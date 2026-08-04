const express = require("express");
const { auth, roleGuard } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { treatmentSchemas } = require("../lib/schemas");
const { rewardVisit } = require("../lib/rewards");
const { sendVisitCompletedEmail } = require("../lib/mailer");

const router = express.Router();

router.get("/patient/:patientId", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const treatments = await prisma.treatment.findMany({
      where: { patientId: req.params.patientId },
      include: {
        dentist: { select: { name: true } },
        tooth: true,
        prescriptions: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(treatments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", auth, roleGuard("DENTIST"), validate(treatmentSchemas.create), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const io = req.app.get("io");
    const { patientId, toothId, appointmentId, procedure, description, notes, cost } = req.body;

    const treatment = await prisma.treatment.create({
      data: {
        patientId,
        toothId,
        appointmentId,
        dentistId: req.user.id,
        procedure,
        description,
        notes,
        cost,
      },
      include: { dentist: { select: { name: true } }, tooth: true },
    });

    if (!appointmentId) {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: { select: { email: true, name: true } } },
      });
      await rewardVisit(prisma, patientId, { io, source: "walk-in visit" });
      if (patient?.user?.email) {
        sendVisitCompletedEmail(patient.user.email, patient.user.name || "Patient");
      }
    }

    res.status(201).json(treatment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", auth, roleGuard("DENTIST"), validate(treatmentSchemas.update), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { procedure, description, notes, cost, toothId } = req.body;
    const treatment = await prisma.treatment.update({
      where: { id: req.params.id },
      data: {
        ...(procedure !== undefined && { procedure }),
        ...(description !== undefined && { description }),
        ...(notes !== undefined && { notes }),
        ...(cost !== undefined && { cost }),
        ...(toothId !== undefined && { toothId }),
      },
      include: { dentist: { select: { name: true } }, tooth: true, prescriptions: true },
    });
    res.json(treatment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", auth, roleGuard("DENTIST", "ADMIN"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    await prisma.treatment.delete({ where: { id: req.params.id } });
    res.json({ message: "Treatment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
