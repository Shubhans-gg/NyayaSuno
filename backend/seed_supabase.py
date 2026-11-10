"""
NyayaSuno - Supabase Seeder Script
Seeds the 27 statutory Indian legal knowledge base chunks into Supabase PostgreSQL.
Run this script AFTER executing schema.sql in Supabase SQL Editor.
"""

import os
import sys
import json
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.core.config import settings, PROCESSED_DATA_DIR
from supabase import create_client, Client

def seed_supabase():
    print("=" * 60)
    print("NYAYASUNO - SUPABASE DATABASE SEEDER")
    print("=" * 60)

    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY

    if not url or not key:
        print("❌ Error: SUPABASE_URL or SUPABASE_KEY missing in .env")
        return

    client: Client = create_client(url, key)

    # 1. Verify tables exist
    try:
        client.table("legal_sources").select("id").limit(1).execute()
        print(" Verified: 'legal_sources' table exists.")
    except Exception as e:
        print(f"❌ Error: Tables not found on Supabase: {e}")
        print("\n👉 Please run 'backend/app/database/schema.sql' in Supabase SQL Editor first!")
        return

    # 2. Load compiled statutory chunks
    kb_path = PROCESSED_DATA_DIR / "legal_knowledge_base.json"
    if not kb_path.exists():
        print(f"❌ Error: {kb_path} not found.")
        return

    with open(kb_path, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    print(f"Loaded {len(chunks)} legal provisions from {kb_path.name}")

    inserted = 0
    for chunk in chunks:
        row = {
            "title": f"{chunk.get('act_name')} - {chunk.get('section')}",
            "act_name": chunk.get("act_name", ""),
            "section": chunk.get("section", ""),
            "heading": chunk.get("heading", ""),
            "category": chunk.get("category", "General"),
            "source_url": chunk.get("official_url", ""),
            "india_code_url": chunk.get("india_code_url", ""),
            "document_date": chunk.get("document_date", ""),
            "version": chunk.get("version", "Current"),
            "content": chunk.get("content", "")
        }

        try:
            client.table("legal_sources").insert(row).execute()
            inserted += 1
            print(f"  [{inserted}/{len(chunks)}] Inserted: {row['title'][:50]}")
        except Exception as e:
            print(f"  ⚠️ Skipping/Error on {row['title']}: {e}")

    print(f"\n Seed complete! Inserted {inserted} provisions into Supabase.")

if __name__ == "__main__":
    seed_supabase()

