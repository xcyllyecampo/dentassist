const express = require("express");
const { auth, roleGuard } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { aiSchemas } = require("../lib/schemas");
const multer = require("multer");

const router = express.Router();

const GEMINI_MODEL = "gemini-2.0-flash";

let genAI = null;
function getGenAI() {
  if (genAI) return genAI;
  const { GoogleGenAI } = require("@google/genai");
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.length < 10) return null;
  genAI = new GoogleGenAI({ apiKey });
  return genAI;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/dicom"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, WebP, and DICOM files are allowed"));
  },
});

function parseAIJson(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    const lastFence = cleaned.lastIndexOf("```");
    cleaned = cleaned.substring(cleaned.indexOf("\n") + 1, lastFence > 0 ? lastFence : undefined).trim();
  }
  return JSON.parse(cleaned);
}

async function generateContent(contents) {
  const ai = getGenAI();
  if (!ai) throw new Error("Gemini API key not configured");
  const response = await ai.models.generateContent({ model: GEMINI_MODEL, contents });
  return response.text;
}

// ─── PROMPTS ───

const CLINIC_NAME = process.env.CLINIC_NAME || "DentAssist Dental Clinic";
const CLINIC_ADDRESS = process.env.CLINIC_ADDRESS || "123 Main Street, Manila, Philippines";
const CLINIC_PHONE = process.env.CLINIC_PHONE || "(02) 8123-4567";
const CLINIC_EMERGENCY = process.env.CLINIC_EMERGENCY || "(02) 8123-4568";
const CLINIC_HOURS = process.env.CLINIC_HOURS || "Monday-Friday 9:00 AM - 5:00 PM, Saturday 9:00 AM - 12:00 PM";

