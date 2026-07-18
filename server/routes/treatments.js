const express = require("express");
const { auth, roleGuard } = require("../middleware/auth");

const router = express.Router();

router.get("/patient/:patientId", auth, async (req, res) => {
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
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", auth, roleGuard("DENTIST"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
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
    res.status(201).json(treatment);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
