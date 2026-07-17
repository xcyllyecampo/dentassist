import os
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from openai import OpenAI
from prompts.dental import DENTAL_CHAT

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    context: Optional[dict] = None


def get_client():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        return None
    return OpenAI(api_key=api_key)


def format_appointments(appts):
    if not appts:
        return "No appointments scheduled for today."
    lines = []
    for a in appts:
        lines.append(f"  {a['time']} - {a['patient']} with {a['dentist']} ({a['room']}, {a['status']})\n    Procedure: {a['procedure']}")
    return "\n".join(lines)


def format_queue(queue):
    waiting = queue.get("waiting", [])
    serving = queue.get("serving", [])
    parts = []
    if waiting:
        parts.append("Waiting (" + str(len(waiting)) + "):\n" + "\n".join(
            f"  #{w['position']} {w['patient']} (~{w['estimatedWait']} min wait)" for w in waiting
        ))
    else:
        parts.append("Waiting: No one in the queue")
    if serving:
        parts.append("Currently serving:\n" + "\n".join(
            f"  - {s['patient']}" for s in serving
        ))
    else:
        parts.append("Currently serving: None")
    return "\n".join(parts)


def format_rooms(rooms):
    lines = []
    for r in rooms:
        status_icon = {"AVAILABLE": "[Available]", "OCCUPIED": "[Occupied]", "CLEANING": "[Cleaning]", "MAINTENANCE": "[Maintenance]"}.get(r['status'], r['status'])
        line = f"  Room {r['number']}: {status_icon}"
        if r.get("currentPatient"):
            line += f" - {r['currentPatient']} (with {r['currentDentist']})"
        lines.append(line)
    return "\n".join(lines)


