import os
import json
from gemini_client import get_client, GEMINI_MODEL
from fastapi import APIRouter
from pydantic import BaseModel
from prompts.dental import TREATMENT_SUGGEST

router = APIRouter()


class TreatmentRequest(BaseModel):
    symptoms: list[str]
    examination_findings: str = ""
    patient_age: int = 0
    patient_gender: str = ""
    medical_history: str = ""


def mock_treatment_response(symptoms: list[str]) -> dict:
    symptom_map = {
        "toothache": {
            "diagnoses": [
                {
                    "name": "Dental Caries (Cavity)",
                    "treatments": [
                        {"name": "Composite Filling", "description": "Tooth-colored resin filling for small to medium cavities", "cost_range": "₱800-₱2,500", "duration": "30-60 minutes", "priority": "recommended"},
                        {"name": "Indirect Pulp Cap + Filling", "description": "For deeper cavities approaching the pulp", "cost_range": "₱1,500-₱3,000", "duration": "45-60 minutes", "priority": "recommended"},
                    ],
                },
                {
                    "name": "Pulpitis (Irreversible)",
                    "treatments": [
                        {"name": "Root Canal Treatment", "description": "Remove infected pulp, clean, and seal the canal", "cost_range": "₱3,500-₱10,000", "duration": "1-2 visits", "priority": "urgent"},
                        {"name": "Extraction + Implant", "description": "If tooth is not salvageable", "cost_range": "₱35,000-₱100,000", "duration": "Multiple visits", "priority": "optional"},
                    ],
                },
                {
                    "name": "Dental Abscess",
                    "treatments": [
                        {"name": "Incision and Drainage", "description": "Drain the abscess and irrigate", "cost_range": "₱1,000-₱3,000", "duration": "1 visit", "priority": "urgent"},
                        {"name": "Root Canal + Antibiotics", "description": "Treat the source of infection", "cost_range": "₱5,000-₱12,000", "duration": "1-2 visits", "priority": "urgent"},
                    ],
                },
            ],
            "additional_tests": ["Periapical X-ray", "Cold sensitivity test", "Percussion test"],
            "red_flags": ["Swelling spreading to face/neck", "Difficulty breathing or swallowing", "Fever above 101F"],
        },
        "sensitivity": {
            "diagnoses": [
                {
                    "name": "Tooth Erosion / Attrition",
                    "treatments": [
                        {"name": "Fluoride Varnish Application", "description": "Professional fluoride to strengthen enamel", "cost_range": "₱500-₱1,000", "duration": "15 minutes", "priority": "recommended"},
                        {"name": "Desensitizing Agent", "description": "Apply potassium nitrate agent", "cost_range": "₱500-₱1,500", "duration": "20 minutes", "priority": "recommended"},
                    ],
                },
            ],
            "additional_tests": ["Visual inspection", "Bite analysis"],
            "red_flags": ["Sensitivity lasting more than 30 seconds", "Spontaneous pain"],
        },
    }

    matched = None
    for symptom in symptoms:
        if symptom.lower() in symptom_map:
            matched = symptom_map[symptom.lower()]
            break

    if not matched:
        matched = {
            "diagnoses": [
                {
                    "name": "Requires Clinical Examination",
                    "treatments": [
                        {"name": "Comprehensive Examination", "description": "Full oral examination with X-rays", "cost_range": "₱500-₱1,500", "duration": "30-45 minutes", "priority": "urgent"},
                    ],
                }
            ],
            "additional_tests": ["Full mouth X-rays", "Panoramic radiograph"],
            "red_flags": ["Persistent pain lasting more than 2 days", "Visible swelling", "Fever"],
        }

    return {
        "diagnoses": matched["diagnoses"],
        "additional_tests": matched.get("additional_tests", []),
        "red_flags": matched.get("red_flags", []),
        "recommendation": "This is a decision support suggestion. The final treatment plan must be determined by the treating dentist.",
        "disclaimer": "This AI-generated suggestion is for clinical decision support only. The licensed dentist retains full responsibility for treatment decisions.",
        "source": "mock",
    }


@router.post("/suggest")
async def suggest_treatment(req: TreatmentRequest):
    client = get_client()

    if not client:
        result = mock_treatment_response(req.symptoms)
        return result

    try:
        prompt = f"""{TREATMENT_SUGGEST}

Analyze the following patient case and suggest treatment options in JSON format:

Symptoms: {', '.join(req.symptoms)}
Examination Findings: {req.examination_findings or 'Not provided'}
Patient Age: {req.patient_age or 'Not specified'}
Patient Gender: {req.patient_gender or 'Not specified'}
Medical History: {req.medical_history or 'Not provided'}

Respond with JSON:
{{
    "diagnoses": [
        {{
            "name": "Condition name",
            "treatments": [
                {{
                    "name": "Treatment name",
                    "description": "Description",
                    "cost_range": "Estimated cost in Philippine Peso",
                    "duration": "Expected duration",
                    "priority": "urgent/recommended/optional"
                }}
            ]
        }}
    ],
    "additional_tests": ["Test 1", "Test 2"],
    "red_flags": ["Red flag 1"]
}}"""

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )

        ai_text = response.text

        try:
            cleaned = ai_text.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0].strip()
            result = json.loads(cleaned)
        except json.JSONDecodeError:
            result = {
                "diagnoses": [{"name": "AI Response", "treatments": [{"name": "See analysis", "description": ai_text, "cost_range": "Varies", "duration": "Varies", "priority": "recommended"}]}],
                "additional_tests": [],
                "red_flags": [],
            }

        result["recommendation"] = "This is a decision support suggestion. The final treatment plan must be determined by the treating dentist."
        result["disclaimer"] = "This AI-generated suggestion is for clinical decision support only."
        result["source"] = "gemini"
        return result

    except Exception as e:
        result = mock_treatment_response(req.symptoms)
        result["error"] = str(e)
        return result
