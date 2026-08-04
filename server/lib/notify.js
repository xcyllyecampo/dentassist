async function notifyAllStaff(prisma, io, { type, message }) {
  try {
    const staff = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "DENTIST", "ASSISTANT"] } },
      select: { id: true },
    });
    if (staff.length > 0) {
      await prisma.notification.createMany({
        data: staff.map(u => ({ userId: u.id, type, message })),
      });
    }
    io.to("notifications").emit("notification", { type, message });
  } catch (err) {
    console.error("notifyAllStaff error:", err);
  }
}

async function notifyPatient(prisma, io, userId, { type, message }) {
  try {
    if (!userId) return;
    await prisma.notification.create({ data: { userId, type, message } });
    if (io) io.to(`user-${userId}`).emit("notification", { type, message });
  } catch (err) {
    console.error("notifyPatient error:", err);
  }
}

module.exports = { notifyAllStaff, notifyPatient };
