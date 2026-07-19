import os
from google import genai

_client = None


def get_client():
    global _client
    if _client is not None:
        return _client
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or len(api_key) < 10:
        return None
    _client = genai.Client(api_key=api_key)
    return _client


GEMINI_MODEL = "gemini-3.5-flash"
