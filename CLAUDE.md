# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MedBuddy** is a production-ready telemedicine consultation platform with:
- **Backend**: NestJS (TypeScript) REST API at `/backend`
- **Frontend Web**: Next.js 14 (App Router) at `/frontend-web`
- **Database**: PostgreSQL 15 with Prisma ORM
- **Cache/Queue**: Redis + Bull Queue
- **Auth**: JWT with refresh token rotation
- **Roles**: PATIENT, DOCTOR, ADMIN with full RBAC

## Development Commands

### Starting the Application

```bash
# From project root - Start PostgreSQL and Redis containers
npm run docker:up

# Start backend API (runs on port 3000)
npm run backend:dev

# Start frontend web (runs on port 3001)
npm run frontend-web:dev
```

### Database Operations

```bash
# Generate Prisma Client (run after schema changes)
npm run prisma:generate

# Create and apply migration
npm run prisma:migrate

# Open Prisma Studio (database GUI on port 5555)
npm run prisma:studio

# Direct Prisma commands
cd backend
npx prisma migrate dev --name migration_name
npx prisma migrate deploy  # Production only
npx prisma db push         # Dev: push without migration
```

### Backend Commands

```bash
cd backend

npm run start:dev          # Development with hot reload
npm run start:debug        # Debug mode
npm run build              # Production build
npm run start:prod         # Production mode

npm run lint               # ESLint with auto-fix
npm run format             # Prettier formatting
npm run test               # Unit tests
npm run test:watch         # Test watch mode
npm run test:cov           # Coverage report
npm run test:e2e           # End-to-end tests
```

### Frontend Commands

```bash
cd frontend-web

npm run dev                # Development server
npm run build              # Production build
npm run start              # Production server
npm run lint               # ESLint
```

### Docker Operations

```bash
npm run docker:up          # Start all services
npm run docker:down        # Stop all services
npm run docker:logs        # View logs (tail -f)

docker ps                  # Check service health
docker-compose restart backend
```

## Architecture Patterns

### Backend Architecture (NestJS)

**Module Structure**: Each feature follows this pattern:
```
module-name/
├── module-name.module.ts       # Dependencies, imports, providers
├── module-name.controller.ts   # HTTP endpoints
├── module-name.service.ts      # Business logic
├── dto/                        # Data Transfer Objects (validation)
│   ├── create-*.dto.ts
│   └── update-*.dto.ts
└── services/                   # Additional helper services
```

**Authentication Flow**:
1. All protected routes use `@UseGuards(JwtAuthGuard, RolesGuard)`
2. Use `@Roles(UserRole.PATIENT)` decorator to restrict by role
3. Use `@CurrentUser('sub')` to get userId from JWT
4. Use `@Public()` decorator to bypass auth on public endpoints

**Example Controller Pattern**:
```typescript
@Controller('resource')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ResourceController {
  @Get('me')
  @Roles(UserRole.PATIENT)
  async getMyResource(@CurrentUser('sub') userId: string) {
    // Implementation
  }

  @Public()
  @Get('search')
  async search(@Query() dto: SearchDto) {
    // Public endpoint
  }
}
```

**Prisma Usage**:
- PrismaService injected via DI: `constructor(private prisma: PrismaService)`
- Always use transactions for multi-step operations
- Relations loaded explicitly: `include: { relation: true }`

### Frontend Architecture (Next.js)

**App Router Structure**: Role-based route groups:
```
app/
├── (auth)/          # Auth layout: /auth/login, /auth/register
├── (patient)/       # Patient routes: /patient/dashboard, /patient/search-doctors
├── (doctor)/        # Doctor routes: /doctor/dashboard, /doctor/appointments
└── (admin)/         # Admin routes (future)
```

**State Management**:
- **Server State**: TanStack Query (React Query) for all API data
- **Global Client State**: Zustand for auth state (`authStore`)
- **Form State**: React Hook Form with Zod validation

