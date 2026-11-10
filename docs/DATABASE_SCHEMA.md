# NyayaSuno Database Schema & Supabase Setup

NyayaSuno is designed for **Supabase PostgreSQL** with the **pgvector** extension.
It includes an automatic fallback to local SQLite for instant development and offline operation.

---

## 1. Supabase PostgreSQL Schema with pgvector

The complete migration script is located at `backend/app/database/schema.sql`.

### Enable Extensions
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Table Definitions

#### 1. `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique user identifier |
| `name` | `VARCHAR(255)` | `NOT NULL` | Citizen's full name |
| `email` | `VARCHAR(255)` | `UNIQUE NOT NULL` | Email address for login |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | PBKDF2 HMAC SHA-256 hash |
| `preferred_language` | `VARCHAR(10)` | `DEFAULT 'en'` | `'en'` or `'hi'` |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Account creation timestamp |

#### 2. `conversations`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Conversation session ID |
| `user_id` | `UUID` | `REFERENCES users(id) ON DELETE CASCADE` | Nullable for guest chats |
| `title` | `VARCHAR(255)` | `NOT NULL` | Auto-generated inquiry summary |
| `language` | `VARCHAR(10)` | `DEFAULT 'en'` | Language of conversation |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Timestamp created |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Timestamp of last message |

#### 3. `messages`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique message ID |
| `conversation_id` | `UUID` | `REFERENCES conversations(id) ON DELETE CASCADE` | Parent conversation |
| `role` | `VARCHAR(50)` | `NOT NULL` | `'user'`, `'assistant'`, `'system'` |
| `content` | `TEXT` | `NOT NULL` | Markdown textual response |
| `structured_data` | `JSONB` | | Strict 7-part legal analysis schema |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Message timestamp |

#### 4. `documents`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Unique document ID |
| `user_id` | `UUID` | `REFERENCES users(id) ON DELETE SET NULL` | Owner user ID |
| `file_name` | `VARCHAR(255)` | `NOT NULL` | Original uploaded filename |
| `file_path` | `VARCHAR(500)` | `NOT NULL` | Secure file path on disk/S3 |
| `extracted_text` | `TEXT` | | Extracted digital text or OCR |
| `document_type` | `VARCHAR(100)` | | Classified legal category |
| `analysis_data` | `JSONB` | | Extracted clauses, risks, dates |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Upload timestamp |

#### 5. `legal_sources` & `legal_embeddings`
```sql
CREATE TABLE legal_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    act_name VARCHAR(255) NOT NULL,
    section VARCHAR(100),
    heading VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    source_url TEXT,
    india_code_url TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE legal_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES legal_sources(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    embedding vector(768),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_legal_embeddings_vector 
ON legal_embeddings USING hnsw (embedding vector_cosine_ops);
```

#### 6. Vector Similarity Search Function (RPC)
```sql
CREATE OR REPLACE FUNCTION match_legal_chunks (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  source_id uuid,
  chunk_text text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    legal_embeddings.id,
    legal_embeddings.source_id,
    legal_embeddings.chunk_text,
    legal_embeddings.metadata,
    1 - (legal_embeddings.embedding <=> query_embedding) AS similarity
  FROM legal_embeddings
  WHERE 1 - (legal_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY legal_embeddings.embedding <=> query_embedding
  LIMIT match_count;
$$;
```

---

## 2. Row Level Security (RLS) Policies
- Unauthenticated citizens can read verified statutory sources and legal embeddings.
- Authenticated citizens can strictly view and modify only their own conversations, messages, and uploaded documents.

