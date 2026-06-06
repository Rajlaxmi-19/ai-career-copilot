import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ResumeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    filename: str
    mime_type: str
    file_size: int
    extracted_text: str | None
    analysis_results: dict | None = None
    created_at: datetime
    updated_at: datetime


class ResumeUploadResponse(ResumeResponse):
    text_preview: str = Field(..., description="First 500 characters of extracted text")