**API Integration Pattern**:
```typescript
// 1. Define API function in lib/api/*.ts
export const resourceAPI = {
  get: async (): Promise<ApiResponse<Resource>> => {
    const response = await apiClient.get<ApiResponse<Resource>>('/endpoint');
    return response.data;
  },
};

// 2. Create custom hook in lib/hooks/*.ts
export function useResource() {
  return useQuery({
    queryKey: ['resource'],
    queryFn: () => resourceAPI.get(),
  });
}

// 3. Use in component
const { data, isLoading } = useResource();
```

**Protected Routes**: Wrap pages with:
```typescript
<ProtectedRoute allowedRoles={['PATIENT']}>
  {/* Page content */}
</ProtectedRoute>
```

**Error Handling**: Consistent pattern across all API hooks:
```typescript
onError: (error: any) => {
  const message =
    error.response?.data?.error?.message ||
    error.response?.data?.message ||
    'Fallback error message';
  toast.error(message);
}
```

## API Structure

**Base URL**: `http://localhost:3000/api/v1`

**Response Format**: All endpoints return:
```typescript
{
  success: true,
  message: "Optional message",
  data: { /* response data */ }
}
```

**Error Format**:
```typescript
{
  success: false,
  error: {
    message: "Error description",
    statusCode: 400
  }
}
```

**Authentication**: Include JWT in headers:
```
Authorization: Bearer <access_token>
```

**Key Endpoints**:
- Auth: `/api/v1/auth/*` (public)
- Patients: `/api/v1/patients/me/*` (PATIENT role)
- Doctors: `/api/v1/doctors/*` (public search, protected profile)
- Specialties: `/api/v1/specialties` (public)
- Appointments: `/api/v1/appointments/*` (PATIENT/DOCTOR roles)
- Consultations: `/api/v1/consultations/*` (DOCTOR role)
- Prescriptions: `/api/v1/prescriptions/*` (DOCTOR role)
- Video: `/api/v1/video/:appointmentId/token` (PATIENT/DOCTOR), `/api/v1/video/:appointmentId/end` (DOCTOR only)

**Swagger Docs**: http://localhost:3000/api

## Critical Implementation Details

### Race Condition Prevention (Appointment Booking)

The booking system uses **distributed locking** with Redis + database locks:

```typescript
// In appointments/services/booking.service.ts
async bookAppointment(dto: CreateAppointmentDto) {
  // 1. Acquire distributed lock
  const lockAcquired = await slotLockService.acquireLock(
    doctorId, slotStart, slotEnd, patientId
  );

  if (!lockAcquired) {
    throw new ConflictException('Slot is being booked by another patient');
  }

  try {
    // 2. Verify availability in transaction
    // 3. Create appointment
    // 4. Create reminders
  } finally {
    // 5. Always release lock
    await slotLockService.releaseLock(...);
  }
}
```

**Never bypass this pattern** when implementing appointment-related features.

### Token Refresh Flow

API client (`lib/api/client.ts`) handles token refresh automatically:

1. Access token expires (401 response)
2. Interceptor catches 401 and calls `/auth/refresh` with refresh token
3. New access token stored in Zustand store
4. Original request retried with new token
5. If refresh fails, user redirected to login

**Don't implement manual token refresh** - it's handled globally.

### Enum Value Mapping

Backend uses `SCREAMING_SNAKE_CASE` for enums, but frontend displays user-friendly values:

```typescript
// Blood Type example
<SelectItem value="A_POSITIVE">A+</SelectItem>  // ✅ Correct
<SelectItem value="A+">A+</SelectItem>          // ❌ Backend will reject

// Gender example
<SelectItem value="MALE">Male</SelectItem>      // ✅ Correct
```

**Always check Prisma schema** for enum values when working with dropdowns.

### Select Component Requirements (shadcn/ui)

```typescript
// ✅ Correct: Use undefined for unselected state
<Select value={value || undefined}>
  <SelectContent>
    {/* No empty string values */}
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>

// ❌ Incorrect: Will throw runtime error
<Select value={value}>
  <SelectContent>
    <SelectItem value="">All options</SelectItem>  {/* Error! */}
  </SelectContent>
</Select>
```

