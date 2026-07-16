import os
from fastapi import APIRouter
from pydantic import BaseModel
from openai import OpenAI
from prompts.dental import DENTAL_CHAT

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


def get_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        return None
    return OpenAI(api_key=api_key)


def mock_chat_response(message: str) -> str:
    lower = message.lower().strip()

    if any(w in lower for w in ["hello", "hi", "hey", "good morning", "good afternoon"]):
        return "Hello! Welcome to DentAssist Dental Clinic. I'm here to help you with information about our services, procedures, and appointments. How can I assist you today?"

    if any(w in lower for w in ["hour", "time", "open", "schedule", "when are you"]):
        return "Our clinic hours are:\n\nMonday to Friday: 9:00 AM - 5:00 PM\nSaturday: 9:00 AM - 12:00 PM\nSunday: Closed\n\nFor emergencies, call our 24/7 emergency line at (02) 8123-4568."

    if any(w in lower for w in ["location", "where", "address", "direction", "find you"]):
        return "We're located at:\n\n123 Main Street\nManila, Philippines\n\nFree parking is available behind the building. You can reach us by phone at (02) 8123-4567."

    if any(w in lower for w in ["book", "appointment", "schedule", "reserve"]):
        return "I'd be happy to help you book an appointment! You can:\n\n1. Use the Appointments page in the DentAssist dashboard\n2. Call us at (02) 8123-4567\n3. Walk in during clinic hours\n\nWhat type of appointment are you looking for? (Checkup, cleaning, consultation, etc.)"

    if any(w in lower for w in ["root canal"]):
        return "A root canal is a treatment to save a badly damaged or infected tooth. Here's what to expect:\n\n1. The dentist removes the damaged pulp inside the tooth\n2. The canals are cleaned and disinfected\n3. The tooth is filled and sealed\n4. A crown is usually placed on top\n\nDuration: 1-2 visits, about 60-90 minutes each\nCost: $500-800\nRecovery: Mild soreness for 2-3 days\n\nWould you like to schedule a consultation?"

    if any(w in lower for w in ["fill", "filling", "cavity", "cavities"]):
        return "Dental fillings repair minor tooth damage from cavities. Here's what you need to know:\n\n1. The decayed portion is removed\n2. The area is cleaned\n3. Filling material is placed (we use tooth-colored composite resin)\n\nDuration: 30-60 minutes\nCost: $100-200 depending on size\nNo downtime - you can eat immediately after\n\nEarly detection means simpler, less expensive treatment!"

    if any(w in lower for w in ["extract", "extraction", "pull", "remove tooth"]):
        return "Tooth extraction involves removing a tooth from its socket. We recommend extraction when:\n\n- Severe decay makes the tooth unsalvageable\n- Overcrowding needs space\n- Wisdom teeth are impacted\n- Infection risk is high\n\nSimple extraction: 20-40 minutes, $150-300\nSurgical extraction: 45-60 minutes, $250-500\nRecovery: 7-10 days\n\nWould you like to schedule a consultation to discuss your options?"

    if any(w in lower for w in ["clean", "cleaning", "scaling"]):
        return "Professional dental cleaning (prophylaxis) removes plaque and tartar buildup that brushing can't handle.\n\nWhat happens:\n1. Ultrasonic scaling removes tartar\n2. Professional flossing\n3. Teeth polishing\n4. Fluoride treatment\n\nDuration: 30-45 minutes\nCost: $80\nRecommended: Every 6 months\n\nIt's painless and helps prevent cavities and gum disease!"

    if any(w in lower for w in ["white", "whitening", "bleach", "brighten"]):
        return "We offer professional teeth whitening to brighten your smile:\n\nIn-Office Whitening:\n- Results in just 1 session\n- Up to 8 shades whiter\n- Duration: 60-90 minutes\n- Cost: $300\n\nTake-Home Kit:\n- Custom-fitted trays\n- Gradual whitening over 2 weeks\n- Cost: $200\n\nResults last 6-12 months with proper care. Avoid coffee, tea, and red wine for 48 hours after treatment."

    if any(w in lower for w in ["brace", "braces", "aligner", "align", "orthodont", "crooked"]):
        return "We offer several orthodontic options to straighten teeth:\n\n1. Metal Braces: $3,000-4,000 (18-24 months)\n2. Ceramic Braces: $4,000-5,000 (18-24 months)\n3. Clear Aligners: $3,500-5,000 (12-18 months)\n\nAll options include:\n- Free initial consultation\n- Monthly check-ups\n- Retainer after treatment\n\nWould you like to schedule a consultation?"

    if any(w in lower for w in ["veneer", "veneers"]):
        return "Dental veneers are thin, custom-made shells that cover the front of teeth to improve their appearance.\n\nTypes:\n- Porcelain veneers: $800-1,500/tooth, lasts 10-15 years\n- Composite veneers: $250-500/tooth, lasts 5-7 years\n\nVeneers can fix:\n- Chips and cracks\n- Severe discoloration\n- Gaps between teeth\n- Misshapen teeth\n\nDuration: 2-3 visits over 2-3 weeks"

    if any(w in lower for w in ["cost", "price", "how much", "fee", "charge", "pricing", "expensive"]):
        return "Here are our general pricing ranges:\n\n- Consultation: $30\n- Dental Cleaning: $80\n- X-Ray: $50-100\n- Filling: $100-200\n- Root Canal: $500-800\n- Extraction: $150-300\n- Teeth Whitening: $300\n- Braces: $3,000-5,000\n- Veneers: $800-1,500/tooth\n- Implants: $2,000-3,500\n\nWe accept most insurance plans (HMO, DMF, PhilHealth). Ask us about payment plans!"

    if any(w in lower for w in ["insurance", "coverage", "hmo", "philhealth"]):
        return "We accept most major dental insurance plans:\n\n- HMO dental plans\n- DMF insurance\n- PhilHealth dental coverage\n- Major credit cards\n- Cash and bank transfer\n\nPlease bring your insurance card to your appointment. We can verify your coverage before treatment. For specific questions about your plan, call us at (02) 8123-4567."

    if any(w in lower for w in ["pain", "hurt", "ache", "sore", "throbbing"]):
        return "If you're experiencing dental pain, here are some immediate steps:\n\n1. Take over-the-counter pain relief (ibuprofen if not allergic)\n2. Apply a cold compress to the outside of your cheek\n3. Rinse with warm salt water\n4. Avoid hot/cold foods on the affected area\n\nIMPORTANT: Please call us at (02) 8123-4567 to schedule an urgent appointment. For after-hours emergencies, call (02) 8123-4568.\n\nDon't ignore persistent pain - it could indicate infection!"

    if any(w in lower for w in ["emergency", "urgent", "broken", "knocked out", "accident"]):
        return "🚨 DENTAL EMERGENCY\n\nIf you have a dental emergency:\n\nCall our 24/7 emergency line: (02) 8123-4568\n\nFor a KNOCKED-OUT TOOTH:\n1. Pick it up by the crown (not the root)\n2. Rinse gently with milk or saline\n3. Try to place it back in the socket\n4. If not, keep it in milk\n5. Get to a dentist within 30 minutes\n\nFor a BROKEN TOOTH:\n1. Rinse your mouth with warm water\n2. Apply gauze to any bleeding areas\n3. Use a cold compress to reduce swelling\n4. Save any broken pieces\n5. See a dentist immediately"

    return "I'm DentAssist AI, your dental clinic assistant. I can help you with:\n\n- Information about our clinic (hours, location, contact)\n- Explaining dental procedures (fillings, root canals, extractions, etc.)\n- Pricing and insurance information\n- Booking appointments\n- Emergency dental guidance\n\nWhat would you like to know more about?"


@router.post("")
async def chat(req: ChatRequest):
    client = get_client()

    if not client:
        response = mock_chat_response(req.message)
        return {"response": response, "source": "mock"}

    try:
        messages = [{"role": "system", "content": DENTAL_CHAT}]

        for msg in req.history[-10:]:
            messages.append(msg)

        messages.append({"role": "user", "content": req.message})

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=1000,
            temperature=0.7,
        )

        return {"response": response.choices[0].message.content, "source": "openai"}

    except Exception as e:
        response = mock_chat_response(req.message)
        return {"response": response, "source": "mock", "error": str(e)}
