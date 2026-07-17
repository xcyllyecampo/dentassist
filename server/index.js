require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { PrismaClient } = require("@prisma/client");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

const prisma = new PrismaClient();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

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

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("join-queue", () => socket.join("queue"));
  socket.on("join-twin", () => socket.join("twin"));
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = { app, server, io, prisma };
