import type { GithubSummary } from "../types/github";

const API_BASE = "/api/github";

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

export async function fetchGithubSummary(username: string): Promise<GithubSummary> {
  const response = await fetch(`${API_BASE}/${username}/summary`);
  return handleResponse<GithubSummary>(response);
}
