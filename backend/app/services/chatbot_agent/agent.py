"""
KrishiVaani — Real LangChain Tool-Calling Agent
Uses create_tool_calling_agent with OpenAI/Anthropic LLM.
Falls back to intelligent rule-based routing when no LLM key is set.
"""
import os
import json
import re
import uuid
from typing import Optional

from backend.app.core.config import settings
from backend.app.services.chatbot_agent.schema import (
    ChatRequest, ChatResponse, ToolInvocationResult,
)
from backend.app.services.chatbot_agent.tools import (
    recommend_crop_tool, predict_yield_tool, get_weather_advisory_tool,
    detect_disease_tool, get_satellite_ndvi_tool,
    get_fertilizer_recommendation_tool, get_crop_calendar_tool,
    get_crop_rotation_tool, get_market_price_tool,
    ALL_TOOLS,
)
from backend.app.services.chatbot_agent.memory import get_messages, save_exchange, clear_memory

# ── System prompt — agriculture-only domain lock ──────────────────────────────
SYSTEM_PROMPT = """You are KrishiVaani, an expert AI farming assistant for Indian farmers.
You ONLY answer agriculture-related questions. For anything unrelated to farming, crops,
soil, weather, pest, market prices, or government schemes — politely say:
"I can only help with farming and agriculture topics."

You have access to real tools for:
- Crop recommendation (soil NPK + climate → best crop)
- Yield & MSP revenue prediction
- Weather advisory and extreme alerts
- Fertilizer and soil nutrient dose recommendation
- Crop sowing/harvesting calendar by state
- Crop rotation advice
- Leaf disease detection (requires image)
- Satellite NDVI field health monitoring
- Mandi/market price lookup

Always:
1. Use the farmer's remembered location/soil data from conversation history when relevant.
2. Provide answers in simple, practical language a rural farmer can understand.
3. Include specific Indian product names (e.g. Urea, DAP, Carbendazim) when giving advice.
4. Quote government MSP prices and scheme names where applicable.
5. If asked in Hindi or Odia, respond in that language.
"""

# ── Build LLM (lazy — only when first message arrives) ────────────────────────
_llm = None

def _get_llm():
    global _llm
    if _llm is not None:
        return _llm

    openai_key = settings.OPENAI_API_KEY
    anthropic_key = settings.ANTHROPIC_API_KEY

    if openai_key:
        try:
            from langchain_openai import ChatOpenAI
            _llm = ChatOpenAI(
                model="gpt-4o-mini",
                temperature=0.3,
                openai_api_key=openai_key,
                streaming=False,
            )
            return _llm
        except Exception:
            pass

    if anthropic_key:
        try:
            from langchain_anthropic import ChatAnthropic
            _llm = ChatAnthropic(
                model="claude-3-haiku-20240307",
                temperature=0.3,
                anthropic_api_key=anthropic_key,
            )
            return _llm
        except Exception:
            pass

    return None  # No LLM configured → fallback mode


# ── Build LangChain agent (lazy) ───────────────────────────────────────────────
_agent_executor = None

def _get_agent():
    global _agent_executor
    if _agent_executor is not None:
        return _agent_executor

    llm = _get_llm()
    if llm is None:
        return None

    try:
        from langchain.agents import AgentExecutor, create_tool_calling_agent
        from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

        prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder("chat_history", optional=True),
            ("human", "{input}"),
            MessagesPlaceholder("agent_scratchpad"),
        ])

        agent = create_tool_calling_agent(llm, ALL_TOOLS, prompt)
        _agent_executor = AgentExecutor(
            agent=agent,
            tools=ALL_TOOLS,
            verbose=False,
            handle_parsing_errors=True,
            max_iterations=5,
            return_intermediate_steps=True,
        )
        return _agent_executor
    except Exception:
        return None


