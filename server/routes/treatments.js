const express = require("express");
const { auth, roleGuard } = require("../middleware/auth");

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
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", auth, roleGuard("DENTIST"), async (req, res) => {
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
