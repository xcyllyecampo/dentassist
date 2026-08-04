const { computeTier } = require("./tiers");
const { notifyPatient } = require("./notify");
const { sendBadgeEmail, sendVisitCompletedEmail } = require("./mailer");

const VISIT_POINTS = 20;

async function getOrCreateLoyalty(prisma, patientId) {
  let loyalty = await prisma.loyaltyPoints.findUnique({ where: { patientId } });
  if (!loyalty) {
    loyalty = await prisma.loyaltyPoints.create({
      data: { patientId, points: 0, tier: "Bronze" },
    });
  }
  return loyalty;
}

async function addPoints(prisma, patientId, amount, description) {
  const loyalty = await getOrCreateLoyalty(prisma, patientId);
  const newTotal = loyalty.points + amount;
  const tier = computeTier(newTotal);
  return prisma.loyaltyPoints.update({
    where: { id: loyalty.id },
    data: {
      points: newTotal,
      tier,
      transactions: { create: { amount, description, type: "EARNED" } },
    },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
}

async function awardBadge(prisma, patientId, badgeName, { io } = {}) {
  const badge = await prisma.badge.findUnique({ where: { name: badgeName } });
  if (!badge) return null;

  const existing = await prisma.patientBadge.findUnique({
    where: { patientId_badgeId: { patientId, badgeId: badge.id } },
  });
  if (existing) return null;

  const patientBadge = await prisma.patientBadge.create({
    data: { patientId, badgeId: badge.id },
    include: { badge: true },
  });

  await addPoints(prisma, patientId, badge.points, `Badge earned: ${badge.name}`);

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (patient) {
    await notifyPatient(prisma, io, patient.userId, {
      type: "badge",
      message: `You earned the "${badge.name}" badge (+${badge.points} pts)!`,
    });
    if (patient.user.email) {
      sendBadgeEmail(patient.user.email, patient.user.name || "Patient", badge.name, badge.points);
    }
  }

  return patientBadge;
}

async function detectBadges(prisma, patientId) {
  const earned = await prisma.patientBadge.findMany({
    where: { patientId },
    select: { badgeId: true },
  });
  const earnedIds = new Set(earned.map((e) => e.badgeId));

  const [completedAppts, walkInTreatments, allTreatments, allAppts, decayedCount] = await Promise.all([
    prisma.appointment.findMany({
      where: { patientId, status: "COMPLETED" },
      select: { date: true, time: true, createdAt: true },
    }),
    prisma.treatment.findMany({
      where: { patientId, appointmentId: null },
      select: { createdAt: true, procedure: true, description: true },
    }),
    prisma.treatment.findMany({
      where: { patientId },
      select: { procedure: true, description: true },
    }),
    prisma.appointment.findMany({
      where: { patientId, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
      select: { date: true, createdAt: true },
    }),
    prisma.tooth.count({ where: { patientId, status: "DECAYED" } }),
  ]);

  const visits = completedAppts.length + walkInTreatments.length;
  const treatmentCount = allTreatments.length;

  const earlyBirds = completedAppts.filter((a) => a.time < "10:00").length;
  const aheadOfSchedule = allAppts.filter((a) => a.date - new Date(a.createdAt) >= 7 * 24 * 60 * 60 * 1000).length;

  const months = new Set();
  for (const a of completedAppts) months.add(`${a.date.getFullYear()}-${a.date.getMonth()}`);
  for (const t of walkInTreatments) months.add(`${t.createdAt.getFullYear()}-${t.createdAt.getMonth()}`);
  const sortedMonths = [...months].sort();
  let hasStreak = false;
  for (let i = 0; i < sortedMonths.length - 2; i++) {
    const a = sortedMonths[i].split("-").map(Number);
    const b = sortedMonths[i + 1].split("-").map(Number);
    const c = sortedMonths[i + 2].split("-").map(Number);
    const monthDiff = (x, y) => (y[0] - x[0]) * 12 + (y[1] - x[1]);
    if (monthDiff(a, b) === 1 && monthDiff(b, c) === 1) {
      hasStreak = true;
      break;
    }
  }

  const whitening = allTreatments.some((t) => /whiten|bleach/i.test(`${t.procedure} ${t.description || ""}`));
  const fullAssessment = allTreatments.some((t) => /comprehensive|full assessment|full exam|full check|complete exam/i.test(`${t.procedure} ${t.description || ""}`));

  const candidates = {
    "First Visit": visits >= 1,
    "Regular Visitor": visits >= 3,
    "Loyal Patient": visits >= 10,
    "VIP Patient": visits >= 20,
    "Committed Patient": treatmentCount >= 5,
    "Cavity-Free Checkup": visits >= 3 && decayedCount === 0,
    "Whiter Smile": whitening,
    "Full Assessment": fullAssessment,
    "Streak Master": hasStreak,
    "Early Bird": earlyBirds >= 3,
    "Ahead of Schedule": aheadOfSchedule >= 3,
  };

  const toAward = [];
  for (const [name, ok] of Object.entries(candidates)) {
    if (!ok) continue;
    const badge = await prisma.badge.findUnique({ where: { name } });
    if (badge && !earnedIds.has(badge.id)) toAward.push(name);
  }
  return toAward;
}

async function rewardVisit(prisma, patientId, { io, source = "visit" } = {}) {
  await addPoints(prisma, patientId, VISIT_POINTS, "Completed visit");

  const names = await detectBadges(prisma, patientId);
  const awarded = [];
  for (const name of names) {
    const pb = await awardBadge(prisma, patientId, name, { io });
    if (pb) awarded.push(pb);
  }

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (patient) {
    await notifyPatient(prisma, io, patient.userId, {
      type: "points",
      message: `You earned +${VISIT_POINTS} points from your ${source}!`,
    });
    if (patient.user.email) {
      sendVisitCompletedEmail(patient.user.email, patient.user.name || "Patient", {
        points: VISIT_POINTS,
        badges: awarded.map((pb) => ({ name: pb.badge.name, points: pb.badge.points })),
      });
    }
  }

  return { awarded };
}

module.exports = {
  VISIT_POINTS,
  getOrCreateLoyalty,
  addPoints,
  awardBadge,
  detectBadges,
  rewardVisit,
};
