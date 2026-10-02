"""
KrishiVaani — Agricultural RAG API Router
"""
from fastapi import APIRouter, HTTPException, status
from backend.app.services.agricultural_rag.schema import RAGQueryRequest, RAGQueryResponse
from backend.app.services.agricultural_rag.retriever import agri_rag

router = APIRouter(
    prefix="/agriculture/rag",
    tags=["Agricultural RAG Knowledge System"]
)

@router.post(
    "/query",
    response_model=RAGQueryResponse,
    status_code=status.HTTP_200_OK,
    summary="Query agricultural knowledge base",
    description="Semantically retrieves authoritative recommendations from ICAR, CIBRC, and State Agricultural Universities for pests, diseases, crop rotations, soil health, and safety."
)
async def query_agricultural_knowledge(req: RAGQueryRequest) -> RAGQueryResponse:
    try:
        return agri_rag.query(req)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agricultural knowledge retrieval failed: {str(e)}"
        )
