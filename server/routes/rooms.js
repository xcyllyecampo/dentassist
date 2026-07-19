const express = require("express");
const { auth, roleGuard } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const rooms = await prisma.room.findMany({
      include: {
        appointments: {
          where: { status: { in: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"] } },
          include: {
            patient: { include: { user: { select: { name: true } } } },
            dentist: { select: { name: true } },
          },
          take: 1,
          orderBy: { date: "asc" },
        },
      },
      orderBy: { number: "asc" },
    });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", auth, roleGuard("ADMIN", "ASSISTANT"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const io = req.app.get("io");
    const { status } = req.body;

    const room = await prisma.room.update({
      where: { id: req.params.id },
      data: { status },
    });

    io.to("twin").emit("room-update", { roomId: room.id, status: room.status });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", auth, roleGuard("ADMIN"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const { number, name } = req.body;
    if (!number || !name) return res.status(400).json({ error: "Room number and name are required" });
    const room = await prisma.room.create({ data: { number, name } });
    res.status(201).json(room);
  } catch (err) {
    if (err.code === "P2002") return res.status(409).json({ error: "Room number already exists" });
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", auth, roleGuard("ADMIN"), async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    await prisma.room.delete({ where: { id: req.params.id } });
    res.json({ message: "Room deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
