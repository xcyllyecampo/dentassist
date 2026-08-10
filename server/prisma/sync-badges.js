const { PrismaClient } = require("@prisma/client");
const { BADGES } = require("./badge-catalog");

const prisma = new PrismaClient({});

async function main() {
  console.log("=== Badge Catalog Sync (non-destructive) ===\n");

  for (const b of BADGES) {
    const existing = await prisma.badge.findUnique({ where: { name: b.name } });
    await prisma.badge.upsert({
      where: { name: b.name },
      update: { description: b.description, icon: b.icon, category: b.category, threshold: b.threshold, points: b.points },
      create: b,
    });
    console.log(`  ${existing ? "updated" : "created"}: ${b.name} (+${b.points} pts)`);
  }

  const count = await prisma.badge.count();
  console.log(`\nBadge catalog now has ${count} badges.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
