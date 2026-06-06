import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.resume import Resume
from app.models.user import User
from app.schemas.resume import ResumeResponse, ResumeUploadResponse
from app.services.gemini_analyzer import GeminiAnalysisError, analyze_resume_text_async
from app.services.pdf_extractor import PdfExtractionError, extract_text_from_pdf

router = APIRouter(prefix="/resumes", tags=["resumes"])

PDF_MIME_TYPES = {"application/pdf", "application/x-pdf"}


async def _get_resume_or_404(resume_id: uuid.UUID, db: AsyncSession) -> Resume:
    result = await db.execute(select(Resume).where(Resume.id == resume_id))
    resume = result.scalar_one_or_none()
    if resume is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")
    return resume


def _validate_pdf_upload(filename: str | None, content_type: str | None, file_bytes: bytes) -> None:
    if not filename or not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are allowed")

    if content_type and content_type not in PDF_MIME_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only PDF files are allowed")

    if not file_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is not a valid PDF")

    if len(file_bytes) > settings.MAX_RESUME_SIZE_BYTES:
        max_mb = settings.MAX_RESUME_SIZE_BYTES // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum size of {max_mb} MB",
        )


@router.post("/upload", response_model=ResumeUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    user_id: uuid.UUID = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
) -> ResumeUploadResponse:
    user_result = await db.execute(select(User).where(User.id == user_id))
    if user_result.scalar_one_or_none() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    file_bytes = await file.read()
    _validate_pdf_upload(file.filename, file.content_type, file_bytes)

    try:
        extracted_text = extract_text_from_pdf(file_bytes)
    except PdfExtractionError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

    resume = Resume(
        user_id=user_id,
        filename=file.filename,
        mime_type=file.content_type or "application/pdf",
        file_size=len(file_bytes),
        file_content=file_bytes,
        extracted_text=extracted_text,
    )
    db.add(resume)
    await db.commit()
    await db.refresh(resume)

    preview = extracted_text[:500]
    if len(extracted_text) > 500:
        preview += "..."

    return ResumeUploadResponse(
        id=resume.id,
        user_id=resume.user_id,
        filename=resume.filename,
        mime_type=resume.mime_type,
        file_size=resume.file_size,
        extracted_text=resume.extracted_text,
        created_at=resume.created_at,
        updated_at=resume.updated_at,
        text_preview=preview,
    )


@router.get("", response_model=list[ResumeResponse])
async def list_resumes(
    user_id: uuid.UUID | None = Query(None, description="Filter resumes by user"),
    db: AsyncSession = Depends(get_db),
) -> list[Resume]:
    query = select(Resume).order_by(Resume.created_at.desc())
    if user_id is not None:
        query = query.where(Resume.user_id == user_id)
    result = await db.execute(query)
    return list(result.scalars().all())


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(resume_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Resume:
    return await _get_resume_or_404(resume_id, db)


@router.get("/{resume_id}/download")
async def download_resume(resume_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> Response:
    resume = await _get_resume_or_404(resume_id, db)
    return Response(
        content=resume.file_content,
        media_type=resume.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{resume.filename}"'},
    )


from pydantic import BaseModel

class AnalyzeResumeRequest(BaseModel):
    job_role: str | None = None
    job_description: str | None = None


@router.post("/{resume_id}/analyze", response_model=ResumeResponse)
async def analyze_resume(
    resume_id: uuid.UUID,
    payload: AnalyzeResumeRequest = AnalyzeResumeRequest(),
    db: AsyncSession = Depends(get_db),
) -> Resume:
    resume = await _get_resume_or_404(resume_id, db)

    if not resume.extracted_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume does not have any extracted text. Please re-upload a valid text-based PDF resume.",
        )

    try:
        job_role = payload.job_role if payload else None
        job_description = payload.job_description if payload else None
        
        analysis = await analyze_resume_text_async(
            resume.extracted_text,
            job_role=job_role,
            job_description=job_description,
        )
        
        # Save input target parameters inside analysis results
        analysis["job_role"] = job_role
        analysis["job_description"] = job_description
        
        resume.analysis_results = analysis
        await db.commit()
        await db.refresh(resume)
        return resume
    except GeminiAnalysisError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        )

