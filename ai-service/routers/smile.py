import os
import base64
import json
from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from openai import OpenAI
from prompts.dental import SMILE_SIMULATION

router = APIRouter()


def get_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        return None
    return OpenAI(api_key=api_key)


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
                "changes": [
                    "Significant reduction in surface staining",
                    "More uniform tooth color across the smile",
                    "Brighter overall appearance",
                    "Enhanced smile aesthetics",
                ],
            },
            "procedures": [
                {
                    "name": "In-Office Laser Whitening",
                    "description": "Professional-grade hydrogen peroxide gel activated by LED light for instant results",
                    "cost": "$300",
                    "duration": "60-90 minutes",
                    "results": "Immediate",
                },
                {
                    "name": "Custom Take-Home Whitening Kit",
                    "description": "Dentist-made trays with professional-grade gel for gradual whitening",
                    "cost": "$200",
                    "duration": "2-4 weeks (daily use)",
                    "results": "Gradual over 2-4 weeks",
                },
            ],
            "timeline": "Results visible immediately after in-office treatment. Take-home kit takes 2-4 weeks for full effect.",
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
                "description": "Porcelain veneers would create a perfectly aligned, symmetrical smile with natural-looking tooth shapes and consistent color. Chips and irregularities would be completely concealed.",
                "estimated_shade_change": "Custom shade matching",
                "changes": [
                    "Perfectly symmetrical tooth shapes",
                    "Uniform color and translucency",
                    "Chips and cracks completely concealed",
                    "Improved smile proportions",
                    "Natural-looking porcelain finish",
                ],
            },
            "procedures": [
                {
                    "name": "Porcelain Veneers (6-8 teeth)",
                    "description": "Thin porcelain shells bonded to the front surface of teeth for a complete smile makeover",
                    "cost": "$800-1,500 per tooth",
                    "duration": "2-3 visits over 3-4 weeks",
                    "results": "10-15 year lifespan with proper care",
                },
                {
                    "name": "Composite Veneers",
                    "description": "Tooth-colored resin directly applied and sculpted for a more affordable option",
                    "cost": "$250-500 per tooth",
                    "duration": "1-2 visits",
                    "results": "5-7 year lifespan",
                },
            ],
            "timeline": "First visit: consultation and tooth preparation. Second visit (2 weeks): veneer fitting and bonding.",
            "maintenance": "Avoid biting hard objects. Regular brushing and flossing. Dental checkups every 6 months.",
        },
        "alignment": {
            "current_analysis": {
                "smile_score": 55,
                "observations": [
                    {"area": "Upper anterior teeth", "finding": "Mild crowding with teeth #7 and #10 slightly rotated", "severity": "mild"},
                    {"area": "Lower anterior teeth", "finding": "Minor overlapping of lower incisors", "severity": "mild"},
                    {"area": "Bite alignment", "finding": "Slight overjet, molars appear to have acceptable interdigitation", "severity": "mild"},
                ],
            },
            "simulated_result": {
                "smile_score": 88,
                "description": "Clear aligner therapy would gradually shift teeth into ideal positions over 12-18 months. Crowding would be resolved and the bite properly aligned.",
                "estimated_shade_change": "N/A (alignment only)",
                "changes": [
                    "Teeth straightened into proper arch form",
                    "Crowding resolved in both arches",
                    "Improved bite alignment",
                    "Better oral hygiene access",
                    "Enhanced facial symmetry",
                ],
            },
            "procedures": [
                {
                    "name": "Clear Aligner Therapy (e.g., Invisalign)",
                    "description": "Series of custom clear trays that gradually move teeth into position",
                    "cost": "$3,000-5,000",
                    "duration": "12-18 months",
                    "results": "Progressive improvement every 2 weeks",
                },
                {
                    "name": "Traditional Ceramic Braces",
                    "description": "Tooth-colored ceramic brackets for a less visible orthodontic option",
                    "cost": "$2,500-4,500",
                    "duration": "12-24 months",
                    "results": "Continuous adjustment",
                },
            ],
            "timeline": "Aligner changes every 2 weeks. Checkups every 6-8 weeks. Full treatment 12-18 months.",
            "maintenance": "Wear retainers as directed after treatment. Regular dental cleanings every 6 months.",
        },
    }

    result = simulations.get(treatment_type, simulations["whitening"])
    result["source"] = "mock"
    result["treatment_type"] = treatment_type
    return result


class SmileRequest(BaseModel):
    treatment_type: str = "whitening"


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

        treatment_labels = {
            "whitening": "professional teeth whitening",
            "veneers": "porcelain veneers",
            "alignment": "orthodontic alignment with clear aligners",
        }
        treatment_desc = treatment_labels.get(treatment_type, treatment_type)

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SMILE_SIMULATION},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": f"Analyze this smile photo and simulate the expected results after {treatment_desc}. Provide current analysis, simulated result, procedure options, timeline, and maintenance advice.",
                        },
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
            max_tokens=2500,
        )

        ai_text = response.choices[0].message.content

        try:
            result = json.loads(ai_text)
        except json.JSONDecodeError:
            result = {
                "current_analysis": {"smile_score": 50, "observations": []},
                "simulated_result": {"smile_score": 80, "description": ai_text, "changes": []},
                "procedures": [],
                "disclaimer": "This is an AI-generated simulation and should not be considered a guarantee of results.",
            }

        result["source"] = "openai"
        result["treatment_type"] = treatment_type
        return result

    except Exception as e:
        result = mock_smile_simulation(treatment_type)
        result["error"] = str(e)
        return result
