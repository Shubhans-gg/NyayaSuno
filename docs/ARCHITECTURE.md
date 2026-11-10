# NyayaSuno – System Architecture

NyayaSuno is a voice-first AI legal information assistant designed to make Indian statutory law accessible, understandable, and actionable for ordinary citizens in Hindi, English, and conversational Hinglish.

---

## 1. High-Level Architecture

```
+-------------------------------------------------------------------------+
|                              CLIENT TIER                                |
|   React 18 + Vite + Tailwind CSS + Web Speech API + AudioRecorder       |
|   Pages: Landing, Assistant Dashboard, Document Analyzer, Resources,    |
|          Auth & Profile                                                 |
+------------------------------------+------------------------------------+
                                     |
                                     | HTTP REST & Multipart Audio/Files
                                     v
+-------------------------------------------------------------------------+
|                             API GATEWAY                                 |
|   FastAPI + Pydantic v2 + JWT Security Middleware + CORS                |
+---------+-------------------+--------------------+----------------------+
          |                   |                    |
          v                   v                    v
+-------------------+ +-------------------+ +---------------------------+
|  VOICE SUBSYSTEM  | | DOCUMENT PARSER   | | RAG RETRIEVAL SUBSYSTEM   |
|  - Web Speech STT | | - PyPDF extractor | | - BM25 & Hybrid Vector    |
|  - Whisper API    | | - Tesseract OCR   | | - Legal Query Expansion   |
|  - Browser TTS    | | - Clause Scanner  | | - India Code Grounding    |
|  - Audio WebM/WAV | | - Date Extractor  | | - Source Citation Builder |
+---------+---------+ +---------+---------+ +-------------+-------------+
          |                     |                         |
          +---------------------+-------------------------+
                                |
                                v
+-------------------------------------------------------------------------+
|                            AI REASONING                                 |
|   Google Gemini 1.5 Flash Grounded Generation                           |
|   Strict 7-Part Output:                                                 |
|   1. Understanding Situation   4. Possible Next Steps  7. Disclaimer    |
|   2. Statutory Provisions      5. Documents Needed                      |
|   3. Simple Explanation        6. Verified Citations                    |
+-------------------------------+-----------------------------------------+
                                |
                                v
+-------------------------------------------------------------------------+
|                             PERSISTENCE                                 |
|   Supabase PostgreSQL with pgvector (Cloud)                             |
|   Embedded SQLite Fallback (Local Dev & Offline Testing)                |
|   Tables: users, conversations, messages, documents, sources, reports   |
+-------------------------------------------------------------------------+
```

---

## 2. Core Subsystems

### A. Grounded Legal RAG Pipeline
1. **Curated Statutory Knowledge Base**: Covers Consumer Protection Act 2019, Model Tenancy Act 2021, Payment of Wages Act 1936, Code on Wages 2019, and Legal Services Authorities Act (NALSA) 1987.
2. **Multi-lingual Query Expansion**: Maps common Hindi/Hinglish colloquial expressions (`"kirayedar"`, `"makan malik"`, `"vetan"`, `"shoshit"`, `"grahak"`, `"vakeel"`) to exact statutory concepts.
3. **Hybrid Retrieval**: Combines Robertson-Spärck Jones BM25 lexical scoring with keyword-boosted relevance and vector cosine similarity.
4. **Anti-Hallucination Guardrails**: Prompts strictly constrain the model to indexed citations. If context is sparse, `is_insufficient_context` is flagged and the citizen is directed to NALSA Helpline 15100.

### B. Voice-First Interaction
1. **Speech-to-Text**:
   - Primary browser Web Speech API for low-latency streaming dictation in `hi-IN` and `en-IN`.
   - Backend `MediaRecorder` audio transmission to `/api/chat/voice` with Whisper/Gemini multimodal audio processing.
2. **Text-to-Speech**:
   - `window.speechSynthesis` with Indian accent and Hindi pitch matching.
   - Clean text preprocessing to remove markdown symbols and raw URLs for natural narration.

### C. Document Understanding
1. **PDF Text Extraction**: Pure-Python PyPDF parser extracting digital text layers.
2. **Image OCR**: Pytesseract fallback for scanned documents and invoices.
3. **Clause Risk Classification**: Heuristic and semantic labeling of clauses as Normal, Warning, or Critical.
4. **Interactive Document Q&A**: Allows citizens to cross-examine their uploaded agreement against benchmark statutory protections.

### D. Dual Storage Engine
- **Cloud Mode**: Connects to Supabase PostgreSQL with `pgvector` for vector indexes and Supabase Row Level Security (RLS).
- **Development Mode**: Self-initializing SQLite embedded engine (`nyayasuno.db`) ensuring full offline testing and zero-setup deployment.

