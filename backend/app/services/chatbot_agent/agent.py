"""
KrishiVaani — Direct Gemini AI Chatbot Agent
Uses direct Google Gemini integration.
Preserves chatbot_agent singleton export for backward compatibility.
"""
from backend.app.services.gemini_chat import gemini_chat_service, GeminiChatService

# Export chatbot_agent as the direct GeminiChatService instance
chatbot_agent: GeminiChatService = gemini_chat_service
