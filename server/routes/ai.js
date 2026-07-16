const express = require("express");
const { auth } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `ai-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.post("/xray/analyze", auth, upload.single("file"), async (req, res) => {
  try {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(req.file.path);
    const blob = new Blob([fileBuffer], { type: req.file.mimetype });
    formData.append("file", blob, req.file.originalname);

    const response = await fetch(`${AI_SERVICE_URL}/analyze/xray`, {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error("AI service error:", err.message);
    res.status(500).json({ error: "AI service unavailable", details: err.message });
  }
});

router.post("/oral/screen", auth, upload.single("file"), async (req, res) => {
  try {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(req.file.path);
    const blob = new Blob([fileBuffer], { type: req.file.mimetype });
    formData.append("file", blob, req.file.originalname);

    const response = await fetch(`${AI_SERVICE_URL}/screen/oral`, {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error("AI service error:", err.message);
    res.status(500).json({ error: "AI service unavailable", details: err.message });
  }
});

router.post("/chat", auth, async (req, res) => {
  try {
    const { message, history } = req.body;
    const response = await fetch(`${AI_SERVICE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: history || [] }),
    });
    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error("AI service error:", err.message);
    res.status(500).json({ error: "AI service unavailable", details: err.message });
  }
});

router.post("/treatment/suggest", auth, async (req, res) => {
  try {
    const { symptoms, examination_findings, patient_age, patient_gender, medical_history } = req.body;
    const response = await fetch(`${AI_SERVICE_URL}/treatment/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms, examination_findings, patient_age, patient_gender, medical_history }),
    });
    const result = await response.json();
    res.json(result);
  } catch (err) {
    console.error("AI service error:", err.message);
    res.status(500).json({ error: "AI service unavailable", details: err.message });
  }
});

module.exports = router;
