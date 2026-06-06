import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.skill import Skill
from app.models.user import User
from app.schemas.skill import SkillCreate, SkillResponse, SkillUpdate

router = APIRouter(prefix="/skills", tags=["skills"])


async def _get_skill_or_404(skill_id: uuid.UUID, db: AsyncSession) -> Skill:
    result = await db.execute(select(Skill).where(Skill.id == skill_id))
    skill = result.scalar_one_or_none()
    if skill is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
    return skill


@router.get("", response_model=list[SkillResponse])
async def list_skills(
    user_id: uuid.UUID | None = Query(None, description="Filter skills by user"),
    db: AsyncSession = Depends(get_db),
) -> list[Skill]:
    query = select(Skill).order_by(Skill.name)
    if user_id is not None:
        query = query.where(Skill.user_id == user_id)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.get("/{skill_id}", response_model=SkillResponse)
async def get_skill(skill_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Skill:
    return await _get_skill_or_404(skill_id, db)


@router.post("", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
async def create_skill(payload: SkillCreate, db: AsyncSession = Depends(get_db)) -> Skill:
    user_result = await db.execute(select(User).where(User.id == payload.user_id))
    if user_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    skill = Skill(
        user_id=payload.user_id,
        name=payload.name,
        category=payload.category,
        proficiency=payload.proficiency,
        description=payload.description,
    )
    db.add(skill)
    await db.commit()
    await db.refresh(skill)
    return skill


@router.put("/{skill_id}", response_model=SkillResponse)
async def update_skill(
    skill_id: uuid.UUID, payload: SkillUpdate, db: AsyncSession = Depends(get_db)
) -> Skill:
    skill = await _get_skill_or_404(skill_id, db)
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields to update")

    for field, value in updates.items():
        setattr(skill, field, value)

    await db.commit()
    await db.refresh(skill)
    return skill


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_skill(skill_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> None:
    skill = await _get_skill_or_404(skill_id, db)
    await db.delete(skill)
    await db.commit()
