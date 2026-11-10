import json
import os
import glob
import re
from pathlib import Path
from typing import List, Dict, Any
from app.core.config import RAW_DATA_DIR, PROCESSED_DATA_DIR, settings

# Hindi / Hinglish synonym dictionary for legal query expansion
HINDI_LEGAL_SYNONYMS = {
    "Consumer Rights": ["upbhokta", "grahak", "adalat", "khareed", "cheating", "fraud", "defective", "kharab saman", "refund", "wapsi", "complaint", "shikayat", "bill", "invoice", "e-daakhil"],
    "Rental and Tenancy": ["kiraya", "kirayedar", "makan malik", "ghar malik", "security deposit", "deposit", "advance", "chhat", "khali karna", "eviction", "agreement", "kirayanama", "electricity cut", "bijli", "pani"],
    "Employment and Salary": ["salary", "vetan", "tankhwah", "kamai", "boss", "company", "naukri", "kaam", "gratuity", "pension", "bonus", "layoff", "nikal diya", "termination", "notice period", "labour court", "shramik"],
    "Basic Legal Procedures and Legal Aid": ["nalsa", "muft vakeel", "free lawyer", "kanooni sahayata", "legal notice", "court fees", "lok adalat", "agreement", "samjhauta", "notice ka jawab", "reply"]
}

def clean_text(text: str) -> str:
    """Normalize whitespace and strip special control characters."""
    if not text:
        return ""
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def build_knowledge_base() -> List[Dict[str, Any]]:
    """Parse all raw legal JSON files and build a structured chunked knowledge base."""
    raw_files = glob.glob(str(RAW_DATA_DIR / "*.json"))
    chunks = []
    chunk_counter = 1

    print(f"Indexing legal raw data from: {RAW_DATA_DIR} ({len(raw_files)} files found)")

    for file_path in raw_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            act_name = data.get("act_name", "Statutory Act")
            short_title = data.get("short_title", act_name)
            category = data.get("category", "General Law")
            official_url = data.get("official_url", "")
            india_code_url = data.get("india_code_url", "")
            jurisdiction = data.get("jurisdiction", "All India")
            effective_date = data.get("effective_date", "")
            summary = data.get("summary", "")

            # Category synonyms
            category_keywords = HINDI_LEGAL_SYNONYMS.get(category, [])

            sections = data.get("sections", [])
            for sec in sections:
                sec_number = sec.get("section", "Section General")
                sec_heading = sec.get("heading", "")
                sec_text = clean_text(sec.get("text", ""))

                combined_chunk_text = (
                    f"Act: {act_name} ({short_title})\n"
                    f"Category: {category}\n"
                    f"Provision: {sec_number} - {sec_heading}\n"
                    f"Jurisdiction: {jurisdiction}\n"
                    f"Text: {sec_text}\n"
                    f"Official URL: {official_url}\n"
                    f"India Code URL: {india_code_url}"
                )

                chunk_obj = {
                    "id": f"legal-chunk-{chunk_counter:04d}",
                    "act_name": act_name,
                    "short_title": short_title,
                    "category": category,
                    "section": sec_number,
                    "heading": sec_heading,
                    "content": sec_text,
                    "full_chunk_text": combined_chunk_text,
                    "official_url": official_url,
                    "india_code_url": india_code_url,
                    "jurisdiction": jurisdiction,
                    "effective_date": effective_date,
                    "keywords": [
                        act_name.lower(),
                        short_title.lower(),
                        category.lower(),
                        sec_number.lower(),
                        sec_heading.lower()
                    ] + category_keywords
                }
                chunks.append(chunk_obj)
                chunk_counter += 1

        except Exception as e:
            print(f"Error processing {file_path}: {e}")

    # Save to processed JSON
    output_path = PROCESSED_DATA_DIR / "legal_knowledge_base.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f" Successfully compiled {len(chunks)} legal chunks into {output_path}")
    return chunks

if __name__ == "__main__":
    build_knowledge_base()

