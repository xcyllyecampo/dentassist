require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const { globalLimiter } = require("./middleware/rateLimit");

const WEAK_SECRETS = [
  "dentassist_super_secret_key_2026_thesis",
  "dentassist_refresh_secret_key_2026",
  "CHANGE_ME_TO_A_SECURE_RANDOM_STRING",
  "CHANGE_ME_TO_ANOTHER_SECURE_RANDOM_STRING",
  "secret",
  "changeme",
];
if (WEAK_SECRETS.includes(process.env.JWT_SECRET)) {
  console.warn("\x1b[33m[WARNING] JWT_SECRET is insecure. Generate a strong secret:\x1b[0m");
  console.warn("  node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\"");
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn("\x1b[33m[WARNING] JWT_SECRET must be at least 32 characters.\x1b[0m");
}

const globalForPrisma = globalThis;
const prisma = globalForPrisma.__prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = prisma;

const app = express();
app.set("trust proxy", 1);
const server = http.createServer(app);

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000").split(",");

const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ["GET", "POST"] },
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: '1mb' }));
app.use("/api", globalLimiter);

const { router: appointmentsRouter, roomsAwaitingCleanup } = require("./routes/appointments");

app.set("prisma", prisma);
app.set("io", io);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/patients", require("./routes/patients"));
app.use("/api/appointments", appointmentsRouter);
app.use("/api/rooms", require("./routes/rooms"));
app.use("/api/queue", require("./routes/queue"));
app.use("/api/treatments", require("./routes/treatments"));
app.use("/api/prescriptions", require("./routes/prescriptions"));
app.use("/api/xray", require("./routes/xray"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/loyalty", require("./routes/loyalty"));
app.use("/api/badges", require("./routes/badges"));
app.use("/api/dentist-schedules", require("./routes/dentist-schedules"));
app.use("/api/admin-users", require("./routes/admin-users"));
app.use("/api/notifications", require("./routes/notifications"));

app.get("/api/server-info", (req, res) => {
  const os = require("os");
  const ifaces = os.networkInterfaces();
  let ip = "localhost";
  Object.keys(ifaces).forEach((ifname) => {
    ifaces[ifname].forEach((iface) => {
      if (iface.family === "IPv4" && !iface.internal) {
        ip = iface.address;
      }
    });
  });
  res.json({ ip });
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  let userId = null;
  let userRole = null;
  try {
    const token = socket.handshake.auth?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
      userRole = decoded.role;
    }
  } catch (e) { console.error("Socket auth error:", e.message); }

  socket.on("join-queue", () => socket.join("queue"));
  socket.on("join-twin", () => socket.join("twin"));
  socket.on("join-notifications", () => {
    if (userId && userRole !== "PATIENT") socket.join("notifications");
  });
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

const PORT = process.env.PORT || 5000;

async function cleanupExpiredTokens() {
  try {
    const result = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (result.count > 0) console.log(`Cleaned up ${result.count} expired refresh tokens`);
  } catch (err) {
    console.error("Token cleanup failed:", err.message);
  }
}

cleanupExpiredTokens();
setInterval(cleanupExpiredTokens, 3600000);

async function cleanupRooms() {
  const now = Date.now();
  const CLEANUP_MS = 5 * 60 * 1000;
  for (const [roomId, startedAt] of roomsAwaitingCleanup.entries()) {
    if (now - startedAt >= CLEANUP_MS) {
      try {
        await prisma.room.update({ where: { id: roomId }, data: { status: "AVAILABLE" } });
        io.to("twin").emit("room-update", { roomId, status: "AVAILABLE" });
        roomsAwaitingCleanup.delete(roomId);
      } catch (err) {
        console.error("Room cleanup failed:", err.message);
      }
    }
  }
}
setInterval(cleanupRooms, 30000);

async function cleanupOrphanedPatients() {
  try {
    const orphaned = await prisma.patient.findMany({
      where: { user: { role: { not: "PATIENT" } } },
      include: { user: { select: { id: true, name: true, role: true } } },
    });
    for (const p of orphaned) {
      await prisma.tooth.deleteMany({ where: { patientId: p.id } });
      await prisma.patient.delete({ where: { id: p.id } });
      console.log(`Cleaned orphaned patient record for ${p.user.name} (now ${p.user.role})`);
    }
  } catch (err) {
    console.error("Orphaned patient cleanup failed:", err.message);
  }
}

cleanupOrphanedPatients();

app.use((err, _req, res, _next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large. Maximum size is 5MB." });
  }
  if (err.name === "MulterError") {
    return res.status(400).json({ error: err.message });
  }
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { app, server, io, prisma };
