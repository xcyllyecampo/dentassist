const express = require("express");
const { auth, roleGuard } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { dentistId } = req.query;
    const where = dentistId ? { userId: dentistId } : {};
    const schedules = await prisma.dentistSchedule.findMany({
      where,
      include: { user: { select: { id: true, name: true } } },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/dentist/:dentistId", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const schedules = await prisma.dentistSchedule.findMany({
      where: { userId: req.params.dentistId },
      orderBy: { dayOfWeek: "asc" },
    });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", auth, roleGuard("ADMIN"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { dentistId, dayOfWeek, startTime, endTime } = req.body;
    const schedule = await prisma.dentistSchedule.upsert({
      where: { userId_dayOfWeek: { userId: dentistId, dayOfWeek } },
      update: { startTime, endTime },
      create: { userId: dentistId, dayOfWeek, startTime, endTime },
      include: { user: { select: { id: true, name: true } } },
    });
    res.status(201).json(schedule);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", auth, roleGuard("ADMIN"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    await prisma.dentistSchedule.delete({ where: { id: req.params.id } });
    res.json({ message: "Schedule deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
