import asyncio
import json
import logging
import httpx
from fastapi import HTTPException, status
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger("app.services.github_service")


class GitHubAPIError(Exception):
    """Exception raised when GitHub API requests fail."""
    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.status_code = status_code


class GitHubImprovementsSchema(BaseModel):
    improvements: list[str] = Field(
        description="A list of 3-5 specific, highly actionable recommendations to improve this developer's GitHub profile."
    )


def _get_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "AICareerCopilot-Backend",
    }
    if settings.GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"
    return headers


def _generate_profile_improvements(profile_data: dict) -> list[str]:
    """Analyze GitHub metrics using Gemini API and return suggestions to improve profile."""
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
        return [
            "Add a descriptive profile README (repository named after your username) to showcase your focus and projects.",
            "Add meaningful repository descriptions and project tags for your featured repositories.",
            "Contribute to open-source projects or work in branch-based flows to increase pull request statistics."
        ]

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        repos_missing_desc = [r["name"] for r in profile_data["top_repositories"] if not r.get("description")]
        top_languages = [l["language"] for l in profile_data["languages"][:3]]

        prompt = (
            "You are an expert developer advocate, recruiter, and career coach. "
            "Please analyze the following developer's GitHub profile data and provide 3-5 specific, "
            "highly actionable recommendations to improve their profile readability, appeal to recruiters, "
            "and showcase their engineering skills.\n\n"
            f"Developer: {profile_data['name']} (@{profile_data['username']})\n"
            f"Bio: {profile_data.get('bio') or 'None specified'}\n"
            f"Public Repositories: {profile_data['public_repos']}\n"
            f"Total Stars: {profile_data['total_stars']} | Total Forks: {profile_data['total_forks']}\n"
            f"Top Languages: {', '.join(top_languages)}\n"
            f"Recent Activity (Past 30 Events): {profile_data['recent_activity']['commits']} commits, "
            f"{profile_data['recent_activity']['prs']} PRs, {profile_data['recent_activity']['issues']} issues\n"
        )

        if repos_missing_desc:
            prompt += f"Note: These top repositories are currently missing description text: {', '.join(repos_missing_desc)}.\n"
        if not profile_data.get("bio"):
            prompt += "Note: The developer has not set a bio in their GitHub settings.\n"

        prompt += "\nReturn a list of specific improvements in JSON format."

        logger.info("Generating GitHub profile improvements using Gemini...")
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=GitHubImprovementsSchema,
                temperature=0.3,
            ),
        )

        if not response.text:
            raise Exception("Empty text response from Gemini API.")

        result = json.loads(response.text)
        logger.info("Successfully generated profile improvements.")
        return result.get("improvements", [])

    except Exception as exc:
        logger.error(f"Error generating profile improvements: {exc}", exc_info=True)
        # Fallback suggestions
        return [
            "Create a GitHub Profile README (create a repo matching your username) to introduce your skills.",
            "Add project descriptions and website links to all featured repositories.",
            "Diversify contribution types (commits vs pull requests) to demonstrate collaborative engineering."
        ]


