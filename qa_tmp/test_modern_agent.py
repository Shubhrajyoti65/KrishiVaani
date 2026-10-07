import sys, asyncio
sys.path.insert(0, ".")
from backend.app.services.chatbot_agent.agent import _get_llm, SYSTEM_PROMPT
from backend.app.services.chatbot_agent.tools import ALL_TOOLS
from langchain.agents import create_agent

sys.stdout.reconfigure(encoding="utf-8")

llm = _get_llm()
graph = create_agent(
    model=llm,
    tools=ALL_TOOLS,
    system_prompt=SYSTEM_PROMPT,
)

async def test():
    user_query = "Which crop should I grow in my alluvial soil in bhubaneswar?"
    print(f"Query: {user_query}")
    result = await graph.ainvoke({
        "messages": [{"role": "user", "content": user_query}]
    })
    messages = result["messages"]
    print(f"Total messages in graph trace: {len(messages)}")
    for i, m in enumerate(messages):
        tc = getattr(m, "tool_calls", None)
        t_name = getattr(m, "name", None)
        print(f"Msg {i}: {type(m).__name__} | name: {t_name} | tool_calls: {tc}")

    last_msg = messages[-1]
    content = last_msg.content
    if isinstance(content, list):
        text = "".join([item.get("text", "") for item in content if isinstance(item, dict)])
    else:
        text = str(content)
    print("\n--- FINAL GEMINI RESPONSE ---")
    print(text)

if __name__ == "__main__":
    asyncio.run(test())