def mock_chat_response(message: str, context: dict = None) -> str:
    lower = message.lower().strip()
    ctx = context or {}

    # === DATA-AWARE RESPONSES ===

    if any(w in lower for w in ["how many patient", "total patient", "patient count", "number of patient", "how many people"]):
        total = ctx.get("totalPatients", 0)
        today_appts = ctx.get("todayAppointments", [])
        waiting = ctx.get("queue", {}).get("waitingCount", 0)
        return (
            f"You have **{total} registered patients** in the system.\n\n"
            f"Today ({ctx.get('date', 'today')}):\n"
            f"  - {len(today_appts)} appointments scheduled\n"
            f"  - {waiting} patients currently waiting in queue\n\n"
            f"Would you like to see today's appointment list or queue details?"
        )

    if any(w in lower for w in ["first patient", "next patient", "who's next", "whos next", "who is next"]):
        appts = ctx.get("todayAppointments", [])
        queue = ctx.get("queue", {})
        if appts:
            a = appts[0]
            return (
                f"Your first appointment today:\n\n"
                f"  Time: {a['time']}\n"
                f"  Patient: {a['patient']}\n"
                f"  Dentist: {a['dentist']}\n"
                f"  Room: {a['room']}\n"
                f"  Procedure: {a['procedure']}\n"
                f"  Status: {a['status']}"
            )
        elif queue.get("waiting"):
            w = queue["waiting"][0]
            return f"No appointments scheduled, but the first patient in the queue is:\n\n  #{w['position']} {w['patient']} (~{w['estimatedWait']} min wait)\n\nYou may want to call them in."
        else:
            return "No patients scheduled or waiting right now. Looks like a quiet day!"

    if any(w in lower for w in ["who's waiting", "who is waiting", "queue", "waiting list", "wait list", "waiting patients", "who is in queue"]):
        queue = ctx.get("queue", {})
        waiting = queue.get("waiting", [])
        serving = queue.get("serving", [])
        total_wait = queue.get("waitingCount", 0)
        total_serve = queue.get("servingCount", 0)
        if not waiting and not serving:
            return "The queue is empty — no patients waiting or being served right now."
        return (
            f"Queue Status:\n\n{format_queue(queue)}\n\n"
            f"Summary: {total_wait} waiting, {total_serve} in service"
        )

    if any(w in lower for w in ["today's appointment", "today appointment", "what's on today", "appointments today", "my schedule", "what do i have today", "what's scheduled"]):
        appts = ctx.get("todayAppointments", [])
        if not appts:
            return f"No appointments scheduled for {ctx.get('date', 'today')}."
        completed = sum(1 for a in appts if a['status'] == 'COMPLETED')
        in_progress = sum(1 for a in appts if a['status'] == 'IN_PROGRESS')
        scheduled = sum(1 for a in appts if a['status'] in ('SCHEDULED', 'CONFIRMED'))
        return (
            f"Today's Appointments ({ctx.get('date', 'today')}):\n\n"
            f"{format_appointments(appts)}\n\n"
            f"Summary: {len(appts)} total | {completed} completed | {in_progress} in progress | {scheduled} upcoming"
        )

    if any(w in lower for w in ["room status", "room", "which room", "rooms available", "room overview", "which rooms"]):
        rooms = ctx.get("rooms", [])
        if not rooms:
            return "No room data available."
        available = sum(1 for r in rooms if r['status'] == 'AVAILABLE')
        occupied = sum(1 for r in rooms if r['status'] == 'OCCUPIED')
        cleaning = sum(1 for r in rooms if r['status'] == 'CLEANING')
        return (
            f"Room Overview:\n\n{format_rooms(rooms)}\n\n"
            f"Summary: {available} available, {occupied} occupied, {cleaning} cleaning"
        )

    if any(w in lower for w in ["what's happening", "whats happening", "summary", "overview", "status", "give me an overview", "daily summary", "clinic status"]):
        appts = ctx.get("todayAppointments", [])
        queue = ctx.get("queue", {})
        rooms = ctx.get("rooms", [])
        total = ctx.get("totalPatients", 0)
        return (
            f"Clinic Overview for {ctx.get('date', 'today')}:\n\n"
            f"Patients: {total} registered\n"
            f"Appointments: {len(appts)} today ({sum(1 for a in appts if a['status'] == 'IN_PROGRESS')} in progress)\n"
            f"Queue: {queue.get('waitingCount', 0)} waiting, {queue.get('servingCount', 0)} in service\n"
            f"Rooms: {sum(1 for r in rooms if r['status'] == 'AVAILABLE')}/{len(rooms)} available\n\n"
            f"Would you like details on any specific area?"
        )

    if any(w in lower for w in ["recent treatment", "recent patient", "last treatment", "latest treatment", "what treatments"]):
        treatments = ctx.get("recentTreatments", [])
        patients = ctx.get("recentPatients", [])
        parts = []
        if treatments:
            parts.append("Recent Treatments:\n" + "\n".join(
                f"  - {t['patient']}: {t['procedure']} ({t['dentist']})" for t in treatments
            ))
        if patients:
            parts.append("Recent Patients:\n" + "\n".join(
                f"  - {p['name']} ({p['email']})" for p in patients
            ))
        return "\n\n".join(parts) if parts else "No recent treatment or patient data found."

    if any(w in lower for w in ["search patient", "find patient", "look up patient", "patient info", "patient details"]):
        patients = ctx.get("recentPatients", [])
        name_query = lower.replace("search patient", "").replace("find patient", "").replace("look up patient", "").replace("patient info", "").replace("patient details", "").strip()
        if name_query:
            matches = [p for p in patients if name_query in (p.get("name", "")).lower()]
            if matches:
                p = matches[0]
                info = f"Found: {p['name']}\n  Email: {p['email']}"
                if p.get("bloodType"):
                    info += f"\n  Blood Type: {p['bloodType']}"
                if p.get("allergies"):
                    info += f"\n  Allergies: {p['allergies']}"
                return info
            return f"No patient matching '{name_query}' found in recent records. Try the Patients page for a full search."
        return "Which patient are you looking for? You can say \"search patient john\" or check the Patients page."

    # === FAQ RESPONSES (original) ===

    if any(w in lower for w in ["hello", "hi", "hey", "good morning", "good afternoon"]):
        total = ctx.get("totalPatients", "several")
        waiting = ctx.get("queue", {}).get("waitingCount", 0) if ctx else 0
        return (
            f"Hello! Welcome to DentAssist Dental Clinic.\n\n"
            f"Quick stats: {total} patients registered, {waiting} waiting in queue right now.\n\n"
            f"How can I help you? You can ask about today's schedule, patient info, rooms, or anything else about the clinic."
        )

    if any(w in lower for w in ["hour", "time", "open", "schedule", "when are you"]):
        return "Our clinic hours are:\n\nMonday to Friday: 9:00 AM - 5:00 PM\nSaturday: 9:00 AM - 12:00 PM\nSunday: Closed\n\nFor emergencies, call our 24/7 emergency line at (02) 8123-4568."

    if any(w in lower for w in ["location", "where", "address", "direction", "find you"]):
        return "We're located at:\n\n123 Main Street\nManila, Philippines\n\nFree parking is available behind the building. You can reach us by phone at (02) 8123-4567."

    if any(w in lower for w in ["book", "appointment", "schedule", "reserve"]):
        return "You can book an appointment by:\n\n1. Using the Appointments page in the DentAssist dashboard\n2. Calling us at (02) 8123-4567\n3. Walking in during clinic hours\n\nWhat type of appointment are you looking for?"

    if any(w in lower for w in ["root canal"]):
        return "A root canal treats a badly damaged or infected tooth:\n\n1. Damaged pulp is removed\n2. Canals are cleaned and disinfected\n3. Tooth is filled and sealed\n4. A crown is usually placed on top\n\nDuration: 1-2 visits (60-90 min each)\nCost: $500-800\nRecovery: Mild soreness for 2-3 days"

    if any(w in lower for w in ["fill", "filling", "cavity", "cavities"]):
        return "Dental fillings repair minor tooth damage from cavities:\n\n1. Decay is removed\n2. Area is cleaned\n3. Composite resin filling is placed\n\nDuration: 30-60 minutes\nCost: $100-200\nNo downtime — eat immediately after."

    if any(w in lower for w in ["extract", "extraction", "pull", "remove tooth"]):
        return "Tooth extraction removes a tooth from its socket:\n\n- Simple: 20-40 min, $150-300\n- Surgical: 45-60 min, $250-500\n- Recovery: 7-10 days\n\nWe recommend extraction for severe decay, overcrowding, or impacted wisdom teeth."

    if any(w in lower for w in ["clean", "cleaning", "scaling"]):
        return "Professional dental cleaning (prophylaxis):\n\n1. Ultrasonic scaling removes tartar\n2. Professional flossing\n3. Teeth polishing\n4. Fluoride treatment\n\nDuration: 30-45 min\nCost: $80\nRecommended every 6 months."

    if any(w in lower for w in ["cost", "price", "how much", "fee", "charge", "pricing"]):
        return "General pricing:\n\n- Consultation: $30\n- Cleaning: $80\n- X-Ray: $50-100\n- Filling: $100-200\n- Root Canal: $500-800\n- Extraction: $150-300\n- Whitening: $300\n- Braces: $3,000-5,000\n- Veneers: $800-1,500/tooth\n- Implants: $2,000-3,500\n\nWe accept HMO, DMF, PhilHealth, credit cards, and cash."

    if any(w in lower for w in ["pain", "hurt", "ache", "sore", "throbbing"]):
        return "For dental pain relief:\n\n1. Take ibuprofen (if not allergic)\n2. Apply cold compress to cheek\n3. Rinse with warm salt water\n4. Avoid hot/cold foods on the area\n\nCall (02) 8123-4567 for an urgent appointment. Don't ignore persistent pain!"

    if any(w in lower for w in ["emergency", "urgent", "broken", "knocked out"]):
        return "DENTAL EMERGENCY - Call (02) 8123-4568 (24/7)\n\nKnocked-out tooth:\n1. Pick up by crown (not root)\n2. Rinse gently with milk/saline\n3. Try to place back in socket\n4. If not, keep in milk\n5. See dentist within 30 minutes\n\nBroken tooth:\n1. Rinse with warm water\n2. Apply gauze to bleeding\n3. Cold compress for swelling\n4. Save broken pieces"

    if any(w in lower for w in ["white", "whitening", "bleach"]):
        return "Professional teeth whitening:\n\nIn-Office: 1 session, up to 8 shades whiter, 60-90 min, $300\nTake-Home: Custom trays, 2 weeks, $200\n\nResults last 6-12 months. Avoid coffee/tea/red wine for 48 hours after."

    if any(w in lower for w in ["brace", "braces", "aligner", "orthodont"]):
        return "Orthodontic options:\n\n1. Metal Braces: $3,000-4,000 (18-24 months)\n2. Ceramic Braces: $4,000-5,000 (18-24 months)\n3. Clear Aligners: $3,500-5,000 (12-18 months)\n\nAll include free consultation, monthly check-ups, and retainer."

    if any(w in lower for w in ["veneer", "veneers"]):
        return "Dental veneers:\n\n- Porcelain: $800-1,500/tooth, lasts 10-15 years\n- Composite: $250-500/tooth, lasts 5-7 years\n\nFixes chips, discoloration, gaps, misshapen teeth.\nDuration: 2-3 visits over 2-3 weeks."

    if any(w in lower for w in ["insurance", "coverage", "hmo", "philhealth"]):
        return "We accept:\n- HMO dental plans\n- DMF insurance\n- PhilHealth dental coverage\n- Credit cards, cash, bank transfer\n\nBring your insurance card to your appointment. We can verify coverage before treatment."

    return (
        "I can help you with:\n\n"
        "**Clinic Operations:**\n"
        "- \"How many patients do I have?\"\n"
        "- \"Who's my first patient today?\"\n"
        "- \"What's the queue status?\"\n"
        "- \"Room overview\"\n"
        "- \"Today's appointments\"\n"
        "- \"Give me a clinic overview\"\n\n"
        "**Dental Knowledge:**\n"
        "- Procedures (fillings, root canals, extractions)\n"
        "- Pricing and insurance\n"
        "- Emergency guidance\n"
        "- Clinic hours and location"
    )


