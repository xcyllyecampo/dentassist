import os
from gemini_client import get_client, GEMINI_MODEL
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from prompts.dental import DENTAL_CHAT

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []
    context: Optional[dict] = None


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

    if any(w in lower for w in ["how many patient", "total patient", "patient count", "number of patient", "how many people"]):
        total = ctx.get("totalPatients", 0)
        today_appts = ctx.get("todayAppointments", [])
        waiting = ctx.get("queue", {}).get("waitingCount", 0)
        return f"You have **{total} registered patients** in the system.\n\nToday ({ctx.get('date', 'today')}):\n  - {len(today_appts)} appointments scheduled\n  - {waiting} patients currently waiting in queue\n\nWould you like to see today's appointment list or queue details?"

    if any(w in lower for w in ["first patient", "next patient", "who's next", "whos next", "who is next"]):
        appts = ctx.get("todayAppointments", [])
        queue = ctx.get("queue", {})
        if appts:
            a = appts[0]
            return f"Your first appointment today:\n\n  Time: {a['time']}\n  Patient: {a['patient']}\n  Dentist: {a['dentist']}\n  Room: {a['room']}\n  Procedure: {a['procedure']}\n  Status: {a['status']}"
        elif queue.get("waiting"):
            w = queue["waiting"][0]
            return f"No appointments scheduled, but the first patient in the queue is:\n\n  #{w['position']} {w['patient']} (~{w['estimatedWait']} min wait)\n\nYou may want to call them in."
        else:
            return "No patients scheduled or waiting right now. Looks like a quiet day!"

    if any(w in lower for w in ["who's waiting", "who is waiting", "queue", "waiting list", "waiting patients", "who is in queue"]):
        queue = ctx.get("queue", {})
        waiting = queue.get("waiting", [])
        serving = queue.get("serving", [])
        if not waiting and not serving:
            return "The queue is empty — no patients waiting or being served right now."
        return f"Queue Status:\n\n{format_queue(queue)}\n\nSummary: {queue.get('waitingCount', 0)} waiting, {queue.get('servingCount', 0)} in service"

    if any(w in lower for w in ["today's appointment", "today appointment", "what's on today", "appointments today", "what's scheduled"]):
        appts = ctx.get("todayAppointments", [])
        if not appts:
            return f"No appointments scheduled for {ctx.get('date', 'today')}."
        return f"Today's Appointments ({ctx.get('date', 'today')}):\n\n{format_appointments(appts)}"

    if any(w in lower for w in ["room status", "room", "which room", "rooms available", "room overview"]):
        rooms = ctx.get("rooms", [])
        if not rooms:
            return "No room data available."
        return f"Room Overview:\n\n{format_rooms(rooms)}"

    if any(w in lower for w in ["what's happening", "summary", "overview", "status", "daily summary", "clinic status"]):
        appts = ctx.get("todayAppointments", [])
        queue = ctx.get("queue", {})
        rooms = ctx.get("rooms", [])
        total = ctx.get("totalPatients", 0)
        return f"Clinic Overview for {ctx.get('date', 'today')}:\n\nPatients: {total} registered\nAppointments: {len(appts)} today\nQueue: {queue.get('waitingCount', 0)} waiting, {queue.get('servingCount', 0)} in service\nRooms: {sum(1 for r in rooms if r['status'] == 'AVAILABLE')}/{len(rooms)} available"

    if any(w in lower for w in ["recent treatment", "recent patient", "last treatment", "what treatments"]):
        treatments = ctx.get("recentTreatments", [])
        patients = ctx.get("recentPatients", [])
        parts = []
        if treatments:
            parts.append("Recent Treatments:\n" + "\n".join(f"  - {t['patient']}: {t['procedure']} ({t['dentist']})" for t in treatments))
        if patients:
            parts.append("Recent Patients:\n" + "\n".join(f"  - {p['name']} ({p['email']})" for p in patients))
        return "\n\n".join(parts) if parts else "No recent treatment or patient data found."

    if any(w in lower for w in ["hello", "hi", "hey", "good morning", "good afternoon"]):
        total = ctx.get("totalPatients", "several")
        waiting = ctx.get("queue", {}).get("waitingCount", 0) if ctx else 0
        return f"Hello! Welcome to DentAssist Dental Clinic.\n\nQuick stats: {total} patients registered, {waiting} waiting in queue right now.\n\nHow can I help you?"

    if any(w in lower for w in ["hour", "time", "open", "schedule", "when are you"]):
        return "Our clinic hours are:\n\nMonday to Friday: 9:00 AM - 5:00 PM\nSaturday: 9:00 AM - 12:00 PM\nSunday: Closed\n\nFor emergencies, call (02) 8123-4568."

    if any(w in lower for w in ["location", "where", "address", "direction"]):
        return "We're located at:\n\n123 Main Street\nManila, Philippines\n\nFree parking behind the building. Phone: (02) 8123-4567."

    if any(w in lower for w in ["book", "appointment", "schedule", "reserve"]):
        return "You can book an appointment by:\n\n1. Using the Appointments page\n2. Calling (02) 8123-4567\n3. Walking in during clinic hours"

    if any(w in lower for w in ["root canal"]):
        return "Root canal treats a damaged/infected tooth:\n\n1. Damaged pulp removed\n2. Canals cleaned and disinfected\n3. Tooth filled and sealed\n4. Crown placed on top\n\nDuration: 1-2 visits (60-90 min each)\nCost: ₱3,500-₱10,000\nRecovery: Mild soreness 2-3 days"

    if any(w in lower for w in ["fill", "filling", "cavity"]):
        return "Dental fillings repair cavities:\n\n1. Decay removed\n2. Area cleaned\n3. Composite resin placed\n\nDuration: 30-60 min\nCost: ₱800-₱2,500"

    if any(w in lower for w in ["extract", "extraction", "pull", "remove tooth"]):
        return "Tooth extraction:\n\n- Simple: 20-40 min, ₱500-₱3,000\n- Surgical: 45-60 min, ₱5,000-₱10,000\n- Recovery: 7-10 days"

    if any(w in lower for w in ["clean", "cleaning", "scaling"]):
        return "Professional dental cleaning:\n\n1. Ultrasonic scaling\n2. Professional flossing\n3. Polishing\n4. Fluoride treatment\n\nDuration: 30-45 min\nCost: ₱500-₱1,500\nRecommended every 6 months."

    if any(w in lower for w in ["cost", "price", "how much", "fee", "pricing"]):
        return "General pricing:\n\n- Cleaning: ₱500-₱1,500\n- Filling: ₱800-₱2,500\n- Root Canal: ₱3,500-₱10,000\n- Extraction: ₱500-₱3,000\n- Whitening: ₱5,000-₱12,000\n- Braces: ₱25,000-₱55,000\n- Veneers: ₱12,000-₱35,000/tooth\n- Implants: ₱35,000-₱100,000\n\nWe accept HMO, PhilHealth, credit cards, and cash."

    if any(w in lower for w in ["pain", "hurt", "ache"]):
        return "For dental pain:\n\n1. Take ibuprofen (if not allergic)\n2. Cold compress to cheek\n3. Rinse with warm salt water\n4. Avoid hot/cold foods\n\nCall (02) 8123-4567 for urgent appointment."

    if any(w in lower for w in ["emergency", "urgent", "broken", "knocked out"]):
        return "DENTAL EMERGENCY - Call (02) 8123-4568 (24/7)\n\nKnocked-out tooth:\n1. Pick up by crown (not root)\n2. Rinse gently with milk/saline\n3. Try to place back in socket\n4. See dentist within 30 minutes"

    if any(w in lower for w in ["whitening", "white", "bleach"]):
        return "Professional teeth whitening:\n\nIn-Office: ₱5,000-₱12,000, 60-90 min\nTake-Home: ₱3,000-₱5,000, 2-4 weeks\n\nResults last 6-12 months."

    if any(w in lower for w in ["brace", "braces", "aligner", "orthodont"]):
        return "Orthodontic options:\n\n1. Metal Braces: ₱25,000-₱45,000 (18-24 months)\n2. Ceramic Braces: ₱30,000-₱55,000\n3. Clear Aligners: ₱35,000-₱60,000"

    if any(w in lower for w in ["veneer", "veneers"]):
        return "Dental veneers:\n\n- Porcelain: ₱12,000-₱35,000/tooth, 10-15 years\n- Composite: ₱5,000-₱10,000/tooth, 5-7 years"

    if any(w in lower for w in ["insurance", "hmo", "philhealth"]):
        return "We accept: HMO dental plans, PhilHealth, credit cards, cash, bank transfer."

    return "I can help with:\n\n**Clinic Operations:** patients, appointments, queue, rooms, overview\n\n**Dental Knowledge:** procedures, pricing, emergencies, clinic info"


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
                system_msg += "RECENT PATIENTS:\n" + "\n".join(
                    f"  - {p['name']} ({p['email']})" for p in ctx['recentPatients']
                ) + "\n\n"

        full_prompt = system_msg + "\n\nUser: " + req.message

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=full_prompt,
        )

        return {"response": response.text, "source": "gemini"}

    except Exception as e:
        response = mock_chat_response(req.message, ctx)
        return {"response": response, "source": "mock", "error": str(e)}
