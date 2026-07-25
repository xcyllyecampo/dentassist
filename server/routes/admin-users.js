const express = require("express");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { auth, roleGuard } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { adminUserSchemas } = require("../lib/schemas");
const { notifyAllStaff } = require("../lib/notify");
const { uploadFile, deleteFile, getPublicUrl } = require("../lib/storage");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.get("/", auth, roleGuard("ADMIN"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { role, search } = req.query;
    const where = {};
    if (role && role !== "ALL") where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, role: true, phone: true, avatar: true, active: true,
        lastEditedBy: true, lastEditedAt: true,
        patient: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", auth, roleGuard("ADMIN"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, email: true, role: true, phone: true, avatar: true, active: true,
        patient: true,
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", auth, roleGuard("ADMIN"), upload.single("avatar"), validate(adminUserSchemas.create), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { name, email, password, role, phone, dob, gender, bloodType } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password || crypto.randomBytes(4).toString('hex'), 10);

    let avatarUrl = null;
    if (req.file) {
      const filename = `avatar-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
      await uploadFile(req.file.buffer, filename, req.file.mimetype);
      avatarUrl = getPublicUrl(filename);
    }

    const user = await prisma.user.create({
      data: { email, password: hashed, name, role, phone, avatar: avatarUrl },
      select: { id: true, name: true, email: true, role: true, phone: true, avatar: true },
    });

    let patient;
    if (role === "PATIENT") {
      patient = await prisma.patient.create({
        data: { userId: user.id, dob: dob ? new Date(dob) : new Date("1990-01-01"), gender: gender || "Unknown", bloodType },
      });
      const defaultTeeth = Array.from({ length: 32 }, (_, i) => ({
        patientId: patient.id, toothNumber: i + 1, status: "HEALTHY",
      }));
      await prisma.tooth.createMany({ data: defaultTeeth });
    }

    const io = req.app.get("io");
    notifyAllStaff(prisma, io, { type: "patient", message: `New ${role.toLowerCase()} added: ${name}` });

    res.status(201).json({ ...user, patient: patient ? { id: patient.id, dob: patient.dob, gender: patient.gender, bloodType: patient.bloodType } : null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", auth, roleGuard("ADMIN"), upload.single("avatar"), validate(adminUserSchemas.update), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { name, email, role, phone, dob, gender, bloodType, password } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    if (req.file) {
      const filename = `avatar-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
      await uploadFile(req.file.buffer, filename, req.file.mimetype);
      updateData.avatar = getPublicUrl(filename);
    }
    updateData.lastEditedBy = req.user.name;
    updateData.lastEditedAt = new Date();

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, phone: true, avatar: true, active: true, lastEditedBy: true, lastEditedAt: true },
    });

    if (role && role !== "PATIENT") {
      const existingPatient = await prisma.patient.findUnique({ where: { userId: user.id } });
      if (existingPatient) {
        await prisma.tooth.deleteMany({ where: { patientId: existingPatient.id } });
        await prisma.patient.delete({ where: { userId: user.id } });
      }
    } else if (user.role === "PATIENT") {
      const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
      if (patient) {
        const patientUpdate = {};
        if (dob) patientUpdate.dob = new Date(dob);
        if (gender) patientUpdate.gender = gender;
        if (bloodType) patientUpdate.bloodType = bloodType;
        if (Object.keys(patientUpdate).length > 0) {
          await prisma.patient.update({ where: { userId: user.id }, data: patientUpdate });
        }
      }
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id/toggle-active", auth, roleGuard("ADMIN"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.id === req.user.id) return res.status(400).json({ error: "Cannot deactivate your own account" });

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { active: !user.active },
      select: { id: true, name: true, email: true, role: true, phone: true, avatar: true, active: true },
    });

    if (!user.active) {
      await prisma.refreshToken.deleteMany({ where: { userId: req.params.id } });
    }

    const io = req.app.get("io");
    notifyAllStaff(prisma, io, { type: "staff", message: `${updated.name} has been ${updated.active ? "activated" : "deactivated"}` });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", auth, roleGuard("ADMIN"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.id === req.user.id) return res.status(400).json({ error: "Cannot delete your own account" });

    if (user.role === "DENTIST") {
      return res.status(403).json({ error: "Dentists cannot be deleted. Use the deactivate button instead." });
    }

    if (user.role === "PATIENT") {
      const patient = await prisma.patient.findUnique({ where: { userId: user.id }, include: { xrayImages: { select: { filePath: true } } } });
      if (patient) {
        await prisma.appointment.updateMany({
          where: { patientId: patient.id, status: { in: ["SCHEDULED", "CONFIRMED"] } },
          data: { status: "CANCELLED" },
        });
        await prisma.queueEntry.updateMany({
          where: { patientId: patient.id, status: { in: ["WAITING", "IN_PROGRESS"] } },
          data: { status: "CANCELLED" },
        });
        for (const img of patient.xrayImages) {
          try { if (img.filePath) await deleteFile(img.filePath); } catch {}
        }
      }
    }

    if (user.avatar) {
      try { await deleteFile(user.avatar); } catch {}
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
