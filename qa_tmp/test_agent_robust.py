import sys, asyncio
sys.path.insert(0, ".")

from backend.app.services.chatbot_agent.agent import _get_llm, SYSTEM_PROMPT
from backend.app.services.chatbot_agent.tools import ALL_TOOLS
from langchain.agents import create_agent

sys.stdout.reconfigure(encoding="utf-8")

async def test():
    llm = _get_llm()
    agent = create_agent(
        model=llm,
        tools=ALL_TOOLS,
        system_prompt=SYSTEM_PROMPT,
    )

    test_queries = [
        "help me on wheat production",
        "Which crop should I grow in my alluvial soil in bhubaneswar?",
        "What is the weather in Jaipur right now?"
    ]

    for q in test_queries:
        print(f"\n====================\nQUERY: {q}")
        res = await agent.ainvoke({"messages": [{"role": "user", "content": q}]})
        msgs = res["messages"]
        print(f"Total msgs: {len(msgs)}")
        last = msgs[-1]
        c = last.content
        text = c if isinstance(c, str) else "".join([x.get("text", "") for x in c if isinstance(x, dict)])
        print(f"REPLY:\n{text[:250]}...")
        # Check tool calls
        for m in msgs:
            if hasattr(m, "tool_calls") and m.tool_calls:
                print(f"Tools called: {[tc['name'] for tc in m.tool_calls]}")

if __name__ == "__main__":
    asyncio.run(test())
