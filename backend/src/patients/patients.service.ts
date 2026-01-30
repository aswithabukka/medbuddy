import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientProfileDto } from './dto/create-patient-profile.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';
import { AddConditionDto } from './dto/add-condition.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create or update patient profile
   */
  async createOrUpdateProfile(userId: string, dto: CreatePatientProfileDto | UpdatePatientProfileDto) {
    // Verify user is a patient
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== UserRole.PATIENT) {
      throw new ForbiddenException('Only patients can have patient profiles');
    }

    // Check if profile already exists
    const existingProfile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      // Track changes in history
      const changedFields: any = {};
      Object.keys(dto).forEach((key) => {
        if (dto[key] !== existingProfile[key]) {
          changedFields[key] = {
            old: existingProfile[key],
            new: dto[key],
          };
        }
      });

      // Update profile
      const updatedProfile = await this.prisma.$transaction(async (tx) => {
        // Update the profile
        const profile = await tx.patientProfile.update({
          where: { userId },
          data: dto,
        });

        // Record history if there are changes
        if (Object.keys(changedFields).length > 0) {
          await tx.patientProfileHistory.create({
            data: {
              patientId: profile.id,
              changedFields,
            },
          });
        }

        return profile;
      });

      return updatedProfile;
    } else {
      // Create new profile
      return this.prisma.patientProfile.create({
        data: {
          userId,
          ...dto,
        },
      });
    }
  }

  /**
   * Get patient profile by user ID
   */
  async getProfile(userId: string, requestingUserId: string, requestingUserRole: UserRole) {
    // Only the patient or admin/doctor can view
    if (userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      // Check if requesting user is a doctor with an appointment
      if (requestingUserRole === UserRole.DOCTOR) {
        const hasAppointment = await this.prisma.appointment.findFirst({
          where: {
            patientId: userId,
            doctorId: requestingUserId,
          },
        });

        if (!hasAppointment) {
          throw new ForbiddenException('You can only view profiles of your patients');
        }
      } else {
        throw new ForbiddenException('You can only view your own profile');
      }
    }

    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
      include: {
        conditions: {
          orderBy: { createdAt: 'desc' },
        },
        user: {
          select: {
            id: true,
            email: true,
            emailVerified: true,
            createdAt: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Patient profile not found');
    }

    return profile;
  }

  /**
   * Get profile history
   */
  async getProfileHistory(userId: string, requestingUserId: string) {
    // Only the patient can view their own history
    if (userId !== requestingUserId) {
      throw new ForbiddenException('You can only view your own profile history');
    }

    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Patient profile not found');
    }

    const history = await this.prisma.patientProfileHistory.findMany({
      where: { patientId: profile.id },
      orderBy: { changedAt: 'desc' },
      take: 50, // Limit to last 50 changes
    });

    return history;
  }

  /**
   * Add medical condition
   */
  async addCondition(userId: string, dto: AddConditionDto) {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new BadRequestException('Patient profile not found. Please create profile first.');
    }

    const condition = await this.prisma.patientCondition.create({
      data: {
        patientId: profile.id,
        ...dto,
      },
    });

    return condition;
  }

  /**
   * Update medical condition
   */
  async updateCondition(userId: string, conditionId: string, dto: AddConditionDto) {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Patient profile not found');
    }

    // Verify condition belongs to this patient
    const condition = await this.prisma.patientCondition.findFirst({
      where: {
        id: conditionId,
        patientId: profile.id,
      },
    });

    if (!condition) {
      throw new NotFoundException('Condition not found');
    }

    return this.prisma.patientCondition.update({
      where: { id: conditionId },
      data: dto,
    });
  }

  /**
   * Delete medical condition
   */
  async deleteCondition(userId: string, conditionId: string) {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Patient profile not found');
    }

    // Verify condition belongs to this patient
    const condition = await this.prisma.patientCondition.findFirst({
      where: {
        id: conditionId,
        patientId: profile.id,
      },
    });

    if (!condition) {
      throw new NotFoundException('Condition not found');
    }

    await this.prisma.patientCondition.delete({
      where: { id: conditionId },
    });

    return { message: 'Condition deleted successfully' };
  }

  /**
   * Get all conditions for a patient
   */
  async getConditions(userId: string) {
    const profile = await this.prisma.patientProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new NotFoundException('Patient profile not found');
    }

    return this.prisma.patientCondition.findMany({
      where: { patientId: profile.id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
