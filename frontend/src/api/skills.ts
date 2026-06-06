import type { ProficiencyLevel, Skill, SkillFormData } from "../types/skill";

const API_BASE = "/api/skills";

function formatErrorDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => (typeof item === "object" && item && "msg" in item ? String(item.msg) : String(item))).join(", ");
  }
  return "Request failed";
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(formatErrorDetail(error.detail));
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export async function fetchSkills(userId: string): Promise<Skill[]> {
  const response = await fetch(`${API_BASE}?user_id=${userId}`);
  return handleResponse<Skill[]>(response);
}

export async function createSkill(userId: string, data: SkillFormData): Promise<Skill> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: userId,
      name: data.name,
      category: data.category || null,
      proficiency: data.proficiency,
      description: data.description || null,
    }),
  });
  return handleResponse<Skill>(response);
}

export async function updateSkill(
  skillId: string,
  data: Partial<{
    name: string;
    category: string | null;
    proficiency: ProficiencyLevel;
    description: string | null;
  }>,
): Promise<Skill> {
  const response = await fetch(`${API_BASE}/${skillId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleResponse<Skill>(response);
}

export async function deleteSkill(skillId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${skillId}`, { method: "DELETE" });
  await handleResponse<void>(response);
}
