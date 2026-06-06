export interface DashboardSummary {
  skills_count: number;
  resumes_count: number;
  resume_score: number;
  github_username: string | null;
  github_activity_score: number | null;
  github_tier: string | null;
  career_readiness_score: number;
  insights: string[];
}
