const express = require("express");
const { auth, roleGuard } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { date, dentistId } = req.query;
    const where = {};
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      where.date = { gte: start, lt: end };
    }
    if (dentistId) where.dentistId = dentistId;

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: { include: { user: { select: { name: true } } } },
        dentist: { select: { name: true } },
        room: true,
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } },
        dentist: { select: { name: true, email: true } },
        room: true,
        treatments: true,
      },
    });
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", auth, roleGuard("ADMIN", "ASSISTANT", "DENTIST"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const io = req.app.get("io");
    const { patientId, dentistId, roomId, date, time, duration, reason, notes } = req.body;

    const appointment = await prisma.appointment.create({
      data: { patientId, dentistId, roomId, date: new Date(date), time, duration: duration || 30, reason, notes },
      include: {
        patient: { include: { user: { select: { name: true } } } },
        dentist: { select: { name: true } },
        room: true,
      },
    });

    if (roomId) {
      await prisma.room.update({ where: { id: roomId }, data: { status: "OCCUPIED" } });
      io.to("twin").emit("room-update", { roomId, status: "OCCUPIED" });
    }

    io.to("queue").emit("appointment-update", appointment);
    res.status(201).json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const io = req.app.get("io");
    const { status, roomId, notes } = req.body;

    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status, roomId, notes },
      include: {
        patient: { include: { user: { select: { name: true } } } },
        dentist: { select: { name: true } },
        room: true,
      },
    });

    if (status === "COMPLETED" || status === "CANCELLED") {
      if (appointment.roomId) {
        await prisma.room.update({ where: { id: appointment.roomId }, data: { status: "CLEANING" } });
        io.to("twin").emit("room-update", { roomId: appointment.roomId, status: "CLEANING" });
        setTimeout(async () => {
          await prisma.room.update({ where: { id: appointment.roomId }, data: { status: "AVAILABLE" } });
          io.to("twin").emit("room-update", { roomId: appointment.roomId, status: "AVAILABLE" });
        }, 300000);
      }
    }

    io.to("queue").emit("appointment-update", appointment);
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", auth, roleGuard("ADMIN", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    await prisma.appointment.delete({ where: { id: req.params.id } });
    res.json({ message: "Appointment deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
