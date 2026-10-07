from fastapi import APIRouter, HTTPException, status
from backend.app.services.chatbot_agent.schema import (
    ChatRequest,
    ChatResponse,
)
from backend.app.services.chatbot_agent.agent import chatbot_agent

router = APIRouter(
    prefix="/chatbot",
    tags=["KrishiMitra Google Gemini AI Agricultural Chatbot"]
)

@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Chat with KrishiMitra Gemini AI Assistant",
    description="Processes farmer queries with direct Google Gemini integration, personalized with MongoDB farmer profile, live weather, satellite NDVI, and RAG agricultural guidelines."
)
async def chat_with_agent(request: ChatRequest) -> ChatResponse:
    try:
        return await chatbot_agent.process_chat(request)
    except Exception as e:
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE if ("429" in str(e) or "quota" in str(e).lower()) else status.HTTP_500_INTERNAL_SERVER_ERROR
        raise HTTPException(
            status_code=status_code,
            detail=f"Chatbot error: {str(e)}"
        )

# Additional alias router under /agriculture
agri_chat_router = APIRouter(
    prefix="/agriculture",
    tags=["Agricultural AI Assistant"]
)

@agri_chat_router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Chat with Agricultural AI Assistant"
)
async def chat_with_agriculture_assistant(request: ChatRequest) -> ChatResponse:
    return await chat_with_agent(request)

# Additional alias router under /chat
chat_message_router = APIRouter(
    prefix="/chat",
    tags=["Chat Alias"]
)

@chat_message_router.post(
    "/message",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Chat alias for frontend widget (/chat/message)"
)
async def chat_message_alias(request: ChatRequest) -> ChatResponse:
    return await chat_with_agent(request)

@chat_message_router.post(
    "/",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Chat alias (/chat)"
)
async def chat_alias(request: ChatRequest) -> ChatResponse:
    return await chat_with_agent(request)
