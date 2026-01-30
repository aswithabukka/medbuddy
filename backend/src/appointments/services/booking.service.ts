import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SlotLockService } from './slot-lock.service';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UserRole, AppointmentStatus, DoctorStatus } from '@prisma/client';

/**
 * BookingService handles the core appointment booking logic
 * Implements slot locking to prevent race conditions
 */
@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private slotLockService: SlotLockService,
  ) {}

  /**
   * Book an appointment with race condition prevention
   * Uses distributed locking to ensure no double-booking
   */
  async bookAppointment(patientUserId: string, dto: CreateAppointmentDto) {
    // 1. Validate patient exists and has PATIENT role
    const patient = await this.prisma.user.findUnique({
      where: { id: patientUserId },
      include: {
        patientProfile: true,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (patient.role !== UserRole.PATIENT) {
      throw new BadRequestException('Only patients can book appointments');
    }

    if (!patient.patientProfile) {
      throw new BadRequestException('Please complete your patient profile before booking appointments');
    }

    // 2. Validate doctor exists and is approved
    const doctor = await this.prisma.user.findUnique({
      where: { id: dto.doctorUserId },
      include: {
        doctorProfile: true,
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    if (!doctor.doctorProfile) {
      throw new NotFoundException('Doctor profile not found');
    }

    if (doctor.doctorProfile.status !== DoctorStatus.APPROVED) {
      throw new BadRequestException('Doctor is not approved for consultations');
    }

    // 3. Parse and validate appointment time
    const scheduledAt = new Date(dto.scheduledAt);
    const now = new Date();

    if (scheduledAt <= now) {
      throw new BadRequestException('Appointment time must be in the future');
    }

    // Don't allow booking more than 90 days in advance
    const maxAdvanceDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    if (scheduledAt > maxAdvanceDate) {
      throw new BadRequestException('Cannot book appointments more than 90 days in advance');
    }

    const durationMinutes = dto.durationMinutes || 30;
    const slotEnd = new Date(scheduledAt.getTime() + durationMinutes * 60 * 1000);

    // 4. Acquire distributed lock for this slot
    const lockAcquired = await this.slotLockService.acquireLock(
      doctor.doctorProfile.id,
      scheduledAt,
      slotEnd,
      patientUserId,
    );

    if (!lockAcquired) {
      throw new ConflictException('This slot is currently being booked by another patient. Please try again.');
    }

    try {
      // 5. Double-check slot availability within transaction
      const existingAppointment = await this.prisma.appointment.findFirst({
        where: {
          doctorId: doctor.doctorProfile.id,
          scheduledAt,
          status: {
            notIn: [AppointmentStatus.CANCELLED],
          },
        },
      });

      if (existingAppointment) {
        throw new ConflictException('This slot is no longer available');
      }

      // 6. Check if doctor is unavailable on this date
      const appointmentDate = new Date(scheduledAt);
      appointmentDate.setHours(0, 0, 0, 0);

      const unavailableDate = await this.prisma.doctorUnavailableDate.findFirst({
        where: {
          doctorId: doctor.doctorProfile.id,
          date: appointmentDate,
        },
      });

      if (unavailableDate) {
        throw new ConflictException('Doctor is unavailable on this date');
      }

      // 7. Validate that the slot matches doctor's availability template
      const dayOfWeek = scheduledAt.getDay();
      const dayMapping = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const dayName = dayMapping[dayOfWeek];

      const timeString = `${String(scheduledAt.getHours()).padStart(2, '0')}:${String(scheduledAt.getMinutes()).padStart(2, '0')}`;

      const availability = await this.prisma.doctorAvailabilityTemplate.findFirst({
        where: {
          doctorId: doctor.doctorProfile.id,
          dayOfWeek: dayName as any,
          startTime: {
            lte: timeString,
          },
          endTime: {
            gt: timeString,
          },
        },
      });

      if (!availability) {
        throw new ConflictException('Doctor is not available at this time');
      }

      // 8. Create appointment in transaction
      const appointment = await this.prisma.appointment.create({
        data: {
          patientId: patient.patientProfile.id,
          doctorId: doctor.doctorProfile.id,
          scheduledAt,
          durationMinutes,
          patientTimezone: dto.patientTimezone || 'UTC',
          doctorTimezone: doctor.doctorProfile.timezone,
          consultationFee: doctor.doctorProfile.consultationFee,
          status: AppointmentStatus.CONFIRMED,
        },
        include: {
          patient: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
          doctor: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // TODO: Create appointment reminders (will be implemented in reminders module)
      // TODO: Send confirmation email (will be implemented in notifications module)

      return {
        success: true,
        message: 'Appointment booked successfully',
        data: appointment,
      };
    } finally {
      // 9. Always release the lock, even if booking fails
      await this.slotLockService.releaseLock(doctor.doctorProfile.id, scheduledAt, patientUserId);
    }
  }

  /**
   * Check if a specific slot is available for booking
   */
  async isSlotAvailable(doctorUserId: string, scheduledAt: Date): Promise<boolean> {
    const doctor = await this.prisma.user.findUnique({
      where: { id: doctorUserId },
      include: {
        doctorProfile: true,
      },
    });

    if (!doctor?.doctorProfile) {
      return false;
    }

    // Check for existing appointment
    const existingAppointment = await this.prisma.appointment.findFirst({
      where: {
        doctorId: doctor.doctorProfile.id,
        scheduledAt,
        status: {
          notIn: [AppointmentStatus.CANCELLED],
        },
      },
    });

    if (existingAppointment) {
      return false;
    }

    // Check if slot is currently locked
    const isLocked = await this.slotLockService.isSlotLocked(doctor.doctorProfile.id, scheduledAt);
    if (isLocked) {
      return false;
    }

    return true;
  }
}
