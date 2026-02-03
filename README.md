# MedBuddy - Telemedicine Consultation Platform

A production-ready telemedicine platform enabling doctors to enroll and patients to discover, book, and attend live video consultations with comprehensive medical record management, prescriptions, and follow-ups.

## 🏗️ Architecture

**Tech Stack:**
- **Backend:** NestJS (Node.js, TypeScript)
- **Frontend Web:** Next.js 14 (React 18, TypeScript)
- **Mobile:** React Native with Expo
- **Database:** PostgreSQL 15 with Prisma ORM
- **Caching/Queue:** Redis + Bull Queue
- **Storage:** AWS S3
- **Video:** Twilio Video API
- **Deployment:** Docker containers

## 📋 Features

### Core Features (MVP)
- ✅ **Authentication & RBAC** - JWT auth with refresh tokens (PATIENT, DOCTOR, ADMIN roles)
- ✅ **Patient Profile** - Demographics, medical conditions, allergies, medications
- ✅ **Doctor Onboarding** - Specialty, qualifications, availability, admin verification
- ✅ **Doctor Discovery** - Search by specialty with filters (fee, language, experience, ratings)
- ✅ **Appointment Booking** - Race-condition-safe booking with timezone handling
- ✅ **Reminders** - Email + push notifications (24h, 1h, 10min before)
- ✅ **Video Consultation** - WebRTC calls via Twilio with waiting room
- ✅ **Medical Reports** - Secure upload/download with signed URLs
- ✅ **Consultation Notes** - SOAP format templates with auto-save
- ✅ **Follow-ups** - Doctor recommends, patient books linked appointments
- ✅ **Prescriptions** - PDF export with digital signature
- ✅ **Ratings & Reviews** - Post-consultation feedback
- ✅ **Medical History Timeline** - Visual timeline of consultations + reports
- ✅ **Admin Panel** - Doctor verification, audit logs, specialty management

### Security Features
- 🔒 Bcrypt password hashing
- 🔒 JWT access + refresh tokens with rotation
- 🔒 Role-based access control (RBAC)
- 🔒 Rate limiting (100 req/min)
- 🔒 CORS whitelist
- 🔒 Helmet.js security headers
- 🔒 Audit logging for critical actions
- 🔒 Signed URLs for file access (1-hour expiry)
- 🔒 HIPAA-style considerations

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm or yarn

### 1. Clone and Setup

```bash
git clone <repository-url>
cd MedBuddy
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Update .env with your credentials:
# - Database URL (Docker: already configured)
# - JWT secrets (change from defaults!)
# - SendGrid API key (for emails)
# - AWS S3 credentials (for file storage)
# - Twilio credentials (for video calls)
# - FCM key (for push notifications)
```

### 3. Start Services

```bash
# Start PostgreSQL and Redis
npm run docker:up

# Wait for services to be healthy (check with: docker ps)
```

### 4. Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

### 5. Start Backend

```bash
# Development mode with hot reload
npm run backend:dev

# Backend runs on http://localhost:3000
# Swagger API docs: http://localhost:3000/api
```

### 6. Access Services

- **Backend API:** http://localhost:3000
- **Prisma Studio:** http://localhost:5555 (when running)
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

## 📁 Project Structure

```
MedBuddy/
├── backend/                    # NestJS Backend API
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   ├── users/             # User management
│   │   ├── patients/          # Patient profiles
│   │   ├── doctors/           # Doctor profiles & search
│   │   ├── appointments/      # Appointment booking
│   │   ├── consultations/     # Consultation notes (SOAP)
│   │   ├── prescriptions/     # Prescription management
│   │   ├── medical-reports/   # Medical report uploads
│   │   ├── video/             # Twilio video integration
│   │   ├── reviews/           # Ratings & reviews
│   │   ├── notifications/     # Email/push notifications
│   │   ├── reminders/         # Appointment reminders
│   │   ├── admin/             # Admin operations
│   │   ├── audit/             # Audit logging
│   │   ├── storage/           # S3 file storage
│   │   ├── jobs/              # Background jobs (Bull)
│   │   ├── cache/             # Redis caching
│   │   └── common/            # Shared utilities
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── Dockerfile
│   └── package.json
│
├── frontend-web/              # Next.js Web App (coming soon)
├── frontend-mobile/           # React Native Mobile App (coming soon)
├── docker-compose.yml         # Docker services
└── package.json               # Root workspace
```

## 🗄️ Database Schema

The platform uses **PostgreSQL** with **25+ tables** including:

