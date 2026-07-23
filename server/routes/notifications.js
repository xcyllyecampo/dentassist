const express = require("express");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/read-all", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id/read", auth, async (req, res) => {
  try {
    const prisma = req.app.get("prisma");
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    if (notification.userId !== req.user.id) return res.status(403).json({ error: "Forbidden" });

    await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
