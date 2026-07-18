const express = require("express");
const { auth } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `ai-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const MOCK_RESPONSES = {
  chat: (message) => ({
    response: `I'm DentAssist AI (Demo Mode). Based on your query about "${message.slice(0, 50)}", here's what I can tell you:\n\n- The clinic currently has patients in queue\n- Room availability looks good for today\n- For specific clinical advice, please consult with the attending dentist.\n\nNote: The AI service is running in demo mode. Connect OpenAI for full AI-powered responses.`,
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
          { name: "Composite Filling", description: "Tooth-colored resin filling to restore the damaged tooth structure.", cost_range: "₱800 - ₱2,500", duration: "30-45 min", priority: "recommended" },
          { name: "Dental Crown", description: "Full coverage crown (PFM or zirconia) for extensively damaged teeth.", cost_range: "₱8,000 - ₱20,000", duration: "2 visits", priority: "alternative" },
        ],
      },
      {
        name: "Gingivitis",
        treatments: [
          { name: "Professional Cleaning", description: "Deep cleaning (scaling and root planing) to remove tartar and bacteria.", cost_range: "₱500 - ₱1,500", duration: "60-90 min", priority: "recommended" },
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
      description: `With ${treatmentType} treatment, your smile could improve significantly. Expected results include brighter, more uniform tooth appearance with enhanced symmetry.`,
      estimated_shade_change: treatmentType === "whitening" ? "4-6 shades lighter" : "Customized to match natural tooth color",
      changes: treatmentType === "whitening"
        ? ["Brighter, whiter teeth", "More uniform color across all teeth", "Removal of surface stains"]
        : treatmentType === "veneers"
        ? ["Perfect tooth shape and symmetry", "Natural-looking porcelain finish", "Instant smile transformation"]
        : ["Straighter tooth alignment", "Improved bite correction", "Gradual movement over treatment period"],
    },
    procedures: [
      { name: treatmentType === "whitening" ? "Professional Teeth Whitening" : treatmentType === "veneers" ? "Porcelain Veneers" : "Orthodontic Alignment", description: `Professional ${treatmentType} treatment tailored to your needs.`, cost: treatmentType === "whitening" ? "₱5,000 - ₱12,000" : treatmentType === "veneers" ? "₱12,000 - ₱35,000/tooth" : "₱25,000 - ₱55,000", duration: treatmentType === "whitening" ? "1-2 hours" : treatmentType === "veneers" ? "2-3 visits" : "12-18 months" },
    ],
    timeline: treatmentType === "whitening" ? "Results visible immediately. Full effect within 48 hours." : treatmentType === "veneers" ? "Completed in 2-3 visits over 2-3 weeks." : "Gradual improvement over 12-18 months with regular check-ups.",
    maintenance: "Maintain good oral hygiene. Avoid staining foods for 48h after whitening. Regular dental check-ups every 6 months.",
    disclaimer: "This is an AI-generated simulation for demonstration purposes. Actual results may vary. A licensed dentist must evaluate before any treatment.",
    source: "mock",
  }),
};

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

router.post("/chat", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { message, history } = req.body;

    const clinicContext = await getClinicContext(prisma);

    const response = await fetch(`${AI_SERVICE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        history: history || [],
        context: clinicContext,
      }),
    });
    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.log("AI service unavailable, using mock chat response");
    res.json(MOCK_RESPONSES.chat(req.body.message || ""));
  }
});

router.post("/xray/analyze", auth, upload.single("file"), async (req, res) => {
  try {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(req.file.path);
    const blob = new Blob([fileBuffer], { type: req.file.mimetype });
    formData.append("file", blob, req.file.originalname);

    const response = await fetch(`${AI_SERVICE_URL}/analyze/xray`, {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.log("AI service unavailable, using mock xray analysis");
    res.json(MOCK_RESPONSES.xray);
  }
});

router.post("/oral/screen", auth, upload.single("file"), async (req, res) => {
  try {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(req.file.path);
    const blob = new Blob([fileBuffer], { type: req.file.mimetype });
    formData.append("file", blob, req.file.originalname);

    const response = await fetch(`${AI_SERVICE_URL}/screen/oral`, {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.log("AI service unavailable, using mock oral screening");
    res.json(MOCK_RESPONSES.oral);
  }
});

router.post("/treatment/suggest", auth, async (req, res) => {
  try {
    const { symptoms, examination_findings, patient_age, patient_gender, medical_history } = req.body;
    const response = await fetch(`${AI_SERVICE_URL}/treatment/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms, examination_findings, patient_age, patient_gender, medical_history }),
    });
    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.log("AI service unavailable, using mock treatment suggestions");
    res.json(MOCK_RESPONSES.treatment);
  }
});

router.post("/smile/simulate", auth, upload.single("file"), async (req, res) => {
  try {
    const treatmentType = req.body.treatment_type || "whitening";
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(req.file.path);
    const blob = new Blob([fileBuffer], { type: req.file.mimetype });
    formData.append("file", blob, req.file.originalname);
    formData.append("treatment_type", treatmentType);

    const response = await fetch(`${AI_SERVICE_URL}/smile/simulate?treatment_type=${treatmentType}`, {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.log("AI service unavailable, using mock smile simulation");
    res.json(MOCK_RESPONSES.smile(req.body.treatment_type || "whitening"));
  }
});

module.exports = router;
