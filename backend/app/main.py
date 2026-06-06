from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.api.dashboard import router as dashboard_router
from app.api.github import router as github_router
from app.api.resumes import router as resumes_router
from app.api.skills import router as skills_router

app = FastAPI(title="AI Career Copilot API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(skills_router, prefix="/api")
app.include_router(resumes_router, prefix="/api")
app.include_router(github_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")


@app.get("/")
async def root() -> RedirectResponse:
    return RedirectResponse(url="/docs")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
