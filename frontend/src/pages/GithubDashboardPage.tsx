import React, { useState } from "react";
import { Link } from "react-router-dom";
import { fetchGithubSummary } from "../api/github";
import type { GithubSummary } from "../types/github";
import "./GithubDashboardPage.css";

export default function GithubDashboardPage() {
  const [usernameInput, setUsernameInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<GithubSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const target = usernameInput.trim();
    if (!target) {
      setError("Please enter a GitHub username.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchGithubSummary(target);
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load GitHub data.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  // Helper to get color classes based on the developer tier
  function getTierClass(tier: string): string {
    switch (tier) {
      case "Elite Developer":
        return "tier--elite";
      case "Power Contributor":
        return "tier--power";
      case "Active Developer":
        return "tier--active";
      default:
        return "tier--novice";
    }
  }

  return (
    <div className="github-page">
      <header className="github-page__header">
        <div>
          <p className="eyebrow">AI Career Copilot</p>
          <h1>Developer Profile Analyzer</h1>
          <p className="subtitle">Analyze a developer's public activity and calculate their career score.</p>
        </div>
        <nav className="github-page__nav">
          <Link to="/" className="nav-link">
            Dashboard
          </Link>
          <Link to="/resumes" className="nav-link">
            Resumes
          </Link>
          <Link to="/skills" className="nav-link">
            Skills
          </Link>
        </nav>
      </header>

      <section className="search-card">
        <h2>Enter GitHub Username</h2>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="e.g. torvalds, gaearon..."
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            disabled={loading}
            className="search-input"
          />
          <button type="submit" className="btn btn--primary search-btn" disabled={loading}>
            {loading ? "Analyzing Profile..." : "Analyze Developer Profile"}
          </button>
        </form>
      </section>

      {error && <div className="alert alert--error">{error}</div>}

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Fetching public profile repositories and contributions from GitHub API...</p>
        </div>
      )}

      {!loading && summary && (
        <div className="dashboard-grid">
          {/* Left Column: Profile Card, Activity Score */}
          <div className="dashboard-col dashboard-col--left">
            <article className="profile-card">
              <img
                src={summary.avatar_url || "https://github.com/identicons/guest.png"}
                alt={summary.name}
                className="profile-card__avatar"
              />
              <div className="profile-card__info">
                <h3>{summary.name}</h3>
                <a href={summary.html_url} target="_blank" rel="noreferrer" className="profile-link">
                  @{summary.username} 🔗
                </a>
                {summary.bio && <p className="profile-bio">{summary.bio}</p>}
                
                <div className="profile-meta-details">
                  {summary.company && <span>🏢 {summary.company}</span>}
                  {summary.location && <span>📍 {summary.location}</span>}
                </div>

                <div className="follow-stats">
                  <span><strong>{summary.followers}</strong> Followers</span>
                  <span><strong>{summary.following}</strong> Following</span>
                </div>
              </div>
            </article>

            {/* Glowing Activity Score Radial Ring */}
            <article className={`score-card ${getTierClass(summary.developer_tier)}`}>
              <h4>Developer Activity Score</h4>
              <div className="score-ring-container">
                <div className="score-ring">
                  <span className="score-value">{summary.activity_score}</span>
                  <span className="score-label">Points</span>
                </div>
              </div>
              <p className="tier-display">
                Level: <strong>{summary.developer_tier}</strong>
              </p>
              <p className="score-desc">
                Calculated based on repositories, stars, forks, and contributions in the last 30 events.
              </p>
            </article>
          </div>

          {/* Right Column: Statistics Grid, Language Chart, Repositories */}
          <div className="dashboard-col dashboard-col--right">
            <section className="stats-panel">
              <div className="stat-box">
                <span className="stat-icon">📁</span>
                <span className="stat-number">{summary.public_repos}</span>
                <span className="stat-label">Public Repos</span>
              </div>
              <div className="stat-box">
                <span className="stat-icon">⭐</span>
                <span className="stat-number">{summary.total_stars}</span>
                <span className="stat-label">Total Stars</span>
              </div>
              <div className="stat-box">
                <span className="stat-icon">🍴</span>
                <span className="stat-number">{summary.total_forks}</span>
                <span className="stat-label">Total Forks</span>
              </div>
              <div className="stat-box">
                <span className="stat-icon">💻</span>
                <span className="stat-number">{summary.recent_activity.commits}</span>
                <span className="stat-label">Recent Commits</span>
              </div>
            </section>

            {/* AI Profile Optimization Tips */}
            {summary.profile_improvements && summary.profile_improvements.length > 0 && (
              <section className="improvements-card">
                <h4>⚡ AI Profile Optimization Tips</h4>
                <ul className="improvements-list">
                  {summary.profile_improvements.map((tip, idx) => (
                    <li key={idx} className="improvement-item">
                      <span className="improvement-icon">✨</span>
                      <p className="improvement-text">{tip}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Language Breakdown */}
            {summary.languages.length > 0 && (
              <section className="languages-card">
                <h4>Top Languages Distribution</h4>
                <div className="languages-list">
                  {summary.languages.map((item) => (
                    <div key={item.language} className="language-row">
                      <div className="language-label">
                        <span className="language-name">{item.language}</span>
                        <span className="language-percent">{item.percentage}%</span>
                      </div>
                      <div className="language-bar-container">
                        <div
                          className="language-bar-fill"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recent Contribution activity breakdown */}
            <section className="activity-card">
              <h4>Recent Event Activity (Past 30 Events)</h4>
              <div className="activity-grid">
                <div className="activity-item">
                  <span className="activity-num">{summary.recent_activity.commits}</span>
                  <span className="activity-lbl">Commits Pushed</span>
                </div>
                <div className="activity-item">
                  <span className="activity-num">{summary.recent_activity.prs}</span>
                  <span className="activity-lbl">Pull Requests</span>
                </div>
                <div className="activity-item">
                  <span className="activity-num">{summary.recent_activity.issues}</span>
                  <span className="activity-lbl">Issues Opened/Closed</span>
                </div>
              </div>
            </section>

            {/* Top Repositories */}
            {summary.top_repositories.length > 0 && (
              <section className="repos-section">
                <h4>Featured Repositories (Sorted by Stars)</h4>
                <div className="repos-grid">
                  {summary.top_repositories.map((repo) => (
                    <article key={repo.name} className="repo-card">
                      <div className="repo-card__header">
                        <h5>
                          <a href={repo.html_url} target="_blank" rel="noreferrer">
                            {repo.name}
                          </a>
                        </h5>
                        <div className="repo-card__stats">
                          <span>⭐ {repo.stargazers_count}</span>
                          <span>🍴 {repo.forks_count}</span>
                        </div>
                      </div>
                      {repo.description && <p className="repo-desc">{repo.description}</p>}
                      <div className="repo-footer">
                        {repo.language && (
                          <span className="repo-lang-tag">{repo.language}</span>
                        )}
                        <span className="repo-date">
                          Updated {new Date(repo.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
