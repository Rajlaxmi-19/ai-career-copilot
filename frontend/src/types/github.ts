export interface LanguageMetric {
  language: string;
  count: number;
  percentage: number;
}

export interface ActivityMetrics {
  commits: number;
  prs: number;
  issues: number;
}

export interface RepositorySummary {
  name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
}

export interface GithubSummary {
  username: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  total_stars: number;
  total_forks: number;
  languages: LanguageMetric[];
  recent_activity: ActivityMetrics;
  activity_score: number;
  developer_tier: string;
  top_repositories: RepositorySummary[];
  profile_improvements: string[];
}
