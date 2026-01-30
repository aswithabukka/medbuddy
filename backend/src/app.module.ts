import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

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

    // Feature modules will be added here
    // AuthModule,
    // UsersModule,
    // PatientsModule,
    // DoctorsModule,
    // AppointmentsModule,
    // etc.
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Uncomment when rate limiting is fully configured
    // {
    //   provide: APP_GUARD,
    //   useClass: ThrottlerGuard,
    // },
  ],
})
export class AppModule {}
