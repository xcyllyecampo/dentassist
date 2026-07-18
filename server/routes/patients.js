const express = require("express");
const { auth, roleGuard } = require("../middleware/auth");

const router = express.Router();

router.get("/me", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        teeth: { orderBy: { toothNumber: "asc" } },
        appointments: { orderBy: { date: "desc" }, take: 10 },
        treatments: { orderBy: { createdAt: "desc" }, take: 10 },
        prescriptions: { orderBy: { createdAt: "desc" }, take: 10 },
        xrayImages: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
    if (!patient) return res.status(404).json({ error: "Patient profile not found" });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const patients = await prisma.patient.findMany({
      include: { user: { select: { name: true, email: true, phone: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        teeth: { orderBy: { toothNumber: "asc" } },
        appointments: { orderBy: { date: "desc" }, take: 10 },
        treatments: { orderBy: { createdAt: "desc" }, take: 10 },
        prescriptions: { orderBy: { createdAt: "desc" }, take: 10 },
        xrayImages: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", auth, roleGuard("ADMIN", "ASSISTANT", "DENTIST"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { name, email, phone, dob, gender, bloodType, address, allergies, medicalHistory, emergencyContact, insuranceInfo } = req.body;
    const bcrypt = require("bcryptjs");

    const hashed = await bcrypt.hash("password123", 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role: "PATIENT", phone },
    });

    const patient = await prisma.patient.create({
      data: {
        userId: user.id,
        dob: new Date(dob),
        gender,
        bloodType,
        address,
        allergies,
        medicalHistory,
        emergencyContact,
        insuranceInfo,
      },
      include: { user: { select: { name: true, email: true, phone: true } } },
    });

    const defaultTeeth = Array.from({ length: 32 }, (_, i) => ({
      patientId: patient.id,
      toothNumber: i + 1,
      status: "HEALTHY",
    }));
    await prisma.tooth.createMany({ data: defaultTeeth });

    res.status(201).json(patient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", auth, roleGuard("ADMIN", "ASSISTANT", "DENTIST"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { dob, gender, bloodType, address, allergies, medicalHistory, emergencyContact, insuranceInfo } = req.body;

    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: { dob: dob ? new Date(dob) : undefined, gender, bloodType, address, allergies, medicalHistory, emergencyContact, insuranceInfo },
      include: { user: { select: { name: true, email: true, phone: true } } },
    });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", auth, roleGuard("ADMIN"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const patient = await prisma.patient.findUnique({ where: { id: req.params.id } });
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    await prisma.user.delete({ where: { id: patient.userId } });
    res.json({ message: "Patient deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
