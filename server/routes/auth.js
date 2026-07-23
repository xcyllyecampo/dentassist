const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { auth } = require("../middleware/auth");
const { notifyAllStaff } = require("../lib/notify");

const router = express.Router();

async function generateTokens(user, prisma) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt },
  });

  return { accessToken, refreshToken };
}

router.post("/register", async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { email, password, name, role, phone } = req.body;

    if (!email || !password || !name) return res.status(400).json({ error: "Email, password, and name are required" });
    if (typeof password !== "string" || password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, role: "PATIENT", phone },
    });

    if (user.role === "PATIENT") {
      await prisma.patient.create({
        data: { userId: user.id, dob: new Date("1990-01-01"), gender: "Unknown" },
      });

      const io = req.app.get("io");
      notifyAllStaff(prisma, io, { type: "patient", message: `New patient registered: ${name}` });
    }

    const { accessToken, refreshToken } = await generateTokens(user, prisma);
    res.status(201).json({
      token: accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    if (user.active === false) {
      return res.status(403).json({ error: "Your account has been deactivated. Please contact the administrator to regain access." });
    }

    const { accessToken, refreshToken } = await generateTokens(user, prisma);
    res.json({
      token: accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { refreshToken } = req.body;

    if (!refreshToken) return res.status(400).json({ error: "Refresh token required" });

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored) return res.status(401).json({ error: "Invalid refresh token" });

    if (new Date() > stored.expiresAt) {
      await prisma.refreshToken.delete({ where: { token: refreshToken } });
      return res.status(401).json({ error: "Refresh token expired" });
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) return res.status(401).json({ error: "User not found" });
    if (user.active === false) {
      await prisma.refreshToken.delete({ where: { token: refreshToken } });
      return res.status(403).json({ error: "Your account has been deactivated. Please contact the administrator to regain access." });
    }

    await prisma.refreshToken.delete({ where: { token: refreshToken } });

    const tokens = await generateTokens(user, prisma);
    res.json({ token: tokens.accessToken, refreshToken: tokens.refreshToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/logout", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/me", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, phone: true, avatar: true, active: true },
    });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
