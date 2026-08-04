const express = require("express");
const { auth, roleGuard } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { queueSchemas } = require("../lib/schemas");
const { notifyAllStaff } = require("../lib/notify");
const { computeTier } = require("../lib/tiers");

const router = express.Router();

const entryInclude = {
  patient: {
    include: {
      user: { select: { name: true, avatar: true } },
      loyaltyPoints: { select: { tier: true, points: true } },
    },
  },
  dentist: { select: { name: true, avatar: true } },
};

function rankEntries(entries) {
  const active = entries.filter((e) => e.status === "WAITING" || e.status === "IN_PROGRESS");
  const ranked = [...active].sort((a, b) => {
    const aPlat = computeTier(a.patient?.loyaltyPoints?.points || 0) === "Platinum" ? 1 : 0;
    const bPlat = computeTier(b.patient?.loyaltyPoints?.points || 0) === "Platinum" ? 1 : 0;
    if (aPlat !== bPlat) return bPlat - aPlat;
    return (a.position || 0) - (b.position || 0);
  });
  const posMap = new Map(ranked.map((e, i) => [e.id, i + 1]));
  return entries.map((e) => {
    const effectivePosition = posMap.get(e.id) || null;
    const isPlatinum = computeTier(e.patient?.loyaltyPoints?.points || 0) === "Platinum";
    return {
      ...e,
      effectivePosition,
      isPlatinum,
      estimatedWait: e.status === "WAITING" && effectivePosition ? (effectivePosition - 1) * 30 : e.estimatedWait,
    };
  });
}

async function getQueueView(prisma, where) {
  const entries = await prisma.queueEntry.findMany({
    where: { status: { in: ["WAITING", "IN_PROGRESS"] }, ...where },
    include: entryInclude,
    orderBy: { position: "asc" },
  });
  return rankEntries(entries);
}

async function nextPosition(prisma) {
  const lastEntry = await prisma.queueEntry.findFirst({
    where: { status: "WAITING" },
    orderBy: { position: "desc" },
  });
  return (lastEntry?.position || 0) + 1;
}

router.get("/", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { dentistId } = req.query;
    const where = {};
    if (dentistId) {
      where.dentistId = dentistId;
    } else if (req.user.role === "DENTIST") {
      where.dentistId = req.user.id;
    }
    const view = await getQueueView(prisma, where);
    res.json(view);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/my-entry", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.json(null);

    const view = await getQueueView(prisma, {});
    const entry = view.find((e) => e.patientId === patient.id) || null;
    res.json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

async function createEntry(prisma, io, { patientId, dentistId }, req, res) {
  const position = await nextPosition(prisma);
  const waitingCount = await prisma.queueEntry.count({ where: { status: "WAITING" } });
  const estimatedWait = waitingCount * 30;

  const entry = await prisma.queueEntry.create({
    data: { patientId, position, estimatedWait, dentistId: dentistId || null },
    include: entryInclude,
  });

  const view = rankEntries([entry]);
  const enriched = view[0];

  io.to("queue").emit("queue-update", { updated: true });
  io.to("twin").emit("queue-update", { waitingCount: waitingCount + 1 });

  notifyAllStaff(prisma, io, {
    type: "queue",
    message: `${enriched.patient?.user?.name || "Patient"} joined the queue (position #${enriched.effectivePosition || position})`,
  });

  res.status(201).json(enriched);
}

router.post("/self-check-in", auth, validate(queueSchemas.selfCheckIn), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const io = req.app.get("io");
    const { dentistId } = req.body;

    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ error: "Patient profile not found" });

    const existing = await prisma.queueEntry.findFirst({
      where: { patientId: patient.id, status: { in: ["WAITING", "IN_PROGRESS"] } },
    });
    if (existing) return res.status(400).json({ error: "You are already in the queue" });

    await createEntry(prisma, io, { patientId: patient.id, dentistId }, req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), validate(queueSchemas.create), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const io = req.app.get("io");
    const { patientId, dentistId } = req.body;
    await createEntry(prisma, io, { patientId, dentistId }, req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), validate(queueSchemas.update), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const io = req.app.get("io");
    const { status } = req.body;

    const entry = await prisma.queueEntry.update({
      where: { id: req.params.id },
      data: { status },
      include: entryInclude,
    });

    const view = rankEntries([entry]);
    io.to("queue").emit("queue-update", { updated: true });

    const waitingCount = await prisma.queueEntry.count({ where: { status: "WAITING" } });
    notifyAllStaff(prisma, io, { type: "queue", message: `${entry.patient?.user?.name || "Patient"} queue status: ${entry.status}` });
    io.to("twin").emit("queue-update", { waitingCount });

    res.json(view[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", auth, roleGuard("ADMIN", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const io = req.app.get("io");
    await prisma.queueEntry.delete({ where: { id: req.params.id } });
    const waitingCount = await prisma.queueEntry.count({ where: { status: "WAITING" } });
    io.to("queue").emit("queue-update", { updated: true });
    io.to("twin").emit("queue-update", { waitingCount });
    res.json({ message: "Queue entry removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
