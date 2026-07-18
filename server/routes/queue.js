const express = require("express");
const { auth, roleGuard } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const entries = await prisma.queueEntry.findMany({
      where: { status: { in: ["WAITING", "IN_PROGRESS"] } },
      include: { patient: { include: { user: { select: { name: true } } } } },
      orderBy: { position: "asc" },
    });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/my-entry", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.json(null);

    const entry = await prisma.queueEntry.findFirst({
      where: { patientId: patient.id, status: { in: ["WAITING", "IN_PROGRESS"] } },
      include: { patient: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(entry || null);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/self-check-in", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const io = req.app.get("io");

    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ error: "Patient profile not found" });

    const existing = await prisma.queueEntry.findFirst({
      where: { patientId: patient.id, status: { in: ["WAITING", "IN_PROGRESS"] } },
    });
    if (existing) return res.status(400).json({ error: "You are already in the queue" });

    const lastEntry = await prisma.queueEntry.findFirst({
      where: { status: "WAITING" },
      orderBy: { position: "desc" },
    });
    const position = (lastEntry?.position || 0) + 1;

    const waitingCount = await prisma.queueEntry.count({ where: { status: "WAITING" } });
    const estimatedWait = waitingCount * 30;

    const entry = await prisma.queueEntry.create({
      data: { patientId: patient.id, position, estimatedWait },
      include: { patient: { include: { user: { select: { name: true } } } } },
    });

    io.to("queue").emit("queue-update", entry);
    io.to("twin").emit("queue-update", { waitingCount: waitingCount + 1 });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const io = req.app.get("io");
    const { patientId } = req.body;

    const lastEntry = await prisma.queueEntry.findFirst({
      where: { status: "WAITING" },
      orderBy: { position: "desc" },
    });
    const position = (lastEntry?.position || 0) + 1;

    const waitingCount = await prisma.queueEntry.count({ where: { status: "WAITING" } });
    const estimatedWait = waitingCount * 30;

    const entry = await prisma.queueEntry.create({
      data: { patientId, position, estimatedWait },
      include: { patient: { include: { user: { select: { name: true } } } } },
    });

    io.to("queue").emit("queue-update", entry);
    io.to("twin").emit("queue-update", { waitingCount: waitingCount + 1 });
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const io = req.app.get("io");
    const { status } = req.body;

    const entry = await prisma.queueEntry.update({
      where: { id: req.params.id },
      data: { status },
      include: { patient: { include: { user: { select: { name: true } } } } },
    });

    io.to("queue").emit("queue-update", entry);

    const waitingCount = await prisma.queueEntry.count({ where: { status: "WAITING" } });
    io.to("twin").emit("queue-update", { waitingCount });

    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", auth, roleGuard("ADMIN", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    await prisma.queueEntry.delete({ where: { id: req.params.id } });
    res.json({ message: "Queue entry removed" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
