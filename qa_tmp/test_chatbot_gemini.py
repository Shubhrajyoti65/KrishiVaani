import os
import sys
import asyncio

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

sys.path.insert(0, os.path.abspath("."))
from backend.app.core.config import settings
from backend.app.services.chatbot_agent.agent import chatbot_agent
from backend.app.services.chatbot_agent.schema import ChatRequest

async def main():
    print(f"Testing Chatbot Agent with Gemini API...")
    print(f"GEMINI_API_KEY present: {bool(settings.GEMINI_API_KEY)}")
    print(f"GEMINI_MODEL: {settings.GEMINI_MODEL}")

    req = ChatRequest(
        message="What is the weather in Cuttack, Odisha and what crop should I plant in alluvial soil?",
        district="Cuttack",
        state="Odisha",
        soil_type="Alluvial",
        language="en"
    )

    res = await chatbot_agent.process_chat(req)
    print("\n" + "=" * 60)
    print("REPLY FROM CHATBOT:")
    print("=" * 60)
    print(res.reply)
    print("\nTOOLS INVOKED:", [t.tool_name for t in res.tools_invoked])

if __name__ == "__main__":
    asyncio.run(main())
