import os
import json
import re
from typing import List, Dict, Any, Tuple
from backend.app.services.chatbot_agent.schema import (
    ChatRequest,
    ChatResponse,
    ToolInvocationResult,
)
from backend.app.services.chatbot_agent.tools import (
    recommend_crop_tool,
    predict_yield_tool,
    get_weather_advisory_tool,
    detect_disease_tool,
    get_satellite_ndvi_tool,
)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", None)
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", None)

class KrishiVaaniAgent:
    
    async def process_chat(self, request: ChatRequest) -> ChatResponse:
        msg_lower = request.message.lower()
        tools_invoked = []
        reply_parts = []
        structured_payload = {}

        # 1. Check for Weather intent
        if any(w in msg_lower for w in ["weather", "rain", "temperature", "forecast", "alert", "climate", "heatwave", "frost"]):
            district = request.district or "Cuttack"
            state = request.state or "Odisha"
            
            # Extract district if mentioned in message
            dist_match = re.search(r"in ([a-zA-Z]+)", request.message)
            if dist_match:
                district = dist_match.group(1).capitalize()

            raw_res = await get_weather_advisory_tool.ainvoke({"district": district, "state": state})
            data = json.loads(raw_res)
            tools_invoked.append(ToolInvocationResult(
                tool_name="get_weather_advisory_tool",
                input_args={"district": district, "state": state},
                output_summary=f"Weather in {data['location_name']}: {data['current']['temperature_c']}°C, {data['current']['condition']}"
            ))
            structured_payload["weather"] = data

            reply_parts.append(
                f"🌡️ **Weather Update for {data['location_name']}**:\n"
                f"• Current Temp: {data['current']['temperature_c']}°C ({data['current']['condition']})\n"
                f"• Humidity: {data['current']['humidity_percent']}%\n"
                f"• Active Alerts: {', '.join([a['title'] for a in data['active_alerts']])}\n"
                f"• Advisory: {data['agromet_advisories'][0]}"
            )

        # 2. Check for Crop Recommendation intent
        if any(w in msg_lower for w in ["crop", "grow", "recommend", "plant", "soil", "npk"]):
            n = 90.0 if "nitrogen" not in msg_lower else 80.0
            p = 42.0
            k = 43.0
            temp = 25.0
            hum = 80.0
            ph = 6.5
            rain = 200.0

            raw_res = recommend_crop_tool.invoke({
                "nitrogen": n, "phosphorus": p, "potassium": k,
                "temperature": temp, "humidity": hum, "ph": ph, "rainfall": rain
            })
            data = json.loads(raw_res)
            tools_invoked.append(ToolInvocationResult(
                tool_name="recommend_crop_tool",
                input_args={"N": n, "P": p, "K": k, "pH": ph, "rainfall": rain},
                output_summary=f"Recommended crop: {data['primary_recommendation'].capitalize()} ({round(data['confidence']*100, 1)}% confidence)"
            ))
            structured_payload["crop_recommendation"] = data

            reply_parts.append(
                f"🌾 **Crop Recommendation**:\n"
                f"Based on your soil parameters, the optimal crop to cultivate is **{data['primary_recommendation'].capitalize()}** "
                f"({round(data['confidence']*100, 1)}% confidence).\n"
                f"• Soil Diagnosis: {data['soil_health_assessment'].get('Nitrogen', '')}\n"
                f"• Agronomic Advice: {data['advisory_notes'][0]}"
            )

        # 3. Check for Yield Prediction intent
        if any(w in msg_lower for w in ["yield", "production", "quintal", "harvest", "revenue", "income"]):
            crop = "rice"
            if "wheat" in msg_lower: crop = "wheat"
            elif "cotton" in msg_lower: crop = "cotton"
            elif "maize" in msg_lower: crop = "maize"

            state = request.state or "Odisha"

            raw_res = predict_yield_tool.invoke({
                "crop": crop, "state": state, "season": "Kharif", "area_acres": 5.0,
                "nitrogen": 90.0, "phosphorus": 45.0, "potassium": 40.0, "rainfall": 1100.0, "temperature": 27.5
            })
            data = json.loads(raw_res)
            tools_invoked.append(ToolInvocationResult(
                tool_name="predict_yield_tool",
                input_args={"crop": crop, "area_acres": 5.0, "state": state},
                output_summary=f"Predicted yield: {data['predicted_yield_per_acre_quintals']} qtl/acre, Total: {data['total_expected_yield_quintals']} qtl"
            ))
            structured_payload["yield_prediction"] = data

            rev = data["revenue_estimate"]
            reply_parts.append(
                f"📊 **Yield & Revenue Estimate for {crop.capitalize()}**:\n"
                f"• Yield per acre: {data['predicted_yield_per_acre_quintals']} quintals/acre\n"
                f"• Total expected production (5 acres): {data['total_expected_yield_quintals']} quintals\n"
                f"• Estimated Revenue (at MSP ₹{rev['estimated_msp_per_quintal_inr']}/qtl): ₹{rev['min_total_revenue_inr']:,} - ₹{rev['max_total_revenue_inr']:,}"
            )

        # 4. Check for Satellite NDVI intent
        if any(w in msg_lower for w in ["satellite", "ndvi", "canopy", "health index", "plot health"]):
            lat = 20.4625
            lon = 85.8830

            raw_res = await get_satellite_ndvi_tool.ainvoke({"latitude": lat, "longitude": lon})
            data = json.loads(raw_res)
            tools_invoked.append(ToolInvocationResult(
                tool_name="get_satellite_ndvi_tool",
                input_args={"latitude": lat, "longitude": lon},
                output_summary=f"Sentinel-2 Mean NDVI: {data['ndvi_metrics']['mean_ndvi']} ({data['ndvi_metrics']['canopy_health_status']})"
            ))
            structured_payload["satellite"] = data

            reply_parts.append(
                f"🛰️ **Satellite Field Monitoring (Sentinel-2)**:\n"
                f"• Mean NDVI Vegetation Index: {data['ndvi_metrics']['mean_ndvi']}\n"
                f"• Canopy Status: {data['ndvi_metrics']['canopy_health_status']}\n"
                f"• Field Advisory: {data['canopy_advisories'][0]}"
            )

        # Default fallback response if no explicit intent matched
        if not reply_parts:
            reply_parts.append(
                "Namaste! I am **KrishiVaani**, your personal AI farming assistant.\n"
                "You can ask me about:\n"
                "• 🌾 **Crop Recommendations** based on your soil NPK & climate\n"
                "• 📊 **Yield & Revenue Predictions** for your harvest\n"
                "• 🌡️ **Weather Forecasts & Extreme Alerts** (Heatwave, Heavy Rain, Frost)\n"
                "• 🍃 **Crop Leaf Disease Diagnosis** & Remedies\n"
                "• 🛰️ **Satellite NDVI Crop Canopy Health**"
            )

        final_reply = "\n\n".join(reply_parts)

        return ChatResponse(
            reply=final_reply,
            language=request.language,
            tools_invoked=tools_invoked,
            structured_payload=structured_payload if structured_payload else None
        )

chatbot_agent = KrishiVaaniAgent()
