const express = require("express");
const router = express.Router();
const { auth, roleGuard } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { badgeSchemas } = require("../lib/schemas");
const { computeTier } = require("../lib/tiers");
const { notifyPatient } = require("../lib/notify");

router.get("/", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const badges = await prisma.badge.findMany({ orderBy: { name: "asc" } });
    res.json(badges);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/patient/:patientId", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");

    if (req.user.role === "PATIENT") {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (!patient || patient.id !== req.params.patientId) {
        return res.status(403).json({ error: "You can only view your own badges" });
      }
    }

    const earned = await prisma.patientBadge.findMany({
      where: { patientId: req.params.patientId },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    });
    res.json(earned);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/my", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ error: "Patient profile not found" });
    const earned = await prisma.patientBadge.findMany({
      where: { patientId: patient.id },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    });
    res.json(earned);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/award", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), validate(badgeSchemas.award), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const io = req.app.get("io");
    const { patientId, badgeId } = req.body;

    const existing = await prisma.patientBadge.findUnique({
      where: { patientId_badgeId: { patientId, badgeId } },
    });
    if (existing) return res.json(existing);

    const badge = await prisma.badge.findUnique({ where: { id: badgeId } });
    if (!badge) return res.status(404).json({ error: "Badge not found" });

    const result = await prisma.$transaction(async (tx) => {
      const patientBadge = await tx.patientBadge.create({
        data: { patientId, badgeId },
        include: { badge: true },
      });

      let loyalty = await tx.loyaltyPoints.findUnique({ where: { patientId } });
      if (!loyalty) {
        loyalty = await tx.loyaltyPoints.create({
          data: { patientId, points: 0, tier: "Bronze" },
        });
      }
      const newTotal = loyalty.points + badge.points;
      await tx.loyaltyPoints.update({
        where: { id: loyalty.id },
        data: {
          points: newTotal,
          tier: computeTier(newTotal),
          transactions: { create: { amount: badge.points, description: `Badge earned: ${badge.name}`, type: "EARNED" } },
        },
      });

      return patientBadge;
    });

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
    if (patient) {
      await notifyPatient(prisma, io, patient.userId, {
        type: "badge",
        message: `You earned the "${result.badge.name}" badge (+${result.badge.points} pts)!`,
      });
      if (patient.user.email) {
        const { sendBadgeEmail } = require("../lib/mailer");
        sendBadgeEmail(patient.user.email, patient.user.name || "Patient", result.badge.name, result.badge.points);
      }
    }

    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