const PROMPTS = {
  xrayAnalysis: `You are a dental AI assistant specializing in radiograph analysis.

Analyze the provided dental X-ray image and identify:
1. Cavities or dental caries
2. Bone loss or periodontal disease
3. Impacted teeth
4. Fractures or cracks
5. Infections or abscesses
6. Root canal issues
7. Wisdom tooth problems

For EACH finding, provide:
- area: Specific tooth number or region (e.g., "Tooth #19", "Upper left molar area")
- type: Category (cavity, bone_loss, impacted, fracture, infection, root_canal, wisdom_tooth)
- confidence: A number between 0 and 1 (be conservative, only flag what you're reasonably sure about)
- severity: "mild", "moderate", or "severe"
- description: Clear explanation of what you observe

Also provide:
- overall_assessment: Brief summary of the X-ray quality and general dental health
- recommendations: List of recommended next steps

IMPORTANT: Always include a disclaimer that this is AI-assisted analysis and not a definitive diagnosis. The final determination must be made by a licensed dentist.`,

  oralScreening: `You are a dental AI assistant specializing in oral health screening from photographs.

Analyze the provided intraoral photograph and identify:
1. Plaque or tartar buildup
2. Gum disease signs (gingivitis, recession)
3. Tooth discoloration or staining
4. Misalignment or crowding
5. Visible cavities or decay
6. Soft tissue abnormalities
7. Wear patterns

For EACH finding, provide:
- region: Specific area (e.g., "Upper front teeth", "Lower left molars")
- concern: Description of the observation
- severity: "none", "mild", "moderate", or "severe"
- confidence: A number between 0 and 1

Also provide:
- overall_score: Oral health score from 0 to 100 (100 being perfect)
- recommendations: List of recommended actions

IMPORTANT: Always include a disclaimer that this AI screening is NOT a medical diagnosis. Always recommend consulting a licensed dentist for professional evaluation.`,

  dentalChat: `You are DentAssist AI, an intelligent dental clinic assistant for ${CLINIC_NAME} at ${CLINIC_ADDRESS}.

You have ACCESS TO LIVE CLINIC DATA including:
- Patient registry (total count, recent patients with details)
- Today's appointments (times, patients, dentists, rooms, procedures, statuses)
- Real-time queue (who's waiting, who's being served, estimated wait times)
- Room statuses (available, occupied, cleaning, maintenance)
- Recent treatments and procedures

When answering questions about clinic operations, USE THE PROVIDED DATA. Be specific with names, times, and numbers from the data.

CAPABILITIES:
1. Clinic Operations: Answer questions about patients, appointments, queue, rooms
2. Dental Knowledge: Explain procedures, pricing, treatments
3. Emergency Guidance: Direct emergencies to call the emergency line
4. Clinic Info: Hours, location, contact details, insurance

CLINIC INFORMATION:
- Name: ${CLINIC_NAME}
- Address: ${CLINIC_ADDRESS}
- Phone: ${CLINIC_PHONE}
- Emergency Line: ${CLINIC_EMERGENCY} (24/7)
- Hours: ${CLINIC_HOURS}

SERVICES & PRICING (all costs in Philippine Peso):
- Consultation: 500-1,500, Cleaning: 500-1,500, Filling: 800-2,500
- Root Canal: 3,500-10,000, Extraction: 500-3,000
- Whitening: 5,000-12,000, Braces: 25,000-55,000
- Veneers: 12,000-35,000/tooth, Implants: 35,000-100,000

RULES:
- Be helpful, professional, and warm
- Use real data when available — be specific with names, times, numbers
- Always recommend consulting a dentist for medical advice
- Direct emergencies to the emergency line (${CLINIC_EMERGENCY})
- Keep responses concise and actionable
- Never provide definitive diagnoses`,

  treatmentSuggest: `You are a dental clinical decision support system. You help dentists by suggesting possible treatment options based on symptoms and examination findings.

Given the patient's symptoms and examination findings:
1. List possible diagnoses (most likely first)
2. For each diagnosis, suggest treatment options with:
   - name: Treatment name
   - description: Brief explanation
   - cost_range: Estimated cost range in Philippine Peso
   - duration: Expected time
   - priority: "urgent", "recommended", or "optional"
3. List any additional tests or examinations recommended
4. Note any red flags requiring immediate attention

IMPORTANT: This is a DECISION SUPPORT tool only. The final treatment decision must be made by the licensed dentist after thorough clinical examination. Always emphasize that these are suggestions, not prescriptions.`,

  smileSimulation: `You are a dental AI assistant specializing in cosmetic dentistry smile simulation.

Analyze the provided smile photograph and simulate the expected results after a specific dental treatment.

For the CURRENT ANALYSIS, evaluate:
- smile_score: Current smile attractiveness score (0-100)
- observations: List of specific findings about the current smile
  - area: Region of the mouth
  - finding: What you observe
  - severity: "none", "mild", "moderate", or "severe"

For the SIMULATED RESULT, describe:
- smile_score: Expected smile score after treatment (0-100)
- description: Detailed description of the expected outcome
- estimated_shade_change: Expected color change (if applicable)
- changes: List of specific improvements expected

Also provide:
- procedures: List of recommended procedure options with name, description, cost (in Philippine Peso), duration, and results
- timeline: Treatment timeline from start to finish
- maintenance: Post-treatment care instructions

IMPORTANT: Always include a disclaimer that this is an AI-generated simulation for informational purposes only. Actual results may vary based on individual dental conditions. A licensed dentist must evaluate before any treatment.`,
};

// ─── MOCK RESPONSES ───

