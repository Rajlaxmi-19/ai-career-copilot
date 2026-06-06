import type { SkillFormData } from "../types/skill";
import { PROFICIENCY_OPTIONS } from "../types/skill";
import "./SkillForm.css";

interface SkillFormProps {
  title: string;
  initialData: SkillFormData;
  submitLabel: string;
  onSubmit: (data: SkillFormData) => Promise<void>;
  onCancel: () => void;
}

export default function SkillForm({
  title,
  initialData,
  submitLabel,
  onSubmit,
  onCancel,
}: SkillFormProps) {
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      name: String(form.get("name") ?? "").trim(),
      category: String(form.get("category") ?? "").trim(),
      proficiency: String(form.get("proficiency") ?? "intermediate") as SkillFormData["proficiency"],
      description: String(form.get("description") ?? "").trim(),
    });
  }

  return (
    <form className="skill-form" onSubmit={handleSubmit}>
      <h2>{title}</h2>

      <label>
        Skill name *
        <input name="name" defaultValue={initialData.name} required maxLength={100} />
      </label>

      <label>
        Category
        <input
          name="category"
          defaultValue={initialData.category}
          placeholder="e.g. Programming, Leadership"
          maxLength={100}
        />
      </label>

      <label>
        Proficiency
        <select name="proficiency" defaultValue={initialData.proficiency}>
          {PROFICIENCY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Description
        <textarea
          name="description"
          defaultValue={initialData.description}
          rows={3}
          placeholder="Optional notes about this skill"
        />
      </label>

      <div className="skill-form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
