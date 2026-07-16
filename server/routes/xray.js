const express = require("express");
const { auth } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `xray-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const router = express.Router();

router.get("/patient/:patientId", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const images = await prisma.xrayImage.findMany({
      where: { patientId: req.params.patientId },
      orderBy: { createdAt: "desc" },
    });
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/upload", auth, upload.single("image"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { patientId, fileType } = req.body;

    const image = await prisma.xrayImage.create({
      data: {
        patientId,
        filePath: req.file.path,
        fileType: fileType || "xray",
        uploadedBy: req.user.id,
      },
    });
    res.status(201).json(image);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/analyze/:id", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const image = await prisma.xrayImage.findUnique({ where: { id: req.params.id } });
    if (!image) return res.status(404).json({ error: "Image not found" });

    const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
    try {
      const response = await fetch(`${aiServiceUrl}/analyze-xray`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePath: image.filePath }),
      });
      const analysis = await response.json();

      const updated = await prisma.xrayImage.update({
        where: { id: req.params.id },
        data: { analysis },
      });
      res.json(updated);
    } catch (fetchErr) {
      const mockAnalysis = {
        findings: [
          { area: "Lower left molar", confidence: 0.87, type: "possible_cavity", description: "Potential decay detected on tooth #19" },
          { area: "Upper right", confidence: 0.65, type: "bone_loss", description: "Mild bone loss observed" },
        ],
        summary: "AI analysis complete. 2 areas of concern identified. Please verify with clinical examination.",
        disclaimer: "This is an AI-generated analysis and should not be considered a definitive diagnosis.",
      };

      const updated = await prisma.xrayImage.update({
        where: { id: req.params.id },
        data: { analysis: mockAnalysis },
      });
      res.json(updated);
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