const MOCK = {
  chat: (message) => ({
    response: `I'm DentAssist AI (Demo Mode). Based on your query about "${message.slice(0, 50)}", here's what I can tell you:\n\n- The clinic currently has patients in queue\n- Room availability looks good for today\n- For specific clinical advice, please consult with the attending dentist.\n\nNote: The AI service is running in demo mode. Connect Gemini for full AI-powered responses.`,
    source: "mock",
  }),

  xray: {
    overall_assessment: "Demo analysis: Mild periodontal concerns detected. Routine examination recommended.",
    findings: [
      { area: "Upper left molar (#14)", severity: "mild", confidence: 0.82, description: "Slight enamel wear detected. Monitor for potential sensitivity." },
      { area: "Lower right premolar (#30)", severity: "moderate", confidence: 0.75, description: "Possible early-stage caries. Recommend bitewing X-ray for confirmation." },
      { area: "Anterior teeth", severity: "none", confidence: 0.95, description: "No significant abnormalities detected. Good alignment and bone levels." },
    ],
    recommendations: [
      "Schedule a follow-up examination in 6 months",
      "Consider fluoride treatment for enamel protection",
      "Maintain current oral hygiene routine",
    ],
    disclaimer: "This is an AI-generated analysis for demonstration purposes. All findings must be verified by a licensed dentist.",
    source: "mock",
  },

  oral: {
    overall_score: 78,
    areas: [
      { region: "Upper Front Teeth", severity: "none", confidence: 0.92, concern: "No visible concerns. Good alignment and color." },
      { region: "Lower Front Teeth", severity: "mild", confidence: 0.85, concern: "Slight gingival inflammation observed. Recommend improved flossing." },
      { region: "Upper Right Molars", severity: "none", confidence: 0.88, concern: "No visible decay or damage detected." },
      { region: "Lower Left Molars", severity: "mild", confidence: 0.78, concern: "Minor plaque buildup detected. Professional cleaning recommended." },
      { region: "Tongue & Soft Palate", severity: "none", confidence: 0.9, concern: "Appears healthy with no abnormalities." },
    ],
    recommendations: [
      "Floss daily to reduce gum inflammation",
      "Schedule a professional dental cleaning",
      "Consider using an antimicrobial mouthwash",
    ],
    disclaimer: "This is an AI-generated screening for demonstration purposes. Please consult a licensed dentist for professional evaluation.",
    source: "mock",
  },

  treatment: {
    diagnoses: [
      {
        name: "Dental Caries (Tooth Decay)",
        treatments: [
          { name: "Composite Filling", description: "Tooth-colored resin filling to restore the damaged tooth structure.", cost_range: "800 - 2,500", duration: "30-45 min", priority: "recommended" },
          { name: "Dental Crown", description: "Full coverage crown (PFM or zirconia) for extensively damaged teeth.", cost_range: "8,000 - 20,000", duration: "2 visits", priority: "alternative" },
        ],
      },
      {
        name: "Gingivitis",
        treatments: [
          { name: "Professional Cleaning", description: "Deep cleaning (scaling and root planing) to remove tartar and bacteria.", cost_range: "500 - 1,500", duration: "60-90 min", priority: "recommended" },
        ],
      },
    ],
    red_flags: ["Persistent pain lasting more than 48 hours", "Swelling of face or gums"],
    additional_tests: ["Panoramic X-ray", "Periodontal probing"],
    disclaimer: "This is a clinical decision support tool for demonstration purposes. Final treatment decisions must be made by a licensed dentist.",
    source: "mock",
  },

  smile: (treatmentType) => ({
    current_analysis: {
      smile_score: 62,
      observations: [
        { area: "Tooth Color", severity: "mild", finding: "Slight yellowing detected. Teeth could benefit from whitening." },
        { area: "Tooth Alignment", severity: "none", finding: "Minor crowding in lower anterior region." },
        { area: "Tooth Shape", severity: "mild", finding: "Slight unevenness in incisal edges." },
      ],
    },
    simulated_result: {
      smile_score: 88,
      description: `With ${treatmentType} treatment, your smile could improve significantly.`,
      estimated_shade_change: treatmentType === "whitening" ? "4-6 shades lighter" : "Customized to match natural tooth color",
      changes: treatmentType === "whitening"
        ? ["Brighter, whiter teeth", "More uniform color across all teeth", "Removal of surface stains"]
        : treatmentType === "veneers"
        ? ["Perfect tooth shape and symmetry", "Natural-looking porcelain finish", "Instant smile transformation"]
        : ["Straighter tooth alignment", "Improved bite correction", "Gradual movement over treatment period"],
    },
    procedures: [
      { name: treatmentType === "whitening" ? "Professional Teeth Whitening" : treatmentType === "veneers" ? "Porcelain Veneers" : "Orthodontic Alignment", description: `Professional ${treatmentType} treatment tailored to your needs.`, cost: treatmentType === "whitening" ? "5,000 - 12,000" : treatmentType === "veneers" ? "12,000 - 35,000/tooth" : "25,000 - 55,000", duration: treatmentType === "whitening" ? "1-2 hours" : treatmentType === "veneers" ? "2-3 visits" : "12-18 months" },
    ],
    timeline: treatmentType === "whitening" ? "Results visible immediately. Full effect within 48 hours." : treatmentType === "veneers" ? "Completed in 2-3 visits over 2-3 weeks." : "Gradual improvement over 12-18 months with regular check-ups.",
    maintenance: "Maintain good oral hygiene. Avoid staining foods for 48h after whitening. Regular dental check-ups every 6 months.",
    disclaimer: "This is an AI-generated simulation for demonstration purposes. Actual results may vary. A licensed dentist must evaluate before any treatment.",
    source: "mock",
  }),
};

