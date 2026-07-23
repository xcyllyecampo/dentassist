const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const prisma = new PrismaClient({});

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
function ask(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  console.log("=== DentAssist Seed Script ===\n");

  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log(`WARNING: Database already has ${userCount} user(s).`);
    const answer = await ask("This will OVERWRITE existing data with seed data. Continue? (yes/no): ");
    if (answer.trim().toLowerCase() !== "yes") {
      console.log("Seed cancelled.");
      rl.close();
      return;
    }
    console.log("\nClearing existing data...");
    await prisma.prescription.deleteMany();
    await prisma.treatment.deleteMany();
    await prisma.xrayImage.deleteMany();
    await prisma.queueEntry.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.tooth.deleteMany();
    await prisma.patientBadge.deleteMany();
    await prisma.pointTransaction.deleteMany();
    await prisma.loyaltyPoints.deleteMany();
    await prisma.badge.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.room.deleteMany();
    await prisma.dentistSchedule.deleteMany();
    await prisma.user.deleteMany();
  } else {
    console.log("Database is empty. Seeding fresh data...\n");
  }

  const password = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@dentassist.com" },
    update: {},
    create: { email: "admin@dentassist.com", password, name: "Dr. Admin", role: "ADMIN" },
  });

  const dentist1 = await prisma.user.upsert({
    where: { email: "dr.santos@dentassist.com" },
    update: {},
    create: { email: "dr.santos@dentassist.com", password, name: "Dr. Maria Santos", role: "DENTIST", phone: "09171234567" },
  });

  const dentist2 = await prisma.user.upsert({
    where: { email: "dr.reyes@dentassist.com" },
    update: {},
    create: { email: "dr.reyes@dentassist.com", password, name: "Dr. Juan Reyes", role: "DENTIST", phone: "09181234568" },
  });

  const assistant = await prisma.user.upsert({
    where: { email: "angela@dentassist.com" },
    update: {},
    create: { email: "angela@dentassist.com", password, name: "Angela Cruz", role: "ASSISTANT", phone: "09191234569" },
  });

  const patientUsers = [];
  const patientData = [
    { name: "Miguel Dela Cruz", email: "miguel@email.com", dob: "1985-03-15", gender: "Male", bloodType: "O+", allergies: "Penicillin" },
    { name: "Ana Bautista", email: "ana@email.com", dob: "1992-07-22", gender: "Female", bloodType: "A+", medicalHistory: "Braces in 2015" },
    { name: "Carlos Ramos", email: "carlos@email.com", dob: "1978-11-08", gender: "Male", bloodType: "B-", allergies: "Latex", medicalHistory: "Diabetes Type 2" },
    { name: "Patricia Gonzales", email: "patricia@email.com", dob: "1995-01-30", gender: "Female", bloodType: "AB+" },
    { name: "Jose Villanueva", email: "jose@email.com", dob: "1988-06-17", gender: "Male", bloodType: "O-", allergies: "Ibuprofen" },
  ];

  for (const p of patientData) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: { email: p.email, password, name: p.name, role: "PATIENT" },
    });
    patientUsers.push(user);

    const existing = await prisma.patient.findUnique({ where: { userId: user.id } });
    const patient = existing || await prisma.patient.create({
      data: {
        userId: user.id,
        dob: new Date(p.dob),
        gender: p.gender,
        bloodType: p.bloodType,
        allergies: p.allergies,
        medicalHistory: p.medicalHistory,
        address: "123 Rizal Avenue, Makati City, Metro Manila",
        emergencyContact: "Juan Dela Cruz - 09171112222",
      },
    });

    const teethCount = await prisma.tooth.count({ where: { patientId: patient.id } });
    if (teethCount === 0) {
      const teethData = Array.from({ length: 32 }, (_, i) => ({
        patientId: patient.id,
        toothNumber: i + 1,
        status: i === 3 || i === 14 ? "FILLING" : i === 17 ? "CROWN" : "HEALTHY",
      }));
      await prisma.tooth.createMany({ data: teethData });
    }
  }

  const rooms = [];
  for (let i = 1; i <= 6; i++) {
    const existing = await prisma.room.findUnique({ where: { number: i } });
    const room = existing || await prisma.room.create({
      data: { number: i, name: `Room ${i}`, status: i <= 4 ? "AVAILABLE" : i === 5 ? "OCCUPIED" : "CLEANING" },
    });
    rooms.push(room);
  }

  const today = new Date();
  const times = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00"];
  const reasons = ["Regular Checkup", "Tooth Pain", "Crown Replacement", "Teeth Cleaning", "Root Canal", "Consultation", "Filling", "Extraction"];

  const apptCount = await prisma.appointment.count();
  if (apptCount === 0) {
    for (let i = 0; i < 9; i++) {
      const patient = await prisma.patient.findFirst({
        where: { userId: patientUsers[i % patientUsers.length].id },
      });
      const dentistId = i % 2 === 0 ? dentist1.id : dentist2.id;
      const roomId = i < 6 ? rooms[i].id : null;
      const status = i < 3 ? "COMPLETED" : i < 6 ? "IN_PROGRESS" : "SCHEDULED";

      await prisma.appointment.create({
        data: {
          patientId: patient.id,
          dentistId,
          roomId,
          date: today,
          time: times[i],
          duration: 30,
          status,
          reason: reasons[i],
        },
      });
    }
  }

  const queueCount = await prisma.queueEntry.count();
  if (queueCount === 0) {
    for (let i = 0; i < 3; i++) {
      const patient = await prisma.patient.findFirst({
        where: { userId: patientUsers[i + 2].id },
      });
      await prisma.queueEntry.create({
        data: { patientId: patient.id, position: i + 1, estimatedWait: (i + 1) * 30, status: "WAITING" },
      });
    }
  }

  for (const dentist of [dentist1, dentist2]) {
    for (let day = 1; day <= 5; day++) {
      await prisma.dentistSchedule.upsert({
        where: { userId_dayOfWeek: { userId: dentist.id, dayOfWeek: day } },
        update: { startTime: "09:00", endTime: "17:00" },
        create: { userId: dentist.id, dayOfWeek: day, startTime: "09:00", endTime: "17:00" },
      });
    }
  }

  const badges = [
    { name: "First Visit", description: "Completed your first dental visit", icon: "🎉", category: "Milestone", threshold: 1 },
    { name: "Regular Visitor", description: "Attended 3 or more appointments", icon: "⭐", category: "Loyalty", threshold: 3 },
    { name: "Committed Patient", description: "Completed 5 or more treatments", icon: "🏆", category: "Achievement", threshold: 5 },
    { name: "Streak Master", description: "Maintained a 3-month visit streak", icon: "🔥", category: "Dedication", threshold: 3 },
  ];
  for (const b of badges) {
    await prisma.badge.upsert({
      where: { name: b.name },
      update: {},
      create: b,
    });
  }

  const firstPatient = await prisma.patient.findFirst();
  if (firstPatient) {
    const firstVisitBadge = await prisma.badge.findUnique({ where: { name: "First Visit" } });
    if (firstVisitBadge) {
      await prisma.patientBadge.upsert({
        where: { patientId_badgeId: { patientId: firstPatient.id, badgeId: firstVisitBadge.id } },
        update: {},
        create: { patientId: firstPatient.id, badgeId: firstVisitBadge.id },
      });
    }

    const existingLoyalty = await prisma.loyaltyPoints.findUnique({ where: { patientId: firstPatient.id } });
    if (!existingLoyalty) {
      const loyalty = await prisma.loyaltyPoints.create({
        data: { patientId: firstPatient.id, points: 50, tier: "Silver" },
      });
      await prisma.pointTransaction.create({
        data: { loyaltyPointsId: loyalty.id, amount: 50, description: "Welcome bonus + First Visit badge", type: "EARNED" },
      });
    }
  }

  console.log("\nDatabase seeded successfully!");
  console.log("Login credentials:");
  console.log("  Admin:    admin@dentassist.com / password123");
  console.log("  Dentist:  dr.santos@dentassist.com / password123");
  console.log("  Dentist:  dr.reyes@dentassist.com / password123");
  console.log("  Assistant: angela@dentassist.com / password123");
  console.log("  Patient:  miguel@email.com / password123");

  rl.close();
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
