const express = require("express");
const crypto = require("crypto");
const { auth, roleGuard } = require("../middleware/auth");
const { deleteFile } = require("../lib/storage");
const validate = require("../middleware/validate");
const { patientSchemas } = require("../lib/schemas");
const { notifyAllStaff } = require("../lib/notify");

const router = express.Router();

router.get("/me", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id },
      include: {
        user: { select: { name: true, email: true, phone: true, avatar: true } },
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
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const patients = await prisma.patient.findMany({
      include: { user: { select: { name: true, email: true, phone: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(patients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true, email: true, phone: true, avatar: true } },
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
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", auth, roleGuard("ADMIN", "ASSISTANT", "DENTIST"), validate(patientSchemas.create), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { name, email, phone, dob, gender, bloodType, address, allergies, medicalHistory, emergencyContact, insuranceInfo } = req.body;
    const bcrypt = require("bcryptjs");

    const tempPassword = crypto.randomBytes(12).toString("base64url");
    const hashed = await bcrypt.hash(tempPassword, 10);
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
      include: { user: { select: { name: true, email: true, phone: true, avatar: true } } },
    });

    const defaultTeeth = Array.from({ length: 32 }, (_, i) => ({
      patientId: patient.id,
      toothNumber: i + 1,
      status: "HEALTHY",
    }));
    await prisma.tooth.createMany({ data: defaultTeeth });

    const io = req.app.get("io");
    notifyAllStaff(prisma, io, { type: "patient", message: `New patient registered: ${patient.user?.name || name}` });

    res.status(201).json({ ...patient, tempPassword });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", auth, roleGuard("ADMIN", "ASSISTANT", "DENTIST"), validate(patientSchemas.update), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { dob, gender, bloodType, address, allergies, medicalHistory, emergencyContact, insuranceInfo } = req.body;

    const patient = await prisma.patient.update({
      where: { id: req.params.id },
      data: { dob: dob ? new Date(dob) : undefined, gender, bloodType, address, allergies, medicalHistory, emergencyContact, insuranceInfo },
      include: { user: { select: { name: true, email: true, phone: true, avatar: true } } },
    });
    res.json(patient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", auth, roleGuard("ADMIN"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const patient = await prisma.patient.findUnique({
      where: { id: req.params.id },
      include: { xrayImages: { select: { filePath: true } }, user: { select: { avatar: true } } },
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    for (const img of patient.xrayImages) {
      try { if (img.filePath) await deleteFile(img.filePath); } catch {}
    }
    if (patient.user?.avatar) {
      try { await deleteFile(patient.user.avatar); } catch {}
    }

    await prisma.user.delete({ where: { id: patient.userId } });
    res.json({ message: "Patient deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:patientId/teeth/:toothNumber", auth, roleGuard("DENTIST", "ADMIN"), validate(patientSchemas.updateTooth), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { status, notes } = req.body;
    const tooth = await prisma.tooth.upsert({
      where: { patientId_toothNumber: { patientId: req.params.patientId, toothNumber: parseInt(req.params.toothNumber) } },
      update: { ...(status !== undefined && { status }), ...(notes !== undefined && { notes }) },
      create: { patientId: req.params.patientId, toothNumber: parseInt(req.params.toothNumber), status: status || "HEALTHY", notes },
    });
    res.json(tooth);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

