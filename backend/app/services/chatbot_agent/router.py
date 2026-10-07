from fastapi import APIRouter, HTTPException, status
from backend.app.services.chatbot_agent.schema import (
    ChatRequest,
    ChatResponse,
)
from backend.app.services.chatbot_agent.agent import chatbot_agent

router = APIRouter(
    prefix="/chatbot",
    tags=["LangChain Tool-Calling Conversational Chatbot Agent"]
)

@router.post(
    "/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Chat with KrishiVaani Tool-Calling AI Assistant",
    description="Processes farmer queries in natural language, automatically triggers underlying ML models (crop rec, yield prediction, weather advisory, disease detection, satellite NDVI), and returns a formatted conversational reply with structured payloads."
)
async def chat_with_agent(request: ChatRequest) -> ChatResponse:
    try:
        return await chatbot_agent.process_chat(request)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chatbot agent error: {str(e)}"
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
