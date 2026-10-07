"""
KrishiVaani — Direct Google Gemini Agricultural Chatbot Service
Talks directly to the official `google-genai` SDK.
Personalized with MongoDB farmer context, live weather, satellite NDVI, and RAG knowledge.
"""
import os
import asyncio
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid

from google import genai
from google.genai import types
from google.genai.errors import APIError, ClientError, ServerError

from backend.app.core.config import settings
from backend.app.services.chatbot_agent.schema import ChatRequest, ChatResponse, ToolInvocationResult
from backend.app.services.chatbot_agent.memory import (
    ChatMessage,
    load_history_async,
    save_exchange_async,
)
from backend.app.services.farmer_profile.repository import farmer_repository
from backend.app.services.agricultural_rag.retriever import AgriculturalRetriever
from backend.app.services.weather_service.service import weather_service
from backend.app.services.weather_service.schema import WeatherQuery

logger = logging.getLogger(__name__)

# Singleton RAG retriever
_rag_retriever = AgriculturalRetriever()

# Fixed Agricultural System Prompt (Strict KrishiMitra Persona & Rules)
KRISHIMITRA_SYSTEM_PROMPT = """You are KrishiMitra, an expert agricultural advisor for Indian farmers. You give practical, accurate, easy-to-understand advice on: crop selection and planning, soil health and fertilizer use, irrigation, weather-based farming decisions, crop disease and pest identification and management, yield improvement, NDVI/crop-health interpretation, government schemes and market basics related to farming, and sustainable farming practices.

RULES:
1. Stay strictly within agriculture, farming, and related rural livelihood topics. If the user asks about anything unrelated (politics, coding, entertainment, medical advice for humans, etc.), politely say you only help with farming and suggest what you can help with.
2. Always use the farmer context provided (location, soil, current crops, weather, NDVI, previous recommendations, farm history) to personalize answers. If important information is missing (for example soil type, crop stage, or location), ask ONE short clarifying question instead of guessing.
3. Give specific, actionable steps: what to do, how much, when, and why. Use metric units and local conventions (kg/acre or kg/hectare, seasons like Kharif/Rabi/Zaid). Mention approximate costs or timings only when you are reasonably sure.
4. For disease or pest questions: state the likely cause, symptoms to confirm, immediate treatment (organic and chemical options), prevention, and when to consult a local agriculture officer or Krishi Vigyan Kendra. Never give unsafe pesticide advice; always mention safety precautions and recommended dosages from the label or an expert.
5. If retrieved knowledge-base context is provided, base your answer on it and say so briefly. If the context does not cover the question, use your general agricultural knowledge but say you are less certain. Never invent facts, statistics, product names, or scheme details. If you do not know, say so.
6. Reply in the same language the farmer uses, in simple words. Keep answers concise: short paragraphs or a few clear bullet points, no long essays. Format with clean paragraphs and simple bullet points. End with one useful follow-up suggestion when appropriate.
7. Be respectful and encouraging; farmers may have limited literacy and tech exposure."""


