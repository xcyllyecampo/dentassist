import os
import base64
from fastapi import APIRouter, UploadFile, File
from openai import OpenAI
from prompts.dental import ORAL_SCREENING

router = APIRouter()


def get_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        return None
    return OpenAI(api_key=api_key)


def mock_oral_screening():
    return {
        "areas": [
            {
                "region": "Upper left molar area",
                "concern": "Visible plaque buildup on the buccal surface of the upper left molars",
                "severity": "mild",
                "confidence": 0.78,
            },
            {
                "region": "Lower front teeth (lingual surface)",
                "concern": "Moderate tartar accumulation with slight gum recession observed",
                "severity": "moderate",
                "confidence": 0.72,
            },
            {
                "region": "Upper front teeth",
                "concern": "Mild yellowing consistent with surface staining, no visible decay",
                "severity": "mild",
                "confidence": 0.85,
            },
            {
                "region": "Right wisdom tooth area",
                "concern": "Area appears normal with no visible concerns",
                "severity": "none",
                "confidence": 0.92,
            },
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

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": ORAL_SCREENING},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Please analyze this intraoral photograph for oral health screening."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/{file.content_type.split('/')[-1]};base64,{base64_image}",
                                "detail": "high",
                            },
                        },
                    ],
                },
            ],
            max_tokens=2000,
        )

        ai_text = response.choices[0].message.content
        import json
        try:
            result = json.loads(ai_text)
        except json.JSONDecodeError:
            result = {
                "areas": [],
                "overall_score": 50,
                "recommendations": [ai_text],
                "disclaimer": "This is an AI-generated screening and is NOT a medical diagnosis.",
            }

        result["source"] = "openai"
        return result

    except Exception as e:
        result = mock_oral_screening()
        result["error"] = str(e)
        return result
