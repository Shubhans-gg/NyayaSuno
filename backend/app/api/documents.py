from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, status
from pathlib import Path
import uuid
import shutil
from typing import Optional
from app.models.schemas import DocumentAnalysisResponse, DocumentAnalyzeQuestionRequest, LegalAnswerStructured
from app.core.security import get_current_user_optional
from app.database.connection import DatabaseManager
from app.services.document_parser import document_parser_service
from app.core.config import UPLOADS_DIR
from app.rag.retriever import legal_retriever
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/documents", tags=["Document Processing"])

@router.post("/upload", response_model=DocumentAnalysisResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Upload and analyze a legal document (Rental Agreement, Notice, Contract, Bill).
    Performs text extraction, OCR, clause risk assessment, and date extraction.
    """
    user_id = current_user["sub"] if current_user else None
    
    # 1. Validation
    orig_name = file.filename or "uploaded_document.pdf"
    file_ext = Path(orig_name).suffix.lower()
    if file_ext not in document_parser_service.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file_ext}'. Allowed formats: PDF, PNG, JPG, JPEG."
        )

    # 2. Save file locally
    doc_id = str(uuid.uuid4())
    safe_file_name = f"{doc_id}_{Path(orig_name).name}"
    save_path = UPLOADS_DIR / safe_file_name

    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Check file size
    if save_path.stat().st_size > document_parser_service.MAX_FILE_SIZE_BYTES:
        save_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="File size exceeds the 15MB limit.")

    # 3. Analyze document
    analysis = document_parser_service.analyze_document(
        document_id=doc_id,
        file_name=orig_name,
        file_path=save_path
    )

    # 4. Save to database
    DatabaseManager.save_document(
        user_id=user_id,
        file_name=orig_name,
        file_path=str(save_path),
        extracted_text=analysis.extracted_text_preview,
        document_type=analysis.document_type,
        analysis_data=analysis.model_dump()
    )

    return analysis

@router.get("/{doc_id}", response_model=DocumentAnalysisResponse)
async def get_document_analysis(doc_id: str):
    """Retrieve previously analyzed document by ID."""
    doc = DatabaseManager.get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    analysis_data = doc.get("analysis_data", {})
    if isinstance(analysis_data, dict) and "document_id" in analysis_data:
        return DocumentAnalysisResponse(**analysis_data)

    return DocumentAnalysisResponse(
        document_id=doc["id"],
        file_name=doc["file_name"],
        document_type=doc.get("document_type", "General Legal Document"),
        extracted_text_preview=doc.get("extracted_text", ""),
        plain_language_summary="Document analysis loaded from archive.",
        important_clauses=[],
        key_dates_and_deadlines=[],
        potential_risks=[],
        applicable_laws=[],
        next_steps=[],
        disclaimer="NyayaSuno automated review.",
        ocr_confidence="Archived",
        created_at=doc.get("created_at", "")
    )

@router.post("/analyze-question", response_model=LegalAnswerStructured)
async def ask_question_about_document(req: DocumentAnalyzeQuestionRequest):
    """Ask a specific legal question comparing statutory law with the uploaded document."""
    doc = DatabaseManager.get_document(req.document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Referenced document not found.")

    doc_text = doc.get("extracted_text", "")
    citations, statutory_context, is_insufficient = legal_retriever.retrieve(
        f"{req.question} {doc.get('document_type', '')}", top_k=3
    )

    combined_context = (
        f"USER UPLOADED DOCUMENT ({doc['file_name']} - {doc.get('document_type')}):\n"
        f"{doc_text}\n\n"
        f"STATUTORY BENCHMARK LAW:\n{statutory_context}"
    )

    answer = await gemini_service.generate_legal_answer(
        query=f"Based on my uploaded document '{doc['file_name']}', {req.question}",
        citations=citations,
        context_text=combined_context,
        is_insufficient=is_insufficient,
        language=req.language
    )

    return answer

