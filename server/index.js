require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const fs = require("fs");

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"], methods: ["GET", "POST"] },
});

const prisma = new PrismaClient();

app.use(cors({ origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000"] }));
app.use(express.json({ limit: '1mb' }));
function authStatic(req, res, next) {
  const token = req.query.token || req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Access denied" });
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
app.use("/uploads", authStatic, express.static("uploads"));

app.set("prisma", prisma);
app.set("io", io);

app.use("/api/auth", require("./routes/auth"));
app.use("/api/patients", require("./routes/patients"));
app.use("/api/appointments", require("./routes/appointments"));
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

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { app, server, io, prisma };
