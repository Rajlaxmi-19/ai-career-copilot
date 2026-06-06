import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createSkill, deleteSkill, fetchSkills, updateSkill } from "../api/skills";
import SkillForm from "../components/SkillForm";
import SkillList from "../components/SkillList";
import type { Skill, SkillFormData } from "../types/skill";
import { EMPTY_SKILL_FORM } from "../types/skill";
import "./SkillsPage.css";

const DEMO_USER_ID = import.meta.env.VITE_DEMO_USER_ID ?? "00000000-0000-0000-0000-000000000001";

type ViewMode = "list" | "add" | "edit";

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [view, setView] = useState<ViewMode>("list");
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSkills(DEMO_USER_ID);
      setSkills(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load skills");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSkills();
  }, [loadSkills]);

  async function handleCreate(data: SkillFormData) {
    if (!data.name) {
      setError("Skill name is required");
      return;
    }
    try {
      setError(null);
      await createSkill(DEMO_USER_ID, data);
      setView("list");
      await loadSkills();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create skill");
    }
  }

  async function handleUpdate(data: SkillFormData) {
    if (!editingSkill) return;
    if (!data.name) {
      setError("Skill name is required");
      return;
    }
    try {
      setError(null);
      await updateSkill(editingSkill.id, {
        name: data.name,
        category: data.category || null,
        proficiency: data.proficiency,
        description: data.description || null,
      });
      setEditingSkill(null);
      setView("list");
      await loadSkills();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update skill");
    }
  }

  async function handleDelete(skill: Skill) {
    const confirmed = window.confirm(`Delete "${skill.name}"?`);
    if (!confirmed) return;
    try {
      setError(null);
      await deleteSkill(skill.id);
      await loadSkills();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete skill");
    }
  }

  function openEdit(skill: Skill) {
    setEditingSkill(skill);
    setView("edit");
    setError(null);
  }

  return (
    <div className="skills-page">
      <header className="skills-page__header">
        <div>
          <p className="eyebrow">AI Career Copilot</p>
          <h1>Skill Management</h1>
          <p className="subtitle">Track, update, and organize your professional skills.</p>
        </div>
        <div className="skills-page__actions" style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <Link to="/" className="nav-link">
            Dashboard
          </Link>
          <Link to="/resumes" className="nav-link">
            Resumes
          </Link>
          <Link to="/github" className="nav-link" style={{ color: "#4f46e5", fontWeight: "600", textDecoration: "none" }}>
            GitHub
          </Link>
          {view === "list" && (
            <button type="button" className="btn btn--primary" onClick={() => setView("add")}>
              Add Skill
            </button>
          )}
        </div>
      </header>

      {error && <div className="alert alert--error">{error}</div>}

      {view === "add" && (
        <SkillForm
          title="Add Skill"
          initialData={EMPTY_SKILL_FORM}
          submitLabel="Create Skill"
          onSubmit={handleCreate}
          onCancel={() => setView("list")}
        />
      )}

      {view === "edit" && editingSkill && (
        <SkillForm
          title="Edit Skill"
          initialData={{
            name: editingSkill.name,
            category: editingSkill.category ?? "",
            proficiency: editingSkill.proficiency,
            description: editingSkill.description ?? "",
          }}
          submitLabel="Save Changes"
          onSubmit={handleUpdate}
          onCancel={() => {
            setEditingSkill(null);
            setView("list");
          }}
        />
      )}

      {view === "list" && (
        <>
          {loading ? <p className="status">Loading skills...</p> : null}
          {!loading ? (
            <SkillList skills={skills} onEdit={openEdit} onDelete={handleDelete} />
          ) : null}
        </>
      )}
    </div>
  );
}
