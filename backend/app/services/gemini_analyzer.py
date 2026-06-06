import asyncio
import json
import logging
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger("app.services.gemini_analyzer")


class ResumeAnalysisSchema(BaseModel):
    strengths: list[str] = Field(
        description="A list of 3-5 key professional strengths of the candidate based on the resume."
    )
    weaknesses: list[str] = Field(
        description="A list of 2-4 professional weaknesses, gaps, or areas of improvement."
    )
    missing_skills: list[str] = Field(
        description="A list of key skills, frameworks, or technologies missing from the resume that would benefit their career path."
    )
    career_suggestions: list[str] = Field(
        description="A list of 2-3 suitable job titles, roles, or career directions based on their profile."
    )


class GeminiAnalysisError(Exception):
    """Exception raised when resume analysis fails."""
    pass


def analyze_resume_text(
    text: str,
    job_role: str | None = None,
    job_description: str | None = None,
) -> dict:
    """Analyze resume text synchronously using Gemini API with structured JSON output, optionally targeted to a specific job."""
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
        raise GeminiAnalysisError(
            "Gemini API key is not configured. Please add your GEMINI_API_KEY in the backend/.env file."
        )

    try:
        # Initialize client with specified API key
        client = genai.Client(api_key=settings.GEMINI_API_KEY)

        # Build targeted instructions if job details are provided
        target_context = ""
        if job_role or job_description:
            target_context = "You are analyzing this resume specifically for the "
            if job_role:
                target_context += f"target job role: '{job_role}'"
            if job_description:
                if job_role:
                    target_context += " with the following "
                target_context += f"job description:\n{job_description}\n\n"
            else:
                target_context += ".\n\n"
            
            target_context += (
                "Evaluate how well the candidate aligns with this target profile. Tailor the assessment as follows:\n"
                "- Strengths: Highlight relevant experience, skills, and qualifications that match the target role.\n"
                "- Weaknesses: Identify key gaps or missing components in the candidate's background relative to the role requirements.\n"
                "- Missing Skills: Identify required technical/soft skills from the job description that are missing from the resume.\n"
                "- Career Suggestions: Provide advice on how they can improve their alignment, or list adjacent roles that might fit.\n\n"
            )
        else:
            target_context = (
                "Provide a general career assessment including key professional strengths, "
                "weaknesses/areas of growth, missing skills that would benefit their career direction, "
                "and recommended career directions/roles based on their profile.\n\n"
            )

        prompt = (
            "You are an expert technical recruiter and career coach.\n\n"
            f"{target_context}"
            f"Resume Text:\n{text}"
        )

        logger.info("Sending resume text to Gemini API for analysis...")
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ResumeAnalysisSchema,
                temperature=0.2,
            ),
        )

        if not response.text:
            raise GeminiAnalysisError("Received empty response text from Gemini API.")

        logger.info("Successfully received analysis from Gemini API.")
        return json.loads(response.text)

    except Exception as exc:
        logger.error(f"Error during Gemini resume analysis: {exc}", exc_info=True)
        raise GeminiAnalysisError(f"Failed to analyze resume via Gemini API: {str(exc)}") from exc


async def analyze_resume_text_async(
    text: str,
    job_role: str | None = None,
    job_description: str | None = None,
) -> dict:
    """Analyze resume text asynchronously by running the blocking call in a separate thread."""
    return await asyncio.to_thread(analyze_resume_text, text, job_role, job_description)
