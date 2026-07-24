const express = require("express");
const router = express.Router();
const { auth, roleGuard } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { badgeSchemas } = require("../lib/schemas");

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

router.post("/award", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), validate(badgeSchemas.award), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
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
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
