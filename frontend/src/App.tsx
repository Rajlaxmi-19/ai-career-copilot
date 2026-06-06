import { Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import GithubDashboardPage from "./pages/GithubDashboardPage";
import ResumeUploadPage from "./pages/ResumeUploadPage";
import SkillsPage from "./pages/SkillsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/skills" element={<SkillsPage />} />
      <Route path="/resumes" element={<ResumeUploadPage />} />
      <Route path="/github" element={<GithubDashboardPage />} />
    </Routes>
  );
}