### SOAP Notes Auto-Save

Consultation notes use **debounced auto-save** (2 seconds):

```typescript
const debouncedSave = useDebouncedCallback((values) => {
  saveNote(values);
}, 2000);

useEffect(() => {
  const subscription = form.watch((values) => {
    debouncedSave(values);
  });
  return () => subscription.unsubscribe();
}, [form, debouncedSave]);
```

**Don't use manual save buttons** - auto-save is the pattern.

### DoctorProfile.id vs User.id

Search results and list queries return `DoctorProfile` rows. `DoctorProfile.id` is the **profile's** primary key — it is **not** the user ID. Backend routes like `GET /doctors/:userId/profile` and `GET /doctors/:userId/slots` expect the **User's** ID. Always use `doctor.userId` (not `doctor.id`) when building URLs or passing IDs to these endpoints.

### React Falsy Rendering Pitfall

`{count && <Component />}` renders the literal string `"0"` when `count` is `0`. Use a ternary or boolean coercion instead:

```typescript
// ❌ Renders "0" when count is 0
{count && <Badge>{count}</Badge>}

// ✅ Renders nothing when count is 0
{count ? <Badge>{count}</Badge> : null}
```

### Dual Availability System

Doctors have **two availability models** that must always be checked together:

| System | Model | Key Fields |
|--------|-------|------------|
| Legacy | `DoctorAvailabilityTemplate` | `dayOfWeek`, `startTime`, `endTime` (repeats every week) |
| New | `DoctorAvailability` | `date`, `startTime`, `endTime`, `recurrenceType` (NONE / DAILY / WEEKLY / MONTHLY) |

All three of the following locations must handle both systems:

1. **Slot listing** (`doctors.service.ts` → `getAvailableSlots`): Merges slots from both models, deduplicates, and sorts before returning.
2. **Booking validation** (`booking.service.ts`): Checks legacy templates first; if no match, queries `DoctorAvailability` with full recurrence logic.
3. **Patient calendar highlighting** (`app/patient/doctors/[id]/page.tsx`): `isDateAvailable` checks both models so green-highlighted days are accurate.

**Never add availability logic to only one system** — a doctor may use either or both.

### Slot API Response Shape

The `/doctors/:userId/slots` endpoint does **not** return a flat array. The response shape is:

```typescript
{
  success: true,
  data: {
    available: boolean,       // whether any slots exist for the date
    slots: ["08:00", "09:00", ...],  // time strings, NOT ISO datetimes
    timezone: "Asia/Kolkata"
  }
}
```

The frontend must transform these time strings into full ISO datetime objects using the selected date before displaying or submitting them.

### Video Consultation (Twilio)

Video calls are powered by Twilio Video. The feature is **disabled gracefully** when Twilio env vars are missing (returns a 400 with a user-facing message).

**Backend flow** (`appointments/services/video.service.ts`):
1. Validate the requesting user is the patient or doctor on the appointment and that it is `CONFIRMED`.
2. Generate a Twilio `AccessToken` with a `VideoGrant` scoped to room `medbuddy-{appointmentId}`.
3. On first token request, create a `VideoSession` record (tracks `startedAt`).
4. Doctor-only `endSession`: updates `VideoSession` with `endedAt` / `durationSeconds`, then ends the Twilio room via REST API.

**Frontend flow** (`components/shared/VideoRoom.tsx`):
1. `twilio-video` is **dynamically imported** (`await import('twilio-video')`) to avoid SSR errors — do not change this to a static import.
2. Component manages four states: `idle` → `connecting` → `connected` (or `error` with retry).
3. Local and remote video tracks are attached/detached imperatively via refs.
4. Doctor sees "End Call" (calls backend `endSession`); patient sees "Leave" (client-side disconnect only).
5. Cleanup hook disconnects the room on unmount.

**Integration point**: `components/shared/AppointmentDetails.tsx` renders `<VideoRoom>` for confirmed appointments, passing the `appointmentId` and the current user's `role`.

## Environment Variables

