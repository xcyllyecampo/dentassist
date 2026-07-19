import os
import base64
import json
from fastapi import APIRouter, UploadFile, File
from gemini_client import get_client, GEMINI_MODEL
from prompts.dental import XRAY_ANALYSIS

router = APIRouter()


def mock_xray_analysis():
    return {
        "findings": [
            {
                "area": "Lower left molar (Tooth #19)",
                "type": "cavity",
                "confidence": 0.87,
                "severity": "moderate",
                "description": "Possible interproximal decay detected between teeth #18 and #19. Radiolucency observed in the distal surface suggesting early to moderate carious lesion.",
            },
            {
                "area": "Upper right wisdom tooth (Tooth #1)",
                "type": "impacted",
                "confidence": 0.92,
                "severity": "mild",
                "description": "Third molar appears partially impacted with mesioangular impaction. May require monitoring or extraction depending on symptoms.",
            },
            {
                "area": "Lower anterior region",
                "type": "bone_loss",
                "confidence": 0.65,
                "severity": "mild",
                "description": "Mild horizontal bone loss observed in the lower anterior region, approximately 15-20% of root length. Early signs of periodontal disease.",
            },
        ],
        "overall_assessment": "The X-ray shows adequate quality with good contrast. The patient presents with a moderate cavity on tooth #19 requiring immediate attention, mild impaction of the upper right wisdom tooth, and early signs of periodontal bone loss.",
        "recommendations": [
            "Schedule composite filling for tooth #19 within 2 weeks",
            "Monitor impacted wisdom tooth with follow-up X-ray in 6 months",
            "Recommend professional dental cleaning and periodontal evaluation",
            "Discuss wisdom tooth extraction options with the patient",
        ],
        "disclaimer": "This is an AI-generated analysis and should NOT be considered a definitive diagnosis. All findings must be verified by a licensed dentist through clinical examination.",
    }


@router.post("/xray")
async def analyze_xray(file: UploadFile = File(...)):
    client = get_client()

    if not client:
        result = mock_xray_analysis()
        result["source"] = "mock"
        return result

    try:
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode("utf-8")
        mime_type = file.content_type or "image/jpeg"

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                XRAY_ANALYSIS,
                "\n\nPlease analyze this dental X-ray and provide your findings in JSON format.",
                {"inline_data": {"mime_type": mime_type, "data": base64_image}},
            ],
        )

        ai_text = response.text

        try:
            cleaned = ai_text.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            findings = json.loads(cleaned)
        except json.JSONDecodeError:
            findings = {
                "findings": [],
                "overall_assessment": ai_text,
                "recommendations": [],
                "disclaimer": "This is an AI-generated analysis and should NOT be considered a definitive diagnosis.",
            }

        findings["source"] = "gemini"
        return findings

    except Exception as e:
        result = mock_xray_analysis()
        result["source"] = "mock"
        result["error"] = str(e)
        return result
