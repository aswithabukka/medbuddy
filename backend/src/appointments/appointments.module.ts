import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { BookingService } from './services/booking.service';
import { SlotLockService } from './services/slot-lock.service';

@Module({
  providers: [AppointmentsService, BookingService, SlotLockService],
  controllers: [AppointmentsController],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