// ─── CLINIC CONTEXT ───

async function getClinicContext(prisma) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalPatients,
    todayAppointments,
    queueWaiting,
    queueServing,
    rooms,
    recentPatients,
    recentTreatments,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.appointment.findMany({
      where: { date: { gte: today, lt: tomorrow } },
      include: {
        patient: { include: { user: { select: { name: true } } } },
        dentist: { select: { name: true } },
        room: { select: { number: true, name: true } },
      },
      orderBy: { time: "asc" },
    }),
    prisma.queueEntry.findMany({
      where: { status: "WAITING" },
      include: { patient: { include: { user: { select: { name: true } } } } },
      orderBy: { position: "asc" },
    }),
    prisma.queueEntry.findMany({
      where: { status: "IN_PROGRESS" },
      include: { patient: { include: { user: { select: { name: true } } } } },
    }),
    prisma.room.findMany({
      include: {
        appointments: {
          where: { status: "IN_PROGRESS" },
          include: {
            patient: { include: { user: { select: { name: true } } } },
            dentist: { select: { name: true } },
          },
        },
      },
      orderBy: { number: "asc" },
    }),
    prisma.patient.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.treatment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        patient: { include: { user: { select: { name: true } } } },
        dentist: { select: { name: true } },
      },
    }),
  ]);

  return {
    date: today.toISOString().split("T")[0],
    totalPatients,
    todayAppointments: todayAppointments.map((a) => ({
      time: a.time,
      patient: a.patient?.user?.name,
      dentist: a.dentist?.name,
      room: a.room ? `Room ${a.room.number}` : "Unassigned",
      procedure: a.reason,
      status: a.status,
    })),
    queue: {
      waiting: queueWaiting.map((q) => ({
        position: q.position,
        patient: q.patient?.user?.name,
        estimatedWait: q.estimatedWait,
      })),
      serving: queueServing.map((q) => ({
        patient: q.patient?.user?.name,
      })),
      waitingCount: queueWaiting.length,
      servingCount: queueServing.length,
    },
    rooms: rooms.map((r) => ({
      number: r.number,
      name: r.name,
      status: r.status,
      currentPatient: r.appointments[0]?.patient?.user?.name || null,
      currentDentist: r.appointments[0]?.dentist?.name || null,
    })),
    recentPatients: recentPatients.map((p) => ({
      name: p.user?.name,
      email: p.user?.email,
      bloodType: p.bloodType,
      allergies: p.allergies,
    })),
    recentTreatments: recentTreatments.map((t) => ({
      patient: t.patient?.user?.name,
      dentist: t.dentist?.name,
      procedure: t.procedure,
      cost: t.cost,
    })),
  };
}

function formatAppointments(appts) {
  if (!appts || !appts.length) return "No appointments scheduled for today.";
  return appts.map((a) => `  ${a.time} - ${a.patient} with ${a.dentist} (${a.room}, ${a.status})\n    Procedure: ${a.procedure}`).join("\n");
}

