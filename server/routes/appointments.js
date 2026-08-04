const VALID_APPOINTMENT_STATUSES = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"];

const express = require("express");
const { auth, roleGuard } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { appointmentSchemas } = require("../lib/schemas");
const { notifyAllStaff } = require("../lib/notify");
const { rewardVisit } = require("../lib/rewards");
const { sendVisitCompletedEmail } = require("../lib/mailer");

const roomsAwaitingCleanup = new Map();

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
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/available-slots", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { date, dentistId } = req.query;
    if (!date) return res.status(400).json({ error: "Date is required" });
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const booked = await prisma.appointment.findMany({
      where: {
        date: { gte: start, lt: end },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        ...(dentistId ? { dentistId } : {}),
      },
      select: { time: true, dentistId: true, roomId: true },
    });

    const allSlots = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30'];
    const bookedTimes = [...new Set(booked.map(b => b.time))];
    const availableSlots = allSlots.filter(t => !bookedTimes.includes(t));

    const dentists = await prisma.user.findMany({ where: { role: "DENTIST" }, select: { id: true, name: true, avatar: true } });
    const rooms = await prisma.room.findMany({ where: { status: { not: "MAINTENANCE" } }, select: { id: true, number: true, name: true, status: true } });

    res.json({ availableSlots, dentists, rooms, booked });
  } catch (err) {
    console.error(err);
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
    console.error(err);
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
    console.error(err);
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
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id/check-in", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const io = req.app.get("io");

    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { patient: true },
    });
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });

    if (req.user.role === "PATIENT" && appointment.patient?.userId !== req.user.id)
      return res.status(403).json({ error: "You can only check in to your own appointment" });

    if (appointment.status !== "SCHEDULED" && appointment.status !== "CONFIRMED")
      return res.status(400).json({ error: "Appointment cannot be checked in at this stage" });

    let roomId = appointment.roomId;
    if (!roomId) {
      const availableRoom = await prisma.room.findFirst({
        where: { status: "AVAILABLE" },
        orderBy: { number: "asc" },
      });
      if (availableRoom) {
        roomId = availableRoom.id;
        await prisma.room.update({ where: { id: roomId }, data: { status: "OCCUPIED" } });
        io.to("twin").emit("room-update", { roomId, status: "OCCUPIED" });
      }
    }

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: "IN_PROGRESS", roomId },
      include: {
        patient: { include: { user: { select: { name: true, avatar: true } } } },
        dentist: { select: { name: true } },
        room: true,
      },
    });

    let queueEntry = null;
    const existingQueue = await prisma.queueEntry.findFirst({
      where: { patientId: appointment.patientId, status: { in: ["WAITING", "IN_PROGRESS"] } },
    });
    if (!existingQueue) {
      const lastEntry = await prisma.queueEntry.findFirst({
        where: { status: "WAITING" },
        orderBy: { position: "desc" },
      });
      const position = (lastEntry?.position || 0) + 1;
      const waitingCount = await prisma.queueEntry.count({ where: { status: "WAITING" } });
      const estimatedWait = waitingCount * 30;
      queueEntry = await prisma.queueEntry.create({
        data: { patientId: appointment.patientId, position, estimatedWait, dentistId: appointment.dentistId, status: "IN_PROGRESS" },
        include: { patient: { include: { user: { select: { name: true, avatar: true } } } }, dentist: { select: { name: true } } },
      });
      io.to("queue").emit("queue-update", queueEntry);
      io.to("twin").emit("queue-update", { waitingCount: waitingCount + 1 });
    }

    notifyAllStaff(prisma, io, {
      type: "appointment",
      message: `${updated.patient?.user?.name || "Patient"} checked in for their appointment`,
    });

    res.json({ appointment: updated, queueEntry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", auth, validate(appointmentSchemas.create), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const io = req.app.get("io");
    let { patientId, dentistId, roomId, date, time, duration, reason, notes } = req.body;

    if (req.user.role === "PATIENT") {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (!patient) return res.status(400).json({ error: "Patient profile not found" });
      patientId = patient.id;

      if (!dentistId) {
        const availableDentist = await prisma.user.findFirst({ where: { role: "DENTIST" }, select: { id: true } });
        if (availableDentist) dentistId = availableDentist.id;
      }
    }

    const apptDuration = duration || 30;
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const existing = await prisma.appointment.findMany({
      where: {
        date: { gte: start, lt: end },
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        OR: [
          { dentistId },
          ...(roomId ? [{ roomId }] : []),
        ],
      },
      select: { time: true, duration: true, dentistId: true, roomId: true },
    });

    const timeToMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    const newStart = timeToMin(time);
    const newEnd = newStart + apptDuration;

    const conflict = existing.find((a) => {
      const existStart = timeToMin(a.time);
      const existEnd = existStart + (a.duration || 30);
      return newStart < existEnd && newEnd > existStart;
    });

    if (conflict) {
      return res.status(409).json({ error: "Time slot conflict — dentist or room is already booked at this time" });
    }

    const appointment = await prisma.appointment.create({
      data: { patientId, dentistId, roomId, date: new Date(date), time, duration: apptDuration, reason, notes },
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } },
        dentist: { select: { name: true } },
        room: true,
      },
    });

    if (appointment.patient?.user?.email) {
      const { sendAppointmentConfirmationEmail } = require("../lib/mailer");
      sendAppointmentConfirmationEmail(appointment.patient.user.email, appointment.patient.user.name || "Patient", {
        date,
        time,
        dentist: appointment.dentist?.name,
        reason,
      });
    }

    if (roomId) {
      await prisma.room.update({ where: { id: roomId }, data: { status: "OCCUPIED" } });
      io.to("twin").emit("room-update", { roomId, status: "OCCUPIED" });
    }

    notifyAllStaff(prisma, io, { type: "appointment", message: `New appointment: ${appointment.patient?.user?.name || "Patient"} with ${appointment.dentist?.name || "Dentist"} on ${new Date(date).toLocaleDateString()} at ${time}` });
    res.status(201).json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", auth, roleGuard("ADMIN", "ASSISTANT", "DENTIST"), validate(appointmentSchemas.update), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const io = req.app.get("io");
    const { status, roomId, notes, date, time, duration, reason } = req.body;

    const current = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { patient: { include: { user: { select: { id: true, name: true, email: true } } } } },
    });
    if (!current) return res.status(404).json({ error: "Appointment not found" });

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (roomId !== undefined) updateData.roomId = roomId || null;
    if (notes !== undefined) updateData.notes = notes;
    if (date !== undefined) updateData.date = new Date(date);
    if (time !== undefined) updateData.time = time;
    if (duration !== undefined) updateData.duration = duration;
    if (reason !== undefined) updateData.reason = reason;

    if (time !== undefined || date !== undefined || roomId !== undefined) {
      const checkDate = date ? new Date(date) : current.date;
      checkDate.setHours(0, 0, 0, 0);
      const checkEnd = new Date(checkDate);
      checkEnd.setDate(checkEnd.getDate() + 1);
      const checkTime = time || current.time;
      const checkDuration = duration || current.duration || 30;
      const checkDentistId = current.dentistId;
      const checkRoomId = roomId !== undefined ? roomId : current.roomId;

      const timeToMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
      const newStart = timeToMin(checkTime);
      const newEnd = newStart + checkDuration;

      const existing = await prisma.appointment.findMany({
        where: {
          id: { not: req.params.id },
          date: { gte: checkDate, lt: checkEnd },
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
          OR: [
            { dentistId: checkDentistId },
            ...(checkRoomId ? [{ roomId: checkRoomId }] : []),
          ],
        },
        select: { time: true, duration: true },
      });

      const conflict = existing.find((a) => {
        const existStart = timeToMin(a.time);
        const existEnd = existStart + (a.duration || 30);
        return newStart < existEnd && newEnd > existStart;
      });

      if (conflict) {
        return res.status(409).json({ error: "Time slot conflict — dentist or room is already booked at this time" });
      }
    }

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
        roomsAwaitingCleanup.set(appointment.roomId, Date.now());
      }
    }

    if (status === "COMPLETED" && current.status !== "COMPLETED") {
      await rewardVisit(prisma, current.patientId, { io, source: "appointment visit" });
      if (current.patient?.user?.email) {
        sendVisitCompletedEmail(current.patient.user.email, current.patient.user.name || "Patient");
      }
    }

    const patientEmail = current.patient?.user?.email;
    if (patientEmail && (time !== undefined || date !== undefined)) {
      const { sendAppointmentUpdateEmail } = require("../lib/mailer");
      sendAppointmentUpdateEmail(patientEmail, current.patient?.user?.name || "Patient", {
        subject: "Your appointment was updated",
        message: `Your appointment has been rescheduled to ${new Date(date || current.date).toLocaleDateString()} at ${time || current.time}.`,
      });
    } else if (patientEmail && status === "CONFIRMED" && current.status !== "CONFIRMED") {
      const { sendAppointmentUpdateEmail } = require("../lib/mailer");
      sendAppointmentUpdateEmail(patientEmail, current.patient?.user?.name || "Patient", {
        subject: "Your appointment is confirmed",
        message: "The clinic has confirmed your appointment. See you soon!",
      });
    }

    notifyAllStaff(prisma, io, { type: "appointment", message: `Appointment updated: ${appointment.patient?.user?.name || "Patient"} - ${appointment.status}` });
    res.json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const io = req.app.get("io");

    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { patient: { include: { user: { select: { name: true, email: true } } } } },
    });
    if (!appointment) return res.status(404).json({ error: "Appointment not found" });

    if (req.user.role === "PATIENT" && appointment.patient?.userId !== req.user.id)
      return res.status(403).json({ error: "You can only cancel your own appointments" });

    if (appointment.status !== "SCHEDULED" && appointment.status !== "CONFIRMED")
      return res.status(400).json({ error: "Only scheduled or confirmed appointments can be cancelled" });

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: "CANCELLED" },
      include: {
        patient: { include: { user: { select: { name: true } } } },
        dentist: { select: { name: true } },
        room: true,
      },
    });

    if (updated.roomId) {
      await prisma.room.update({ where: { id: updated.roomId }, data: { status: "CLEANING" } });
      io.to("twin").emit("room-update", { roomId: updated.roomId, status: "CLEANING" });
      roomsAwaitingCleanup.set(updated.roomId, Date.now());
    }

    if (appointment.patient?.user?.email) {
      const { sendAppointmentUpdateEmail } = require("../lib/mailer");
      sendAppointmentUpdateEmail(appointment.patient.user.email, appointment.patient.user.name || "Patient", {
        subject: "Your appointment was cancelled",
        message: `Your appointment on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.time} has been cancelled. Book a new one anytime on the kiosk.`,
      });
    }

    notifyAllStaff(prisma, io, { type: "appointment", message: `Appointment cancelled: ${updated.patient?.user?.name || "Patient"} - ${new Date(updated.date).toLocaleDateString()} at ${updated.time}` });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", auth, roleGuard("ADMIN", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    await prisma.appointment.delete({ where: { id: req.params.id } });
    res.json({ message: "Appointment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = { router, roomsAwaitingCleanup };


