export interface ResumeAnalysis {
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  career_suggestions: string[];
  job_role?: string | null;
  job_description?: string | null;
}

export interface Resume {
  id: string;
  user_id: string;
  filename: string;
  mime_type: string;
  file_size: number;
  extracted_text: string | null;
  analysis_results: ResumeAnalysis | null;
  created_at: string;
  updated_at: string;
}

export interface ResumeUploadResult extends Resume {
  text_preview: string;
}

