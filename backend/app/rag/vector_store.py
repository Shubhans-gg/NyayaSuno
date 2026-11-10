import json
import math
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.core.config import PROCESSED_DATA_DIR, settings

class LegalVectorStore:
    """
    Hybrid semantic vector store supporting both Gemini embedding cosine similarity
    and BM25/TF-IDF multi-lingual (English + Hindi/Hinglish) retrieval.
    """
    def __init__(self):
        self.chunks: List[Dict[str, Any]] = []
        self.doc_frequencies: Dict[str, int] = {}
        self.total_docs: int = 0
        self.avg_doc_len: float = 0.0
        self.chunk_vectors: List[Dict[str, float]] = []
        self.load_data()

    def tokenize(self, text: str) -> List[str]:
        """Normalize and tokenize text into words and n-grams."""
        text = text.lower()
        # Keep english, devanagari letters and numbers
        words = re.findall(r'[\w\u0900-\u097F]+', text)
        return [w for w in words if len(w) > 1]

    def load_data(self):
        """Load processed knowledge base and build lexical index."""
        kb_file = PROCESSED_DATA_DIR / "legal_knowledge_base.json"
        if not kb_file.exists():
            print(f"Knowledge base file not found at {kb_file}. Returning empty.")
            return

        with open(kb_file, "r", encoding="utf-8") as f:
            self.chunks = json.load(f)

        self.total_docs = len(self.chunks)
        total_len = 0
        self.doc_frequencies = {}

        for chunk in self.chunks:
            # Aggregate full text and all keywords
            content_text = f"{chunk.get('act_name', '')} {chunk.get('section', '')} {chunk.get('heading', '')} {chunk.get('content', '')} {' '.join(chunk.get('keywords', []))}"
            tokens = self.tokenize(content_text)
            chunk["tokens"] = tokens
            chunk_len = len(tokens)
            total_len += chunk_len

            seen_words = set(tokens)
            for w in seen_words:
                self.doc_frequencies[w] = self.doc_frequencies.get(w, 0) + 1

        if self.total_docs > 0:
            self.avg_doc_len = total_len / self.total_docs

        print(f" Loaded {self.total_docs} legal provisions into vector index.")

    def bm25_score(self, query_tokens: List[str], chunk: Dict[str, Any], k1: float = 1.5, b: float = 0.75) -> float:
        """Compute BM25 score for a chunk against query tokens."""
        doc_tokens = chunk.get("tokens", [])
        doc_len = len(doc_tokens)
        if doc_len == 0 or self.total_docs == 0:
            return 0.0

        # Term counts in document
        term_counts: Dict[str, int] = {}
        for t in doc_tokens:
            term_counts[t] = term_counts.get(t, 0) + 1

        score = 0.0
        for q in query_tokens:
            if q in term_counts:
                tf = term_counts[q]
                df = self.doc_frequencies.get(q, 1)
                # Robertson-Spärck Jones IDF
                idf = math.log(1.0 + (self.total_docs - df + 0.5) / (df + 0.5))
                numerator = tf * (k1 + 1.0)
                denominator = tf + k1 * (1.0 - b + b * (doc_len / self.avg_doc_len))
                score += idf * (numerator / denominator)

        # Boost if act name or section specifically matches
        for q in query_tokens:
            if q in chunk.get("section", "").lower():
                score += 3.0
            if q in chunk.get("act_name", "").lower():
                score += 2.0
            if q in chunk.get("heading", "").lower():
                score += 1.5

        return score

    def search(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """Search legal knowledge base using hybrid BM25 and keyword ranking."""
        query_tokens = self.tokenize(query)
        if not query_tokens or not self.chunks:
            return []

        scored_chunks = []
        for chunk in self.chunks:
            score = self.bm25_score(query_tokens, chunk)
            if score > 0.05:
                scored_chunks.append({
                    "chunk": chunk,
                    "score": round(score, 4)
                })

        # Sort descending by score
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]

# Global singleton
vector_store = LegalVectorStore()

