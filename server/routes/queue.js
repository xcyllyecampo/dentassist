const express = require("express");
const { auth, roleGuard } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { queueSchemas } = require("../lib/schemas");
const { notifyAllStaff } = require("../lib/notify");

const router = express.Router();

const entryInclude = {
  patient: { include: { user: { select: { name: true, avatar: true } } } },
  dentist: { select: { name: true, avatar: true } },
};

router.get("/", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const where = { status: { in: ["WAITING", "IN_PROGRESS"] } };

    const { dentistId } = req.query;
    if (dentistId) {
      where.dentistId = dentistId;
    } else if (req.user.role === "DENTIST") {
      where.dentistId = req.user.id;
    }

    const entries = await prisma.queueEntry.findMany({
      where,
      include: entryInclude,
      orderBy: { position: "asc" },
    });
    res.json(entries);
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

    const entry = await prisma.queueEntry.findFirst({
      where: { patientId: patient.id, status: { in: ["WAITING", "IN_PROGRESS"] } },
      include: entryInclude,
      orderBy: { createdAt: "desc" },
    });
    res.json(entry || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

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

    const lastEntry = await prisma.queueEntry.findFirst({
      where: { status: "WAITING" },
      orderBy: { position: "desc" },
    });
    const position = (lastEntry?.position || 0) + 1;

    const waitingCount = await prisma.queueEntry.count({ where: { status: "WAITING" } });
    const estimatedWait = waitingCount * 30;

    const entry = await prisma.queueEntry.create({
      data: { patientId: patient.id, position, estimatedWait, dentistId: dentistId || null },
      include: entryInclude,
    });

    io.to("queue").emit("queue-update", entry);
    io.to("twin").emit("queue-update", { waitingCount: waitingCount + 1 });
    res.status(201).json(entry);
    notifyAllStaff(prisma, io, { type: "queue", message: `${entry.patient?.user?.name || "Patient"} joined the queue (position #${entry.position})` });
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

    const lastEntry = await prisma.queueEntry.findFirst({
      where: { status: "WAITING" },
      orderBy: { position: "desc" },
    });
    const position = (lastEntry?.position || 0) + 1;

    const waitingCount = await prisma.queueEntry.count({ where: { status: "WAITING" } });
    const estimatedWait = waitingCount * 30;

    const entry = await prisma.queueEntry.create({
      data: { patientId, position, estimatedWait, dentistId: dentistId || null },
      include: entryInclude,
    });

    io.to("queue").emit("queue-update", entry);
    io.to("twin").emit("queue-update", { waitingCount: waitingCount + 1 });
    res.status(201).json(entry);
    notifyAllStaff(prisma, io, { type: "queue", message: `${entry.patient?.user?.name || "Patient"} joined the queue (position #${entry.position})` });
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

    io.to("queue").emit("queue-update", entry);

    const waitingCount = await prisma.queueEntry.count({ where: { status: "WAITING" } });
    notifyAllStaff(prisma, io, { type: "queue", message: `${entry.patient?.user?.name || "Patient"} queue status: ${entry.status}` });
    io.to("twin").emit("queue-update", { waitingCount });

    res.json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", auth, roleGuard("ADMIN", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    await prisma.queueEntry.delete({ where: { id: req.params.id } });
    res.json({ message: "Queue entry removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
