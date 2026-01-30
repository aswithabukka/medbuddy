import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingService } from './services/booking.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { UserRole, AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private bookingService: BookingService,
  ) {}

  /**
   * Book a new appointment
   */
  async bookAppointment(patientUserId: string, dto: CreateAppointmentDto) {
    return this.bookingService.bookAppointment(patientUserId, dto);
  }

  /**
   * Get all appointments for a user (filtered by role)
   */
  async findAll(userId: string, userRole: UserRole) {
    let where: any = {};

    if (userRole === UserRole.PATIENT) {
      // Get patient profile ID
      const patientProfile = await this.prisma.patientProfile.findUnique({
        where: { userId },
      });

      if (!patientProfile) {
        return {
          success: true,
          data: [],
        };
      }

      where = {
        patientId: patientProfile.id,
      };
    } else if (userRole === UserRole.DOCTOR) {
      // Get doctor profile ID
      const doctorProfile = await this.prisma.doctorProfile.findUnique({
        where: { userId },
      });

      if (!doctorProfile) {
        return {
          success: true,
          data: [],
        };
      }

      where = {
        doctorId: doctorProfile.id,
      };
    } else if (userRole === UserRole.ADMIN) {
      // Admin can see all appointments
      where = {};
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
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
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    return {
      success: true,
      data: appointments,
    };
  }

  /**
   * Get a specific appointment by ID
   */
  async findOne(appointmentId: string, userId: string, userRole: UserRole) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
            conditions: true,
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
            specialties: {
              include: {
                specialty: true,
              },
            },
          },
        },
        consultationNote: true,
        prescription: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Access control
    const isPatient = appointment.patient.userId === userId;
    const isDoctor = appointment.doctor.userId === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new ForbiddenException('You do not have access to this appointment');
    }

    return {
      success: true,
      data: appointment,
    };
  }

  /**
   * Cancel an appointment
   */
  async cancel(appointmentId: string, userId: string, userRole: UserRole, dto: CancelAppointmentDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Only patient or doctor can cancel their own appointments (or admin)
    const isPatient = appointment.patient.userId === userId;
    const isDoctor = appointment.doctor.userId === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new ForbiddenException('You do not have permission to cancel this appointment');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed appointment');
    }

    // Check if appointment is in the past
    if (new Date(appointment.scheduledAt) < new Date()) {
      throw new BadRequestException('Cannot cancel appointments in the past');
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelReason: dto.reason,
        cancelledAt: new Date(),
      },
    });

    // TODO: Send cancellation notification

    return {
      success: true,
      message: 'Appointment cancelled successfully',
      data: updatedAppointment,
    };
  }

  /**
   * Reschedule an appointment
   */
  async reschedule(appointmentId: string, userId: string, userRole: UserRole, dto: RescheduleAppointmentDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Only patient can reschedule (or admin)
    const isPatient = appointment.patient.userId === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isPatient && !isAdmin) {
      throw new ForbiddenException('Only patients can reschedule appointments');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot reschedule a cancelled appointment');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot reschedule a completed appointment');
    }

    const newScheduledAt = new Date(dto.newScheduledAt);
    const now = new Date();

    if (newScheduledAt <= now) {
      throw new BadRequestException('New appointment time must be in the future');
    }

    // Check if new slot is available
    const isAvailable = await this.bookingService.isSlotAvailable(appointment.doctor.userId, newScheduledAt);

    if (!isAvailable) {
      throw new ConflictException('The new time slot is not available');
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        scheduledAt: newScheduledAt,
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

    // TODO: Update reminders
    // TODO: Send reschedule notification

    return {
      success: true,
      message: 'Appointment rescheduled successfully',
      data: updatedAppointment,
    };
  }

  /**
   * Mark appointment as completed (doctor only)
   */
  async markCompleted(appointmentId: string, userId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.doctor.userId !== userId) {
      throw new ForbiddenException('Only the assigned doctor can mark this appointment as completed');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Appointment is already marked as completed');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot complete a cancelled appointment');
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Appointment marked as completed',
      data: updatedAppointment,
    };
  }

  /**
   * Mark appointment as no-show (doctor only)
   */
  async markNoShow(appointmentId: string, userId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.doctor.userId !== userId) {
      throw new ForbiddenException('Only the assigned doctor can mark this appointment as no-show');
    }

    if (appointment.status !== AppointmentStatus.CONFIRMED) {
      throw new BadRequestException('Can only mark confirmed appointments as no-show');
    }

    const updatedAppointment = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: AppointmentStatus.NO_SHOW,
      },
    });

    return {
      success: true,
      message: 'Appointment marked as no-show',
      data: updatedAppointment,
    };
  }
}