async def fetch_github_summary(username: str) -> dict:
    """Fetch GitHub profile, repositories, and events, then compute metrics and Activity Score."""
    headers = _get_headers()
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Fetch User Profile
        profile_url = f"https://api.github.com/users/{username}"
        try:
            profile_response = await client.get(profile_url, headers=headers)
            if profile_response.status_code == 404:
                raise GitHubAPIError(f"GitHub user '{username}' not found.", status_code=404)
            elif profile_response.status_code == 403:
                detail = profile_response.json().get("message", "Forbidden")
                raise GitHubAPIError(f"GitHub API Rate Limit exceeded or Forbidden: {detail}", status_code=403)
            profile_response.raise_for_status()
            profile_data = profile_response.json()
        except httpx.HTTPError as err:
            logger.error(f"Failed to fetch profile for {username}: {err}")
            raise GitHubAPIError(f"GitHub API error: Failed to retrieve user profile.", status_code=502)

        # 2. Fetch User Repositories
        repos_url = f"https://api.github.com/users/{username}/repos?per_page=100&sort=updated"
        try:
            repos_response = await client.get(repos_url, headers=headers)
            repos_response.raise_for_status()
            repos_list = repos_response.json()
        except httpx.HTTPError as err:
            logger.error(f"Failed to fetch repositories for {username}: {err}")
            repos_list = []

        # 3. Fetch User Events (for recent activity)
        events_url = f"https://api.github.com/users/{username}/events?per_page=30"
        try:
            events_response = await client.get(events_url, headers=headers)
            events_response.raise_for_status()
            events_list = events_response.json()
        except httpx.HTTPError as err:
            logger.error(f"Failed to fetch events for {username}: {err}")
            events_list = []

    # --- Data Calculations ---

    total_stars = sum(repo.get("stargazers_count", 0) for repo in repos_list)
    total_forks = sum(repo.get("forks_count", 0) for repo in repos_list)
    
    languages_freq = {}
    for repo in repos_list:
        lang = repo.get("language")
        if lang:
            languages_freq[lang] = languages_freq.get(lang, 0) + 1
            
    total_repos_with_lang = sum(languages_freq.values())
    languages_breakdown = []
    if total_repos_with_lang > 0:
        for lang, count in sorted(languages_freq.items(), key=lambda x: x[1], reverse=True):
            percentage = round((count / total_repos_with_lang) * 100, 1)
            languages_breakdown.append({
                "language": lang,
                "count": count,
                "percentage": percentage
            })

    recent_commits = 0
    recent_prs = 0
    recent_issues = 0

    for event in events_list:
        event_type = event.get("type")
        if event_type == "PushEvent":
            payload = event.get("payload", {})
            commits = payload.get("commits", [])
            recent_commits += len(commits)
        elif event_type == "PullRequestEvent":
            payload = event.get("payload", {})
            action = payload.get("action")
            if action in ["opened", "closed", "reopened"]:
                recent_prs += 1
        elif event_type == "IssuesEvent":
            payload = event.get("payload", {})
            action = payload.get("action")
            if action in ["opened", "closed"]:
                recent_issues += 1

    activity_score = (
        (profile_data.get("public_repos", 0) * 2) +
        (total_stars * 10) +
        (total_forks * 5) +
        (recent_commits * 3) +
        (recent_prs * 10) +
        (recent_issues * 4)
    )
    
    if activity_score < 20:
        developer_tier = "Novice Contributor"
    elif activity_score < 100:
        developer_tier = "Active Developer"
    elif activity_score < 300:
        developer_tier = "Power Contributor"
    else:
        developer_tier = "Elite Developer"

    top_repos = []
    sorted_repos = sorted(repos_list, key=lambda r: r.get("stargazers_count", 0), reverse=True)
    for repo in sorted_repos[:5]:
        top_repos.append({
            "name": repo.get("name"),
            "description": repo.get("description"),
            "html_url": repo.get("html_url"),
            "stargazers_count": repo.get("stargazers_count", 0),
            "forks_count": repo.get("forks_count", 0),
            "language": repo.get("language"),
            "updated_at": repo.get("updated_at")
        })

    summary_data = {
        "username": username,
        "name": profile_data.get("name") or username,
        "avatar_url": profile_data.get("avatar_url"),
        "bio": profile_data.get("bio"),
        "company": profile_data.get("company"),
        "location": profile_data.get("location"),
        "html_url": profile_data.get("html_url"),
        "public_repos": profile_data.get("public_repos", 0),
        "followers": profile_data.get("followers", 0),
        "following": profile_data.get("following", 0),
        "total_stars": total_stars,
        "total_forks": total_forks,
        "languages": languages_breakdown,
        "recent_activity": {
            "commits": recent_commits,
            "prs": recent_prs,
            "issues": recent_issues
        },
        "activity_score": activity_score,
        "developer_tier": developer_tier,
        "top_repositories": top_repos
    }

    # Generate profile recommendations via Gemini in a separate thread
    improvements = await asyncio.to_thread(_generate_profile_improvements, summary_data)
    summary_data["profile_improvements"] = improvements

    return summary_data
