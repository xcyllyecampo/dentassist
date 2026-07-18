const express = require("express");
const { auth } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { tryAwardBadge } = require("../utils/badges");

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `ai-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

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
    console.error("AI service error:", err.message);
    res.status(500).json({ error: "AI service unavailable", details: err.message });
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
    console.error("AI service error:", err.message);
    res.status(500).json({ error: "AI service unavailable", details: err.message });
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
    console.error("AI service error:", err.message);
    res.status(500).json({ error: "AI service unavailable", details: err.message });
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
    console.error("AI service error:", err.message);
    res.status(500).json({ error: "AI service unavailable", details: err.message });
  }
});

router.post("/smile/simulate", auth, upload.single("file"), async (req, res) => {
  try {
    const patientId = req.body.patientId;
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
    if (patientId) tryAwardBadge(req.app.get("prisma"), patientId, "Smile Explorer");
    res.json(result);
  } catch (err) {
    console.error("AI service error:", err.message);
    res.status(500).json({ error: "AI service unavailable", details: err.message });
  }
});

module.exports = router;
