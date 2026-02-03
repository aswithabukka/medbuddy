import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DoctorStatus, NotificationType } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /**
   * List all pending doctor applications with full details
   */
  async getPendingDoctors() {
    const profiles = await this.prisma.doctorProfile.findMany({
      where: { status: DoctorStatus.PENDING },
      include: {
        user: {
          select: { id: true, email: true, createdAt: true },
        },
        specialties: {
          include: { specialty: true },
        },
        languages: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      success: true,
      data: profiles,
    };
  }

  /**
   * Approve a doctor application
   */
  async approveDoctor(doctorUserId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }

    if (profile.status !== DoctorStatus.PENDING) {
      throw new BadRequestException(`Doctor is not in PENDING status (current: ${profile.status})`);
    }

    const updated = await this.prisma.doctorProfile.update({
      where: { userId: doctorUserId },
      data: {
        status: DoctorStatus.APPROVED,
        verifiedAt: new Date(),
      },
      include: {
        user: { select: { email: true } },
      },
    });

    return {
      success: true,
      message: `Doctor ${updated.fullName} has been approved`,
      data: {
        userId: doctorUserId,
        status: updated.status,
        verifiedAt: updated.verifiedAt,
      },
    };
  }

  /**
   * Reject a doctor application with a reason
   */
  async rejectDoctor(doctorUserId: string, reason: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }

    if (profile.status !== DoctorStatus.PENDING) {
      throw new BadRequestException(`Doctor is not in PENDING status (current: ${profile.status})`);
    }

    const updated = await this.prisma.doctorProfile.update({
      where: { userId: doctorUserId },
      data: {
        status: DoctorStatus.REJECTED,
        rejectionReason: reason,
      },
    });

    return {
      success: true,
      message: `Doctor ${updated.fullName} has been rejected`,
      data: {
        userId: doctorUserId,
        status: updated.status,
        rejectionReason: updated.rejectionReason,
      },
    };
  }

  /**
   * Get all doctor profiles regardless of status, with lightweight info
   */
  async getAllDoctors() {
    const profiles = await this.prisma.doctorProfile.findMany({
      include: {
        user: {
          select: { id: true, email: true, createdAt: true },
        },
        specialties: {
          include: { specialty: true },
        },
        languages: true,
        appointments: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Strip heavy base64 fields and add appointmentCount
    const data = profiles.map((p) => ({
      ...p,
      profilePhoto: p.profilePhoto ? true : false,   // just a flag
      certificates: Array.isArray(p.certificates)
        ? (p.certificates as any[]).map((c: any) => ({ name: c.name }))
        : [],
      appointmentCount: p.appointments.length,
      appointments: undefined, // remove raw array
    }));

    return { success: true, data };
  }

  /**
   * Aggregate statistics for the admin dashboard
   */
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalPatients, totalDoctors, totalAdmins, pending, approved, rejected, approvedToday, rejectedToday] =
      await Promise.all([
        this.prisma.user.count({ where: { role: 'PATIENT' } }),
        this.prisma.doctorProfile.count(),
        this.prisma.user.count({ where: { role: 'ADMIN' } }),
        this.prisma.doctorProfile.count({ where: { status: DoctorStatus.PENDING } }),
        this.prisma.doctorProfile.count({ where: { status: DoctorStatus.APPROVED } }),
        this.prisma.doctorProfile.count({ where: { status: DoctorStatus.REJECTED } }),
        this.prisma.doctorProfile.count({
          where: {
            status: DoctorStatus.APPROVED,
            verifiedAt: { gte: today },
          },
        }),
        this.prisma.doctorProfile.count({
          where: {
            status: DoctorStatus.REJECTED,
            updatedAt: { gte: today },
          },
        }),
      ]);

    return {
      success: true,
      data: {
        totalPatients,
        totalDoctors,
        totalAdmins,
        pending,
        approved,
        rejected,
        approvedToday,
        rejectedToday,
      },
    };
  }

  /**
   * Get all registered patients with lightweight info
   */
  async getAllPatients() {
    const patients = await this.prisma.patientProfile.findMany({
      include: {
        user: {
          select: { id: true, email: true, createdAt: true },
        },
        conditions: true,
        appointments: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const data = patients.map((p) => ({
      ...p,
      appointmentCount: p.appointments.length,
      appointments: undefined,
    }));

    return { success: true, data };
  }

  /**
   * Send a reminder / direct message to a doctor (creates in-app Notification)
   */
  async sendReminder(doctorUserId: string, title: string, message: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    });

    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId: doctorUserId,
        type: NotificationType.SYSTEM,
        title,
        message,
        data: { source: 'admin-reminder' },
      },
    });

    return {
      success: true,
      message: 'Reminder sent successfully',
      data: notification,
    };
  }

  /**
   * Get all admin reminders sent to a doctor (SYSTEM notifications with admin-reminder source)
   */
  async getReminders(doctorUserId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId: doctorUserId,
        type: NotificationType.SYSTEM,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: notifications,
    };
  }
}
