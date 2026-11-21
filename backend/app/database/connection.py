import os
import json
import sqlite3
import uuid
import logging
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from app.core.config import settings, BASE_DIR

logger = logging.getLogger(__name__)

# Check Supabase availability
supabase_client = None
if settings.SUPABASE_URL and (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY):
    try:
        from supabase import create_client, Client
        active_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY
        test_client: Client = create_client(settings.SUPABASE_URL, active_key)
        # Verify key validity with a lightweight ping
        test_client.table("users").select("id").limit(1).execute()
        supabase_client = test_client
        logger.info("Connected to Supabase PostgreSQL database.")
    except Exception as e:
        logger.warning(f"Supabase connection notice ({e}). Seamlessly using embedded SQLite storage engine.")
        supabase_client = None

# Local SQLite fallback database path
SQLITE_DB_PATH = BASE_DIR / "nyayasuno.db"

@contextmanager
def get_sqlite_conn(row_factory: bool = False):
    """Context manager for SQLite connections with optimized PRAGMAs and safe cleanup."""
    conn = sqlite3.connect(SQLITE_DB_PATH, timeout=15.0, check_same_thread=False)
    if row_factory:
        conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_sqlite_db():
    """Initialize local SQLite tables with WAL mode and memory cache for high throughput."""
    with get_sqlite_conn() as conn:
        cursor = conn.cursor()
        
        # Performance PRAGMAs
        cursor.execute("PRAGMA journal_mode = WAL;")
        cursor.execute("PRAGMA synchronous = NORMAL;")
        cursor.execute("PRAGMA temp_store = MEMORY;")
        cursor.execute("PRAGMA cache_size = -64000;")  # 64MB memory page cache
        
        cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            preferred_language TEXT DEFAULT 'en',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            title TEXT NOT NULL,
            language TEXT DEFAULT 'en',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            structured_data TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS documents (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            extracted_text TEXT,
            document_type TEXT,
            analysis_data TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            message_id TEXT,
            conversation_id TEXT,
            reason TEXT NOT NULL,
            details TEXT,
            user_email TEXT,
            created_at TEXT NOT NULL
        );
        """)
        conn.commit()

# Auto-initialize SQLite on startup
init_sqlite_db()

class DatabaseManager:
    """Unified database manager supporting both Supabase PostgreSQL and high-performance local SQLite."""

    @staticmethod
    def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        if supabase_client:
            try:
                res = supabase_client.table("users").select("*").eq("email", email).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase error get_user_by_email: {e}")
        
        with get_sqlite_conn(row_factory=True) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            row = cursor.fetchone()
            return dict(row) if row else None

    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        if supabase_client:
            try:
                res = supabase_client.table("users").select("*").eq("id", user_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase error get_user_by_id: {e}")
        
        with get_sqlite_conn(row_factory=True) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    @staticmethod
    def create_user(name: str, email: str, password_hash: str, preferred_language: str = "en") -> Dict[str, Any]:
        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        user_data = {
            "id": user_id,
            "name": name,
            "email": email,
            "password_hash": password_hash,
            "preferred_language": preferred_language,
            "created_at": now
        }

        if supabase_client:
            try:
                supabase_client.table("users").insert(user_data).execute()
                return user_data
            except Exception as e:
                logger.error(f"Supabase error create_user: {e}")

        with get_sqlite_conn() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO users (id, name, email, password_hash, preferred_language, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (user_id, name, email, password_hash, preferred_language, now)
            )
            conn.commit()
        return user_data

    @staticmethod
    def create_conversation(title: str, user_id: Optional[str] = None, language: str = "en") -> Dict[str, Any]:
        conv_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        conv_data = {
            "id": conv_id,
            "user_id": user_id,
            "title": title[:100],
            "language": language,
            "created_at": now,
            "updated_at": now
        }

        if supabase_client:
            try:
                supabase_client.table("conversations").insert(conv_data).execute()
                return conv_data
            except Exception as e:
                logger.error(f"Supabase error create_conversation: {e}")

        with get_sqlite_conn() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO conversations (id, user_id, title, language, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                (conv_id, user_id, title[:100], language, now, now)
            )
            conn.commit()
        return conv_data

    @staticmethod
    def get_conversation(conv_id: str) -> Optional[Dict[str, Any]]:
        if supabase_client:
            try:
                res = supabase_client.table("conversations").select("*").eq("id", conv_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase error get_conversation: {e}")

        with get_sqlite_conn(row_factory=True) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
            row = cursor.fetchone()
            return dict(row) if row else None

    @staticmethod
    def get_user_conversations(user_id: Optional[str] = None, conv_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        if supabase_client:
            try:
                if user_id:
                    res = supabase_client.table("conversations").select("*, messages(count)").eq("user_id", user_id).order("updated_at", desc=True).execute()
                elif conv_ids:
                    res = supabase_client.table("conversations").select("*, messages(count)").in_("id", conv_ids).order("updated_at", desc=True).execute()
                else:
                    return []

                conversations = []
                for item in res.data or []:
                    msg_count = item.get("messages", [{}])[0].get("count", 0) if item.get("messages") else 0
                    conversations.append({
                        "id": item["id"],
                        "title": item["title"],
                        "created_at": item["created_at"],
                        "updated_at": item["updated_at"],
                        "message_count": msg_count
                    })
                return conversations
            except Exception as e:
                logger.error(f"Supabase error get_user_conversations: {e}")

        with get_sqlite_conn(row_factory=True) as conn:
            cursor = conn.cursor()
            if user_id:
                cursor.execute("""
                    SELECT c.*, COUNT(m.id) as message_count 
                    FROM conversations c 
                    LEFT JOIN messages m ON c.id = m.conversation_id 
                    WHERE c.user_id = ? 
                    GROUP BY c.id 
                    ORDER BY c.updated_at DESC
                """, (user_id,))
            elif conv_ids:
                placeholders = ",".join("?" for _ in conv_ids)
                cursor.execute(f"""
                    SELECT c.*, COUNT(m.id) as message_count 
                    FROM conversations c 
                    LEFT JOIN messages m ON c.id = m.conversation_id 
                    WHERE c.id IN ({placeholders})
                    GROUP BY c.id 
                    ORDER BY c.updated_at DESC
                """, tuple(conv_ids))
            else:
                return []

            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    @staticmethod
    def delete_conversation(conv_id: str) -> bool:
        if supabase_client:
            try:
                supabase_client.table("conversations").delete().eq("id", conv_id).execute()
                return True
            except Exception as e:
                logger.error(f"Supabase error delete_conversation: {e}")

        with get_sqlite_conn() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM messages WHERE conversation_id = ?", (conv_id,))
            cursor.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
            conn.commit()
        return True

    @staticmethod
    def save_message(conversation_id: str, role: str, content: str, structured_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        msg_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        msg_data = {
            "id": msg_id,
            "conversation_id": conversation_id,
            "role": role,
            "content": content,
            "structured_data": structured_data,
            "created_at": now
        }

        if supabase_client:
            try:
                supabase_client.table("messages").insert(msg_data).execute()
                supabase_client.table("conversations").update({"updated_at": now}).eq("id", conversation_id).execute()
                return msg_data
            except Exception as e:
                logger.error(f"Supabase error save_message: {e}")

        with get_sqlite_conn() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO messages (id, conversation_id, role, content, structured_data, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (msg_id, conversation_id, role, content, json.dumps(structured_data) if structured_data else None, now)
            )
            cursor.execute("UPDATE conversations SET updated_at = ? WHERE id = ?", (now, conversation_id))
            conn.commit()
        return msg_data

    @staticmethod
    def get_conversation_messages(conversation_id: str) -> List[Dict[str, Any]]:
        if supabase_client:
            try:
                res = supabase_client.table("messages").select("*").eq("conversation_id", conversation_id).order("created_at", desc=False).execute()
                return res.data or []
            except Exception as e:
                logger.error(f"Supabase error get_conversation_messages: {e}")

        with get_sqlite_conn(row_factory=True) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC", (conversation_id,))
            rows = cursor.fetchall()
            
            result = []
            for r in rows:
                item = dict(r)
                if item.get("structured_data") and isinstance(item["structured_data"], str):
                    try:
                        item["structured_data"] = json.loads(item["structured_data"])
                    except Exception:
                        pass
                result.append(item)
            return result

    @staticmethod
    def save_document(user_id: Optional[str], file_name: str, file_path: str, extracted_text: str, document_type: str, analysis_data: Dict[str, Any], doc_id: Optional[str] = None) -> Dict[str, Any]:
        doc_id = doc_id or str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        doc_data = {
            "id": doc_id,
            "user_id": user_id,
            "file_name": file_name,
            "file_path": file_path,
            "extracted_text": extracted_text[:10000],
            "document_type": document_type,
            "analysis_data": analysis_data,
            "created_at": now
        }

        if supabase_client:
            try:
                supabase_client.table("documents").insert(doc_data).execute()
                return doc_data
            except Exception as e:
                logger.error(f"Supabase error save_document: {e}")

        with get_sqlite_conn() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO documents (id, user_id, file_name, file_path, extracted_text, document_type, analysis_data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (doc_id, user_id, file_name, file_path, extracted_text[:10000], document_type, json.dumps(analysis_data), now)
            )
            conn.commit()
        return doc_data

    @staticmethod
    def get_document(doc_id: str) -> Optional[Dict[str, Any]]:
        if supabase_client:
            try:
                res = supabase_client.table("documents").select("*").eq("id", doc_id).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                logger.error(f"Supabase error get_document: {e}")

        with get_sqlite_conn(row_factory=True) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM documents WHERE id = ?", (doc_id,))
            row = cursor.fetchone()
            if not row:
                return None
            doc = dict(row)
            if doc.get("analysis_data") and isinstance(doc["analysis_data"], str):
                try:
                    doc["analysis_data"] = json.loads(doc["analysis_data"])
                except Exception:
                    pass
            return doc

    @staticmethod
    def save_report(message_id: str, reason: str, details: Optional[str] = None, user_email: Optional[str] = None, conversation_id: Optional[str] = None) -> Dict[str, Any]:
        report_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        data = {
            "id": report_id,
            "message_id": message_id,
            "conversation_id": conversation_id,
            "reason": reason,
            "details": details,
            "user_email": user_email,
            "created_at": now
        }
        if supabase_client:
            try:
                supabase_client.table("reports").insert(data).execute()
                return data
            except Exception as e:
                logger.error(f"Supabase error save_report: {e}")

        with get_sqlite_conn() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO reports (id, message_id, conversation_id, reason, details, user_email, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (report_id, message_id, conversation_id, reason, details, user_email, now)
            )
            conn.commit()
        return data

