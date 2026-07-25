# DentAssist - Dental Clinic Management System

A full-stack web application for managing dental clinic operations including patient records, appointments, queue management, X-ray analysis with AI, prescriptions, loyalty rewards, and a patient kiosk mode.

**Live App:** [https://dentassist-six.vercel.app](https://dentassist-six.vercel.app)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4, Recharts, Three.js (3D clinic view) |
| Backend | Express 5, Prisma ORM, Socket.IO |
| Database | PostgreSQL via Supabase (hosted on AWS) |
| Storage | Supabase Storage (avatars, X-ray uploads) |
| AI | Google Gemini API (direct integration in Node.js) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Deployment | Vercel (frontend), Render (backend), Supabase (database + storage) |

## Deployment Architecture

```
┌─────────────────┐     /api/*      ┌──────────────────┐     SQL      ┌──────────────────┐
│                  │ ──────────────> │                  │ ───────────> │                  │
│  Vercel (CDN)    │                 │  Render          │              │  Supabase        │
│  React Frontend  │ <────────────── │  Express Backend  │              │  PostgreSQL DB   │
│                  │     JSON        │  + Socket.IO     │              │  + File Storage  │
└─────────────────┘                  └──────────────────┘              └──────────────────┘
    dentassist-six.                     dentassist-backend.               qxwqwlauxrbrbjgpucgd.
    vercel.app                          onrender.com                      supabase.co
```

## Features

- **Dashboard** - Real-time stats, 3D clinic visualization, dentist workload charts
- **Patient Management** - CRUD, dental chart (interactive 32-tooth diagram), medical history
- **Appointments** - Calendar view, booking, status tracking, dentist scheduling
- **Queue Management** - Walk-in check-in, real-time queue updates via WebSocket
- **Kiosk Mode** - Touch-optimized patient self-service (check-in, book, view records)
- **X-Ray Analysis** - Upload X-rays, AI-powered analysis via Gemini
- **Oral Screening** - AI-powered intraoral photo analysis
- **AI Chat Assistant** - Live clinic data-aware dental chatbot
- **Treatment Suggestions** - AI clinical decision support for dentists
- **Smile Simulation** - AI smile makeover preview
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
│   ├── public/           # Static assets (images, videos)
│   └── vercel.json       # Vercel rewrites (proxies /api to Render backend)
├── server/               # Express API
│   ├── routes/           # Route handlers (appointments, patients, queue, AI, etc.)
│   ├── prisma/           # Schema, migrations, seed, backup
│   ├── lib/              # Shared utilities (storage.js for Supabase)
│   ├── middleware/        # Auth, validation, rate limiting
│   └── index.js          # Server entry point
├── render.yaml           # Render deployment blueprint
└── README.md
```

## Environment Variables

### Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection pooler (port 6543, pgbouncer=true) |
| `DIRECT_URL` | Supabase PostgreSQL direct connection (port 5432, for migrations) |
| `JWT_SECRET` | Secret for signing JWT access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing JWT refresh tokens |
| `GEMINI_API_KEY` | Google Gemini API key for AI features |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (for storage operations) |
| `CORS_ORIGINS` | Comma-separated allowed origins (e.g., Vercel URL) |
| `NODE_ENV` | Set to `production` on deployment |

## Setup (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (or use Supabase for zero-config setup)

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
Copy `server/.env.example` to `server/.env` and fill in your values.

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

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Patients
- `GET /api/patients` - List patients
- `GET /api/patients/:id` - Patient detail
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `PUT /api/patients/:patientId/teeth/:toothNumber` - Update tooth

### Appointments
- `GET /api/appointments?date=YYYY-MM-DD` - List by date
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `PUT /api/appointments/:id/cancel` - Cancel appointment

### Queue
- `POST /api/queue/self-check-in` - Patient self check-in
- `GET /api/queue/my-entry` - Get own queue position

### X-Ray
- `GET /api/xray/patient/:patientId` - List patient X-rays
- `POST /api/xray/upload` - Upload X-ray (multipart)
- `POST /api/xray/analyze/:id` - AI analysis of X-ray
- `DELETE /api/xray/:id` - Delete X-ray

### AI
- `POST /api/ai/chat` - AI chat assistant
- `POST /api/ai/xray/analyze` - AI X-ray analysis
- `POST /api/ai/oral/screen` - AI oral screening
- `POST /api/ai/treatment/suggest` - AI treatment suggestions
- `POST /api/ai/smile/simulate` - AI smile simulation

### Admin
- `GET /api/admin-users` - List all users
- `POST /api/admin-users` - Create user
- `PUT /api/admin-users/:id` - Update user
- `DELETE /api/admin-users/:id` - Delete user
- `PUT /api/admin-users/:id/toggle-active` - Activate/deactivate user

### Other
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/dentist-schedules/dentists` - List active dentists
- `GET /api/server-info` - Server info (for QR code)
- `GET /api/notifications` - User notifications
- `GET /api/loyalty` - Patient loyalty points
- `GET /api/badges` - Achievement badges

## Backup

Backups are created via `pg_dump` and stored in `server/backups/` with timestamps. Only the 10 most recent backups are kept.

```bash
cd server && npm run db:backup
# Creates: server/backups/dentassist_YYYY-MM-DD_HHMMSS.sql
```

## License

Academic project - Thesis requirement
