const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { auth } = require("../middleware/auth");
const prisma = new PrismaClient();

router.get("/", auth, async (req, res) => {
  try {
    const { patientId } = req.query;
    const where = patientId ? { patientId } : {};
    const points = await prisma.loyaltyPoints.findMany({
      where,
      include: {
        patient: { include: { user: { select: { name: true } } } },
        transactions: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    res.json(points);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/patient/:patientId", auth, async (req, res) => {
  try {
    let points = await prisma.loyaltyPoints.findUnique({
      where: { patientId: req.params.patientId },
      include: {
        transactions: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });
    if (!points) {
      points = await prisma.loyaltyPoints.create({
        data: { patientId: req.params.patientId, points: 0, tier: "Bronze" },
        include: { transactions: true },
      });
    }
    res.json(points);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/earn", auth, async (req, res) => {
  try {
    const { patientId, amount, description } = req.body;
    let loyalty = await prisma.loyaltyPoints.findUnique({ where: { patientId } });
    if (!loyalty) {
      loyalty = await prisma.loyaltyPoints.create({ data: { patientId, points: 0, tier: "Bronze" } });
    }
    const newTotal = loyalty.points + amount;
    let tier = "Bronze";
    if (newTotal >= 500) tier = "Platinum";
    else if (newTotal >= 200) tier = "Gold";
    else if (newTotal >= 50) tier = "Silver";

    const updated = await prisma.loyaltyPoints.update({
      where: { id: loyalty.id },
      data: {
        points: newTotal,
        tier,
        transactions: { create: { amount, description, type: "EARNED" } },
      },
      include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } },
    });
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
