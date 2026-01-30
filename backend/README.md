# MedBuddy Backend API

NestJS-based REST API for the MedBuddy telemedicine platform.

## Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Update .env with your credentials

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

## Available Scripts

```bash
npm run start:dev      # Development mode with hot reload
npm run start:debug    # Debug mode
npm run build          # Production build
npm run start:prod     # Production mode
npm run lint           # Run ESLint
npm run format         # Format with Prettier
npm run test           # Run tests
npm run test:watch     # Test watch mode
npm run test:cov       # Test coverage
npm run test:e2e       # E2E tests
```

## Prisma Commands

```bash
npx prisma generate           # Generate Prisma Client
npx prisma migrate dev        # Create and apply migration
npx prisma migrate deploy     # Apply migrations (production)
npx prisma studio             # Open Prisma Studio GUI
npx prisma db pull            # Pull schema from database
npx prisma db push            # Push schema to database (dev only)
```

## Module Structure

Each module follows NestJS best practices:

```
module-name/
├── module-name.module.ts       # Module definition
├── module-name.controller.ts   # HTTP endpoints
├── module-name.service.ts      # Business logic
├── dto/                        # Data Transfer Objects
│   ├── create-module.dto.ts
│   └── update-module.dto.ts
├── entities/                   # Entity models (optional)
├── guards/                     # Custom guards
├── interceptors/               # Custom interceptors
└── services/                   # Additional services
```

## Environment Variables

See `.env.example` for all required environment variables.

**Critical:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT access token secret (min 32 chars)
- `JWT_REFRESH_SECRET` - JWT refresh token secret (min 32 chars)
- `SENDGRID_API_KEY` - SendGrid for emails
- `TWILIO_*` - Twilio credentials for video
- `AWS_*` - AWS S3 credentials for file storage

## API Documentation

Swagger documentation available at: http://localhost:3000/api

## Testing

```bash
# Unit tests
npm run test

# Specific test file
npm run test -- users.service.spec.ts

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Database Migrations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Deployment

```bash
# Build
npm run build

# Start production server
npm run start:prod
```

## License

UNLICENSED
