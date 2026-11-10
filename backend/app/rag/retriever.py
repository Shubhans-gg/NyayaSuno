from typing import List, Dict, Any, Tuple
from app.rag.vector_store import vector_store
from app.models.schemas import LegalSourceCitation

# Common query expansion mappings for Indian legal problems
LEGAL_EXPANSION_RULES = [
    (r"(deposit|security|kiraya|advance|bayaan)", "security deposit refund Model Tenancy Act rental agreement deductions rent authority"),
    (r"(landlord|makan\s*malik|ghar\s*malik|owner)", "landlord tenant dispute notice eviction essential services"),
    (r"(salary|vetan|tankhwah|wages|dues|unpaid)", "Payment of Wages Act Code on Wages unpaid delayed salary recovery labour court"),
    (r"(consumer|grahak|upbhokta|fraud|kharab|damaged|fake|amazon|flipkart|refund)", "Consumer Protection Act 2019 deficiency in service district commission e-daakhil 1915"),
    (r"(lawyer|vakeel|court|fees|nalsa|sahayata|free)", "Legal Services Authorities Act 1987 NALSA Section 12 free legal aid lok adalat 15100"),
    (r"(notice|legal\s*notice|vakalatnama|threat|summons)", "Section 80 CPC reply to legal notice Limitation Act 1963 breach of contract")
]

class LegalRetriever:
    def __init__(self):
        self.store = vector_store

    def expand_query(self, query: str) -> str:
        """Expand user query with statutory concepts to maximize retrieval recall."""
        expanded = query.lower()
        import re
        for pattern, additions in LEGAL_EXPANSION_RULES:
            if re.search(pattern, expanded):
                expanded += f" {additions}"
        return expanded

    def retrieve(self, query: str, top_k: int = 4) -> Tuple[List[LegalSourceCitation], str, bool]:
        """
        Retrieve relevant legal sources for the query.
        Returns:
            - citations: List[LegalSourceCitation]
            - context_text: Formatted string for LLM prompt
            - is_insufficient: bool indicating whether verified sources are sparse
        """
        expanded_query = self.expand_query(query)
        results = self.store.search(expanded_query, top_k=top_k)

        # Fallback to plain query if expansion gave nothing
        if not results:
            results = self.store.search(query, top_k=top_k)

        if not results:
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

legal_retriever = LegalRetriever()

