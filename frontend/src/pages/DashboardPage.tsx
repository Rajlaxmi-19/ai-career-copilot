import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchDashboardSummary } from "../api/dashboard";
import type { DashboardSummary } from "../types/dashboard";
import "./DashboardPage.css";

const DEMO_USER_ID = import.meta.env.VITE_DEMO_USER_ID ?? "00000000-0000-0000-0000-000000000001";

export default function DashboardPage() {
  const [githubInput, setGithubInput] = useState(() => localStorage.getItem("github_username") ?? "");
  const [activeGithub, setActiveGithub] = useState(() => localStorage.getItem("github_username") ?? "");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingGithub, setUpdatingGithub] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = useCallback(async (ghUsername?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardSummary(DEMO_USER_ID, ghUsername || undefined);
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
    } finally {
      setLoading(false);
      setUpdatingGithub(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboardData(activeGithub);
  }, [activeGithub, loadDashboardData]);

  function handleConnectGithub(event: React.FormEvent) {
    event.preventDefault();
    const cleanUsername = githubInput.trim();
    setUpdatingGithub(true);
    if (cleanUsername) {
      localStorage.setItem("github_username", cleanUsername);
      setActiveGithub(cleanUsername);
    } else {
      localStorage.removeItem("github_username");
      setActiveGithub("");
    }
  }

  // SVG Gauge Renderer
  function renderProgressCircle(score: number, size = 120, strokeWidth = 10, colorClass = "primary") {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className={`gauge-wrapper gauge-wrapper--${colorClass}`} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="gauge-svg">
          <circle
            className="gauge-bg"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className="gauge-fill"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <div className="gauge-text">
          <span className="gauge-value">{score}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-page__header">
        <div>
          <p className="eyebrow">Career Copilot Dashboard</p>
          <h1>Welcome Back!</h1>
          <p className="subtitle">Track your career readiness, resume analytics, and skill profiles here.</p>
        </div>
        <nav className="dashboard-page__nav">
          <Link to="/resumes" className="nav-link">
            Resumes
          </Link>
          <Link to="/skills" className="nav-link">
            Skills
          </Link>
          <Link to="/github" className="nav-link">
            GitHub
          </Link>
        </nav>
      </header>

      {error && <div className="alert alert--error">{error}</div>}

      {loading && !summary ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Compiling database summaries and syncing scores...</p>
        </div>
      ) : (
        summary && (
          <div className="dashboard-main-grid">
            {/* Top Score Section: Unified SVG Charts */}
            <section className="score-charts-section">
              <div className="chart-card chart-card--readiness">
                <h3>Overall Career Readiness</h3>
                <div className="chart-card__body">
                  {renderProgressCircle(summary.career_readiness_score, 150, 12, "readiness")}
                  <div className="score-meta">
                    <span className="score-tier">
                      Tier: {summary.career_readiness_score >= 85 ? "Excellent" : summary.career_readiness_score >= 60 ? "Proficient" : "Needs Review"}
                    </span>
                    <p>Calculated using active skills, parsed resume content, and synced technical activity.</p>
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <h3>Resume Analysis Score</h3>
                <div className="chart-card__body">
                  {renderProgressCircle(summary.resume_score, 120, 10, "resume")}
                  <div className="score-meta">
                    <span className="score-tier">Resume Health</span>
                    <p>Based on strengths, weaknesses, and keywords extracted from your uploads.</p>
                  </div>
                </div>
              </div>

              <div className="chart-card">
                <h3>GitHub Activity Level</h3>
                <div className="chart-card__body">
                  {renderProgressCircle(
                    summary.github_activity_score ? Math.min(100, Math.round(summary.github_activity_score * 0.5)) : 0,
                    120,
                    10,
                    "github"
                  )}
                  <div className="score-meta">
                    <span className="score-tier">
                      {summary.github_tier || "Disconnected"}
                    </span>
                    <p>Reflects public commit frequency, repositories, and stargazers metrics.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Middle Section: Stats Grid & Actionable Insights */}
            <div className="dashboard-row-grid">
              {/* Left Column: Recommendations */}
              <div className="dashboard-subcol dashboard-subcol--insights">
                <section className="insights-card">
                  <h2>💡 Personalized Action Steps</h2>
                  <ul className="insights-list">
                    {summary.insights.map((insight, index) => (
                      <li key={index} className="insight-item">
                        <span className="insight-bullet">✨</span>
                        <p>{insight}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* Right Column: Mini Stats and Connections */}
              <div className="dashboard-subcol dashboard-subcol--stats">
                <section className="quick-stats-grid">
                  <div className="mini-stat-card">
                    <span className="mini-stat-icon">🎓</span>
                    <div className="mini-stat-info">
                      <h4>{summary.skills_count}</h4>
                      <p>Registered Skills</p>
                    </div>
                  </div>

                  <div className="mini-stat-card">
                    <span className="mini-stat-icon">📄</span>
                    <div className="mini-stat-info">
                      <h4>{summary.resumes_count}</h4>
                      <p>Uploaded Resumes</p>
                    </div>
                  </div>
                </section>

                {/* Git connection interface */}
                <section className="github-connect-card">
                  <h2>🔗 GitHub Integration</h2>
                  <p>Provide your GitHub username to automatically populate contribution levels and compute your total score.</p>
                  <form onSubmit={handleConnectGithub} className="connect-form">
                    <input
                      type="text"
                      placeholder="Enter GitHub username"
                      value={githubInput}
                      onChange={(e) => setGithubInput(e.target.value)}
                      className="connect-input"
                    />
                    <button type="submit" className="btn btn--primary connect-btn" disabled={updatingGithub}>
                      {updatingGithub ? "Connecting..." : activeGithub ? "Update Profile" : "Connect Account"}
                    </button>
                  </form>
                  {activeGithub && (
                    <div className="connected-indicator">
                      <span className="green-dot"></span> Connected as <strong>@{activeGithub}</strong>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
