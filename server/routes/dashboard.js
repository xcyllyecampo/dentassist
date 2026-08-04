const express = require("express");
const { auth, roleGuard } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalPatients,
      todayAppointments,
      completedToday,
      totalRevenue,
      roomStatus,
      queueCount,
      recentAppointments,
      dentists,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.appointment.findMany({
        where: { date: { gte: today, lt: tomorrow } },
        include: {
          patient: { include: { user: { select: { name: true } } } },
          dentist: { select: { name: true } },
          room: true,
        },
        orderBy: { time: "asc" },
      }),
      prisma.appointment.count({
        where: { date: { gte: today, lt: tomorrow }, status: "COMPLETED" },
      }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: today, lt: tomorrow } } }),
      prisma.room.findMany({ orderBy: { number: "asc" } }),
      prisma.queueEntry.count({ where: { status: "WAITING" } }),
      prisma.appointment.findMany({
        where: { date: { gte: today, lt: tomorrow } },
        include: {
          patient: { include: { user: { select: { name: true } } } },
          dentist: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.user.findMany({
        where: { role: "DENTIST", active: true },
        select: { id: true, name: true, avatar: true },
      }),
    ]);

    res.json({
      totalPatients,
      todayAppointments,
      completedToday,
      totalRevenue: totalRevenue._sum.amount || 0,
      roomStatus,
      queueCount,
      recentAppointments,
      dentists,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
