"""
Unit and Integration Tests for Agricultural RAG Knowledge System
"""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.agricultural_rag.retriever import agri_rag
from backend.app.services.agricultural_rag.schema import RAGQueryRequest

client = TestClient(app)

def test_rag_retriever_direct_query():
    citations = agri_rag.retrieve(query="rice blast pesticide tricyclazole", crop="Rice", top_k=2)
    assert len(citations) > 0
    assert any("Blast" in c.title or "blast" in c.snippet.lower() for c in citations)
    assert any("Tricyclazole" in c.snippet for c in citations)

def test_rag_retriever_soil_improvement():
    citations = agri_rag.retrieve(query="green manuring dhaincha soil organic carbon", topic="soil_improvement")
    assert len(citations) > 0
    assert any("Soil" in c.title or "Dhaincha" in c.snippet for c in citations)

def test_rag_api_endpoint():
    payload = {
        "query": "How to manage potato late blight with bio fungicides?",
        "crop": "Potato",
        "top_k": 3
    }
    response = client.post("/api/v1/agriculture/rag/query", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["results_count"] > 0
    assert len(data["citations"]) > 0
    assert "CPRI" in data["grounded_context"] or "Potato" in data["grounded_context"]
