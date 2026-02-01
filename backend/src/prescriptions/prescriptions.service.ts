import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { AddMedicineDto } from './dto/add-medicine.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class PrescriptionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate unique prescription number
   */
  private async generatePrescriptionNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Count prescriptions this month to generate sequential number
    const startOfMonth = new Date(year, date.getMonth(), 1);
    const endOfMonth = new Date(year, date.getMonth() + 1, 0, 23, 59, 59);

    const count = await this.prisma.prescription.count({
      where: {
        issuedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const sequenceNumber = String(count + 1).padStart(4, '0');
    return `RX-${year}${month}-${sequenceNumber}`;
  }

  /**
   * Create a new prescription for an appointment
   */
  async create(userId: string, dto: CreatePrescriptionDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
      include: {
        doctor: true,
        patient: true,
        prescription: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Only the assigned doctor can create prescriptions
    if (appointment.doctor.userId !== userId) {
      throw new ForbiddenException('Only the assigned doctor can create prescriptions');
    }

    // Check if prescription already exists
    if (appointment.prescription) {
      throw new BadRequestException('Prescription already exists for this appointment');
    }

    // Generate prescription number
    const prescriptionNumber = await this.generatePrescriptionNumber();

    const prescription = await this.prisma.prescription.create({
      data: {
        appointmentId: dto.appointmentId,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        prescriptionNumber,
        notes: dto.notes,
      },
      include: {
        medicines: true,
        doctor: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        patient: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      message: 'Prescription created successfully',
      data: prescription,
    };
  }

  /**
   * Get prescription by ID
   */
  async findOne(prescriptionId: string, userId: string, userRole: UserRole) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        medicines: true,
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
        appointment: true,
      },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    // Access control
    const isPatient = prescription.patient.userId === userId;
    const isDoctor = prescription.doctor.userId === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isPatient && !isDoctor && !isAdmin) {
      throw new ForbiddenException('You do not have access to this prescription');
    }

    return {
      success: true,
      data: prescription,
    };
  }

  /**
   * Get prescription by appointment ID
   */
  async findByAppointment(appointmentId: string, userId: string, userRole: UserRole) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: true,
        prescription: {
          include: {
            medicines: true,
          },
        },
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
      throw new ForbiddenException('You do not have access to this prescription');
    }

    if (!appointment.prescription) {
      return {
        success: true,
        data: null,
        message: 'No prescription found for this appointment',
      };
    }

    return {
      success: true,
      data: appointment.prescription,
    };
  }

  /**
   * Add medicine to prescription
   */
  async addMedicine(prescriptionId: string, userId: string, dto: AddMedicineDto) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        doctor: true,
      },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    if (prescription.doctor.userId !== userId) {
      throw new ForbiddenException('Only the prescribing doctor can add medicines');
    }

    const medicine = await this.prisma.prescriptionMedicine.create({
      data: {
        prescriptionId,
        ...dto,
      },
    });

    return {
      success: true,
      message: 'Medicine added successfully',
      data: medicine,
    };
  }

  /**
   * Remove medicine from prescription
   */
  async removeMedicine(prescriptionId: string, medicineId: string, userId: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        doctor: true,
      },
    });

    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }

    if (prescription.doctor.userId !== userId) {
      throw new ForbiddenException('Only the prescribing doctor can remove medicines');
    }

    const medicine = await this.prisma.prescriptionMedicine.findFirst({
      where: {
        id: medicineId,
        prescriptionId,
      },
    });

    if (!medicine) {
      throw new NotFoundException('Medicine not found in this prescription');
    }

    await this.prisma.prescriptionMedicine.delete({
      where: { id: medicineId },
    });

    return {
      success: true,
      message: 'Medicine removed successfully',
    };
  }

  /**
   * Get all prescriptions for a patient
   */
  async findPatientPrescriptions(userId: string) {
    const patientProfile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });

    if (!patientProfile) {
      throw new NotFoundException('Patient profile not found');
    }

    const prescriptions = await this.prisma.prescription.findMany({
      where: {
        patientId: patientProfile.id,
      },
      include: {
        medicines: true,
        doctor: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
        appointment: {
          select: {
            scheduledAt: true,
          },
        },
      },
      orderBy: {
        issuedAt: 'desc',
      },
    });

    return {
      success: true,
      data: prescriptions,
    };
  }

  /**
   * Generate PDF for prescription
   * This is a placeholder - actual PDF generation would use a library like PDFKit
   */
  async generatePdf(prescriptionId: string, userId: string, userRole: UserRole) {
    // First verify access
    await this.findOne(prescriptionId, userId, userRole);

    // TODO: Implement actual PDF generation using PDFKit or similar
    // For now, return a message indicating this feature is not yet implemented
    return {
      success: false,
      message: 'PDF generation not yet implemented. This will be added with PDFKit library.',
      data: {
        prescriptionId,
        note: 'Install @pdf-lib/fontkit and pdfkit packages to enable PDF generation',
      },
    };
  }
}
