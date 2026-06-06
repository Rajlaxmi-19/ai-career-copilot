import type { Resume, ResumeUploadResult } from "../types/resume";

const API_BASE = "/api/resumes";

function formatErrorDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (typeof item === "object" && item && "msg" in item ? String(item.msg) : String(item)))
      .join(", ");
  }
  return "Request failed";
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(formatErrorDetail(error.detail));
  }
  return response.json() as Promise<T>;
}

export async function fetchResumes(userId: string): Promise<Resume[]> {
  const response = await fetch(`${API_BASE}?user_id=${userId}`);
  return handleResponse<Resume[]>(response);
}

export async function uploadResume(userId: string, file: File): Promise<ResumeUploadResult> {
  const formData = new FormData();
  formData.append("user_id", userId);
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<ResumeUploadResult>(response);
}

export async function analyzeResume(
  resumeId: string,
  jobRole?: string,
  jobDescription?: string
): Promise<Resume> {
  const hasPayload = jobRole || jobDescription;
  const response = await fetch(`${API_BASE}/${resumeId}/analyze`, {
    method: "POST",
    headers: hasPayload ? { "Content-Type": "application/json" } : undefined,
    body: hasPayload
      ? JSON.stringify({
          job_role: jobRole || null,
          job_description: jobDescription || null,
        })
      : undefined,
  });
  return handleResponse<Resume>(response);
}

