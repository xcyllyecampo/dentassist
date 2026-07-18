async function tryAwardBadge(prisma, patientId, badgeName) {
  try {
    const badge = await prisma.badge.findUnique({ where: { name: badgeName } });
    if (!badge) return;
    const existing = await prisma.patientBadge.findUnique({
      where: { patientId_badgeId: { patientId, badgeId: badge.id } },
    });
    if (existing) return;
    await prisma.patientBadge.create({ data: { patientId, badgeId: badge.id } });
    let loyalty = await prisma.loyaltyPoints.findUnique({ where: { patientId } });
    if (!loyalty) {
      loyalty = await prisma.loyaltyPoints.create({ data: { patientId, points: 0, tier: "Bronze" } });
    }
    const added = badge.threshold * 10;
    const newTotal = loyalty.points + added;
    let tier = "Bronze";
    if (newTotal >= 500) tier = "Platinum";
    else if (newTotal >= 200) tier = "Gold";
    else if (newTotal >= 50) tier = "Silver";
    await prisma.loyaltyPoints.update({
      where: { id: loyalty.id },
      data: {
        points: newTotal,
        tier,
        transactions: { create: { amount: added, description: `Badge earned: ${badge.name}`, type: "EARNED" } },
      },
    });
  } catch (err) {
    console.error(`Failed to award badge "${badgeName}":`, err.message);
  }
}

module.exports = { tryAwardBadge };
