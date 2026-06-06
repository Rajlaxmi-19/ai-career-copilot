import uuid
import logging
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.skill import Skill
from app.models.resume import Resume
from app.services.github_service import fetch_github_summary

logger = logging.getLogger("app.services.dashboard_service")


async def fetch_dashboard_summary(db: AsyncSession, user_id: uuid.UUID, github_username: str | None = None) -> dict:
    """Fetch dashboard stats (skills, resumes, GitHub) and calculate Career Readiness Score & Insights."""
    # 1. Fetch skills count
    skills_query = select(func.count(Skill.id)).where(Skill.user_id == user_id)
    skills_result = await db.execute(skills_query)
    skills_count = skills_result.scalar() or 0

    # 2. Fetch resumes count
    resumes_query = select(func.count(Resume.id)).where(Resume.user_id == user_id)
    resumes_result = await db.execute(resumes_query)
    resumes_count = resumes_result.scalar() or 0

    # 3. Fetch latest resume
    latest_resume_query = select(Resume).where(Resume.user_id == user_id).order_by(Resume.created_at.desc()).limit(1)
    latest_resume_result = await db.execute(latest_resume_query)
    latest_resume = latest_resume_result.scalar_one_or_none()

    resume_score = 0
    has_analysis = False

    if latest_resume and latest_resume.analysis_results:
        has_analysis = True
        analysis = latest_resume.analysis_results
        strengths = len(analysis.get("strengths", []))
        weaknesses = len(analysis.get("weaknesses", []))
        missing_skills = len(analysis.get("missing_skills", []))

        # Heuristic calculations: base starts at 70
        calculated_score = 70 + (strengths * 5) - (weaknesses * 4) - (missing_skills * 2)
        resume_score = max(10, min(100, calculated_score))

    # 4. Fetch GitHub summary details
    github_activity_score = None
    github_tier = None
    has_github = False

    if github_username:
        try:
            github_summary = await fetch_github_summary(github_username)
            github_activity_score = github_summary.get("activity_score", 0)
            github_tier = github_summary.get("developer_tier")
            has_github = True
        except Exception as exc:
            logger.error(f"Failed to fetch GitHub stats for user {github_username}: {exc}")
            # Proceed cleanly without GitHub stats on fetch failures
            pass

    # 5. Calculate Career Readiness Score
    # Skills score: 20 pts per skill, up to 5 skills (max 100)
    skills_score = min(100, skills_count * 20)

    # GitHub score: normalise (cap at 200 pts for 100% score)
    github_normalized_score = 0
    if github_activity_score is not None:
        github_normalized_score = min(100, int(github_activity_score * 0.5))

    # Dynamic Weighting
    if has_github:
        # Skills: 30%, Resume: 40%, GitHub: 30%
        career_readiness_score = int(
            (skills_score * 0.3) +
            (resume_score * 0.4) +
            (github_normalized_score * 0.3)
        )
    else:
        # Skills: 40%, Resume: 60%
        career_readiness_score = int(
            (skills_score * 0.4) +
            (resume_score * 0.6)
        )

    # 6. Compile Recommendations/Insights
    insights = []

    if skills_count == 0:
        insights.append("Add your professional skills in the Skills section to start building your career profile.")
    elif skills_count < 5:
        insights.append(f"You have registered {skills_count} skills. Add {5 - skills_count} more to meet the recommended profile benchmark.")

    if resumes_count == 0:
        insights.append("Upload a PDF resume to enable career evaluation and analysis.")
    elif not has_analysis:
        insights.append("Your latest resume has not been analyzed yet. Run the AI analysis to get career feedback.")
    elif resume_score < 75:
        insights.append("Your resume has some growth areas. Review the 'Areas for Growth' and 'Missing Skills' in your resume report.")
    else:
        insights.append("Great job! Your resume analysis shows a solid professional profile.")

    if not github_username:
        insights.append("Connect your GitHub account in the profile section to sync repositories and showcase coding activity.")
    elif not has_github:
        insights.append("GitHub profile sync failed or is rate limited. Check your connection or add a GITHUB_TOKEN to settings.")
    elif github_activity_score < 50:
        insights.append("Your GitHub activity is light. Try committing more frequently or contributing to projects to raise your score.")
    else:
        insights.append(f"Excellent coding presence! Your GitHub Activity Level is evaluated as '{github_tier}'.")

    if career_readiness_score >= 85:
        insights.append("🎉 Superb! Your overall profile readiness is extremely high. You are well-positioned for recruiting cycles.")

    return {
        "skills_count": skills_count,
        "resumes_count": resumes_count,
        "resume_score": resume_score,
        "github_username": github_username if has_github else None,
        "github_activity_score": github_activity_score,
        "github_tier": github_tier,
        "career_readiness_score": career_readiness_score,
        "insights": insights
    }
