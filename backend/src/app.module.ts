import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { SpecialtiesModule } from './specialties/specialties.module';
import { DoctorsModule } from './doctors/doctors.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';

@Module({
  imports: [
    // Configuration module for environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting module
    ThrottlerModule.forRoot([{
      ttl: parseInt(process.env.RATE_LIMIT_TTL || '60') || 60, // 60 seconds
      limit: parseInt(process.env.RATE_LIMIT_MAX || '100') || 100,  // 100 requests
    }]),

    // Prisma database module (global)
    PrismaModule,

    // Authentication module
    AuthModule,

    UsersModule,

    PatientsModule,

    SpecialtiesModule,

    DoctorsModule,

    AppointmentsModule,

    ConsultationsModule,

    PrescriptionsModule,

    // Feature modules will be added here
    // UsersModule,
    // PatientsModule,
    // DoctorsModule,
    // AppointmentsModule,
    // etc.
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global JWT authentication guard (can be bypassed with @Public() decorator)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Uncomment when rate limiting is fully configured
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
})
export class AppModule {}
