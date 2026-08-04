const express = require("express");
const { auth, roleGuard } = require("../middleware/auth");

const router = express.Router();

router.get("/daily", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [patientCount, appointmentCount, completedCount, revenue] = await Promise.all([
      prisma.patient.count(),
      prisma.appointment.count({ where: { date: { gte: today, lt: tomorrow } } }),
      prisma.appointment.count({ where: { date: { gte: today, lt: tomorrow }, status: "COMPLETED" } }),
      prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: today, lt: tomorrow } } }),
    ]);

    res.json({ patientCount, appointmentCount, completedCount, revenue: revenue._sum.amount || 0 });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/procedures", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const treatments = await prisma.treatment.groupBy({
      by: ["procedure"],
      _count: { procedure: true },
      orderBy: { _count: { procedure: "desc" } },
      take: 10,
    });
    res.json(treatments.map((t) => ({ name: t.procedure, count: t._count.procedure })));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/revenue", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const days = parseInt(req.query.days) || 7;
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const payments = await prisma.payment.findMany({
      where: { paidAt: { gte: since } },
      select: { amount: true, paidAt: true },
    });

    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateStr = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split("T")[0];
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const dayRevenue = payments
        .filter(t => t.paidAt >= date && t.paidAt < nextDay)
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      data.push({ date: dateStr, revenue: dayRevenue });
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/returning-patients", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const patients = await prisma.patient.findMany({
      include: {
        user: { select: { name: true } },
        _count: { select: { appointments: true } },
      },
      orderBy: { appointments: { _count: "desc" } },
      take: 10,
    });
    res.json(patients.map((p) => ({ name: p.user.name, visits: p._count.appointments })));
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/peak-hours", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const appointments = await prisma.appointment.findMany({
      where: { createdAt: { gte: since }, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
      select: { time: true },
    });

    const hourCounts = {};
    for (let h = 9; h <= 17; h++) {
      hourCounts[h] = 0;
    }

    appointments.forEach(a => {
      const hour = parseInt(a.time.split(":")[0]);
      if (hourCounts[hour] !== undefined) hourCounts[hour]++;
    });

    const labels = ['9 AM','10 AM','11 AM','12 PM','1 PM','2 PM','3 PM','4 PM','5 PM'];
    const result = labels.map((label, i) => ({
      hour: label,
      patients: hourCounts[9 + i] || 0,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
