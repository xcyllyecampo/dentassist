const express = require("express");
const { auth, roleGuard } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { paymentSchemas } = require("../lib/schemas");
const { sendPaymentReceiptEmail } = require("../lib/mailer");

const router = express.Router();

router.post("/", auth, roleGuard("ADMIN", "ASSISTANT", "DENTIST"), validate(paymentSchemas.create), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { patientId, appointmentId, amount, method } = req.body;

    const payment = await prisma.payment.create({
      data: { patientId, appointmentId: appointmentId || null, amount, method, status: "PAID" },
      include: {
        patient: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    await sendPaymentReceiptEmail(payment.patient.user.email, payment.patient.user.name, amount, method);

    res.status(201).json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const payments = await prisma.payment.findMany({
      include: { patient: { include: { user: { select: { name: true } } } } },
      orderBy: { paidAt: "desc" },
      take: 50,
    });
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/patient/:patientId", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { patientId } = req.params;

    if (req.user.role === "PATIENT") {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (!patient || patient.id !== patientId) {
        return res.status(403).json({ error: "You can only view your own payments" });
      }
    }

    const payments = await prisma.payment.findMany({
      where: { patientId },
      orderBy: { paidAt: "desc" },
      take: 50,
    });
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
