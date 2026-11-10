from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import time
from app.core.config import settings, UPLOADS_DIR
from app.api import auth, chat, documents, legal

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Voice-First AI Legal Information Assistant grounded in Indian Statutory Law (CPA 2019, Model Tenancy Act, Wages Act, NALSA).",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local & preview deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response

# Include API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(legal.router, prefix="/api")

# Static mount for uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint for Render/Railway/Docker deployment monitoring."""
    from app.rag.vector_store import vector_store
    from app.database.connection import supabase_client
    return {
        "status": "healthy",
        "service": "NyayaSuno API",
        "environment": settings.ENVIRONMENT,
        "database": "Supabase PostgreSQL" if supabase_client else "Embedded SQLite (Dev Mode)",
        "gemini_api_configured": bool(settings.GEMINI_API_KEY),
        "indexed_legal_chunks": vector_store.total_docs,
        "version": "1.0.0"
    }

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to NyayaSuno – Voice-First AI Legal Information Assistant for India.",
        "tagline": "Legal clarity, in your language.",
        "documentation": "/docs",
        "health": "/api/health",
        "supported_languages": ["Hindi (हिन्दी)", "English", "Hinglish"],
        "disclaimer": "NyayaSuno is an educational legal information assistant and does not constitute formal legal representation or binding legal advice."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