### Backend (.env)

Required for development:
```bash
DATABASE_URL="postgresql://medbuddy:medbuddy_dev_password@localhost:5432/medbuddy"
REDIS_HOST="localhost"
REDIS_PORT="6379"
JWT_SECRET="dev_jwt_secret_change_in_production"
JWT_REFRESH_SECRET="dev_jwt_refresh_secret_change_in_production"

# Optional (features disabled without these):
SENDGRID_API_KEY=""          # Email notifications
AWS_ACCESS_KEY_ID=""         # File uploads
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET=""
TWILIO_ACCOUNT_SID=""        # Video calls
TWILIO_API_KEY=""
TWILIO_API_SECRET=""
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

**Note**: Port 3001 is used for frontend to avoid conflict with backend (3000).

## Database Schema Key Entities

**Users & Auth**:
- `User` → one-to-one → `PatientProfile` or `DoctorProfile`
- `RefreshToken` → for JWT rotation
- `PasswordResetToken` → for forgot password flow

**Appointments & Availability**:
- `Appointment` → many-to-one → `Patient`, `Doctor`
- `AppointmentSlotLock` → race condition prevention (Redis-backed)
- `AppointmentReminder` → scheduled notifications
- `DoctorAvailabilityTemplate` → legacy weekly recurring slots (by `dayOfWeek`)
- `DoctorAvailability` → new date-based slots with `RecurrenceType` (NONE / DAILY / WEEKLY / MONTHLY)
- `VideoSession` → one-to-one with `Appointment`; tracks `startedAt`, `endedAt`, `durationSeconds` for each video call

**Medical Data**:
- `PatientCondition` → medical history
- `ConsultationNote` → SOAP format (Subjective, Objective, Assessment, Plan)
- `Prescription` → one-to-many → `PrescriptionMedicine`
- `MedicalReport` → S3 file references with signed URLs

**Relationships**: Always load with `include`:
```typescript
const appointment = await this.prisma.appointment.findUnique({
  where: { id },
  include: {
    doctor: {
      include: { specialties: true, languages: true }
    },
    patient: true
  }
});
```

## Testing

### Backend Testing

```bash
# Run all tests
npm run test

# Test specific file
npm run test -- users.service.spec.ts

# Watch mode
npm run test:watch

# E2E tests (requires test database)
npm run test:e2e

# Coverage
npm run test:cov
```

**Test Pattern**: Each service has a `.spec.ts` file with:
- Mock Prisma client
- Test for success cases
- Test for error handling
- Test for edge cases

### Frontend Testing

Currently no test setup. Future: Jest + React Testing Library.

## Common Issues & Solutions

### Issue: "Cannot GET /api/v1/endpoint"

- ✅ Check endpoint exists in Swagger docs
- ✅ Verify route matches controller path exactly
- ✅ Ensure controller is imported in module's `controllers` array
- ✅ Check if endpoint requires authentication (missing `@Public()`)

### Issue: "Forbidden resource" (403)

- ✅ Verify user has correct role for endpoint
- ✅ Check `@Roles()` decorator matches user's role
- ✅ Ensure JWT token is valid and not expired

### Issue: "Enum validation failed"

- ✅ Check Prisma schema for exact enum values
- ✅ Frontend must send backend enum format (e.g., `A_POSITIVE` not `A+`)
- ✅ Use `<SelectItem value="ENUM_VALUE">Display Text</SelectItem>`

### Issue: Select component error "value prop cannot be empty string"

- ✅ Remove `<SelectItem value="">` entries
- ✅ Use `value={field || undefined}` for unselected state
- ✅ Don't use empty string as placeholder value

### Issue: Token refresh loop

- ✅ Check refresh token is valid in database
- ✅ Ensure `/auth/refresh` endpoint is excluded from auth guard
- ✅ Verify `originalRequest._retry` flag is set to prevent infinite loops

### Issue: Doctor detail page shows "No available slots" despite availability being set

- ✅ The doctor may be using the **new** `DoctorAvailability` model instead of (or in addition to) the legacy `DoctorAvailabilityTemplate`
- ✅ `getAvailableSlots` in `doctors.service.ts` must check **both** models with full recurrence logic
- ✅ The patient booking calendar highlighting (`isDateAvailable`) must also check both models

### Issue: "Failed to book appointment" on a visibly available slot

- ✅ Confirm the booking mutation sends `doctorUserId` (not `doctorId`) — the backend DTO field is `doctorUserId`
- ✅ Booking validation in `booking.service.ts` must check both availability systems, same as slot listing
- ✅ Ensure the slot time submitted matches one of the times returned by `/doctors/:userId/slots`

### Issue: Video call button does nothing / "Video calling is not configured"

- ✅ Set `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY`, and `TWILIO_API_SECRET` in the backend `.env`
- ✅ The appointment must have status `CONFIRMED`
- ✅ Only the patient and doctor on that specific appointment can request a token

### Issue: Prisma Client errors

```bash
# Regenerate Prisma Client after schema changes
npm run prisma:generate

