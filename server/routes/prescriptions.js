const express = require("express");
const { auth, roleGuard } = require("../middleware/auth");

const router = express.Router();

router.get("/patient/:patientId", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: req.params.patientId },
      include: { treatment: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", auth, roleGuard("DENTIST"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { patientId, treatmentId, medication, dosage, frequency, duration, notes } = req.body;

    const prescription = await prisma.prescription.create({
      data: { patientId, treatmentId, medication, dosage, frequency, duration, notes },
    });
    res.status(201).json(prescription);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
