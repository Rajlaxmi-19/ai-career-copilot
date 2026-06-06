from pydantic import BaseModel


class LanguageMetric(BaseModel):
    language: str
    count: int
    percentage: float


class ActivityMetrics(BaseModel):
    commits: int
    prs: int
    issues: int


class RepositorySummary(BaseModel):
    name: str
    description: str | None = None
    html_url: str
    stargazers_count: int
    forks_count: int
    language: str | None = None
    updated_at: str


class GithubSummaryResponse(BaseModel):
    username: str
    name: str
    avatar_url: str | None = None
    bio: str | None = None
    company: str | None = None
    location: str | None = None
    html_url: str
    public_repos: int
    followers: int
    following: int
    total_stars: int
    total_forks: int
    languages: list[LanguageMetric]
    recent_activity: ActivityMetrics
    activity_score: int
    developer_tier: str
    top_repositories: list[RepositorySummary]
    profile_improvements: list[str]

