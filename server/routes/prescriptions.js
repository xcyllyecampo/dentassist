const express = require("express");
const { auth, roleGuard } = require("../middleware/auth");

const router = express.Router();

router.get("/patient/:patientId", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: req.params.patientId },
      include: { treatment: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(prescriptions);
  } catch (err) {
    console.error(err);
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
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", auth, roleGuard("DENTIST"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { medication, dosage, frequency, duration, notes } = req.body;
    const prescription = await prisma.prescription.update({
      where: { id: req.params.id },
      data: {
        ...(medication !== undefined && { medication }),
        ...(dosage !== undefined && { dosage }),
        ...(frequency !== undefined && { frequency }),
        ...(duration !== undefined && { duration }),
        ...(notes !== undefined && { notes }),
      },
      include: { treatment: true },
    });
    res.json(prescription);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", auth, roleGuard("DENTIST", "ADMIN"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    await prisma.prescription.delete({ where: { id: req.params.id } });
    res.json({ message: "Prescription deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
