const express = require("express");
const router = express.Router();
const { auth, roleGuard } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { loyaltySchemas } = require("../lib/schemas");
const { computeTier, nextTier, pointsToNext } = require("../lib/tiers");
const { addPoints, getOrCreateLoyalty } = require("../lib/rewards");

function withNextTier(loyalty) {
  if (!loyalty) return null;
  const points = loyalty.points || 0;
  return {
    ...loyalty,
    tier: loyalty.tier || computeTier(points),
    nextTier: nextTier(points),
    pointsToNextTier: pointsToNext(points),
  };
}

router.get("/", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { patientId } = req.query;
    const where = patientId ? { patientId } : {};
    const points = await prisma.loyaltyPoints.findMany({
      where,
      include: {
        patient: { include: { user: { select: { name: true } } } },
        transactions: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    res.json(points.map(withNextTier));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/patient/:patientId", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { patientId } = req.params;

    if (req.user.role === "PATIENT") {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (!patient || patient.id !== patientId) {
        return res.status(403).json({ error: "You can only view your own rewards" });
      }
    }

    const points = await prisma.loyaltyPoints.findUnique({
      where: { patientId },
      include: {
        transactions: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    res.json(withNextTier(points));
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

    const points = await prisma.loyaltyPoints.findUnique({
      where: { patientId: patient.id },
      include: {
        transactions: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    res.json(withNextTier(points));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/earn", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), validate(loyaltySchemas.earn), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { patientId, amount, description } = req.body;
    await getOrCreateLoyalty(prisma, patientId);
    const updated = await addPoints(prisma, patientId, amount, description);
    res.json(withNextTier(updated));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