function formatQueue(queue) {
  const parts = [];
  const waiting = queue?.waiting || [];
  const serving = queue?.serving || [];
  if (waiting.length) {
    parts.push(`Waiting (${waiting.length}):\n${waiting.map((w) => `  #${w.position} ${w.patient} (~${w.estimatedWait} min wait)`).join("\n")}`);
  } else {
    parts.push("Waiting: No one in the queue");
  }
  if (serving.length) {
    parts.push(`Currently serving:\n${serving.map((s) => `  - ${s.patient}`).join("\n")}`);
  } else {
    parts.push("Currently serving: None");
  }
  return parts.join("\n");
}

function formatRooms(rooms) {
  const icons = { AVAILABLE: "[Available]", OCCUPIED: "[Occupied]", CLEANING: "[Cleaning]", MAINTENANCE: "[Maintenance]" };
  return rooms.map((r) => {
    let line = `  Room ${r.number}: ${icons[r.status] || r.status}`;
    if (r.currentPatient) line += ` - ${r.currentPatient} (with ${r.currentDentist})`;
    return line;
  }).join("\n");
}

function mockChatResponse(message, ctx) {
  const lower = message.toLowerCase().trim();
  const c = ctx || {};

  if (["how many patient", "total patient", "patient count", "number of patient", "how many people"].some((w) => lower.includes(w))) {
    const total = c.totalPatients || 0;
    const waiting = c.queue?.waitingCount || 0;
    const appts = c.todayAppointments || [];
    return `You have **${total} registered patients** in the system.\n\nToday (${c.date || "today"}):\n  - ${appts.length} appointments scheduled\n  - ${waiting} patients currently waiting in queue\n\nWould you like to see today's appointment list or queue details?`;
  }
  if (["first patient", "next patient", "who's next", "whos next", "who is next"].some((w) => lower.includes(w))) {
    const appts = c.todayAppointments || [];
    const queue = c.queue || {};
    if (appts.length) { const a = appts[0]; return `Your first appointment today:\n\n  Time: ${a.time}\n  Patient: ${a.patient}\n  Dentist: ${a.dentist}\n  Room: ${a.room}\n  Procedure: ${a.procedure}\n  Status: ${a.status}`; }
    if (queue.waiting?.length) { const w = queue.waiting[0]; return `No appointments scheduled, but the first patient in the queue is:\n\n  #${w.position} ${w.patient} (~${w.estimatedWait} min wait)\n\nYou may want to call them in.`; }
    return "No patients scheduled or waiting right now. Looks like a quiet day!";
  }
  if (["who's waiting", "who is waiting", "queue", "waiting list", "waiting patients", "who is in queue"].some((w) => lower.includes(w))) {
    const queue = c.queue || {};
    if (!queue.waiting?.length && !queue.serving?.length) return "The queue is empty — no patients waiting or being served right now.";
    return `Queue Status:\n\n${formatQueue(queue)}\n\nSummary: ${queue.waitingCount || 0} waiting, ${queue.servingCount || 0} in service`;
  }
  if (["today's appointment", "today appointment", "what's on today", "appointments today", "what's scheduled"].some((w) => lower.includes(w))) {
    const appts = c.todayAppointments || [];
    if (!appts.length) return `No appointments scheduled for ${c.date || "today"}.`;
    return `Today's Appointments (${c.date || "today"}):\n\n${formatAppointments(appts)}`;
  }
  if (["room status", "room", "which room", "rooms available", "room overview"].some((w) => lower.includes(w))) {
    const rooms = c.rooms || [];
    if (!rooms.length) return "No room data available.";
    return `Room Overview:\n\n${formatRooms(rooms)}`;
  }
  if (["what's happening", "summary", "overview", "status", "daily summary", "clinic status"].some((w) => lower.includes(w))) {
    const appts = c.todayAppointments || [];
    const queue = c.queue || {};
    const rooms = c.rooms || [];
    const total = c.totalPatients || 0;
    return `Clinic Overview for ${c.date || "today"}:\n\nPatients: ${total} registered\nAppointments: ${appts.length} today\nQueue: ${queue.waitingCount || 0} waiting, ${queue.servingCount || 0} in service\nRooms: ${rooms.filter((r) => r.status === "AVAILABLE").length}/${rooms.length} available`;
  }
  if (["recent treatment", "recent patient", "last treatment", "what treatments"].some((w) => lower.includes(w))) {
    const treatments = c.recentTreatments || [];
    const patients = c.recentPatients || [];
    const parts = [];
    if (treatments.length) parts.push("Recent Treatments:\n" + treatments.map((t) => `  - ${t.patient}: ${t.procedure} (${t.dentist})`).join("\n"));
    if (patients.length) parts.push("Recent Patients:\n" + patients.map((p) => `  - ${p.name} (${p.email})`).join("\n"));
    return parts.length ? parts.join("\n\n") : "No recent treatment or patient data found.";
  }
  if (["hello", "hi", "hey", "good morning", "good afternoon"].some((w) => lower.includes(w))) {
    const total = c.totalPatients || "several";
    const waiting = c.queue?.waitingCount || 0;
    return `Hello! Welcome to ${CLINIC_NAME}.\n\nQuick stats: ${total} patients registered, ${waiting} waiting in queue right now.\n\nHow can I help you?`;
  }
  if (["hour", "time", "open", "schedule", "when are you"].some((w) => lower.includes(w))) {
    return `Our clinic hours are:\n\nMonday to Friday: 9:00 AM - 5:00 PM\nSaturday: 9:00 AM - 12:00 PM\nSunday: Closed\n\nFor emergencies, call ${CLINIC_EMERGENCY}.`;
  }
  if (["location", "where", "address", "direction"].some((w) => lower.includes(w))) {
    return `We're located at:\n\n${CLINIC_ADDRESS}\n\nFree parking behind the building. Phone: ${CLINIC_PHONE}.`;
  }
  if (["book", "appointment", "schedule", "reserve"].some((w) => lower.includes(w))) {
    return `You can book an appointment by:\n\n1. Using the Appointments page\n2. Calling ${CLINIC_PHONE}\n3. Walking in during clinic hours`;
  }
  if (lower.includes("root canal")) return "Root canal treats a damaged/infected tooth:\n\n1. Damaged pulp removed\n2. Canals cleaned and disinfected\n3. Tooth filled and sealed\n4. Crown placed on top\n\nDuration: 1-2 visits (60-90 min each)\nCost: 3,500-10,000\nRecovery: Mild soreness 2-3 days";
  if (["fill", "filling", "cavity"].some((w) => lower.includes(w))) return "Dental fillings repair cavities:\n\n1. Decay removed\n2. Area cleaned\n3. Composite resin placed\n\nDuration: 30-60 min\nCost: 800-2,500";
  if (["extract", "extraction", "pull", "remove tooth"].some((w) => lower.includes(w))) return "Tooth extraction:\n\n- Simple: 20-40 min, 500-3,000\n- Surgical: 45-60 min, 5,000-10,000\n- Recovery: 7-10 days";
  if (["clean", "cleaning", "scaling"].some((w) => lower.includes(w))) return "Professional dental cleaning:\n\n1. Ultrasonic scaling\n2. Professional flossing\n3. Polishing\n4. Fluoride treatment\n\nDuration: 30-45 min\nCost: 500-1,500\nRecommended every 6 months.";
  if (["cost", "price", "how much", "fee", "pricing"].some((w) => lower.includes(w))) return "General pricing:\n\n- Cleaning: 500-1,500\n- Filling: 800-2,500\n- Root Canal: 3,500-10,000\n- Extraction: 500-3,000\n- Whitening: 5,000-12,000\n- Braces: 25,000-55,000\n- Veneers: 12,000-35,000/tooth\n- Implants: 35,000-100,000\n\nWe accept HMO, PhilHealth, credit cards, and cash.";
  if (["pain", "hurt", "ache"].some((w) => lower.includes(w))) return "For dental pain:\n\n1. Take ibuprofen (if not allergic)\n2. Cold compress to cheek\n3. Rinse with warm salt water\n4. Avoid hot/cold foods\n\nCall " + CLINIC_PHONE + " for urgent appointment.";
  if (["emergency", "urgent", "broken", "knocked out"].some((w) => lower.includes(w))) return `DENTAL EMERGENCY - Call ${CLINIC_EMERGENCY} (24/7)\n\nKnocked-out tooth:\n1. Pick up by crown (not root)\n2. Rinse gently with milk/saline\n3. Try to place back in socket\n4. See dentist within 30 minutes`;
  if (["whitening", "white", "bleach"].some((w) => lower.includes(w))) return "Professional teeth whitening:\n\nIn-Office: 5,000-12,000, 60-90 min\nTake-Home: 3,000-5,000, 2-4 weeks\n\nResults last 6-12 months.";
  if (["brace", "braces", "aligner", "orthodont"].some((w) => lower.includes(w))) return "Orthodontic options:\n\n1. Metal Braces: 25,000-45,000 (18-24 months)\n2. Ceramic Braces: 30,000-55,000\n3. Clear Aligners: 35,000-60,000";
  if (["veneer", "veneers"].some((w) => lower.includes(w))) return "Dental veneers:\n\n- Porcelain: 12,000-35,000/tooth, 10-15 years\n- Composite: 5,000-10,000/tooth, 5-7 years";
  if (["insurance", "hmo", "philhealth"].some((w) => lower.includes(w))) return "We accept: HMO dental plans, PhilHealth, credit cards, cash, bank transfer.";

  return "I can help with:\n\n**Clinic Operations:** patients, appointments, queue, rooms, overview\n\n**Dental Knowledge:** procedures, pricing, emergencies, clinic info";
}

// ─── ROUTES ───

router.post("/chat", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), validate(aiSchemas.chat), async (req, res) => {
  let clinicContext = null;
  try {
    const prisma = req.app.get("prisma");
    const { message } = req.body;
    clinicContext = await getClinicContext(prisma);

    let systemMsg = PROMPTS.dentalChat;
    if (clinicContext) {
      systemMsg += `\n\nCURRENT CLINIC DATA (as of ${clinicContext.date}):\n`;
      systemMsg += `- Total registered patients: ${clinicContext.totalPatients}\n`;
      systemMsg += `- Today's appointments: ${clinicContext.todayAppointments.length}\n`;
      systemMsg += `- Queue waiting: ${clinicContext.queue.waitingCount}\n`;
      systemMsg += `- Queue serving: ${clinicContext.queue.servingCount}\n`;
      systemMsg += `- Rooms: ${clinicContext.rooms.length} total\n\n`;
      systemMsg += `APPOINTMENTS TODAY:\n${formatAppointments(clinicContext.todayAppointments)}\n\n`;
      systemMsg += `QUEUE:\n${formatQueue(clinicContext.queue)}\n\n`;
      systemMsg += `ROOMS:\n${formatRooms(clinicContext.rooms)}\n\n`;
      if (clinicContext.recentPatients.length) {
        systemMsg += "RECENT PATIENTS:\n" + clinicContext.recentPatients.map((p) => `  - ${p.name} (${p.email})`).join("\n") + "\n\n";
      }
    }

    const fullPrompt = systemMsg + "\n\nUser: " + message;
    const aiText = await generateContent(fullPrompt);
    res.json({ response: aiText, source: "gemini" });
  } catch (err) {
    console.error("Gemini unavailable, using mock chat:", err.message);
    res.json({ response: mockChatResponse(req.body.message || "", clinicContext), source: "mock" });
  }
});

