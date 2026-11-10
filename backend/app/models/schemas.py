from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    preferred_language: str = Field(default="en", description="en or hi")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    preferred_language: str
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# --- Legal Citation & Sources ---
class LegalSourceCitation(BaseModel):
    title: str
    act_name: str
    section: str
    heading: str
    official_url: Optional[str] = None
    india_code_url: Optional[str] = None
    relevance_score: Optional[float] = None
    snippet: Optional[str] = None

# --- AI Legal Response Structure ---
class LegalAnswerStructured(BaseModel):
    understanding: str = Field(..., description="1. Understanding your situation")
    relevant_laws: List[Dict[str, Any]] = Field(..., description="2. Relevant legal provisions")
    simple_explanation: str = Field(..., description="3. Explanation in simple language")
    possible_next_steps: List[str] = Field(..., description="4. Possible next steps")
    documents_needed: List[str] = Field(..., description="5. Documents you may need")
    sources: List[LegalSourceCitation] = Field(..., description="6. Sources and legal references")
    disclaimer: str = Field(..., description="7. Important legal disclaimer")
    missing_information: Optional[List[str]] = None
    is_insufficient_context: bool = False
    suggested_questions: Optional[List[str]] = None

# --- Chat & Message Schemas ---
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    conversation_id: Optional[str] = None
    language: str = Field(default="en", description="en, hi, or hinglish")
    document_ids: Optional[List[str]] = Field(default_factory=list)

class ChatResponse(BaseModel):
    conversation_id: str
    message_id: str
    role: str = "assistant"
    content: str
    structured_data: LegalAnswerStructured
    audio_base64: Optional[str] = None
    created_at: str

class MessageItem(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    structured_data: Optional[Dict[str, Any]] = None
    created_at: str

class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: Optional[str] = None
    message_count: int = 0

class ConversationDetail(BaseModel):
    id: str
    title: str
    created_at: str
    messages: List[MessageItem]

# --- Document Processing Schemas ---
class ClauseItem(BaseModel):
    clause_title: str
    clause_text: str
    plain_english_summary: str
    risk_level: str = "normal" # low, normal, warning, critical

class DocumentAnalysisResponse(BaseModel):
    document_id: str
    file_name: str
    document_type: str
    extracted_text_preview: str
    plain_language_summary: str
    important_clauses: List[ClauseItem]
    key_dates_and_deadlines: List[str]
    potential_risks: List[str]
    applicable_laws: List[str]
    next_steps: List[str]
    disclaimer: str
    ocr_confidence: Optional[str] = "High (Native Digital Extraction)"
    created_at: str

class DocumentAnalyzeQuestionRequest(BaseModel):
    document_id: str
    question: str
    language: str = "en"

# --- Report / Feedback Schema ---
class ReportFeedbackRequest(BaseModel):
    message_id: str
    conversation_id: Optional[str] = None
    reason: str
    details: Optional[str] = None
    user_email: Optional[str] = None

