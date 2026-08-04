const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const { auth, roleGuard } = require("../middleware/auth");
const { computeTier } = require("../lib/tiers");
const { notifyAllStaff } = require("../lib/notify");

const PERKS = {
  SILVER_WHITENING_KIT: { tier: "Silver", label: "Free Whitening Kit", capPerYear: 1 },
  GOLD_CLEANING: { tier: "Gold", label: "Free Cleaning", capPerYear: 6 },
  PLATINUM_XRAY: { tier: "Platinum", label: "Free 3D X-Ray", capPerYear: 1 },
};

const TIER_ORDER = ["Bronze", "Silver", "Gold", "Platinum"];

function eligiblePerks(tier) {
  const idx = TIER_ORDER.indexOf(tier);
  return Object.entries(PERKS)
    .filter(([, def]) => TIER_ORDER.indexOf(def.tier) <= idx && idx >= 0)
    .map(([key, def]) => ({ key, ...def }));
}

function yearStart() {
  const d = new Date();
  return new Date(d.getFullYear(), 0, 1);
}

async function resolvePatientId(prisma, req, bodyPatientId) {
  if (req.user.role === "PATIENT") {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return null;
    return patient.id;
  }
  return bodyPatientId;
}

async function perkSnapshot(prisma, patientId) {
  const loyalty = await prisma.loyaltyPoints.findUnique({ where: { patientId } });
  const points = loyalty?.points || 0;
  const tier = computeTier(points);

  const used = await prisma.perkUsage.findMany({
    where: {
      patientId,
      OR: [
        { status: "APPLIED", usedAt: { gte: yearStart() } },
        { status: "REQUESTED", expiresAt: { gt: new Date() } },
      ],
    },
  });

  const remaining = {};
  for (const [key, def] of Object.entries(PERKS)) {
    remaining[key] = def.capPerYear - used.filter((u) => u.perk === key).length;
  }

  const history = await prisma.perkUsage.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return { tier, points, perks: eligiblePerks(tier).map((p) => ({ ...p, remaining: Math.max(0, remaining[p.key]) })), history };
}

function generateClaimCode() {
  return String(crypto.randomInt(0, 10000)).padStart(4, "0");
}

async function expireOldClaims(prisma) {
  await prisma.perkUsage.updateMany({
    where: { status: "REQUESTED", expiresAt: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });
}

router.get("/my", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const patientId = await resolvePatientId(prisma, req, req.query.patientId);
    if (!patientId) return res.status(404).json({ error: "Patient profile not found" });
    const snapshot = await perkSnapshot(prisma, patientId);
    res.json(snapshot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/claim", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const io = req.app.get("io");
    const { perk, patientId: bodyPatientId } = req.body;

    if (!PERKS[perk]) return res.status(400).json({ error: "Unknown perk" });

    const patientId = await resolvePatientId(prisma, req, bodyPatientId);
    if (!patientId) return res.status(404).json({ error: "Patient profile not found" });

    const snapshot = await perkSnapshot(prisma, patientId);
    const match = snapshot.perks.find((p) => p.key === perk);
    if (!match) return res.status(403).json({ error: "Your rank is not eligible for this perk" });
    if (match.remaining <= 0) return res.status(400).json({ error: "No allowance left for this perk this year" });

    await expireOldClaims(prisma);

    let code = generateClaimCode();
    for (let i = 0; i < 5; i++) {
      const clash = await prisma.perkUsage.findFirst({ where: { claimCode: code, status: { in: ["REQUESTED", "APPLIED"] } } });
      if (!clash) break;
      code = generateClaimCode();
    }

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const claim = await prisma.perkUsage.create({
      data: { patientId, perk, status: "REQUESTED", claimCode: code, expiresAt: endOfDay },
    });

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: { select: { name: true } } },
    });
    notifyAllStaff(prisma, io, {
      type: "perk",
      message: `${patient?.user?.name || "Patient"} claimed: ${PERKS[perk].label} (code #${code})`,
    });

    res.status(201).json({ ...claim, perkLabel: PERKS[perk].label });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/claims", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    await expireOldClaims(prisma);
    const claims = await prisma.perkUsage.findMany({
      where: { status: "REQUESTED" },
      include: { patient: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "asc" },
    });
    res.json(claims.map((c) => ({ ...c, perkLabel: PERKS[c.perk]?.label || c.perk })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id/apply", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const claim = await prisma.perkUsage.update({
      where: { id: req.params.id },
      data: { status: "APPLIED", usedAt: new Date() },
    });
    res.json(claim);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
