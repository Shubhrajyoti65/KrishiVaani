"""
KrishiVaani — Agricultural RAG Schemas
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class RAGQueryRequest(BaseModel):
    query: str = Field(..., description="Agricultural query or symptom/practice question")
    crop: Optional[str] = Field(None, description="Optional target crop filter")
    topic: Optional[str] = Field(None, description="Optional topic filter (e.g. disease_management, soil_improvement, crop_rotation, fertilizer, safety)")
    region: Optional[str] = Field(None, description="Optional agricultural zone or region")
    top_k: int = Field(3, ge=1, le=10, description="Number of relevant documents to retrieve")

class DocumentCitation(BaseModel):
    doc_id: str
    title: str
    source: str
    crop: str
    topic: str
    region: str
    relevance_score: float
    snippet: str

class RAGQueryResponse(BaseModel):
    query: str
    results_count: int
    citations: List[DocumentCitation]
    grounded_context: str
    disclaimer: str = "Knowledge retrieved from official agricultural research publications (ICAR, CIBRC, State Agri Universities). Always adhere to local agronomic bulletins."
