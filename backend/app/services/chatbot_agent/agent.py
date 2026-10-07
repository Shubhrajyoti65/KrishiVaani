"""
KrishiVaani — Real LangChain Tool-Calling Agent
Uses create_tool_calling_agent with Google Gemini LLM.
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

You have access to real specialized tools for:
- Crop recommendation (soil NPK + climate → best crop)
- 3-Year Crop Planning & Multi-Year Sequence Optimization
- Yield & MSP revenue prediction
- Production cost & gross return calculation
- Weather advisory and extreme alerts
- Fertilizer and soil nutrient dose recommendation
- Crop sowing/harvesting calendar by state
- Crop rotation advice
- Leaf disease detection (requires image)
- Satellite NDVI field health monitoring
- Mandi/market price lookup
- Agricultural RAG Knowledge Retrieval (authoritative ICAR / CIBRC / SAU guidelines)

CRITICAL RULES FOR ADVISORY:
1. NEVER invent or hallucinate chemical pesticides, active ingredients, dosages, or pre-harvest intervals. ALWAYS ground pesticide guidance in `query_agricultural_rag_tool`.
2. Do NOT use LLM arithmetic for crop yield or production costs; rely strictly on specialized calculation tools.
3. For multi-year cropping decisions, recommend structured 3-year sequences (incorporating legumes to fix nitrogen and break pest cycles).
4. Provide answers in simple, practical language a rural farmer can understand.
5. If asked in Hindi or Odia, respond in that language.
"""

# ── Build LLM (lazy — only when first message arrives) ────────────────────────
_llm = None

def _get_llm():
    global _llm
    if _llm is not None:
        return _llm

    gemini_key = (
        getattr(settings, "GEMINI_API_KEY", None)
        or getattr(settings, "GOOGLE_API_KEY", None)
        or os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
    )

    if gemini_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            model_name = getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash") or "gemini-2.5-flash"
            _llm = ChatGoogleGenerativeAI(
                model=model_name,
                google_api_key=gemini_key,
                temperature=0.3,
                max_retries=1,
            )
            return _llm
        except Exception:
            pass

    return None  # No LLM configured → fallback mode


# ── Build LangChain agent (lazy) ───────────────────────────────────────────────
_agent_graph = None

