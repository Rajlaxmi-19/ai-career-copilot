from fastapi import APIRouter, HTTPException

from app.schemas.github import GithubSummaryResponse
from app.services.github_service import GitHubAPIError, fetch_github_summary

router = APIRouter(prefix="/github", tags=["github"])


@router.get("/{username}/summary", response_model=GithubSummaryResponse)
async def get_github_summary(username: str) -> dict:
    """Retrieve summarized analytics and developer activity score for a GitHub profile."""
    try:
        return await fetch_github_summary(username)
    except GitHubAPIError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc))