@router.post("")
async def chat(req: ChatRequest):
    client = get_client()
    ctx = req.context

    if not client:
        response = mock_chat_response(req.message, ctx)
        return {"response": response, "source": "mock"}

    try:
        system_msg = DENTAL_CHAT
        if ctx:
            system_msg += f"\n\nCURRENT CLINIC DATA (as of {ctx.get('date', 'today')}):\n"
            system_msg += f"- Total registered patients: {ctx.get('totalPatients', 0)}\n"
            system_msg += f"- Today's appointments: {len(ctx.get('todayAppointments', []))}\n"
            system_msg += f"- Queue waiting: {ctx.get('queue', {}).get('waitingCount', 0)}\n"
            system_msg += f"- Queue serving: {ctx.get('queue', {}).get('servingCount', 0)}\n"
            system_msg += f"- Rooms: {len(ctx.get('rooms', []))} total\n\n"
            system_msg += f"APPOINTMENTS TODAY:\n{format_appointments(ctx.get('todayAppointments', []))}\n\n"
            system_msg += f"QUEUE:\n{format_queue(ctx.get('queue', {}))}\n\n"
            system_msg += f"ROOMS:\n{format_rooms(ctx.get('rooms', []))}\n\n"
            if ctx.get('recentPatients'):
                system_msg += f"RECENT PATIENTS:\n" + "\n".join(
                    f"  - {p['name']} ({p['email']})" for p in ctx['recentPatients']
                ) + "\n\n"

        messages = [{"role": "system", "content": system_msg}]

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
        response = mock_chat_response(req.message, ctx)
        return {"response": response, "source": "mock", "error": str(e)}
