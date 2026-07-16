const { PrismaClient } = require("../generated/prisma");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.prescription.deleteMany();
  await prisma.treatment.deleteMany();
  await prisma.xrayImage.deleteMany();
  await prisma.queueEntry.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.tooth.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.room.deleteMany();
  await prisma.dentistSchedule.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: { email: "admin@dentassist.com", password, name: "Dr. Admin", role: "ADMIN" },
  });

  const dentist1 = await prisma.user.create({
    data: { email: "dr.smith@dentassist.com", password, name: "Dr. Sarah Smith", role: "DENTIST", phone: "555-0101" },
  });

  const dentist2 = await prisma.user.create({
    data: { email: "dr.jones@dentassist.com", password, name: "Dr. Michael Jones", role: "DENTIST", phone: "555-0102" },
  });

  const assistant = await prisma.user.create({
    data: { email: "nurse@dentassist.com", password, name: "Emily Davis", role: "ASSISTANT", phone: "555-0201" },
  });

  const patientUsers = [];
  const patientData = [
    { name: "John Doe", email: "john@email.com", dob: "1985-03-15", gender: "Male", bloodType: "O+", allergies: "Penicillin" },
    { name: "Jane Wilson", email: "jane@email.com", dob: "1992-07-22", gender: "Female", bloodType: "A+", medicalHistory: "Braces in 2015" },
    { name: "Robert Brown", email: "robert@email.com", dob: "1978-11-08", gender: "Male", bloodType: "B-", allergies: "Latex", medicalHistory: "Diabetes Type 2" },
    { name: "Maria Garcia", email: "maria@email.com", dob: "1995-01-30", gender: "Female", bloodType: "AB+" },
    { name: "David Lee", email: "david@email.com", dob: "1988-06-17", gender: "Male", bloodType: "O-", allergies: "Ibuprofen" },
  ];

  for (const p of patientData) {
    const user = await prisma.user.create({
      data: { email: p.email, password, name: p.name, role: "PATIENT" },
    });
    patientUsers.push(user);

    const patient = await prisma.patient.create({
      data: {
        userId: user.id,
        dob: new Date(p.dob),
        gender: p.gender,
        bloodType: p.bloodType,
        allergies: p.allergies,
        medicalHistory: p.medicalHistory,
        address: "123 Main Street, Manila, Philippines",
        emergencyContact: "Emergency Contact - 555-0000",
      },
    });

    const teethData = Array.from({ length: 32 }, (_, i) => ({
      patientId: patient.id,
      toothNumber: i + 1,
      status: i === 3 || i === 14 ? "FILLING" : i === 17 ? "CROWN" : "HEALTHY",
    }));
    await prisma.tooth.createMany({ data: teethData });
  }

  const rooms = [];
  for (let i = 1; i <= 6; i++) {
    const room = await prisma.room.create({
      data: { number: i, name: `Room ${i}`, status: i <= 4 ? "AVAILABLE" : i === 5 ? "OCCUPIED" : "CLEANING" },
    });
    rooms.push(room);
  }

  const today = new Date();
  const appointments = [];
  const times = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00"];
  const reasons = ["Regular Checkup", "Tooth Pain", "Crown Replacement", "Teeth Cleaning", "Root Canal", "Consultation", "Filling", "Extraction"];

  for (let i = 0; i < 9; i++) {
    const patient = await prisma.patient.findFirst({
      where: { userId: patientUsers[i % patientUsers.length].id },
    });
    const dentistId = i % 2 === 0 ? dentist1.id : dentist2.id;
    const roomId = i < 6 ? rooms[i].id : null;
    const statuses = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED"];
    const status = i < 3 ? "COMPLETED" : i < 6 ? "IN_PROGRESS" : "SCHEDULED";

    const appt = await prisma.appointment.create({
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
    appointments.push(appt);
  }

  for (let i = 0; i < 3; i++) {
    const patient = await prisma.patient.findFirst({
      where: { userId: patientUsers[i + 2].id },
    });
    await prisma.queueEntry.create({
      data: { patientId: patient.id, position: i + 1, estimatedWait: (i + 1) * 30, status: "WAITING" },
    });
  }

  for (const dentist of [dentist1, dentist2]) {
    for (let day = 1; day <= 5; day++) {
      await prisma.dentistSchedule.create({
        data: { userId: dentist.id, dayOfWeek: day, startTime: "09:00", endTime: "17:00" },
      });
    }
  }

  console.log("Database seeded successfully!");
  console.log("Login credentials:");
  console.log("  Admin:    admin@dentassist.com / password123");
  console.log("  Dentist:  dr.smith@dentassist.com / password123");
  console.log("  Dentist:  dr.jones@dentassist.com / password123");
  console.log("  Assistant: nurse@dentassist.com / password123");
  console.log("  Patient:  john@email.com / password123");
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
