const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { auth } = require("../middleware/auth");
const prisma = new PrismaClient();

router.get("/", auth, async (req, res) => {
  try {
    const badges = await prisma.badge.findMany({ orderBy: { name: "asc" } });
    res.json(badges);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/patient/:patientId", auth, async (req, res) => {
  try {
    const earned = await prisma.patientBadge.findMany({
      where: { patientId: req.params.patientId },
      include: { badge: true },
      orderBy: { earnedAt: "desc" },
    });
    res.json(earned);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/award", auth, async (req, res) => {
  try {
    const { patientId, badgeId } = req.body;
    const existing = await prisma.patientBadge.findUnique({
      where: { patientId_badgeId: { patientId, badgeId } },
    });
    if (existing) return res.json(existing);

    const badge = await prisma.badge.findUnique({ where: { id: badgeId } });
    if (!badge) return res.status(404).json({ error: "Badge not found" });

    const patientBadge = await prisma.patientBadge.create({
      data: { patientId, badgeId },
      include: { badge: true },
    });

    await prisma.loyaltyPoints.upsert({
      where: { patientId },
      create: { patientId, points: badge.threshold * 10, tier: "Bronze" },
      update: { points: { increment: badge.threshold * 10 } },
    });

    res.json(patientBadge);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
