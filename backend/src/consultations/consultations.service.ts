import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateConsultationNoteDto } from './dto/update-consultation-note.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class ConsultationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get consultation note for an appointment
   */
  async getNote(appointmentId: string, userId: string, userRole: UserRole) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: true,
        consultationNote: true,
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
      throw new ForbiddenException('You do not have access to this consultation note');
    }

    // If no note exists yet, return null
    if (!appointment.consultationNote) {
      return {
        success: true,
        data: null,
        message: 'No consultation note created yet',
      };
    }

    // Patients can only view finalized notes
    if (isPatient && !isDoctor && !isAdmin && !appointment.consultationNote.isFinalized) {
      throw new ForbiddenException('Consultation note is not yet finalized');
    }

    return {
      success: true,
      data: appointment.consultationNote,
    };
  }

  /**
   * Create or update consultation note (auto-save)
   * Only the assigned doctor can create/update notes
   */
  async createOrUpdateNote(appointmentId: string, userId: string, dto: UpdateConsultationNoteDto) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: true,
        consultationNote: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Only the assigned doctor can write notes
    if (appointment.doctor.userId !== userId) {
      throw new ForbiddenException('Only the assigned doctor can write consultation notes');
    }

    // Check if note is already finalized
    if (appointment.consultationNote?.isFinalized) {
      throw new BadRequestException('Cannot modify a finalized consultation note');
    }

    // If note doesn't exist, create it
    if (!appointment.consultationNote) {
      const newNote = await this.prisma.consultationNote.create({
        data: {
          appointmentId,
          doctorId: appointment.doctorId,
          subjective: dto.subjective,
          objective: dto.objective,
          assessment: dto.assessment,
          plan: dto.plan,
        },
      });

      return {
        success: true,
        message: 'Consultation note created successfully',
        data: newNote,
      };
    }

    // Update existing note
    const updatedNote = await this.prisma.consultationNote.update({
      where: { id: appointment.consultationNote.id },
      data: {
        subjective: dto.subjective !== undefined ? dto.subjective : appointment.consultationNote.subjective,
        objective: dto.objective !== undefined ? dto.objective : appointment.consultationNote.objective,
        assessment: dto.assessment !== undefined ? dto.assessment : appointment.consultationNote.assessment,
        plan: dto.plan !== undefined ? dto.plan : appointment.consultationNote.plan,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Consultation note updated successfully',
      data: updatedNote,
    };
  }

  /**
   * Finalize consultation note (lock editing)
   * Once finalized, the note cannot be edited
   */
  async finalizeNote(appointmentId: string, userId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: true,
        consultationNote: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.doctor.userId !== userId) {
      throw new ForbiddenException('Only the assigned doctor can finalize consultation notes');
    }

    if (!appointment.consultationNote) {
      throw new BadRequestException('No consultation note found for this appointment');
    }

    if (appointment.consultationNote.isFinalized) {
      throw new BadRequestException('Consultation note is already finalized');
    }

    // Validate that at least one section has content
    const note = appointment.consultationNote;
    if (!note.subjective && !note.objective && !note.assessment && !note.plan) {
      throw new BadRequestException('Cannot finalize an empty consultation note');
    }

    const finalizedNote = await this.prisma.consultationNote.update({
      where: { id: appointment.consultationNote.id },
      data: {
        isFinalized: true,
        finalizedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Consultation note finalized successfully. It can no longer be edited.',
      data: finalizedNote,
    };
  }

  /**
   * Get SOAP template (helper for frontend)
   */
  getSoapTemplate() {
    return {
      success: true,
      data: {
        subjective: {
          label: 'Subjective',
          description: "Patient's complaints, symptoms, and history in their own words",
          placeholder: 'Chief complaint, history of present illness, review of systems...',
        },
        objective: {
          label: 'Objective',
          description: "Doctor's observations, measurements, and examination findings",
          placeholder: 'Vital signs, physical examination findings, lab results...',
        },
        assessment: {
          label: 'Assessment',
          description: 'Clinical diagnosis and impression',
          placeholder: 'Diagnosis, differential diagnoses, clinical impression...',
        },
        plan: {
          label: 'Plan',
          description: 'Treatment plan and follow-up actions',
          placeholder: 'Medications, procedures, referrals, follow-up instructions...',
        },
      },
    };
  }
}