def _get_agent():
    global _agent_graph
    if _agent_graph is not None:
        return _agent_graph

    llm = _get_llm()
    if llm is None:
        return None

    try:
        from langchain.agents import create_agent
        _agent_graph = create_agent(
            model=llm,
            tools=ALL_TOOLS,
            system_prompt=SYSTEM_PROMPT,
        )
        return _agent_graph
    except Exception as e:
        import logging
        logging.getLogger(__name__).exception("Failed to create LangChain agent: %s", e)
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
    weather_keywords = ["weather", "forecast", "temperature", "heatwave", "frost", "alert", "मौसम", "बारिश", "ବର୍ଷା"]
    is_weather_explicit = any(w in msg for w in weather_keywords) or (bool(re.search(r"\b(rain|raining|showers)\b", msg)) and not any(k in msg for k in ["crop", "grow", "plant", "sow", "yield"]))

    if is_weather_explicit:
        district = request.district or "Delhi"
        state = request.state or "Delhi"
        stop_locs = {"my", "the", "this", "our", "a", "an", "soil", "field", "kharif", "rabi", "summer", "winter", "autumn", "pot"}
        loc_match = re.search(r"\bin\s+([a-zA-Z]+)", request.message, re.IGNORECASE)
        if loc_match and loc_match.group(1).lower() not in stop_locs:
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

    # ── 3-Year Crop Planning ──────────────────────────────────────────────────
    if any(w in msg for w in ["3-year", "three year", "3 year", "multi-year", "multi year", "planning", "3 वर्ष", "ତିନି ବର୍ଷ"]):
        try:
            from backend.app.services.chatbot_agent.tools import generate_three_year_crop_plan_tool
            raw = generate_three_year_crop_plan_tool.invoke({
                "state": request.state or "Punjab",
                "district": request.district or "Ludhiana",
                "current_season": "Kharif",
                "previous_crop": "Rice"
            })
            data = json.loads(raw)
            tools_invoked.append(ToolInvocationResult(
                tool_name="generate_three_year_crop_plan_tool",
                input_args={"state": request.state or "Punjab"},
                output_summary=f"3-Year Plan: {[p['recommended_crop'] for p in data['three_year_plan']]}"
            ))
            structured_payload["three_year_plan"] = data
            seq = " → ".join([f"{p['year_label'].split()[0]}: {p['recommended_crop']}" for p in data['three_year_plan']])
            reply_parts.append(
                f"🌱 **3-Year Crop Rotation Plan ({data['location']})**\n"
                f"• Sequence: **{seq}**\n"
                f"• Basis: {data['soil_source_label']}\n"
                f"• Agronomic Benefit: {data['three_year_plan'][1]['agronomic_rationale']}\n"
                f"• Soil Plan: {data['soil_improvement_plan']['cover_crops_and_green_manure'][0]}"
            )
        except Exception:
            pass

    # ── Production Cost & Return Calculator ───────────────────────────────────
    if any(w in msg for w in ["cost", "expense", "budget", "input cost", "laagat", "খরচ", "लागत"]):
        crop = "rice"
        for c in ["wheat", "cotton", "maize", "potato", "sugarcane", "chickpea", "mustard"]:
            if c in msg:
                crop = c; break
        try:
            from backend.app.services.chatbot_agent.tools import calculate_production_cost_tool
            raw = calculate_production_cost_tool.invoke({
                "crop": crop, "state": request.state or "Punjab", "area_acres": 2.0
            })
            data = json.loads(raw)
            tools_invoked.append(ToolInvocationResult(
                tool_name="calculate_production_cost_tool",
                input_args={"crop": crop, "area_acres": 2.0},
                output_summary=f"Total Cost: ₹{data['total_production_cost_inr']:,}"
            ))
            structured_payload["production_cost"] = data
            reply_parts.append(
                f"💰 **Production Cost & Returns — {crop.capitalize()}** (2 acres)\n"
                f"• Total Estimated Cost: **₹{data['total_production_cost_inr']:,}** (₹{data['cost_per_acre_inr']:,}/acre)\n"
                f"• Estimated Revenue: ₹{data.get('estimated_revenue_inr', 0):,}\n"
                f"• Expected Gross Return: **₹{data.get('estimated_gross_return_inr', 0):,}**\n"
                f"• Note: {data['disclaimer']}"
            )
        except Exception:
            pass

    # ── Agricultural RAG Knowledge Retrieval ──────────────────────────────────
    if any(w in msg for w in ["blast", "blight", "disease", "pest", "pesticide", "cure", "treatment", "fungus", "soil health", "organic cure", "কীଟପତଙ୍ଗ", "रोग", "कीटनाशक"]):
        try:
            from backend.app.services.chatbot_agent.tools import query_agricultural_rag_tool
            raw = query_agricultural_rag_tool.invoke({"query": request.message})
            tools_invoked.append(ToolInvocationResult(
                tool_name="query_agricultural_rag_tool",
                input_args={"query": request.message},
                output_summary="Grounded ICAR/CIBRC agricultural guidelines retrieved"
            ))
            reply_parts.append(f"📚 **Grounded Agricultural Knowledge (ICAR / CIBRC)**\n{raw}")
        except Exception:
            pass

    # ── General Crop Inquiry ──────────────────────────────────────────────────
    if not reply_parts:
        crops_list = ["wheat", "rice", "maize", "cotton", "sugarcane", "mustard", "chickpea", "potato", "soybean", "barley", "groundnut", "jute"]
        matched_crop = next((c for c in crops_list if c in msg), None)
        if matched_crop:
            try:
                from backend.app.services.chatbot_agent.tools import get_crop_calendar_tool
                cal_raw = get_crop_calendar_tool.invoke({"state": request.state or "Punjab", "crop": matched_crop})
                cal_data = json.loads(cal_raw)
                tools_invoked.append(ToolInvocationResult(
                    tool_name="get_crop_calendar_tool",
                    input_args={"crop": matched_crop, "state": request.state or "Punjab"},
                    output_summary=f"Sowing calendar for {matched_crop}"
                ))
                reply_parts.append(
                    f"🌾 **Crop Overview — {matched_crop.capitalize()}**\n"
                    f"• Recommended Sowing Season: {cal_data.get('season', 'Standard')}\n"
                    f"• Sowing Period: {cal_data.get('sowing_window', 'Optimal season window')}\n"
                    f"• Harvesting Window: {cal_data.get('harvest_window', 'Maturity stage')}\n"
                    f"• Key Agronomic Advice: Ensure balanced NPK fertilization and timely irrigation."
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

        agent = _get_agent()

        # ── Path A: Real LangChain agent ──────────────────────────────────────
        if agent is not None:
            try:
                context_notes = []
                if request.district or request.state:
                    loc = ", ".join(filter(None, [request.district, request.state]))
                    context_notes.append(f"Location: {loc}")
                if request.soil_type:
                    context_notes.append(f"Soil Type: {request.soil_type}")
                if request.language and request.language != "en":
                    context_notes.append(f"Preferred Language: {request.language}")

                user_prompt = request.message
                if context_notes:
                    user_prompt = f"[{' | '.join(context_notes)}]\nUser Question: {user_prompt}"

                history = get_messages(session_id)
                formatted_messages = []
                for msg in history:
                    role = "user" if getattr(msg, "type", "") == "human" else "assistant"
                    formatted_messages.append({"role": role, "content": msg.content})
                formatted_messages.append({"role": "user", "content": user_prompt})

                result = await agent.ainvoke({"messages": formatted_messages})
                messages_out = result.get("messages", [])

                reply = ""
                tools_invoked = []
                for msg in messages_out:
                    if hasattr(msg, "tool_calls") and msg.tool_calls:
                        for tc in msg.tool_calls:
                            tools_invoked.append(ToolInvocationResult(
                                tool_name=tc.get("name", "tool"),
                                input_args=tc.get("args", {}) if isinstance(tc.get("args"), dict) else {},
                                output_summary="Tool executed"
                            ))
                    if hasattr(msg, "content") and getattr(msg, "name", None):
                        t_content = msg.content if isinstance(msg.content, str) else str(msg.content)
                        for ti in tools_invoked:
                            if ti.tool_name == msg.name and ti.output_summary == "Tool executed":
                                ti.output_summary = t_content[:200]
                                break

                # Extract last AI message content
                for msg in reversed(messages_out):
                    if type(msg).__name__ in ("AIMessage", "AIMessageChunk") or getattr(msg, "role", "") == "assistant":
                        c = msg.content
                        if isinstance(c, list):
                            reply = "".join([item.get("text", "") for item in c if isinstance(item, dict)])
                        else:
                            reply = str(c)
                        if reply.strip():
                            break

                if not reply and messages_out:
                    c = messages_out[-1].content
                    reply = str(c) if not isinstance(c, list) else "".join([item.get("text", "") for item in c if isinstance(item, dict)])

                if reply.strip():
                    save_exchange(session_id, request.message, reply)
                    return ChatResponse(
                        reply=reply,
                        language=request.language,
                        tools_invoked=tools_invoked,
                        structured_payload=None,
                        session_id=session_id,
                    )
            except Exception as e:
                import logging
                logging.getLogger(__name__).exception("Agent invocation failed, falling back to rule-based: %s", e)

        # ── Path B: Rule-based fallback ───────────────────────────────────────
        response = await _rule_based_response(request)
        # Save to memory even in fallback mode
        save_exchange(session_id, request.message, response.reply)
        response.session_id = session_id
        return response


chatbot_agent = KrishiVaaniAgent()