router.post("/xray/analyze", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), upload.single("file"), async (req, res) => {
  try {
    const base64Image = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype || "image/jpeg";

    const aiText = await generateContent([
      { text: PROMPTS.xrayAnalysis },
      { text: "\n\nPlease analyze this dental X-ray and provide your findings in JSON format." },
      { inlineData: { mimeType, data: base64Image } },
    ]);

    try {
      const result = parseAIJson(aiText);
      result.source = "gemini";
      res.json(result);
    } catch {
      res.json({ findings: [], overall_assessment: aiText, recommendations: [], disclaimer: "AI analysis.", source: "gemini" });
    }
  } catch (err) {
    console.error("Gemini unavailable, using mock xray:", err.message);
    res.json(MOCK.xray);
  }
});

router.post("/oral/screen", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT", "PATIENT"), upload.single("file"), async (req, res) => {
  try {
    const base64Image = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype || "image/jpeg";

    const aiText = await generateContent([
      { text: PROMPTS.oralScreening },
      { text: "\n\nPlease analyze this intraoral photograph for oral health screening. Provide your findings in JSON format." },
      { inlineData: { mimeType, data: base64Image } },
    ]);

    try {
      const result = parseAIJson(aiText);
      result.source = "gemini";
      res.json(result);
    } catch {
      res.json({ areas: [], overall_score: 50, recommendations: [aiText], disclaimer: "AI screening.", source: "gemini" });
    }
  } catch (err) {
    console.error("Gemini unavailable, using mock oral:", err.message);
    res.json(MOCK.oral);
  }
});

