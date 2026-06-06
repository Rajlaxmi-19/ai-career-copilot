import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { analyzeResume, fetchResumes, uploadResume } from "../api/resumes";
import type { Resume } from "../types/resume";
import "./ResumeUploadPage.css";

const DEMO_USER_ID = import.meta.env.VITE_DEMO_USER_ID ?? "00000000-0000-0000-0000-000000000001";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResumeUploadPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzingIds, setAnalyzingIds] = useState<Record<string, boolean>>({});
  const [jobRoles, setJobRoles] = useState<Record<string, string>>({});
  const [jobDescriptions, setJobDescriptions] = useState<Record<string, string>>({});
  const [showForms, setShowForms] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadResumes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchResumes(DEMO_USER_ID);
      setResumes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load resumes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadResumes();
  }, [loadResumes]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setSuccess(null);
    setError(null);
  }

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedFile) {
      setError("Please choose a PDF file");
      return;
    }
    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await uploadResume(DEMO_USER_ID, selectedFile);
      setSuccess(`Uploaded "${result.filename}" and extracted ${result.extracted_text?.length ?? 0} characters.`);
      setSelectedFile(null);
      (event.target as HTMLFormElement).reset();
      await loadResumes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleAnalyze(resumeId: string) {
    setAnalyzingIds((prev) => ({ ...prev, [resumeId]: true }));
    setError(null);
    setSuccess(null);
    try {
      const role = jobRoles[resumeId]?.trim();
      const desc = jobDescriptions[resumeId]?.trim();
      const updatedResume = await analyzeResume(resumeId, role || undefined, desc || undefined);
      setSuccess(`Successfully analyzed "${updatedResume.filename}" using Gemini AI!`);
      setResumes((prev) => prev.map((r) => (r.id === resumeId ? updatedResume : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzingIds((prev) => ({ ...prev, [resumeId]: false }));
    }
  }

  return (
    <div className="resume-page">
      <header className="resume-page__header">
        <div>
          <p className="eyebrow">AI Career Copilot</p>
          <h1>Resume Upload</h1>
          <p className="subtitle">Upload a PDF resume, store it, and extract text for AI analysis.</p>
        </div>
        <nav className="resume-page__nav" style={{ display: "flex", gap: "1.25rem" }}>
          <Link to="/">Dashboard</Link>
          <Link to="/skills">Skills</Link>
          <Link to="/github">GitHub</Link>
        </nav>
      </header>

      <section className="upload-card">
        <h2>Upload PDF</h2>
        <form onSubmit={handleUpload} className="upload-form">
          <label className="file-picker">
            <span>Choose PDF file</span>
            <input type="file" accept="application/pdf,.pdf" onChange={handleFileChange} />
          </label>
          {selectedFile ? (
            <p className="file-meta">
              Selected: <strong>{selectedFile.name}</strong> ({formatFileSize(selectedFile.size)})
            </p>
          ) : null}
          <button type="submit" className="btn btn--primary" disabled={uploading || !selectedFile}>
            {uploading ? "Uploading & extracting..." : "Upload Resume"}
          </button>
        </form>
      </section>

      {error && <div className="alert alert--error">{error}</div>}
      {success && <div className="alert alert--success">{success}</div>}

      <section className="resume-list-section">
        <h2>Uploaded Resumes</h2>
        {loading ? <p className="status">Loading resumes...</p> : null}
        {!loading && resumes.length === 0 ? (
          <p className="status">No resumes uploaded yet.</p>
        ) : null}
        {!loading
          ? resumes.map((resume) => (
              <article key={resume.id} className="resume-card">
                <div className="resume-card__header">
                  <div className="resume-card__title-group">
                    <h3>{resume.filename}</h3>
                    <span className="file-size-badge">{formatFileSize(resume.file_size)}</span>
                    {resume.analysis_results && (
                      <span className="status-badge status-badge--analyzed">✨ Analyzed</span>
                    )}
                  </div>
                  <div className="resume-card__actions">
                    {!resume.analysis_results ? (
                      <button
                        className="btn btn--primary btn--sm"
                        onClick={() => handleAnalyze(resume.id)}
                        disabled={analyzingIds[resume.id]}
                      >
                        {analyzingIds[resume.id] ? "Analyzing..." : "Analyze with AI ✨"}
                      </button>
                    ) : (
                      <button
                        className="btn btn--secondary btn--sm"
                        onClick={() => handleAnalyze(resume.id)}
                        disabled={analyzingIds[resume.id]}
                      >
                        {analyzingIds[resume.id] ? "Re-analyzing..." : "Re-analyze 🔄"}
                      </button>
                    )}
                  </div>
                </div>
                <p className="resume-card__meta">
                  Uploaded {new Date(resume.created_at).toLocaleString()}
                </p>

                <div className="job-alignment-section">
                  <button
                    type="button"
                    className="toggle-alignment-btn"
                    onClick={() =>
                      setShowForms((prev) => ({ ...prev, [resume.id]: !prev[resume.id] }))
                    }
                  >
                    🎯 {showForms[resume.id] ? "Hide Target Job Settings" : "Target Specific Job Role / Description (Optional)"}
                  </button>
                  
                  {showForms[resume.id] && (
                    <div className="job-alignment-form">
                      <div className="form-group">
                        <label htmlFor={`job-role-${resume.id}`}>Target Job Role</label>
                        <input
                          id={`job-role-${resume.id}`}
                          type="text"
                          placeholder="e.g. Senior Frontend Engineer"
                          value={jobRoles[resume.id] || ""}
                          onChange={(e) =>
                            setJobRoles((prev) => ({ ...prev, [resume.id]: e.target.value }))
                          }
                          className="alignment-input"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`job-desc-${resume.id}`}>Job Description / Requirements</label>
                        <textarea
                          id={`job-desc-${resume.id}`}
                          placeholder="Paste the target job description or requirements here to analyze your resume alignment..."
                          value={jobDescriptions[resume.id] || ""}
                          onChange={(e) =>
                            setJobDescriptions((prev) => ({ ...prev, [resume.id]: e.target.value }))
                          }
                          rows={4}
                          className="alignment-textarea"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {resume.analysis_results && (
                  <details className="analysis-report-details">
                    <summary>View AI Career Analysis Report</summary>
                    <div className="analysis-results">
                      {(resume.analysis_results.job_role || resume.analysis_results.job_description) && (
                        <div className="targeted-analysis-banner">
                          <span className="banner-icon">🎯</span>
                          <div className="banner-content">
                            <h4>Targeted Analysis Report</h4>
                            {resume.analysis_results.job_role && (
                              <p>
                                Analyzed for: <strong>{resume.analysis_results.job_role}</strong>
                              </p>
                            )}
                            {resume.analysis_results.job_description && (
                              <details className="banner-jd-details">
                                <summary>View target job description</summary>
                                <pre className="banner-jd-text">{resume.analysis_results.job_description}</pre>
                              </details>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="analysis-grid">
                        <div className="analysis-card analysis-card--strengths">
                          <h5>💪 Key Strengths</h5>
                          <ul>
                            {resume.analysis_results.strengths.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="analysis-card analysis-card--weaknesses">
                          <h5>⚠️ Areas for Growth</h5>
                          <ul>
                            {resume.analysis_results.weaknesses.map((item, idx) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="analysis-section">
                        <h5>🚀 Missing Skills</h5>
                        <div className="badge-group">
                          {resume.analysis_results.missing_skills.map((item, idx) => (
                            <span key={idx} className="badge badge--skill">{item}</span>
                          ))}
                        </div>
                      </div>

                      <div className="analysis-section">
                        <h5>💼 Recommended Roles</h5>
                        <div className="badge-group">
                          {resume.analysis_results.career_suggestions.map((item, idx) => (
                            <span key={idx} className="badge badge--career">{item}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </details>
                )}

                <details className="raw-text-details">
                  <summary>View Raw Extracted Text</summary>
                  {resume.extracted_text ? (
                    <pre className="resume-card__text">{resume.extracted_text}</pre>
                  ) : (
                    <p className="status">No extracted text available.</p>
                  )}
                </details>
              </article>
            ))
          : null}
      </section>
    </div>
  );
}
