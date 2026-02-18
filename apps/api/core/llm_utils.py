import google.generativeai as genai
import os
import logging
from typing import Optional, Any

logger = logging.getLogger("aris.llm_utils")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

async def call_gemini_with_fallback(prompt: str, primary_model: str = "gemini-pro-latest", fallback_model: str = "gemini-flash-latest") -> str:
    """
    Calls Gemini with a primary model and falls back to a second model if the quota or any error occurs.
    """
    if not GEMINI_API_KEY:
        return "GEMINI_API_KEY not configured."

    # Try Primary Model
    try:
        logger.info(f"🔮 Calling primary model: {primary_model}")
        model = genai.GenerativeModel(primary_model)
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        error_msg = str(e).lower()
        if "quota" in error_msg or "429" in error_msg or "limit" in error_msg:
            logger.warning(f"⚠️ Quota exceeded for {primary_model}. Falling back to {fallback_model}...")
        else:
            logger.error(f"❌ Error with {primary_model}: {e}. Attempting fallback to {fallback_model}...")
        
        # Try Fallback Model
        try:
            model = genai.GenerativeModel(fallback_model)
            response = model.generate_content(prompt)
            return response.text
        except Exception as fe:
            logger.error(f"💀 Both models failed. Fallback error: {fe}")
            return f"Error: Both primary and fallback models failed. Last error: {str(fe)}"
