import os
import json
from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
from prompts.dental import TREATMENT_SUGGEST

router = APIRouter()


class TreatmentRequest(BaseModel):
    symptoms: list[str]
    examination_findings: str = ""
    patient_age: int = 0
    patient_gender: str = ""
    medical_history: str = ""


def get_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        return None
    return OpenAI(api_key=api_key)


def mock_treatment_response(symptoms: list[str]) -> dict:
    symptom_map = {
        "toothache": {
            "diagnoses": [
                {
                    "name": "Dental Caries (Cavity)",
                    "treatments": [
                        {"name": "Composite Filling", "description": "Tooth-colored resin filling for small to medium cavities", "cost_range": "$100-200", "duration": "30-60 minutes", "priority": "recommended"},
                        {"name": "Indirect Pulp Cap + Filling", "description": "For deeper cavities approaching the pulp", "cost_range": "$150-250", "duration": "45-60 minutes", "priority": "recommended"},
                    ],
                },
                {
                    "name": "Pulpitis (Irreversible)",
                    "treatments": [
                        {"name": "Root Canal Treatment", "description": "Remove infected pulp, clean, and seal the canal", "cost_range": "$500-800", "duration": "1-2 visits", "priority": "urgent"},
                        {"name": "Extraction + Implant", "description": "If tooth is not salvageable", "cost_range": "$2,150-3,800", "duration": "Multiple visits", "priority": "optional"},
                    ],
                },
                {
                    "name": "Dental Abscess",
                    "treatments": [
                        {"name": "Incision and Drainage", "description": "Drain the abscess and irrigate", "cost_range": "$200-400", "duration": "1 visit", "priority": "urgent"},
                        {"name": "Root Canal + Antibiotics", "description": "Treat the source of infection", "cost_range": "$600-900", "duration": "1-2 visits", "priority": "urgent"},
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
                        {"name": "Fluoride Varnish Application", "description": "Professional fluoride to strengthen enamel", "cost_range": "$30-50", "duration": "15 minutes", "priority": "recommended"},
                        {"name": "Desensitizing Agent", "description": "Apply potassium nitrate or similar agent", "cost_range": "$50-100", "duration": "20 minutes", "priority": "recommended"},
                    ],
                },
            ],
            "additional_tests": ["Visual inspection for erosion patterns", "Bite analysis"],
            "red_flags": ["Sensitivity lasting more than 30 seconds after stimulus", "Spontaneous pain"],
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
                        {"name": "Comprehensive Examination", "description": "Full oral examination with X-rays", "cost_range": "$80-130", "duration": "30-45 minutes", "priority": "urgent"},
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
        "recommendation": "This is a decision support suggestion. The final treatment plan must be determined by the treating dentist after clinical examination.",
        "disclaimer": "This AI-generated suggestion is for clinical decision support only. It does NOT constitute medical advice or a prescription. The licensed dentist retains full responsibility for treatment decisions.",
        "source": "mock",
    }


@router.post("/suggest")
async def suggest_treatment(req: TreatmentRequest):
    client = get_client()

    if not client:
        result = mock_treatment_response(req.symptoms)
        return result

    try:
        prompt = f"""Analyze the following patient case and suggest treatment options:

Symptoms: {', '.join(req.symptoms)}
Examination Findings: {req.examination_findings or 'Not provided'}
Patient Age: {req.patient_age or 'Not specified'}
Patient Gender: {req.patient_gender or 'Not specified'}
Medical History: {req.medical_history or 'Not provided'}

Please provide your analysis in JSON format with the following structure:
{{
    "diagnoses": [
        {{
            "name": "Condition name",
            "treatments": [
                {{
                    "name": "Treatment name",
                    "description": "Description",
                    "cost_range": "Estimated cost",
                    "duration": "Expected duration",
                    "priority": "urgent/recommended/optional"
                }}
            ]
        }}
    ],
    "additional_tests": ["Test 1", "Test 2"],
    "red_flags": ["Red flag 1"]
}}"""

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": TREATMENT_SUGGEST},
                {"role": "user", "content": prompt},
            ],
            max_tokens=2000,
            temperature=0.3,
        )

        ai_text = response.choices[0].message.content
        try:
            result = json.loads(ai_text)
        except json.JSONDecodeError:
            result = {
                "diagnoses": [{"name": "AI Response", "treatments": [{"name": "See analysis", "description": ai_text, "cost_range": "Varies", "duration": "Varies", "priority": "recommended"}]}],
                "additional_tests": [],
                "red_flags": [],
            }

        result["recommendation"] = "This is a decision support suggestion. The final treatment plan must be determined by the treating dentist."
        result["disclaimer"] = "This AI-generated suggestion is for clinical decision support only. The licensed dentist retains full responsibility for treatment decisions."
        result["source"] = "openai"
        return result

    except Exception as e:
        result = mock_treatment_response(req.symptoms)
        result["error"] = str(e)
        return result