# Check migration status
cd backend && npx prisma migrate status

# Reset database (WARNING: deletes data)
cd backend && npx prisma migrate reset
```

## File Structure Conventions

### Backend

- **Controllers**: Define routes, validation, guards only. No business logic.
- **Services**: All business logic, database queries, external API calls.
- **DTOs**: Validation with `class-validator` decorators.
- **Guards**: Reusable auth/authorization logic.
- **Decorators**: Custom parameter decorators (e.g., `@CurrentUser()`).

### Frontend

- **app/**: Pages using App Router conventions
- **components/**: Reusable UI components
  - `components/ui/`: shadcn/ui base components (don't modify)
  - `components/shared/`: Cross-role shared components
  - `components/patient/`, `components/doctor/`: Role-specific
- **lib/api/**: API client functions (one file per resource)
- **lib/hooks/**: TanStack Query hooks (one file per resource)
- **lib/schemas/**: Zod validation schemas for forms
- **lib/store/**: Zustand stores (auth store only currently)
- **types/**: Shared TypeScript interfaces

**Key frontend dependencies**:
- `twilio-video` — must be dynamically imported (see Video Consultation section) to avoid SSR crashes
- `react-day-picker` (via shadcn Calendar) — supports `modifiers` / `modifiersClassNames` for conditional day styling (used for available-day highlighting)

## Security Considerations

- **Passwords**: Always hashed with bcrypt (10 rounds) - never log or expose
- **JWT Secrets**: Must be 32+ characters in production, never commit to git
- **File Uploads**: Use signed URLs with 1-hour expiry, never direct S3 access
- **Rate Limiting**: Configured globally, don't disable for legitimate routes
- **CORS**: Whitelist specific origins in production (no wildcards)
- **Audit Logs**: Critical actions automatically logged via interceptor
- **SQL Injection**: Use Prisma parameterized queries (never raw SQL)
- **XSS**: React auto-escapes, but validate/sanitize user input in backend

## Deployment Notes

**Development**:
- Backend: `npm run backend:dev` (port 3000)
- Frontend: `npm run frontend-web:dev` (port 3001)
- Services: `npm run docker:up` (Postgres + Redis)

**Production**:
- Use `docker-compose -f docker-compose.prod.yml up`
- Set strong JWT secrets (32+ characters)
- Configure managed database (AWS RDS) and Redis (ElastiCache)
- Enable HTTPS with TLS 1.2+
- Set up monitoring (DataDog/New Relic) and error tracking (Sentry)
- Run migrations: `cd backend && npx prisma migrate deploy`

## Additional Resources

- **Architecture Plan**: `.claude/plans/bubbly-noodling-pnueli.md`
- **Database Schema**: `backend/prisma/schema.prisma`
- **API Documentation**: http://localhost:3000/api (Swagger)
- **Prisma Docs**: https://www.prisma.io/docs
- **NestJS Docs**: https://docs.nestjs.com
- **Next.js Docs**: https://nextjs.org/docs
- **TanStack Query**: https://tanstack.com/query/latest
