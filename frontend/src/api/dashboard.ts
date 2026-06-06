import type { DashboardSummary } from "../types/dashboard";

const API_BASE = "/api/dashboard";

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

export async function fetchDashboardSummary(
  userId: string,
  githubUsername?: string
): Promise<DashboardSummary> {
  let url = `${API_BASE}/summary?user_id=${userId}`;
  if (githubUsername) {
    url += `&github_username=${encodeURIComponent(githubUsername)}`;
  }
  const response = await fetch(url);
  return handleResponse<DashboardSummary>(response);
}
