"""
NyayaSuno - Legal Retriever & Query Expansion Pipeline
Retrieves verified statutory provisions using precompiled regex expansion rules,
hybrid BM25 ranking, and anti-hallucination sufficiency scoring.
"""

import re
import logging
from functools import lru_cache
from typing import List, Dict, Any, Tuple, Optional
from app.rag.vector_store import vector_store, LegalVectorStore
from app.models.schemas import LegalSourceCitation

logger = logging.getLogger("nyayasuno.retriever")

# Raw query expansion rules for Indian legal concepts
RAW_EXPANSION_RULES = [
    (r"(deposit|security|kiraya|advance|bayaan)", "security deposit refund Model Tenancy Act rental agreement deductions rent authority"),
    (r"(landlord|makan\s*malik|ghar\s*malik|owner)", "landlord tenant dispute notice eviction essential services"),
    (r"(salary|vetan|tankhwah|wages|dues|unpaid)", "Payment of Wages Act Code on Wages unpaid delayed salary recovery labour court"),
    (r"(consumer|grahak|upbhokta|fraud|kharab|damaged|fake|amazon|flipkart|refund)", "Consumer Protection Act 2019 deficiency in service district commission e-daakhil 1915"),
    (r"(lawyer|vakeel|court|fees|nalsa|sahayata|free)", "Legal Services Authorities Act 1987 NALSA Section 12 free legal aid lok adalat 15100"),
    (r"(notice|legal\s*notice|vakalatnama|threat|summons)", "Section 80 CPC reply to legal notice Limitation Act 1963 breach of contract")
]

# Precompiled regex patterns to eliminate per-request compilation overhead
COMPILED_EXPANSION_RULES: List[Tuple[re.Pattern, str]] = [
    (re.compile(pattern, re.IGNORECASE), expansion)
    for pattern, expansion in RAW_EXPANSION_RULES
]

class LegalRetriever:
    """
    Orchestrates query expansion and semantic retrieval from the statutory knowledge base.
    Guarantees that retrieved citations are grounded in verified Indian Acts.
    """

    def __init__(self, store: Optional[LegalVectorStore] = None):
        self.store: LegalVectorStore = store or vector_store

    @staticmethod
    def expand_query(query: str) -> str:
        """
        Expand colloquial citizen terms (Hindi, English, Hinglish) with statutory keywords.
        Utilizes precompiled regex patterns for maximum execution speed.
        """
        if not query:
            return ""
        
        expanded = query.lower()
        additions = []
        for pattern, statutory_keywords in COMPILED_EXPANSION_RULES:
            if pattern.search(expanded):
                additions.append(statutory_keywords)

        if additions:
            return f"{expanded} {' '.join(additions)}"
        return expanded

    def retrieve(self, query: str, top_k: int = 4) -> Tuple[List[LegalSourceCitation], str, bool]:
        """
        Retrieve relevant legal sources for the citizen query.
        
        Args:
            query: Spoken or typed legal query from citizen.
            top_k: Maximum number of statutory provisions to return.

        Returns:
            Tuple of:
            - citations: List[LegalSourceCitation]
            - context_text: Formatted statutory context for LLM grounding
            - is_insufficient: Boolean indicating if retrieval confidence is low
        """
        clean_query = query.strip()
        if not clean_query:
            return [], "No query provided.", True

        expanded_query = self.expand_query(clean_query)
        results = self.store.search(expanded_query, top_k=top_k)

        # Fallback to literal query if expansion yielded no results
        if not results and expanded_query != clean_query:
            results = self.store.search(clean_query, top_k=top_k)

        if not results:
            logger.info(f"Zero legal provisions matched for query: '{clean_query[:50]}'")
            return [], "No verified legal provisions found for this specific query.", True

        citations: List[LegalSourceCitation] = []
        context_parts: List[str] = []

        for item in results:
            chunk = item["chunk"]
            score = item["score"]

            cit = LegalSourceCitation(
                title=f"{chunk.get('act_name')} - {chunk.get('section')}",
                act_name=chunk.get("act_name", ""),
                section=chunk.get("section", ""),
                heading=chunk.get("heading", ""),
                official_url=chunk.get("official_url"),
                india_code_url=chunk.get("india_code_url"),
                relevance_score=score,
                snippet=chunk.get("content", "")[:280] + "..."
            )
            citations.append(cit)

            context_parts.append(
                f"[Source: {chunk.get('act_name')} | Section: {chunk.get('section')} ({chunk.get('heading')})]\n"
                f"Official Reference: {chunk.get('official_url') or chunk.get('india_code_url')}\n"
                f"Statutory Provision: {chunk.get('content')}\n"
            )

        context_text = "\n---\n".join(context_parts)
        is_insufficient = len(citations) == 0 or max(item["score"] for item in results) < 0.2

        return citations, context_text, is_insufficient

# Singleton Retriever
legal_retriever = LegalRetriever()
