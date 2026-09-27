from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Farmer user prompt or question")
    farmer_id: Optional[str] = Field(None, description="Optional registered farmer ID")
    session_id: Optional[str] = Field(None, description="Session ID for conversation memory continuity")
    district: Optional[str] = Field(None, description="District location context")
    state: Optional[str] = Field(None, description="State location context")
    soil_type: Optional[str] = Field(None, description="Soil type context (e.g. Alluvial, Black, Red)")
    language: str = Field("en", description="Language code (en, hi, or)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "message": "What crop should I grow in Cuttack with alluvial soil and high rainfall?",
                "farmer_id": "f_123456",
                "session_id": "sess_abc123",
                "district": "Cuttack",
                "state": "Odisha",
                "soil_type": "Alluvial",
                "language": "en"
            }
        }
    }

class ToolInvocationResult(BaseModel):
    tool_name: str
    input_args: Dict[str, Any]
    output_summary: str

class ChatResponse(BaseModel):
    reply: str
    language: str
    tools_invoked: List[ToolInvocationResult] = []
    structured_payload: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None
