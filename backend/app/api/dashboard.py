import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.dashboard import DashboardSummaryResponse
from app.services.dashboard_service import fetch_dashboard_summary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    user_id: uuid.UUID = Query(..., description="The ID of the user"),
    github_username: str | None = Query(None, description="Optional GitHub username"),
    db: AsyncSession = Depends(get_db)
) -> dict:
    """Retrieve unified statistics, scores, and career readiness insights for the dashboard."""
    return await fetch_dashboard_summary(db, user_id, github_username)
