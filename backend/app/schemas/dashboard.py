from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    skills_count: int
    resumes_count: int
    resume_score: int
    github_username: str | None = None
    github_activity_score: int | None = None
    github_tier: str | None = None
    career_readiness_score: int
    insights: list[str]
