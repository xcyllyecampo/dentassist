const express = require("express");
const { auth, roleGuard } = require("../middleware/auth");

const router = express.Router();

router.get("/month", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { year, month } = req.query;
    if (!year || !month) return res.status(400).json({ error: "Year and month are required" });
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const appointments = await prisma.appointment.findMany({
      where: { date: { gte: start, lte: end } },
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

router.get("/available-slots", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "Date is required" });
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const booked = await prisma.appointment.findMany({
      where: { date: { gte: start, lt: end }, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
      select: { time: true, dentistId: true, roomId: true },
    });

    const allSlots = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'];
    const bookedTimes = [...new Set(booked.map(b => b.time))];
    const availableSlots = allSlots.filter(t => !bookedTimes.includes(t));

    const dentists = await prisma.user.findMany({ where: { role: "DENTIST" }, select: { id: true, name: true } });
    const rooms = await prisma.room.findMany({ where: { status: { not: "MAINTENANCE" } }, select: { id: true, number: true, name: true, status: true } });

    res.json({ availableSlots, dentists, rooms, booked });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

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

router.get("/my", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.json([]);

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        patient: { include: { user: { select: { name: true } } } },
        dentist: { select: { name: true } },
        room: true,
      },
      orderBy: [{ date: "desc" }, { time: "asc" }],
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

router.post("/", auth, async (req, res) => {
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

router.put("/:id", auth, roleGuard("ADMIN", "ASSISTANT", "DENTIST"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const io = req.app.get("io");
    const { status, roomId, notes, date, time, duration, reason } = req.body;

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (roomId !== undefined) updateData.roomId = roomId || null;
    if (notes !== undefined) updateData.notes = notes;
    if (date !== undefined) updateData.date = new Date(date);
    if (time !== undefined) updateData.time = time;
    if (duration !== undefined) updateData.duration = duration;
    if (reason !== undefined) updateData.reason = reason;

    const appointment = await prisma.appointment.update({
      where: { id: req.params.id },
      data: updateData,
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