router.post("/treatment/suggest", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), validate(aiSchemas.treatmentSuggest), async (req, res) => {
  try {
    const { symptoms, examination_findings, patient_age, patient_gender, medical_history } = req.body;

    const prompt = `${PROMPTS.treatmentSuggest}

Analyze the following patient case and suggest treatment options in JSON format:

Symptoms: ${symptoms || "Not specified"}
Examination Findings: ${examination_findings || "Not provided"}
Patient Age: ${patient_age || "Not specified"}
Patient Gender: ${patient_gender || "Not specified"}
Medical History: ${medical_history || "Not provided"}

Respond with JSON:
{
    "diagnoses": [
        {
            "name": "Condition name",
            "treatments": [
                {
                    "name": "Treatment name",
                    "description": "Description",
                    "cost_range": "Estimated cost in Philippine Peso",
                    "duration": "Expected duration",
                    "priority": "urgent/recommended/optional"
                }
            ]
        }
    ],
    "additional_tests": ["Test 1", "Test 2"],
    "red_flags": ["Red flag 1"]
}`;

    const aiText = await generateContent(prompt);

    try {
      const result = parseAIJson(aiText);
      result.recommendation = "This is a decision support suggestion. The final treatment plan must be determined by the treating dentist.";
      result.disclaimer = "This AI-generated suggestion is for clinical decision support only.";
      result.source = "gemini";
      res.json(result);
    } catch {
      res.json({
        diagnoses: [{ name: "AI Response", treatments: [{ name: "See analysis", description: aiText, cost_range: "Varies", duration: "Varies", priority: "recommended" }] }],
        additional_tests: [], red_flags: [],
        recommendation: "This is a decision support suggestion.", disclaimer: "Clinical decision support only.", source: "gemini",
      });
    }
  } catch (err) {
    console.error("Gemini unavailable, using mock treatment:", err.message);
    res.json(MOCK.treatment);
  }
});

