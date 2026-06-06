export type ProficiencyLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface Skill {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  proficiency: ProficiencyLevel;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SkillFormData {
  name: string;
  category: string;
  proficiency: ProficiencyLevel;
  description: string;
}

export const PROFICIENCY_OPTIONS: { value: ProficiencyLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

export const EMPTY_SKILL_FORM: SkillFormData = {
  name: "",
  category: "",
  proficiency: "intermediate",
  description: "",
};
