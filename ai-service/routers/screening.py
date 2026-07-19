import os
import base64
import json
from fastapi import APIRouter, UploadFile, File
from gemini_client import get_client, GEMINI_MODEL
from prompts.dental import ORAL_SCREENING

router = APIRouter()


def mock_oral_screening():
    return {
        "areas": [
            {"region": "Upper left molar area", "concern": "Visible plaque buildup on the buccal surface of the upper left molars", "severity": "mild", "confidence": 0.78},
            {"region": "Lower front teeth (lingual surface)", "concern": "Moderate tartar accumulation with slight gum recession observed", "severity": "moderate", "confidence": 0.72},
            {"region": "Upper front teeth", "concern": "Mild yellowing consistent with surface staining, no visible decay", "severity": "mild", "confidence": 0.85},
            {"region": "Right wisdom tooth area", "concern": "Area appears normal with no visible concerns", "severity": "none", "confidence": 0.92},
        ],
        "overall_score": 72,
        "recommendations": [
            "Schedule professional dental cleaning within 2 weeks",
            "Consider teeth whitening treatment for staining",
            "Practice improved oral hygiene focusing on lingual surfaces of lower anterior teeth",
            "Follow up in 6 months for re-evaluation",
        ],
        "disclaimer": "This is an AI-generated screening and is NOT a medical diagnosis. Please consult a licensed dentist for professional evaluation and treatment.",
        "source": "mock",
    }


@router.post("/oral")
async def screen_oral(file: UploadFile = File(...)):
    client = get_client()

    if not client:
        return mock_oral_screening()

    try:
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode("utf-8")
        mime_type = file.content_type or "image/jpeg"

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                ORAL_SCREENING,
                "\n\nPlease analyze this intraoral photograph for oral health screening. Provide your findings in JSON format.",
                {"inline_data": {"mime_type": mime_type, "data": base64_image}},
            ],
        )

        ai_text = response.text

        try:
            cleaned = ai_text.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            result = json.loads(cleaned)
        except json.JSONDecodeError:
            result = {
                "areas": [],
                "overall_score": 50,
                "recommendations": [ai_text],
                "disclaimer": "This is an AI-generated screening and is NOT a medical diagnosis.",
            }

        result["source"] = "gemini"
        return result

    except Exception as e:
        result = mock_oral_screening()
        result["error"] = str(e)
        return result
