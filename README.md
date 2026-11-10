# NyayaSuno – Voice-First AI Legal Information Assistant
### Built for the Scaler x Wispr Flow Hackathon: "India Runs on Voice"

> **"Legal clarity, in your language."**  
> Indian statutory legal clarity demystified for ordinary citizens in Hindi, English, and conversational Hinglish powered by **Wispr Flow**.

[![Wispr Flow](https://img.shields.io/badge/Voice_AI-Wispr_Flow-FF6B00.svg?style=flat&logo=sound)](https://wisprflow.ai)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61DAFB.svg?style=flat&logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4.svg?style=flat&logo=google)](https://aistudio.google.com)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20pgvector-3ECF8E.svg?style=flat&logo=supabase)](https://supabase.com)

---

## 1. Project Overview & Hackathon Alignment

**NyayaSuno** was developed for the **Scaler x Wispr Flow Hackathon** ("India Runs on Voice", Civic Tech / Access to Justice track).

Many citizens across India struggle to understand statutory legal terminology, government dispute procedures, lease agreements, unpaid wages, and legal notices.

Powered by **Wispr Flow's ultra-low latency, AI auto-edited voice engine**, NyayaSuno empowers ordinary citizens to explain their problems naturally by speaking in Hindi, English, or conversational Hinglish:
1. **Wispr Flow Speech Recognition**: Transcribes citizen speech with zero hesitation, automatically removing filler words (`"um"`, `"matlab"`, `"like"`) and formatting legal spoken narratives cleanly into structured queries.
2. **Retrieves Verified Statutory Provisions**: RAG pipeline searches official Indian sources (India Code, Consumer Protection Act 2019, Model Tenancy Act, Payment of Wages Act, NALSA).
3. **Explains Potentially Applicable Laws**: Translates complex sections into simple, jargon-free citizen language.
4. **Outlines Actionable Next Steps**: Step-by-step checklists of documents needed (e.g., filing on E-Daakhil, sending demand notices, approaching the Rent Authority).
5. **Connects Citizens to Free Legal Aid**: Directly surfaces Section 12 criteria under the Legal Services Authorities Act and dials the NALSA Helpline (**15100**).
6. **Analyzes Uploaded Legal Documents**: Scans rental agreements, notices, and invoices to identify hidden risks, unfair clauses, and key deadlines.

> **CRITICAL LEGAL SAFETY NOTICE**: NyayaSuno is an educational legal information assistant and does NOT provide formal legal advice, representation, or guarantee court outcomes. For case representation, citizens are directed to licensed advocates or the NALSA Helpline at **15100**.

---

## 2. Technology Stack

### Frontend
- **Framework**: React.js (v18.3) with Vite build system
- **Styling**: Tailwind CSS with legal-tech navy/blue/emerald aesthetic
- **Routing**: React Router DOM (v6.28)
- **Icons**: Lucide React
- **API Client**: Axios with JWT Bearer interceptor
- **Voice / Audio**: Web Speech API (`SpeechRecognition` & `speechSynthesis`) + `MediaRecorder` audio capture

### Backend
- **Framework**: Python 3.10+ / FastAPI with Uvicorn
- **Validation**: Pydantic v2 & Pydantic-Settings
- **Security**: JWT tokens (PyJWT) with PBKDF2 password hashing
- **File Uploads**: Python-Multipart

### AI & Retrieval-Augmented Generation (RAG)
- **LLM**: Google Gemini API (`gemini-1.5-flash`) for grounded structured generation
- **Embeddings & Vector Search**: Hybrid Robertson-Spärck Jones BM25 + Gemini Embeddings (`text-embedding-004`) + Supabase `pgvector`
- **Knowledge Base**: Curated, verified statutory sections from India Code repository

### Document Processing
- **PDF Extraction**: PyPDF (pure-Python digital layer extraction)
- **OCR Engine**: Tesseract OCR (via `pytesseract`) + Gemini Vision fallback
- **Clause Analyzer**: Rule-based & semantic risk classification (Normal, Warning, Critical)

### Database & Persistence
- **Cloud Database**: Supabase PostgreSQL with `pgvector` extension and Row Level Security (RLS)
- **Local Fallback**: Embedded SQLite (`nyayasuno.db`) for instant offline development and automated testing

---

## 3. Directory Structure

```
NyaySuno/
├── frontend/                     # React + Vite + Tailwind frontend
│   ├── public/                   # Favicon & assets
│   ├── src/
│   │   ├── components/           # Navbar, Footer, LegalCard, VoiceRecorder, Modals
│   │   ├── pages/                # LandingPage, AssistantPage, DocumentPage, ResourcesPage, AuthPage, ProfilePage
│   │   ├── services/             # api.js, speech.js
│   │   ├── context/              # AuthContext.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── backend/                      # Python FastAPI backend
│   ├── app/
│   │   ├── api/                  # auth.py, chat.py, documents.py, legal.py
│   │   ├── core/                 # config.py, security.py
│   │   ├── database/             # connection.py, schema.sql
│   │   ├── rag/                  # ingest.py, vector_store.py, retriever.py
│   │   ├── services/             # gemini_service.py, document_parser.py, voice_service.py
│   │   ├── models/               # schemas.py
│   │   └── main.py
│   ├── requirements.txt
│   └── .env.example
│
├── legal_data/                   # Curated Indian Legal Sources
│   ├── raw/                      # Verified JSON statutes (CPA 2019, Tenancy Act, Wages Act, NALSA)
│   └── processed/                # Indexed chunks: legal_knowledge_base.json
│
├── docs/                         # Architecture, API docs, Database schema
│   ├── ARCHITECTURE.md
│   ├── API_DOCUMENTATION.md
│   └── DATABASE_SCHEMA.md
│
├── README.md                     # Setup, testing, and deployment instructions
└── .env.example
```

---

## 4. Local Setup Instructions

### Prerequisites
- Node.js (v18 or higher) and npm
- Python (v3.10 or higher) and pip

### Step 1: Clone or Navigate to the Workspace
```bash
cd NyaySuno
```

### Step 2: Set Up Backend
```bash
cd backend

# (Optional) Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate 
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env
```

*(Edit `backend/.env` with your `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com). Even without an API key, the system automatically uses its built-in grounded rule engine for seamless testing!)*

#### Start the Backend Server:
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API is now running at `http://127.0.0.1:8000`.  
Explore interactive API documentation at `http://127.0.0.1:8000/docs`.

---

### Step 3: Set Up Frontend
Open a new terminal:
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite development server
npm run dev
```
The frontend is now running at `http://localhost:5173`.

---

## 5. Testing NyayaSuno

### A. Test Voice & Text Legal Assistance
1. Open `http://localhost:5173/assistant`.
2. Click on the sample chip: **"Can my landlord refuse to return my security deposit?"** or speak into the microphone in Hindi:
   > *"Mere landlord ne mera security deposit wapas nahi kiya. Main kya kar sakta hoon?"*
3. Verify that the response renders into the strict 7-part legal card:
   - Understanding your situation
   - Relevant statutory provisions (Model Tenancy Act Section 11)
   - Plain language explanation in Hindi/English
   - Possible next steps (e.g. demand notice, approaching Rent Authority)
   - Documents needed checklist
   - Verified clickable citations linking to official portals and India Code
   - Legal safety disclaimer
4. Click the **"Listen"** button to hear natural speech narration.

### B. Test Document Understanding
1. Navigate to `http://localhost:5173/documents`.
2. Drag and drop any lease agreement, legal notice, or contract (PDF or PNG).
3. Check the identified document type, extracted clauses, risk breakdown (Normal / Warning / Critical), and key dates.
4. Use the bottom input box to ask questions like: *"What is the notice period for vacating?"*.

### C. Test Inaccuracy Reporting
1. On any legal answer card, click the flag icon in the upper-right corner.
2. Select a reason (e.g., *"Inaccurate legal section or act cited"*), write optional details, and click **Submit Report**.

---

## 6. Deployment Guides

### Deploy Frontend to Vercel
1. Push the code to GitHub.
2. In the [Vercel Dashboard](https://vercel.com), click **Add New Project** and select the repository.
3. Set **Root Directory** to `frontend`.
4. Framework Preset: **Vite**.
5. Build Command: `npm run build`, Output Directory: `dist`.
6. Add Environment Variable:
   - `VITE_API_URL`: Your deployed backend URL (e.g., `https://nyayasuno-api.onrender.com/api`).
7. Click **Deploy**.

### Deploy Backend to Render
1. In the [Render Dashboard](https://render.com), click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Set **Root Directory** to `backend`.
4. Runtime: **Python 3**.
5. Build Command: `pip install -r requirements.txt`.
6. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
7. Add Environment Variables:
   - `GEMINI_API_KEY`: Your Google AI Studio API key
   - `JWT_SECRET`: Random 32+ character string
   - `SUPABASE_URL`: (Optional) Your Supabase project URL
   - `SUPABASE_KEY`: (Optional) Your Supabase public anon key
8. Click **Create Web Service**.

---

## 7. External API Credentials Checklist

| Service | Environment Variable | Required / Optional | Where to Obtain |
|---|---|---|---|
| **Wispr Flow API** | `WISPR_FLOW_API_KEY` | Recommended (Hackathon Primary Engine) | [Wispr Flow Platform](https://platform.wisprflow.ai) |
| **Google Gemini API** | `GEMINI_API_KEY` | Recommended | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| **Supabase PostgreSQL** | `SUPABASE_URL`, `SUPABASE_KEY` | Optional (SQLite fallback included) | [Supabase Console](https://supabase.com/dashboard) |
| **Groq Whisper** | `GROQ_API_KEY` | Optional secondary fallback | [Groq Console](https://console.groq.com) |
| **OpenAI Whisper** | `WHISPER_API_KEY` | Optional secondary fallback | [OpenAI Platform](https://platform.openai.com) |

---

## 8. Verified Legal Citations Included in Knowledge Base

1. **Consumer Protection Act, 2019**:
   - Section 2(7) (Definition of Consumer), Section 2(9) (Consumer Rights), Section 2(11) (Deficiency in Service), Sections 34/47/58 (Pecuniary Jurisdictions), Section 35 (E-Daakhil Portal Complaints), National Consumer Helpline (1915).
2. **Model Tenancy Act, 2021 & State Rent Control**:
   - Section 4 (Mandatory Written Agreement), Section 11 (Security Deposit Capped at 2 Months Rent & Mandatory Refund), Section 20 (Prohibition of Water/Electricity Cutoff), Section 21/22 (Eviction Protection).
3. **Payment of Wages Act, 1936 & Code on Wages, 2019**:
   - Sections 4 & 5 (Timely Payment within 7-10 Days), Section 7-13 (Prohibition of Arbitrary Deductions), Section 15 (Labour Authority Recovery Claims), Section 33C(2) (Industrial Disputes Act Recovery).
4. **Legal Services Authorities Act, 1987 (NALSA)**:
   - Section 12 (Criteria for Free Legal Aid to Women, Children, Industrial Workmen, and Low-Income Citizens), Section 19-22 (Lok Adalats), National Legal Aid Helpline (15100).
