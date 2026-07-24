const { z } = require("zod");

const email = z.string().email("Invalid email format").max(255);
const password = z.string().min(6, "Password must be at least 6 characters").max(128);
const name = z.string().min(1, "Name is required").max(100);
const phone = z.string().max(20).optional().nullable();
const uuid = z.string().uuid("Invalid ID format");

const roleEnum = z.enum(["ADMIN", "DENTIST", "ASSISTANT", "PATIENT"]);
const appointmentStatusEnum = z.enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]);
const toothStatusEnum = z.enum(["HEALTHY", "TREATED", "DECAYED", "MISSING", "CROWN", "IMPLANT", "BRIDGE", "FILLING"]);
const roomStatusEnum = z.enum(["AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE"]);
const queueStatusEnum = z.enum(["WAITING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]);

const authSchemas = {
  register: z.object({
    email,
    password,
    name,
    phone,
  }),
  login: z.object({
    email,
    password: z.string().min(1, "Password is required"),
  }),
  refresh: z.object({
    refreshToken: z.string().min(1, "Refresh token required"),
  }),
};

const patientSchemas = {
  create: z.object({
    name,
    email,
    phone,
    dob: z.string().or(z.date()).optional(),
    gender: z.string().max(20).optional().nullable(),
    bloodType: z.string().max(5).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    allergies: z.string().max(1000).optional().nullable(),
    medicalHistory: z.string().max(5000).optional().nullable(),
    emergencyContact: z.string().max(500).optional().nullable(),
    insuranceInfo: z.string().max(500).optional().nullable(),
  }),
  update: z.object({
    dob: z.string().or(z.date()).optional(),
    gender: z.string().max(20).optional().nullable(),
    bloodType: z.string().max(5).optional().nullable(),
    address: z.string().max(500).optional().nullable(),
    allergies: z.string().max(1000).optional().nullable(),
    medicalHistory: z.string().max(5000).optional().nullable(),
    emergencyContact: z.string().max(500).optional().nullable(),
    insuranceInfo: z.string().max(500).optional().nullable(),
  }),
  updateTooth: z.object({
    status: toothStatusEnum.optional(),
    notes: z.string().max(1000).optional().nullable(),
  }),
};

const appointmentSchemas = {
  create: z.object({
    patientId: uuid,
    dentistId: uuid,
    roomId: uuid.optional().nullable(),
    date: z.string().or(z.date()),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
    duration: z.number().int().min(5).max(480).optional(),
    reason: z.string().max(500).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  }),
  update: z.object({
    status: appointmentStatusEnum.optional(),
    roomId: uuid.optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    date: z.string().or(z.date()).optional(),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format").optional(),
    duration: z.number().int().min(5).max(480).optional(),
    reason: z.string().max(500).optional().nullable(),
  }),
};

const treatmentSchemas = {
  create: z.object({
    patientId: uuid,
    toothId: uuid.optional().nullable(),
    appointmentId: uuid.optional().nullable(),
    procedure: z.string().min(1, "Procedure is required").max(200),
    description: z.string().max(2000).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    cost: z.number().min(0).max(1000000).optional().nullable(),
  }),
  update: z.object({
    procedure: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
    cost: z.number().min(0).max(1000000).optional().nullable(),
    toothId: uuid.optional().nullable(),
  }),
};

const prescriptionSchemas = {
  create: z.object({
    patientId: uuid,
    treatmentId: uuid.optional().nullable(),
    medication: z.string().min(1, "Medication is required").max(200),
    dosage: z.string().min(1, "Dosage is required").max(100),
    frequency: z.string().min(1, "Frequency is required").max(100),
    duration: z.string().min(1, "Duration is required").max(100),
    notes: z.string().max(1000).optional().nullable(),
  }),
  update: z.object({
    medication: z.string().min(1).max(200).optional(),
    dosage: z.string().min(1).max(100).optional(),
    frequency: z.string().min(1).max(100).optional(),
    duration: z.string().min(1).max(100).optional(),
    notes: z.string().max(1000).optional().nullable(),
  }),
};

const adminUserSchemas = {
  create: z.object({
    name,
    email,
    password,
    role: roleEnum,
    phone,
    dob: z.string().or(z.date()).optional(),
    gender: z.string().max(20).optional().nullable(),
    bloodType: z.string().max(5).optional().nullable(),
  }),
  update: z.object({
    name: name.optional(),
    email: email.optional(),
    role: roleEnum.optional(),
    phone,
    password: password.optional(),
    dob: z.string().or(z.date()).optional(),
    gender: z.string().max(20).optional().nullable(),
    bloodType: z.string().max(5).optional().nullable(),
  }),
};

const queueSchemas = {
  create: z.object({
    patientId: uuid,
    dentistId: uuid.optional().nullable(),
  }),
  update: z.object({
    status: queueStatusEnum,
  }),
  selfCheckIn: z.object({
    dentistId: uuid.optional().nullable(),
  }),
};

const roomSchemas = {
  create: z.object({
    number: z.number().int().min(1).max(100),
    name: z.string().min(1, "Room name is required").max(100),
  }),
  update: z.object({
    status: roomStatusEnum,
  }),
};

const dentistScheduleSchemas = {
  create: z.object({
    dentistId: uuid,
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  }),
};

const loyaltySchemas = {
  earn: z.object({
    patientId: uuid,
    amount: z.number().int().min(1).max(10000),
    description: z.string().min(1, "Description is required").max(200),
  }),
};

const badgeSchemas = {
  award: z.object({
    patientId: uuid,
    badgeId: uuid,
  }),
};

const aiSchemas = {
  chat: z.object({
    message: z.string().min(1, "Message is required").max(2000),
    history: z.array(z.object({
      role: z.enum(["user", "model"]),
      parts: z.array(z.string()),
    })).max(50).optional(),
  }),
  treatmentSuggest: z.object({
    symptoms: z.string().max(2000).optional(),
    examination_findings: z.string().max(2000).optional(),
    patient_age: z.number().int().min(0).max(150).optional(),
    patient_gender: z.string().max(20).optional(),
    medical_history: z.string().max(2000).optional(),
  }),
  smileSimulate: z.object({
    treatment_type: z.enum(["whitening", "veneers", "alignment"]).optional(),
  }),
};

module.exports = {
  authSchemas,
  patientSchemas,
  appointmentSchemas,
  treatmentSchemas,
  prescriptionSchemas,
  adminUserSchemas,
  queueSchemas,
  roomSchemas,
  dentistScheduleSchemas,
  loyaltySchemas,
  badgeSchemas,
  aiSchemas,
  toothStatusEnum,
  roleEnum,
};
