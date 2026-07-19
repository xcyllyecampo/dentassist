import os
import base64
import json
from fastapi import APIRouter, UploadFile, File
from gemini_client import get_client, GEMINI_MODEL
from prompts.dental import SMILE_SIMULATION

router = APIRouter()


def mock_smile_simulation(treatment_type):
    simulations = {
        "whitening": {
            "current_analysis": {
                "smile_score": 58,
                "observations": [
                    {"area": "Upper front teeth", "finding": "Surface staining from coffee/tea consumption", "severity": "mild"},
                    {"area": "Lower front teeth", "finding": "Moderate yellowing on lingual surfaces", "severity": "mild"},
                    {"area": "Overall smile line", "finding": "Good lip symmetry, teeth show evenly when smiling", "severity": "none"},
                ],
            },
            "simulated_result": {
                "smile_score": 85,
                "description": "Professional whitening would brighten teeth by 4-8 shades. Surface stains would be significantly reduced, resulting in a noticeably brighter and more uniform smile.",
                "estimated_shade_change": "4-8 shades lighter",
                "changes": ["Significant reduction in surface staining", "More uniform tooth color across the smile", "Brighter overall appearance", "Enhanced smile aesthetics"],
            },
            "procedures": [
                {"name": "In-Office Laser Whitening", "description": "Professional-grade hydrogen peroxide gel activated by LED light", "cost": "₱5,000 - ₱12,000", "duration": "60-90 minutes", "results": "Immediate"},
                {"name": "Custom Take-Home Whitening Kit", "description": "Dentist-made trays with professional-grade gel", "cost": "₱3,000 - ₱5,000", "duration": "2-4 weeks", "results": "Gradual over 2-4 weeks"},
            ],
            "timeline": "Results visible immediately after in-office treatment.",
            "maintenance": "Avoid staining foods/drinks for 48 hours post-treatment. Touch-up every 6-12 months.",
        },
        "veneers": {
            "current_analysis": {
                "smile_score": 62,
                "observations": [
                    {"area": "Upper front teeth", "finding": "Minor chips and uneven edges on teeth #8 and #9", "severity": "mild"},
                    {"area": "Tooth shape", "finding": "Slightly irregular tooth shapes affecting smile symmetry", "severity": "mild"},
                    {"area": "Color consistency", "finding": "Mild discoloration with some opacity variations", "severity": "mild"},
                ],
            },
            "simulated_result": {
                "smile_score": 92,
                "description": "Porcelain veneers would create a perfectly aligned, symmetrical smile with natural-looking tooth shapes and consistent color.",
                "estimated_shade_change": "Custom shade matching",
                "changes": ["Perfectly symmetrical tooth shapes", "Uniform color and translucency", "Chips and cracks completely concealed", "Improved smile proportions"],
            },
            "procedures": [
                {"name": "Porcelain Veneers (6-8 teeth)", "description": "Thin porcelain shells bonded to teeth", "cost": "₱12,000 - ₱35,000 per tooth", "duration": "2-3 visits over 3-4 weeks", "results": "10-15 year lifespan"},
                {"name": "Composite Veneers", "description": "Tooth-colored resin directly applied", "cost": "₱5,000 - ₱10,000 per tooth", "duration": "1-2 visits", "results": "5-7 year lifespan"},
            ],
            "timeline": "First visit: consultation. Second visit (2 weeks): veneer fitting and bonding.",
            "maintenance": "Avoid biting hard objects. Regular checkups every 6 months.",
        },
        "alignment": {
            "current_analysis": {
                "smile_score": 55,
                "observations": [
                    {"area": "Upper anterior teeth", "finding": "Mild crowding with teeth #7 and #10 slightly rotated", "severity": "mild"},
                    {"area": "Lower anterior teeth", "finding": "Minor overlapping of lower incisors", "severity": "mild"},
                    {"area": "Bite alignment", "finding": "Slight overjet", "severity": "mild"},
                ],
            },
            "simulated_result": {
                "smile_score": 88,
                "description": "Clear aligner therapy would gradually shift teeth into ideal positions over 12-18 months.",
                "estimated_shade_change": "N/A (alignment only)",
                "changes": ["Teeth straightened into proper arch form", "Crowding resolved", "Improved bite alignment", "Better oral hygiene access"],
            },
            "procedures": [
                {"name": "Clear Aligner Therapy (Invisalign)", "description": "Series of custom clear trays", "cost": "₱25,000 - ₱55,000", "duration": "12-18 months", "results": "Progressive improvement"},
                {"name": "Traditional Ceramic Braces", "description": "Tooth-colored ceramic brackets", "cost": "₱20,000 - ₱45,000", "duration": "12-24 months", "results": "Continuous adjustment"},
            ],
            "timeline": "Aligner changes every 2 weeks. Full treatment 12-18 months.",
            "maintenance": "Wear retainers after treatment. Cleanings every 6 months.",
        },
    }

    result = simulations.get(treatment_type, simulations["whitening"])
    result["source"] = "mock"
    result["treatment_type"] = treatment_type
    return result


@router.post("/simulate")
async def simulate_smile(
    file: UploadFile = File(...),
    treatment_type: str = "whitening",
):
    client = get_client()

    if not client:
        result = mock_smile_simulation(treatment_type)
        return result

    try:
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode("utf-8")
        mime_type = file.content_type or "image/jpeg"

        treatment_labels = {
            "whitening": "professional teeth whitening",
            "veneers": "porcelain veneers",
            "alignment": "orthodontic alignment with clear aligners",
        }
        treatment_desc = treatment_labels.get(treatment_type, treatment_type)

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                SMILE_SIMULATION,
                f"\n\nAnalyze this smile photo and simulate the expected results after {treatment_desc}. Provide current analysis, simulated result, procedure options, timeline, and maintenance advice in JSON format.",
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
                "current_analysis": {"smile_score": 50, "observations": []},
                "simulated_result": {"smile_score": 80, "description": ai_text, "changes": []},
                "procedures": [],
                "disclaimer": "This is an AI-generated simulation.",
            }

        result["source"] = "gemini"
        result["treatment_type"] = treatment_type
        return result

    except Exception as e:
        result = mock_smile_simulation(treatment_type)
        result["error"] = str(e)
        return result
