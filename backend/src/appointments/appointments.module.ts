import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { BookingService } from './services/booking.service';
import { SlotLockService } from './services/slot-lock.service';
import { VideoService } from './services/video.service';
import { VideoController } from './video.controller';

@Module({
  providers: [AppointmentsService, BookingService, SlotLockService, VideoService],
  controllers: [AppointmentsController, VideoController],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
