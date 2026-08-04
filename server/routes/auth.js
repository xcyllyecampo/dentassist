const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { auth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { authSchemas } = require("../lib/schemas");
const { strictAuthLimiter, authLimiter } = require("../middleware/rateLimit");
const { notifyAllStaff } = require("../lib/notify");
const { sendWelcomeEmail, sendPasswordResetEmail } = require("../lib/mailer");

const router = express.Router();

async function generateTokens(user, prisma) {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
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

router.post("/register", authLimiter, validate(authSchemas.register), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { email, password, name, phone } = req.body;

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

    await sendWelcomeEmail(user.email, user.name);

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

router.post("/login", strictAuthLimiter, validate(authSchemas.login), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { email, password } = req.body;

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

router.post("/refresh", authLimiter, validate(authSchemas.refresh), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { refreshToken } = req.body;

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

router.post("/forgot-password", authLimiter, validate(authSchemas.forgotPassword), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: "If that email exists, a reset link has been sent" });
    }

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const link = `${clientUrl}/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, user.name, link);

    res.json({ message: "If that email exists, a reset link has been sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/reset-password", authLimiter, validate(authSchemas.resetPassword), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { token, password } = req.body;

    const stored = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!stored) return res.status(400).json({ error: "Invalid or expired reset link" });
    if (new Date() > stored.expiresAt) {
      await prisma.passwordResetToken.delete({ where: { id: stored.id } });
      return res.status(400).json({ error: "Reset link has expired. Please request a new one." });
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: stored.userId }, data: { password: hashed } });
    await prisma.passwordResetToken.deleteMany({ where: { userId: stored.userId } });
    await prisma.refreshToken.deleteMany({ where: { userId: stored.userId } });

    res.json({ message: "Password reset successful. You can now log in." });
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
