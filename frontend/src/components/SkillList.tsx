import type { Skill } from "../types/skill";
import "./SkillList.css";

interface SkillListProps {
  skills: Skill[];
  onEdit: (skill: Skill) => void;
  onDelete: (skill: Skill) => void;
}

function formatProficiency(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function SkillList({ skills, onEdit, onDelete }: SkillListProps) {
  if (skills.length === 0) {
    return (
      <div className="skill-list skill-list--empty">
        <p>No skills yet. Add your first skill to get started.</p>
      </div>
    );
  }

  return (
    <div className="skill-list">
      {skills.map((skill) => (
        <article key={skill.id} className="skill-card">
          <div className="skill-card__header">
            <h3>{skill.name}</h3>
            <span className={`badge badge--${skill.proficiency}`}>
              {formatProficiency(skill.proficiency)}
            </span>
          </div>

          {skill.category && <p className="skill-card__category">{skill.category}</p>}
          {skill.description && <p className="skill-card__description">{skill.description}</p>}

          <div className="skill-card__actions">
            <button type="button" className="btn btn--ghost" onClick={() => onEdit(skill)}>
              Edit
            </button>
            <button type="button" className="btn btn--danger" onClick={() => onDelete(skill)}>
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
