import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.skill import ProficiencyLevel


class SkillBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str | None = Field(None, max_length=100)
    proficiency: ProficiencyLevel = ProficiencyLevel.INTERMEDIATE
    description: str | None = None


class SkillCreate(SkillBase):
    user_id: uuid.UUID


class SkillUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    category: str | None = Field(None, max_length=100)
    proficiency: ProficiencyLevel | None = None
    description: str | None = None


class SkillResponse(SkillBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
