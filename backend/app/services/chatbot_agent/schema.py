from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Farmer user prompt or question")
    farmer_id: Optional[str] = Field(None, description="Optional registered farmer ID")
    district: Optional[str] = Field(None, description="District location context")
    state: Optional[str] = Field(None, description="State location context")
    language: str = Field("en", description="Language code (en, hi, or)")

    model_config = {
        "json_schema_extra": {
            "example": {
                "message": "What crop should I grow in Cuttack with high rainfall and neutral soil pH?",
                "farmer_id": "f_123456",
                "district": "Cuttack",
                "state": "Odisha",
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
    tools_invoked: List[ToolInvocationResult]
    structured_payload: Optional[Dict[str, Any]] = None
