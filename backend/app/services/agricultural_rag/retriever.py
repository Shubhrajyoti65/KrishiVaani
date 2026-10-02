"""
KrishiVaani — Semantic RAG Retrieval Engine
Retrieves authoritative agricultural guidelines matching farmers' queries and context.
Works offline and in-memory with zero external API dependencies.
"""
import re
import math
from typing import List, Dict, Any, Optional
from collections import Counter
from backend.app.services.agricultural_rag.knowledge_corpus import AGRICULTURAL_DOCUMENTS
from backend.app.services.agricultural_rag.schema import DocumentCitation, RAGQueryResponse

def tokenize(text: str) -> List[str]:
    """Tokenize and normalize text."""
    words = re.findall(r"\b[a-zA-Z0-9_\-\.]{2,}\b", text.lower())
    stop_words = {
        "the", "and", "for", "with", "this", "that", "from", "are", "can",
        "has", "have", "per", "acre", "crop", "plant", "use", "when", "how"
    }
    return [w for w in words if w not in stop_words]

class AgriculturalRetriever:
    def __init__(self, corpus: List[Dict[str, Any]] = AGRICULTURAL_DOCUMENTS):
        self.corpus = corpus
        self._build_index()

    def _build_index(self):
        self.doc_vectors = []
        self.doc_lengths = []
        self.df = Counter()
        self.N = len(self.corpus)

        for doc in self.corpus:
            combined_text = f"{doc['title']} {doc['crop']} {doc['disease']} {doc['topic']} {doc['region']} {doc['content']}"
            tokens = tokenize(combined_text)
            tf = Counter(tokens)
            self.doc_vectors.append(tf)
            self.doc_lengths.append(len(tokens) or 1)
            for token in set(tokens):
                self.df[token] += 1

    def retrieve(
        self,
        query: str,
        crop: Optional[str] = None,
        topic: Optional[str] = None,
        region: Optional[str] = None,
        top_k: int = 3
    ) -> List[DocumentCitation]:
        q_tokens = tokenize(query)
        if not q_tokens and not crop and not topic:
            return []

        # BM25-style scoring
        k1 = 1.5
        b = 0.75
        avg_len = sum(self.doc_lengths) / (self.N or 1)

        scores = []
        for i, doc in enumerate(self.corpus):
            # Metadata hard filters if provided
            if crop and doc["crop"].lower() != "general" and crop.lower() not in doc["crop"].lower():
                continue
            if topic and doc["topic"].lower() != topic.lower():
                continue
            if region and doc["region"].lower() != "national" and region.lower() not in doc["region"].lower():
                continue

            score = 0.0
            doc_tf = self.doc_vectors[i]
            doc_l = self.doc_lengths[i]

            for t in q_tokens:
                if t in doc_tf:
                    freq = doc_tf[t]
                    doc_freq = self.df.get(t, 1)
                    idf = math.log((self.N - doc_freq + 0.5) / (doc_freq + 0.5) + 1.0)
                    tf_norm = (freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (doc_l / avg_len)))
                    score += idf * tf_norm

            # Bonus for exact crop / topic / title matches
            q_lower = query.lower()
            if doc["crop"].lower() in q_lower and doc["crop"].lower() != "general":
                score += 3.0
            if doc["disease"].lower() in q_lower and doc["disease"].lower() != "none":
                score += 4.5
            if doc["topic"].lower() in q_lower:
                score += 2.0

            if score > 0:
                scores.append((score, doc))

        scores.sort(key=lambda x: x[0], reverse=True)

        citations = []
        for s, d in scores[:top_k]:
            content = d["content"]
            if len(content) > 800:
                snippet = content[:797] + "..."
            else:
                snippet = content
            citations.append(DocumentCitation(
                doc_id=d["doc_id"],
                title=d["title"],
                source=d["source"],
                crop=d["crop"],
                topic=d["topic"],
                region=d["region"],
                relevance_score=round(float(s), 3),
                snippet=snippet
            ))

        return citations

    def format_grounded_context(self, citations: List[DocumentCitation]) -> str:
        if not citations:
            return "No specific authoritative agricultural document matched your query."
        lines = ["=== AUTHORITATIVE AGRICULTURAL KNOWLEDGE CITATIONS ==="]
        for c in citations:
            lines.append(f"[{c.doc_id}] {c.title} ({c.source})")
            lines.append(f"Target Crop: {c.crop} | Topic: {c.topic} | Region: {c.region}")
            lines.append(f"Excerpt: {c.snippet}")
            lines.append("---")
        return "\n".join(lines)

    def query(self, req) -> RAGQueryResponse:
        citations = self.retrieve(
            query=req.query,
            crop=req.crop,
            topic=req.topic,
            region=req.region,
            top_k=req.top_k
        )
        context = self.format_grounded_context(citations)
        return RAGQueryResponse(
            query=req.query,
            results_count=len(citations),
            citations=citations,
            grounded_context=context
        )

# Global singleton
agri_rag = AgriculturalRetriever()
