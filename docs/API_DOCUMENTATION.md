# NyayaSuno REST API Documentation

The NyayaSuno API is built with FastAPI and runs by default at `http://localhost:8000`.
Interactive Swagger UI is accessible at `/docs` and ReDoc at `/redoc`.

---

## 1. Authentication Endpoints

### Register User
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Request Body**:
```json
{
  "name": "Ramesh Kumar",
  "email": "ramesh@example.com",
  "password": "securepassword123",
  "preferred_language": "hi"
}
```
- **Response**: `201 Created`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "user": {
    "id": "c1f19d9b-...",
    "name": "Ramesh Kumar",
    "email": "ramesh@example.com",
    "preferred_language": "hi",
    "created_at": "2026-11-09T14:30:00Z"
  }
}
```

### Login User
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Request Body**:
```json
{
  "email": "ramesh@example.com",
  "password": "securepassword123"
}
```
- **Response**: `200 OK` (Returns access token and user profile)

### Get Current User Profile
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Header**: `Authorization: Bearer <access_token>`
- **Response**: `200 OK`

---

## 2. Chat & Legal Assistance Endpoints

### Send Legal Message
- **Method**: `POST`
- **Path**: `/api/chat`
- **Header**: Optional `Authorization: Bearer <access_token>`
- **Request Body**:
```json
{
  "message": "Mere landlord ne mera security deposit wapas nahi kiya. Main kya kar sakta hoon?",
  "conversation_id": null,
  "language": "hi",
  "document_ids": []
}
```
- **Response**: `200 OK`
```json
{
  "conversation_id": "4b68453f-...",
  "message_id": "7a30bc68-...",
  "role": "assistant",
  "content": "आप अपने मकान मालिक द्वारा सुरक्षा जमा वापस न किए जाने से परेशान हैं...",
  "structured_data": {
    "understanding": "...",
    "relevant_laws": [
      {
        "act": "Model Tenancy Act, 2021",
        "section": "Section 11",
        "provision_title": "Security Deposit Limits & Return"
      }
    ],
    "simple_explanation": "...",
    "possible_next_steps": ["Demand notice", "Rent Authority application"],
    "documents_needed": ["Rent agreement", "Payment receipt"],
    "sources": [
      {
        "title": "Model Tenancy Act, 2021 - Section 11",
        "act_name": "Model Tenancy Act, 2021",
        "section": "Section 11",
        "heading": "Security Deposit Limits & Return",
        "official_url": "https://mohua.gov.in/...",
        "india_code_url": "https://www.indiacode.nic.in"
      }
    ],
    "disclaimer": "NyayaSuno provides legal information, not formal representation."
  },
  "created_at": "2026-11-09T14:30:00Z"
}
```

### Voice Chat (Audio Upload)
- **Method**: `POST`
- **Path**: `/api/chat/voice`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: Audio file (WebM, WAV, MP3)
  - `conversation_id`: Optional UUID
  - `language`: `hi` or `en`
- **Response**: `200 OK` (Transcribed speech text and structured legal guidance)

### List Conversations
- **Method**: `GET`
- **Path**: `/api/conversations`
- **Response**: `200 OK` (List of conversation summaries with message counts)

### Get Conversation Messages
- **Method**: `GET`
- **Path**: `/api/conversations/{id}`
- **Response**: `200 OK` (Complete message history)

### Delete Conversation
- **Method**: `DELETE`
- **Path**: `/api/conversations/{id}`
- **Response**: `200 OK`

### Report Inaccurate Answer
- **Method**: `POST`
- **Path**: `/api/report`
- **Request Body**:
```json
{
  "message_id": "7a30bc68-...",
  "conversation_id": "4b68453f-...",
  "reason": "Inaccurate legal section or act cited",
  "details": "State rent control act was not reflected.",
  "user_email": "user@example.com"
}
```

---

## 3. Document Analysis Endpoints

### Upload & Analyze Document
- **Method**: `POST`
- **Path**: `/api/documents/upload`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file`: PDF, PNG, JPG, or JPEG file (up to 15MB)
- **Response**: `200 OK`
```json
{
  "document_id": "f5c2...",
  "file_name": "rental_agreement.pdf",
  "document_type": "Rental / Lease Agreement",
  "extracted_text_preview": "...",
  "plain_language_summary": "...",
  "important_clauses": [
    {
      "clause_title": "Security Deposit & Refund Terms",
      "clause_text": "...",
      "plain_english_summary": "...",
      "risk_level": "warning"
    }
  ],
  "key_dates_and_deadlines": ["01/04/2026", "11 months"],
  "potential_risks": ["..."],
  "applicable_laws": ["Model Tenancy Act, 2021"],
  "next_steps": ["..."],
  "ocr_confidence": "High (Native Digital Extraction)",
  "disclaimer": "..."
}
```

### Ask Question About Document
- **Method**: `POST`
- **Path**: `/api/documents/analyze-question`
- **Request Body**:
```json
{
  "document_id": "f5c2...",
  "question": "Does this lease agreement have an illegal lock-in period penalty?",
  "language": "en"
}
```

---

## 4. Legal Directory Endpoints

### List Verified Legal Sources
- **Method**: `GET`
- **Path**: `/api/legal/sources`

### List Legal Categories
- **Method**: `GET`
- **Path**: `/api/legal/categories`

### List Emergency Helplines
- **Method**: `GET`
- **Path**: `/api/legal/helplines`
- Returns verified contact numbers for NALSA (15100), National Consumer Helpline (1915), Cyber Crime (1930), and Women Helpline (1091).

---

## 5. System Health Check

- **Method**: `GET`
- **Path**: `/api/health`
- **Response**: `200 OK`
```json
{
  "status": "healthy",
  "service": "NyayaSuno API",
  "environment": "development",
  "database": "Embedded SQLite (Dev Mode)",
  "gemini_api_configured": false,
  "indexed_legal_chunks": 27,
  "version": "1.0.0"
}
```

