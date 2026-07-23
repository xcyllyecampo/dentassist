# DentAssist - Dental Clinic Management System

A full-stack web application for managing dental clinic operations including patient records, appointments, queue management, billing, X-ray analysis, and a patient kiosk mode.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4, Recharts, Three.js (3D clinic view) |
| Backend | Express 5, Prisma ORM, PostgreSQL, Socket.IO |
| AI | Google Gemini API (X-ray analysis, symptom screening) |
| Auth | JWT (jsonwebtoken) + bcryptjs |

## Features

- **Dashboard** - Real-time stats, 3D clinic visualization, dentist workload charts
- **Patient Management** - CRUD, dental chart (interactive 32-tooth diagram), medical history
- **Appointments** - Calendar view, booking, status tracking, dentist scheduling
- **Queue Management** - Walk-in check-in, real-time queue updates via WebSocket
- **Kiosk Mode** - Touch-optimized patient self-service (check-in, book, view records)
- **X-Ray Analysis** - Upload X-rays, AI-powered analysis via Gemini
- **AI Symptom Screening** - Chat-based dental symptom assessment
- **Billing** - Invoice generation, payment tracking
- **Prescriptions** - Medication management per patient
- **Loyalty & Rewards** - Points system, tier progression, achievement badges
- **Admin Panel** - User management, role-based access (Admin, Dentist, Assistant, Patient)
- **Notifications** - Real-time bell notifications with sound effects

## Project Structure

```
dental/
├── client/               # React frontend (Vite)
│   ├── src/
│   │   ├── pages/        # Page components (Dashboard, Patients, etc.)
│   │   │   └── kiosk/    # Kiosk mode pages (touch-optimized)
│   │   ├── components/   # Reusable components (Layout, Header, EmptyState, etc.)
│   │   ├── context/      # React contexts (Auth, Toast)
│   │   └── lib/          # Utilities (api, socket, sounds, treatments)
│   └── public/           # Static assets
├── server/               # Express API
│   ├── routes/           # Route handlers (appointments, patients, queue, etc.)
│   ├── prisma/           # Schema, migrations, seed, backup
│   ├── middleware/        # Auth, file upload (multer)
│   └── index.js          # Server entry point
└── README.md
```

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone and install
```bash
git clone <repo-url> dental
cd dental

# Install server
cd server && npm install

# Install client
cd ../client && npm install
```

### 2. Configure environment
Create `server/.env`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/dentassist"
JWT_SECRET="your_secret_key"
PORT=5000
GEMINI_API_KEY="your_gemini_api_key"  # Optional, for AI features
```

### 3. Set up database
```bash
cd server
npx prisma migrate dev --name init
node prisma/seed.js    # Say "yes" to confirm seeding
```

### 4. Start development servers
```bash
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client
cd client && npm run dev
```

App runs at: `http://localhost:5173` (client) and `http://localhost:5000` (API)

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@dentassist.com | password123 |
| Dentist | dr.santos@dentassist.com | password123 |
| Dentist | dr.reyes@dentassist.com | password123 |
| Assistant | angela@dentassist.com | password123 |
| Patient | miguel@email.com | password123 |

## Available Scripts

### Server (`server/`)
| Script | Description |
|--------|-------------|
| `npm run dev` | Start server with nodemon (auto-restart) |
| `npm start` | Start server in production |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:backup` | Create PostgreSQL backup to `server/backups/` |
| `npm run db:reset` | Reset database (destructive) |

### Client (`client/`)
| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run Oxlint |

## Roles & Permissions

| Role | Access |
|------|--------|
| ADMIN | Full access - user management, all modules |
| DENTIST | Patients, appointments, treatments, prescriptions, X-rays |
| ASSISTANT | Queue, appointments, patients (limited) |
| PATIENT | Kiosk mode only - check-in, book, view records |

## API Endpoints

- `POST /auth/login` - Login
- `POST /auth/register` - Register
- `GET /patients` - List patients
- `GET /patients/:id` - Patient detail
- `POST /appointments` - Create appointment
- `GET /appointments?date=YYYY-MM-DD` - List by date
- `PUT /appointments/:id/cancel` - Cancel appointment
- `POST /queue/self-check-in` - Patient self check-in
- `GET /queue/my-entry` - Get own queue position
- `POST /xray-images/upload` - Upload X-ray (multipart)
- `POST /ai/screen-symptoms` - AI symptom chat
- `GET /admin-users` - List all users
- `PUT /admin-users/:id/toggle-active` - Activate/deactivate user
- `GET /dentist-schedules/dentists` - List active dentists
- `GET /analytics/dashboard` - Dashboard statistics

## Backup

Backups are created via `pg_dump` and stored in `server/backups/` with timestamps. Only the 10 most recent backups are kept.

```bash
cd server && npm run db:backup
# Creates: server/backups/dentassist_YYYY-MM-DD_HHMMSS.sql
```

## License

Academic project - Thesis requirement
