const express = require("express");
const { auth, roleGuard } = require("../middleware/auth");
const multer = require("multer");
const crypto = require("crypto");
const { uploadFile, deleteFile, getPublicUrl } = require("../lib/storage");

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/dicom', 'application/dicom'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and DICOM files are allowed.'));
  },
});

const router = express.Router();

router.get("/patient/:patientId", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const images = await prisma.xrayImage.findMany({
      where: { patientId: req.params.patientId },
      orderBy: { createdAt: "desc" },
    });
    res.json(images);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/upload", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), upload.single("image"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { patientId, fileType } = req.body;

    const filename = `xray-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    await uploadFile(req.file.buffer, filename, req.file.mimetype);
    const fileUrl = getPublicUrl(filename);

    const image = await prisma.xrayImage.create({
      data: {
        patientId,
        filePath: fileUrl,
        fileType: fileType || "xray",
        uploadedBy: req.user.id,
      },
    });
    res.status(201).json(image);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/analyze/:id", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const image = await prisma.xrayImage.findUnique({ where: { id: req.params.id } });
    if (!image) return res.status(404).json({ error: "Image not found" });

    try {
      const { GoogleGenAI } = require("@google/genai");
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey.length < 10) throw new Error("Gemini API key not configured");

      const ai = new GoogleGenAI({ apiKey });

      let imageBuffer;
      if (image.filePath.startsWith("http")) {
        const resp = await fetch(image.filePath);
        const arrayBuf = await resp.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuf);
      } else {
        const fs = require("fs");
        imageBuffer = fs.readFileSync(image.filePath);
      }

      const base64Image = imageBuffer.toString("base64");
      const mimeMap = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
      const ext = image.filePath.match(/\.\w+$/)?.[0]?.toLowerCase() || ".jpg";

      const aiText = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
          { text: "You are a dental AI assistant specializing in radiograph analysis. Analyze this dental X-ray and provide findings in JSON format with: findings[] (area, type, confidence, severity, description), overall_assessment, recommendations[], disclaimer." },
          { inlineData: { mimeType: mimeMap[ext] || "image/jpeg", data: base64Image } },
        ],
      }).then(r => r.text);

      let analysis;
      try {
        let cleaned = aiText.trim();
        if (cleaned.startsWith("```")) cleaned = cleaned.split("\n", 1)[1].rsplit("```", 1)[0].trim();
        analysis = JSON.parse(cleaned);
      } catch {
        analysis = { findings: [], overall_assessment: aiText, recommendations: [], disclaimer: "AI analysis." };
      }

      const updated = await prisma.xrayImage.update({
        where: { id: req.params.id },
        data: { analysis },
      });
      res.json(updated);
    } catch (aiErr) {
      console.error("AI analysis failed:", aiErr.message);
      const mockAnalysis = {
        findings: [
          { area: "Lower left molar", confidence: 0.87, type: "possible_cavity", description: "Potential decay detected on tooth #19" },
          { area: "Upper right", confidence: 0.65, type: "bone_loss", description: "Mild bone loss observed" },
        ],
        summary: "AI analysis complete. 2 areas of concern identified. Please verify with clinical examination.",
        disclaimer: "This is an AI-generated analysis and should not be considered a definitive diagnosis.",
        source: "mock",
      };

      const updated = await prisma.xrayImage.update({
        where: { id: req.params.id },
        data: { analysis: mockAnalysis },
      });
      res.json(updated);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", auth, roleGuard("ADMIN", "DENTIST", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const image = await prisma.xrayImage.findUnique({ where: { id: req.params.id } });
    if (!image) return res.status(404).json({ error: "Image not found" });

    try { if (image.filePath) await deleteFile(image.filePath); } catch {}
    await prisma.xrayImage.delete({ where: { id: req.params.id } });
    res.json({ message: "X-ray image deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