**Core Entities:**
- Users, Roles, Auth Tokens
- Patient & Doctor Profiles
- Appointments & Slot Locks (race condition prevention)
- Consultation Notes (SOAP format)
- Prescriptions & Medicines
- Medical Reports & Access Logs
- Video Sessions
- Reviews & Ratings
- Follow-up Recommendations
- Notifications & Reminders
- Audit Logs

See [backend/prisma/schema.prisma](backend/prisma/schema.prisma) for full schema.

## 🔐 Authentication Flow

1. **Registration:** User signs up with email/password
2. **Email Verification:** Verification email sent via SendGrid
3. **Login:** Returns JWT access token (15min) + refresh token (7 days)
4. **Token Refresh:** Refresh token rotates on use
5. **Logout:** Revokes refresh token

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - Register user
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh access token
- `POST /auth/verify-email` - Verify email
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Patients
- `GET /patients/me` - Get profile
- `PUT /patients/me` - Update profile
- `POST /patients/me/conditions` - Add medical condition

### Doctors
- `GET /doctors` - Search doctors (with filters)
- `GET /doctors/:id` - Get doctor profile
- `GET /doctors/:id/slots` - Get available slots
- `PUT /doctors/me` - Update profile
- `POST /doctors/me/availability` - Set availability

### Appointments
- `POST /appointments` - Book appointment
- `GET /appointments` - List appointments
- `PUT /appointments/:id/cancel` - Cancel
- `PUT /appointments/:id/reschedule` - Reschedule

### Video
- `POST /video/token` - Get Twilio token
- `POST /video/:appointmentId/start` - Start session
- `POST /video/:appointmentId/end` - End session

### Prescriptions
- `POST /prescriptions` - Create prescription
- `GET /prescriptions/:id/pdf` - Download PDF

### Medical Reports
- `POST /medical-reports/upload` - Upload report
- `GET /medical-reports/:id/download` - Get signed URL

See Swagger docs at http://localhost:3000/api for complete API reference.

## 🧪 Testing

```bash
# Unit tests
npm run backend:test

# E2E tests
cd backend && npm run test:e2e

# Coverage report
cd backend && npm run test:cov
```

## 🚢 Deployment

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables (Production)

Ensure these are set in production:
- ✅ Strong JWT secrets (min 32 chars)
- ✅ SendGrid API key (for emails)
- ✅ AWS S3 credentials (for file storage)
- ✅ Twilio credentials (for video)
- ✅ Database URL (use managed DB like AWS RDS)
- ✅ Redis URL (use managed Redis like AWS ElastiCache)

### Database Migrations

```bash
# Production migration
cd backend && npx prisma migrate deploy
```

## 📈 Performance & Scalability

- **Slot Locking:** Redis distributed locks prevent double-booking
- **Caching:** Doctor search results cached in Redis
- **Background Jobs:** Bull queue for email/notifications
- **Database Indexes:** Optimized queries with strategic indexes
- **File Storage:** S3 with signed URLs (no direct access)
- **Stateless API:** Horizontal scaling ready

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Change default JWT secrets** - Use strong random strings (32+ chars)
3. **Enable HTTPS in production** - TLS 1.2+
4. **Configure CORS properly** - Whitelist specific origins
5. **Regular dependency updates** - Run `npm audit` regularly
6. **Use managed services** - RDS, ElastiCache for production
7. **Implement rate limiting** - Prevent brute force attacks
8. **Sign BAAs with vendors** - Twilio, SendGrid, AWS for HIPAA compliance

## 🛠️ Development Tools

```bash
# Start all services
npm run docker:up

# View logs
npm run docker:logs

# Stop all services
npm run docker:down

# Open Prisma Studio (DB GUI)
npm run prisma:studio

# Run migrations
npm run prisma:migrate

# Format code
cd backend && npm run format

# Lint code
cd backend && npm run lint
```

## 📚 Documentation

- **Architecture Plan:** [.claude/plans/bubbly-noodling-pnueli.md](.claude/plans/bubbly-noodling-pnueli.md)
- **Database Schema:** [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
- **API Docs:** http://localhost:3000/api (Swagger)

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "Add feature"`
3. Push: `git push origin feature/your-feature`
4. Create Pull Request

**Pre-commit hooks will:**
- Run ESLint and auto-fix issues
- Format code with Prettier
- Run type checking

## 📝 License

UNLICENSED - Private project


---

**Status:** 🚧 In Development - Phase 1: Foundation Complete

**Next Steps:**
1. Implement authentication module
2. Build patient & doctor profile modules
3. Create appointment booking system
4. Integrate Twilio video
5. Develop frontend web app (Next.js)
6. Build mobile app (React Native)