# ── Intelligent rule-based fallback ───────────────────────────────────────────
async def _rule_based_response(request: ChatRequest) -> ChatResponse:
    """
    When no LLM is configured, this provides intelligent, informative responses
    by directly calling tools based on keyword intent detection.
    """
    msg = request.message.lower()
    reply_parts = []
    tools_invoked = []
    structured_payload = {}

    # ── Weather ──────────────────────────────────────────────────────────────
    if any(w in msg for w in ["weather", "rain", "temperature", "forecast", "alert",
                               "heatwave", "frost", "मौसम", "बारिश", "ବର୍ଷା"]):
        district = request.district or "Delhi"
        state = request.state or "Delhi"
        loc_match = re.search(r"in\s+([a-zA-Z]+)", request.message)
        if loc_match:
            district = loc_match.group(1).capitalize()
        try:
            raw = await get_weather_advisory_tool.ainvoke({"district": district, "state": state})
            data = json.loads(raw)
            tools_invoked.append(ToolInvocationResult(
                tool_name="get_weather_advisory_tool",
                input_args={"district": district, "state": state},
                output_summary=f"{data['location_name']}: {data['current']['temperature_c']}°C"
            ))
            structured_payload["weather"] = data
            alerts = ", ".join([a["title"] for a in data.get("active_alerts", [])]) or "None"
            reply_parts.append(
                f"🌡️ **Weather Update — {data['location_name']}**\n"
                f"• Temperature: {data['current']['temperature_c']}°C ({data['current']['condition']})\n"
                f"• Humidity: {data['current']['humidity_percent']}%\n"
                f"• Active Alerts: {alerts}\n"
                f"• Advisory: {data['agromet_advisories'][0] if data.get('agromet_advisories') else 'No active advisory'}"
            )
        except Exception as e:
            reply_parts.append("⚠️ Could not fetch live weather. Please check your OpenWeatherMap API key in `.env`.")

    # ── Crop Recommendation ───────────────────────────────────────────────────
    if any(w in msg for w in ["crop", "grow", "plant", "recommend", "soil", "npk",
                               "फसल", "ਫ਼ਸਲ", "ଫସଲ"]):
        n, p, k = 90.0, 42.0, 43.0
        try:
            raw = recommend_crop_tool.invoke({
                "nitrogen": n, "phosphorus": p, "potassium": k,
                "temperature": 25.0, "humidity": 80.0, "ph": 6.5, "rainfall": 200.0
            })
            data = json.loads(raw)
            tools_invoked.append(ToolInvocationResult(
                tool_name="recommend_crop_tool",
                input_args={"N": n, "P": p, "K": k},
                output_summary=f"Recommended: {data['primary_recommendation']} ({round(data['confidence']*100,1)}%)"
            ))
            structured_payload["crop_recommendation"] = data
            alts = ", ".join([c["crop"].capitalize() for c in data.get("top_recommendations", [])[1:3]])
            reply_parts.append(
                f"🌾 **Crop Recommendation**\n"
                f"• Best crop: **{data['primary_recommendation'].capitalize()}** "
                f"({round(data['confidence']*100,1)}% confidence)\n"
                f"• Alternatives: {alts}\n"
                f"• Soil note: {list(data.get('soil_health_assessment', {}).values())[0] if data.get('soil_health_assessment') else ''}\n"
                f"• Tip: {data.get('advisory_notes', [''])[0]}"
            )
        except Exception:
            pass

    # ── Yield / Revenue ───────────────────────────────────────────────────────
    if any(w in msg for w in ["yield", "quintal", "harvest", "revenue", "income", "msp",
                               "उपज", "ਉਪਜ", "ଅମଳ"]):
        crop = "rice"
        for c in ["wheat", "cotton", "maize", "soybean", "mustard", "chickpea"]:
            if c in msg:
                crop = c; break
        try:
            raw = predict_yield_tool.invoke({
                "crop": crop, "state": request.state or "Punjab",
                "season": "Kharif", "area_acres": 5.0,
                "nitrogen": 90.0, "phosphorus": 45.0, "potassium": 40.0,
                "rainfall": 1100.0, "temperature": 27.5
            })
            data = json.loads(raw)
            tools_invoked.append(ToolInvocationResult(
                tool_name="predict_yield_tool",
                input_args={"crop": crop},
                output_summary=f"{data['predicted_yield_per_acre_quintals']} qtl/acre"
            ))
            structured_payload["yield_prediction"] = data
            rev = data["revenue_estimate"]
            reply_parts.append(
                f"📊 **Yield & Revenue — {crop.capitalize()}** (5 acres)\n"
                f"• Yield per acre: **{data['predicted_yield_per_acre_quintals']} quintals**\n"
                f"• Total production: {data['total_expected_yield_quintals']} quintals\n"
                f"• Revenue at MSP ₹{rev['estimated_msp_per_quintal_inr']}/qtl: "
                f"₹{rev['min_total_revenue_inr']:,} – ₹{rev['max_total_revenue_inr']:,}"
            )
        except Exception:
            pass

    # ── Fertilizer ────────────────────────────────────────────────────────────
    if any(w in msg for w in ["fertilizer", "urea", "dap", "potash", "nutrient",
                               "खाद", "ਖਾਦ", "ସାର"]):
        crop = "rice"
        for c in ["wheat", "cotton", "maize", "sugarcane", "potato"]:
            if c in msg:
                crop = c; break
        try:
            raw = get_fertilizer_recommendation_tool.invoke({
                "crop": crop, "nitrogen": 60.0, "phosphorus": 35.0, "potassium": 30.0,
                "soil_type": request.soil_type or "Alluvial",
                "state": request.state or "Punjab"
            })
            data = json.loads(raw)
            tools_invoked.append(ToolInvocationResult(
                tool_name="get_fertilizer_recommendation_tool",
                input_args={"crop": crop},
                output_summary=f"Fertilizer plan for {crop}"
            ))
            structured_payload["fertilizer"] = data
            doses = data.get("recommended_doses", {})
            reply_parts.append(
                f"🧪 **Fertilizer Plan — {crop.capitalize()}**\n"
                f"• Urea: {doses.get('urea_kg_per_acre', 'N/A')} kg/acre\n"
                f"• DAP: {doses.get('dap_kg_per_acre', 'N/A')} kg/acre\n"
                f"• MOP (Potash): {doses.get('mop_kg_per_acre', 'N/A')} kg/acre\n"
                f"• Schedule: {data.get('application_schedule', 'Apply as per soil test')}"
            )
        except Exception:
            pass

    # ── Crop Calendar ─────────────────────────────────────────────────────────
    if any(w in msg for w in ["sow", "sowing", "harvest", "calendar", "time", "when to",
                               "बुवाई", "ବୁଣିବା"]):
        crop = "rice"
        for c in ["wheat", "maize", "cotton", "mustard", "sugarcane"]:
            if c in msg:
                crop = c; break
        try:
            raw = get_crop_calendar_tool.invoke({
                "crop": crop, "state": request.state or "Punjab"
            })
            data = json.loads(raw)
            tools_invoked.append(ToolInvocationResult(
                tool_name="get_crop_calendar_tool",
                input_args={"crop": crop},
                output_summary=f"Calendar for {crop}"
            ))
            reply_parts.append(
                f"📅 **Crop Calendar — {crop.capitalize()} ({data.get('state', '')})**\n"
                f"• Sowing: {data.get('sowing_window', 'N/A')}\n"
                f"• Transplanting: {data.get('transplanting', 'N/A')}\n"
                f"• Harvesting: {data.get('harvesting_window', 'N/A')}\n"
                f"• Duration: {data.get('duration_days', 'N/A')} days\n"
                f"• Season: {data.get('season', '')}"
            )
        except Exception:
            pass

    # ── Crop Rotation ─────────────────────────────────────────────────────────
    if any(w in msg for w in ["rotation", "next crop", "after", "previous crop",
                               "फसल चक्र", "ଫସଲ ଚକ୍ର"]):
        prev = "rice"
        for c in ["wheat", "maize", "cotton", "chickpea", "mustard"]:
            if c in msg:
                prev = c; break
        try:
            raw = get_crop_rotation_tool.invoke({
                "previous_crop": prev,
                "soil_type": request.soil_type or "Alluvial",
                "state": request.state or "Punjab"
            })
            data = json.loads(raw)
            tools_invoked.append(ToolInvocationResult(
                tool_name="get_crop_rotation_tool",
                input_args={"previous_crop": prev},
                output_summary=f"Rotation after {prev}"
            ))
            recs = [r["crop"].capitalize() for r in data.get("recommended_next_crops", [])]
            reply_parts.append(
                f"🔄 **Crop Rotation — After {prev.capitalize()}**\n"
                f"• Recommended next crops: **{', '.join(recs)}**\n"
                f"• Reason: {data.get('rotation_benefit', '')}\n"
                f"• Soil benefit: {data.get('soil_benefit', '')}"
            )
        except Exception:
            pass

    # ── Satellite NDVI ────────────────────────────────────────────────────────
    if any(w in msg for w in ["satellite", "ndvi", "canopy", "field health",
                               "उपग्रह", "ଉପଗ୍ରହ"]):
        try:
            raw = await get_satellite_ndvi_tool.ainvoke({"latitude": 28.6, "longitude": 77.2})
            data = json.loads(raw)
            tools_invoked.append(ToolInvocationResult(
                tool_name="get_satellite_ndvi_tool",
                input_args={"lat": 28.6, "lon": 77.2},
                output_summary=f"NDVI: {data['ndvi_metrics']['mean_ndvi']}"
            ))
            structured_payload["satellite"] = data
            reply_parts.append(
                f"🛰️ **Satellite Field Health (Sentinel-2)**\n"
                f"• NDVI Index: **{data['ndvi_metrics']['mean_ndvi']}**\n"
                f"• Canopy Status: {data['ndvi_metrics']['canopy_health_status']}\n"
                f"• Advisory: {data['canopy_advisories'][0] if data.get('canopy_advisories') else 'N/A'}"
            )
        except Exception:
            pass

    # ── Default greeting/help ─────────────────────────────────────────────────
    if not reply_parts:
        reply_parts.append(
            "Namaste! 🙏 I am **KrishiVaani**, your AI farming assistant.\n\n"
            "I can help you with:\n"
            "• 🌾 **Crop Recommendation** — best crop for your soil & climate\n"
            "• 🧪 **Fertilizer Plan** — N/P/K doses from ICAR guidelines\n"
            "• 📅 **Sowing Calendar** — when to sow & harvest by state\n"
            "• 🔄 **Crop Rotation** — what to grow after your current crop\n"
            "• 📊 **Yield & MSP Revenue** — harvest forecast with income estimate\n"
            "• 🌡️ **Weather & Alerts** — heatwave/frost/rain advisories\n"
            "• 🍃 **Leaf Disease Diagnosis** — upload a leaf photo\n"
            "• 🛰️ **Satellite NDVI** — field canopy health monitoring\n\n"
            "Try asking: *\"Which crop should I grow in my alluvial soil in Punjab?\"* "
            "or *\"What is the MSP for wheat in 2025?\"*"
        )

    return ChatResponse(
        reply="\n\n".join(reply_parts),
        language=request.language,
        tools_invoked=tools_invoked,
        structured_payload=structured_payload or None,
    )