class GeminiChatService:
    def __init__(self):
        self._clients: Dict[str, genai.Client] = {}

    def _get_api_keys(self) -> List[str]:
        """Collect available Gemini API keys from settings without printing them."""
        keys = []
        for attr in ["GEMINI_API_KEY", "GEMINI_API_KEY1", "GEMINI_API_KEY2", "GOOGLE_API_KEY"]:
            val = getattr(settings, attr, None)
            if val and isinstance(val, str) and val.strip() and val.strip() not in keys:
                keys.append(val.strip())
        return keys

    def _get_client_for_key(self, api_key: str) -> genai.Client:
        if api_key not in self._clients:
            self._clients[api_key] = genai.Client(api_key=api_key)
        return self._clients[api_key]

    def _get_candidate_models(self) -> List[str]:
        """Return configured model plus fallback models."""
        models = []
        if settings.GEMINI_MODEL:
            models.append(settings.GEMINI_MODEL.strip())
        
        fallback_str = getattr(settings, "GEMINI_FALLBACK_MODELS", "gemini-3.5-flash-lite,gemini-flash-lite-latest")
        if fallback_str:
            for m in fallback_str.split(","):
                m_clean = m.strip()
                if m_clean and m_clean not in models:
                    models.append(m_clean)

        # Ensure reliable defaults are present in fallback list
        for default_m in ["gemini-3.5-flash-lite", "gemini-flash-lite-latest"]:
            if default_m not in models:
                models.append(default_m)
        return models

    async def _gather_farmer_context(self, request: ChatRequest) -> Dict[str, Any]:
        """Fetch farmer profile, soil tests, and farm history from MongoDB."""
        context: Dict[str, Any] = {
            "state": request.state,
            "district": request.district,
            "soil_type": request.soil_type,
        }

        if request.farmer_id:
            try:
                profile = await farmer_repository.get_farmer_by_id(request.farmer_id)
                if profile:
                    context["name"] = profile.name
                    context["state"] = profile.state or context.get("state")
                    context["district"] = profile.district or context.get("district")
                    context["village"] = profile.village
                    context["soil_type"] = profile.soil_type or context.get("soil_type")
                    context["land_area_acres"] = profile.land_area_acres
                    context["preferred_language"] = profile.preferred_language

                soil_tests = await farmer_repository.get_farmer_soil_tests(request.farmer_id)
                if soil_tests:
                    latest_soil = soil_tests[0]
                    context["latest_soil_test"] = {
                        "nitrogen": latest_soil.nitrogen,
                        "phosphorus": latest_soil.phosphorus,
                        "potassium": latest_soil.potassium,
                        "ph": latest_soil.ph,
                        "rainfall": latest_soil.rainfall,
                        "temperature": latest_soil.temperature,
                        "humidity": latest_soil.humidity,
                        "notes": latest_soil.notes,
                    }

                history = await farmer_repository.get_farm_history(request.farmer_id)
                if history:
                    context["recent_crops"] = [
                        {
                            "crop": h.crop,
                            "season": h.season,
                            "year": h.year,
                            "yield_per_acre": h.yield_per_acre_quintals,
                            "disease_experienced": h.disease_experienced
                        }
                        for h in history[:3]
                    ]
            except Exception as e:
                logger.warning("Could not retrieve farmer context for %s: %s", request.farmer_id, e)

        return context

    async def _gather_weather_context(self, district: Optional[str], state: Optional[str]) -> Optional[str]:
        """Fetch live weather summary if location is specified."""
        if not district:
            return None
        try:
            weather_res = await weather_service.get_current_weather(WeatherQuery(district=district, state=state))
            if weather_res:
                return (
                    f"Live Weather ({weather_res.district}, {weather_res.state}): "
                    f"{weather_res.temp_c}°C, humidity {weather_res.humidity_pct}%, "
                    f"conditions: {weather_res.description}, wind: {weather_res.wind_speed_kmh} km/h."
                )
        except Exception as e:
            logger.debug("Weather context lookup skipped: %s", e)
        return None

    def _retrieve_rag_context(self, query: str, district: Optional[str]) -> List[str]:
        """Retrieve relevant agricultural knowledge guidelines."""
        try:
            citations = _rag_retriever.retrieve(query=query, region=district, top_k=2)
            if citations:
                return [f"[{c.title}] {c.snippet} (Source: {c.source})" for c in citations]
        except Exception as e:
            logger.debug("RAG lookup error: %s", e)
        return []

    def _format_context_block(
        self,
        farmer_ctx: Dict[str, Any],
        weather_str: Optional[str],
        rag_snippets: List[str]
    ) -> str:
        """Format injected agricultural context into a clear text block."""
        parts = []
        active_farmer_details = {k: v for k, v in farmer_ctx.items() if v is not None}
        if active_farmer_details:
            parts.append(f"FARMER PROFILE & SOIL CONTEXT: {active_farmer_details}")
        if weather_str:
            parts.append(f"CURRENT WEATHER ADVISORY: {weather_str}")
        if rag_snippets:
            parts.append("RELEVANT KNOWLEDGE BASE GUIDELINES:\n" + "\n".join(rag_snippets))
        
        if not parts:
            return ""
        return "\n--- VERIFIED FARMING CONTEXT ---\n" + "\n\n".join(parts) + "\n--------------------------------\n"

    async def generate_response(
        self,
        user_message: str,
        history: List[ChatMessage],
        context_block: str,
        language: str = "en"
    ) -> str:
        """
        Calls Google Gemini directly using the official `google-genai` SDK.
        Tries candidate models and keys, retrying once on transient errors.
        Raises an explicit exception if all attempts fail.
        """
        api_keys = self._get_api_keys()
        if not api_keys:
            raise RuntimeError("No Gemini API key configured. Please set GEMINI_API_KEY in your .env file.")

        candidate_models = self._get_candidate_models()
        last_error = None

        # Build conversation history in Google GenAI SDK format
        contents: List[types.Content] = []
        for turn in history:
            role = "user" if turn.role == "user" else "model"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=turn.content)]
                )
            )

        # Build current user turn with injected context
        final_prompt = user_message
        if context_block:
            final_prompt = f"{context_block}\nUser Question: {user_message}"
        if language and language != "en":
            final_prompt += f"\n(Please reply in the user's language: {language})"

        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=final_prompt)]
            )
        )

        config = types.GenerateContentConfig(
            system_instruction=KRISHIMITRA_SYSTEM_PROMPT,
            temperature=0.3,
            max_output_tokens=1200,
        )

        # Attempt calls across available API keys and candidate models
        for api_key in api_keys:
            client = self._get_client_for_key(api_key)
            for model_name in candidate_models:
                for attempt in range(2):  # 1 retry on transient network/rate glitch
                    try:
                        logger.info("Invoking Gemini with model='%s' (attempt %d)", model_name, attempt + 1)
                        response = await client.aio.models.generate_content(
                            model=model_name,
                            contents=contents,
                            config=config
                        )
                        if response and response.text:
                            return response.text.strip()
                        raise RuntimeError("Gemini returned empty response text.")
                    except (ClientError, APIError, ServerError) as e:
                        err_str = str(e)
                        logger.warning("Gemini error on model '%s' (attempt %d): %s", model_name, attempt + 1, err_str)
                        last_error = e

                        # If rate limit (429) or model unavailable/not found (404/503), break to next model/key
                        if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                            break
                        if "404" in err_str or "NOT_FOUND" in err_str:
                            break
                        if "503" in err_str or "UNAVAILABLE" in err_str:
                            break

                        if attempt == 0:
                            await asyncio.sleep(1.0)
                    except Exception as e:
                        logger.warning("Unexpected error invoking Gemini '%s': %s", model_name, e)
                        last_error = e
                        if attempt == 0:
                            await asyncio.sleep(1.0)

        # If we reached here, all keys and models failed
        err_msg = f"Gemini API request failed across all models and keys: {last_error}"
        logger.error(err_msg)
        raise RuntimeError(err_msg)

    async def process_chat(self, request: ChatRequest) -> ChatResponse:
        """Main chat pipeline entrypoint."""
        session_id = request.session_id or f"sess_{uuid.uuid4().hex[:12]}"

        # 1. Load conversation history (last 8-10 turns) from MongoDB / cache
        history = await load_history_async(session_id=session_id, farmer_id=request.farmer_id, limit=10)

        # 2. Gather context (farmer profile, soil tests, live weather, RAG guidelines)
        farmer_ctx = await self._gather_farmer_context(request)
        weather_str = await self._gather_weather_context(
            district=farmer_ctx.get("district") or request.district,
            state=farmer_ctx.get("state") or request.state
        )
        rag_snippets = self._retrieve_rag_context(
            query=request.message,
            district=farmer_ctx.get("district") or request.district
        )

        context_block = self._format_context_block(farmer_ctx, weather_str, rag_snippets)

        # 3. Call Gemini directly (Honest error handling — never fake or canned answers)
        try:
            reply_text = await self.generate_response(
                user_message=request.message,
                history=history,
                context_block=context_block,
                language=request.language
            )
        except Exception as e:
            logger.error("Chat generation failed: %s", e, exc_info=True)
            # Re-raise so router returns proper HTTP error to client
            raise

        # 4. Save turn to MongoDB and in-memory cache
        await save_exchange_async(
            session_id=session_id,
            human_msg=request.message,
            ai_msg=reply_text,
            farmer_id=request.farmer_id
        )

        return ChatResponse(
            reply=reply_text,
            language=request.language,
            session_id=session_id,
            tools_invoked=[],
            structured_payload={
                "has_context": bool(context_block),
                "weather_included": bool(weather_str),
                "rag_count": len(rag_snippets),
            }
        )

# Global singleton instance
gemini_chat_service = GeminiChatService()