router.post("/smile/simulate", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT", "PATIENT"), upload.single("file"), async (req, res) => {
  try {
    const treatmentType = req.body.treatment_type || "whitening";
    const base64Image = req.file.buffer.toString("base64");
    const mimeType = req.file.mimetype || "image/jpeg";

    const treatmentLabels = {
      whitening: "professional teeth whitening",
      veneers: "porcelain veneers",
      alignment: "orthodontic alignment with clear aligners",
    };
    const treatmentDesc = treatmentLabels[treatmentType] || treatmentType;

    const aiText = await generateContent([
      { text: PROMPTS.smileSimulation },
      { text: `\n\nAnalyze this smile photo and simulate the expected results after ${treatmentDesc}. Provide current analysis, simulated result, procedure options, timeline, and maintenance advice in JSON format.` },
      { inlineData: { mimeType, data: base64Image } },
    ]);

    try {
      const result = parseAIJson(aiText);
      result.source = "gemini";
      result.treatment_type = treatmentType;
      res.json(result);
    } catch {
      res.json({
        current_analysis: { smile_score: 50, observations: [] },
        simulated_result: { smile_score: 80, description: aiText, changes: [] },
        procedures: [], disclaimer: "AI simulation.", source: "gemini", treatment_type: treatmentType,
      });
    }
  } catch (err) {
    console.error("Gemini unavailable, using mock smile:", err.message);
    res.json(MOCK.smile(req.body.treatment_type || "whitening"));
  }
});

module.exports = router;