# ── Main agent class ───────────────────────────────────────────────────────────
class KrishiVaaniAgent:

    async def process_chat(self, request: ChatRequest) -> ChatResponse:
        # Generate or use provided session ID for memory
        session_id = getattr(request, "session_id", None) or str(uuid.uuid4())

        agent_executor = _get_agent()

        # ── Path A: Real LangChain agent ──────────────────────────────────────
        if agent_executor is not None:
            try:
                history = get_messages(session_id)
                result = await agent_executor.ainvoke({
                    "input": request.message,
                    "chat_history": history,
                })
                reply = result.get("output", "")

                # Save to memory
                save_exchange(session_id, request.message, reply)

                # Extract tool calls from intermediate steps
                tools_invoked = []
                for step in result.get("intermediate_steps", []):
                    action, observation = step
                    tools_invoked.append(ToolInvocationResult(
                        tool_name=action.tool,
                        input_args=action.tool_input if isinstance(action.tool_input, dict) else {"input": str(action.tool_input)},
                        output_summary=str(observation)[:200],
                    ))

                return ChatResponse(
                    reply=reply,
                    language=request.language,
                    tools_invoked=tools_invoked,
                    structured_payload=None,
                    session_id=session_id,
                )
            except Exception as e:
                # If LangChain agent fails, fall through to rule-based
                pass

        # ── Path B: Rule-based fallback ───────────────────────────────────────
        response = await _rule_based_response(request)
        # Save to memory even in fallback mode
        save_exchange(session_id, request.message, response.reply)
        response.session_id = session_id
        return response


chatbot_agent = KrishiVaaniAgent()
