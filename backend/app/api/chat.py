from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from typing import Optional, List
import json
from app.models.schemas import (
    ChatRequest, ChatResponse, ConversationSummary,
    ConversationDetail, MessageItem, ReportFeedbackRequest
)
from app.core.security import get_current_user_optional
from app.database.connection import DatabaseManager
from app.rag.retriever import legal_retriever
from app.services.gemini_service import gemini_service
from app.services.voice_service import voice_service

router = APIRouter(prefix="", tags=["Chat & Conversations"])

@router.post("/chat", response_model=ChatResponse)
async def send_chat_message(
    req: ChatRequest,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Primary legal conversational endpoint.
    Performs RAG retrieval from verified statutory sources,
    generates structured legal advice with citations, and persists messages.
    """
    user_id = current_user["sub"] if current_user else None
    conv_id = req.conversation_id

    # Create new conversation if not provided
    if not conv_id:
        title = req.message[:50].strip()
        conv = DatabaseManager.create_conversation(title=title, user_id=user_id, language=req.language)
        conv_id = conv["id"]
    else:
        conv = DatabaseManager.get_conversation(conv_id)
        if not conv:
            # Recreate or ensure conversation exists
            conv = DatabaseManager.create_conversation(title=req.message[:50].strip(), user_id=user_id, language=req.language)
            conv_id = conv["id"]

    # Save user message
    DatabaseManager.save_message(
        conversation_id=conv_id,
        role="user",
        content=req.message
    )

    # Fetch recent conversation history
    existing_messages = DatabaseManager.get_conversation_messages(conv_id)

    # 1. RAG Retrieval from verified legal acts
    citations, context_text, is_insufficient = legal_retriever.retrieve(req.message, top_k=4)

    # 2. If user attached an analyzed document, incorporate its text
    if req.document_ids:
        doc_contexts = []
        for d_id in req.document_ids:
            doc = DatabaseManager.get_document(d_id)
            if doc:
                doc_contexts.append(
                    f"[Attached User Document: {doc['file_name']} ({doc.get('document_type', 'General')})]\n"
                    f"Extracted Content:\n{doc.get('extracted_text', '')[:1500]}"
                )
        if doc_contexts:
            context_text = "\n\n=== USER UPLOADED DOCUMENT EVIDENCE ===\n" + "\n---\n".join(doc_contexts) + "\n\n=== VERIFIED STATUTORY SOURCES ===\n" + context_text

    # 3. Generate structured legal answer
    structured_answer = await gemini_service.generate_legal_answer(
        query=req.message,
        citations=citations,
        context_text=context_text,
        is_insufficient=is_insufficient,
        language=req.language,
        conversation_history=existing_messages
    )

    # Plain text summary for simple TTS or chat rendering
    full_content = (
        f"{structured_answer.understanding}\n\n"
        f"{structured_answer.simple_explanation}\n\n"
        f"Key Steps:\n" + "\n".join(f"- {step}" for step in structured_answer.possible_next_steps)
    )

    # Save assistant message
    asst_msg = DatabaseManager.save_message(
        conversation_id=conv_id,
        role="assistant",
        content=full_content,
        structured_data=structured_answer.model_dump()
    )

    return ChatResponse(
        conversation_id=conv_id,
        message_id=asst_msg["id"],
        role="assistant",
        content=full_content,
        structured_data=structured_answer,
        created_at=asst_msg["created_at"]
    )

@router.post("/chat/voice")
async def send_voice_chat(
    file: UploadFile = File(...),
    conversation_id: Optional[str] = Form(None),
    language: str = Form("en"),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """
    Voice-first chat endpoint: Accepts audio recording,
    transcribes speech (Hindi / English / Hinglish),
    retrieves legal citations, and returns structured legal guidance.
    """
    audio_bytes = await file.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file uploaded.")

    # Transcribe speech
    transcription_res = await voice_service.transcribe_audio_bytes(
        audio_bytes=audio_bytes,
        mime_type=file.content_type or "audio/webm",
        language=language
    )
    user_speech_text = transcription_res.get("text", "").strip()

    if not user_speech_text:
        user_speech_text = "What are my legal rights in this situation?"

    # Execute chat pipeline with transcribed text
    chat_req = ChatRequest(
        message=user_speech_text,
        conversation_id=conversation_id,
        language=language
    )

    chat_resp = await send_chat_message(req=chat_req, current_user=current_user)

    return {
        "transcribed_text": user_speech_text,
        "transcription_provider": transcription_res.get("provider", "Native Web Audio"),
        "chat_response": chat_resp
    }

@router.get("/conversations", response_model=List[ConversationSummary])
async def list_conversations(current_user: Optional[dict] = Depends(get_current_user_optional)):
    """List all conversations for authenticated user or recent conversations for guest."""
    user_id = current_user["sub"] if current_user else None
    convs = DatabaseManager.get_user_conversations(user_id=user_id)
    return convs

@router.get("/conversations/{conv_id}", response_model=ConversationDetail)
async def get_conversation(conv_id: str):
    """Retrieve full message history for a specific conversation."""
    conv = DatabaseManager.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    raw_messages = DatabaseManager.get_conversation_messages(conv_id)
    messages = []
    for m in raw_messages:
        messages.append(MessageItem(
            id=m["id"],
            conversation_id=m["conversation_id"],
            role=m["role"],
            content=m["content"],
            structured_data=m.get("structured_data"),
            created_at=m["created_at"]
        ))

    return ConversationDetail(
        id=conv["id"],
        title=conv["title"],
        created_at=conv["created_at"],
        messages=messages
    )

@router.delete("/conversations/{conv_id}")
async def delete_conversation(conv_id: str):
    """Delete a conversation and all its messages."""
    success = DatabaseManager.delete_conversation(conv_id)
    return {"success": success, "message": "Conversation deleted successfully."}

@router.post("/report")
async def report_answer(report_req: ReportFeedbackRequest):
    """Submit a report for incorrect, ambiguous, or misleading legal information."""
    report = DatabaseManager.save_report(
        message_id=report_req.message_id,
        reason=report_req.reason,
        details=report_req.details,
        user_email=report_req.user_email,
        conversation_id=report_req.conversation_id
    )
    return {
        "status": "success",
        "message": "Thank you for helping keep NyayaSuno safe and accurate. Our legal review team will inspect this response.",
        "report_id": report["id"]
    }

