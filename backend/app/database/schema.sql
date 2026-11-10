-- NyayaSuno Database Schema for Supabase PostgreSQL with pgvector

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

-- 4. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    structured_data JSONB, -- Stores legal analysis: understanding, laws, explanation, steps, sources, disclaimer
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);

-- 5. Uploaded Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    extracted_text TEXT,
    document_type VARCHAR(100), -- Rental Agreement, Legal Notice, Salary Slip, Consumer Invoice
    analysis_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

-- 6. Legal Sources Table
CREATE TABLE IF NOT EXISTS legal_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    act_name VARCHAR(255) NOT NULL,
    section VARCHAR(100),
    heading VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    source_url TEXT,
    india_code_url TEXT,
    document_date VARCHAR(50),
    version VARCHAR(50),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legal_sources_category ON legal_sources(category);

-- 7. Legal Embeddings Table (pgvector)
CREATE TABLE IF NOT EXISTS legal_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES legal_sources(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    embedding vector(768), -- Gemini text-embedding-004 standard dimension
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- IVFFlat or HNSW Index for vector search performance
CREATE INDEX IF NOT EXISTS idx_legal_embeddings_vector 
ON legal_embeddings 
USING hnsw (embedding vector_cosine_ops);

-- 8. Reports / User Feedback Table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id VARCHAR(255),
    conversation_id VARCHAR(255),
    reason VARCHAR(100) NOT NULL,
    details TEXT,
    user_email VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Row Level Security (RLS) setup for Supabase
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_embeddings ENABLE ROW LEVEL SECURITY;

-- Allow public and service access
CREATE POLICY "Allow read write users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read write conversations" ON conversations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read write messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read write documents" ON documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read write reports" ON reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read legal sources" ON legal_sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read legal embeddings" ON legal_embeddings FOR ALL USING (true) WITH CHECK (true);

-- Function for vector similarity search via RPC
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

