import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { AddUnavailableDateDto } from './dto/add-unavailable-date.dto';
import { AddSpecialtyDto } from './dto/add-specialty.dto';
import { AddLanguageDto } from './dto/add-language.dto';
import { SearchDoctorsDto } from './dto/search-doctors.dto';
import { UserRole, DoctorStatus } from '@prisma/client';

@Injectable()
export class DoctorsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create or update doctor profile
   * Doctors can only create/update their own profile
   */
  async createOrUpdateProfile(userId: string, dto: CreateDoctorProfileDto | UpdateDoctorProfileDto) {
    // Verify user is a doctor
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.DOCTOR) {
      throw new ForbiddenException('Only users with DOCTOR role can create doctor profiles');
    }

    // Check if profile already exists
    const existingProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      // Update existing profile
      const updatedProfile = await this.prisma.doctorProfile.update({
        where: { userId },
        data: {
          ...dto,
          // Don't allow doctor to change status via this endpoint
          status: undefined,
        },
        include: {
          specialties: {
            include: {
              specialty: true,
            },
          },
          languages: true,
        },
      });

      return {
        success: true,
        message: 'Doctor profile updated successfully',
        data: updatedProfile,
      };
    }

    // Validate that required fields are present for creation
    if (!dto.fullName || !dto.qualifications || dto.experience === undefined || dto.consultationFee === undefined) {
      throw new BadRequestException('fullName, qualifications, experience, and consultationFee are required');
    }

    // Create new profile with PENDING status
    const newProfile = await this.prisma.doctorProfile.create({
      data: {
        userId,
        fullName: dto.fullName,
        qualifications: dto.qualifications,
        experience: dto.experience,
        consultationFee: dto.consultationFee,
        bio: dto.bio,
        clinicName: dto.clinicName,
        licenseNumber: dto.licenseNumber,
        timezone: dto.timezone,
        status: DoctorStatus.PENDING, // Always start as pending
      },
      include: {
        specialties: {
          include: {
            specialty: true,
          },
        },
        languages: true,
      },
    });

    return {
      success: true,
      message: 'Doctor profile created successfully. Awaiting admin verification.',
      data: newProfile,
    };
  }

  /**
   * Get doctor profile with access control
   * - Doctors can view their own profile
   * - Patients can view approved doctor profiles
   * - Admins can view all profiles
   */
  async getProfile(doctorUserId: string, requestingUserId: string, requestingUserRole: UserRole) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            emailVerified: true,
            createdAt: true,
          },
        },
        specialties: {
          include: {
            specialty: true,
          },
        },
        languages: true,
        availabilityTemplates: true,
        unavailableDates: {
          where: {
            date: {
              gte: new Date(), // Only future unavailable dates
            },
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }

    // Access control
    const isOwnProfile = doctorUserId === requestingUserId;
    const isAdmin = requestingUserRole === UserRole.ADMIN;
    const isApproved = profile.status === DoctorStatus.APPROVED;

    if (!isOwnProfile && !isAdmin && !isApproved) {
      throw new ForbiddenException('This doctor profile is not yet approved');
    }

    // Calculate average rating
    const ratingStats = await this.prisma.review.aggregate({
      where: { doctorId: profile.id },
      _avg: { rating: true },
      _count: true,
    });

    return {
      success: true,
      data: {
        ...profile,
        averageRating: ratingStats._avg.rating || 0,
        totalReviews: ratingStats._count,
      },
    };
  }

  /**
   * Set availability template for a specific day of the week
   * Replaces existing availability for that day
   */
  async setAvailability(userId: string, dto: SetAvailabilityDto) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new BadRequestException('Please create your doctor profile first');
    }

    // Validate time range
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    // Delete existing availability for this day and create new one
    await this.prisma.doctorAvailabilityTemplate.deleteMany({
      where: {
        doctorId: profile.id,
        dayOfWeek: dto.dayOfWeek,
      },
    });

    const availability = await this.prisma.doctorAvailabilityTemplate.create({
      data: {
        doctorId: profile.id,
        ...dto,
      },
    });

    return {
      success: true,
      message: 'Availability set successfully',
      data: availability,
    };
  }

  /**
   * Get all availability templates for a doctor
   */
  async getAvailability(userId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
      include: {
        availabilityTemplates: {
          orderBy: {
            dayOfWeek: 'asc',
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }

    return {
      success: true,
      data: profile.availabilityTemplates,
    };
  }

  /**
   * Delete availability for a specific day
   */
  async deleteAvailability(userId: string, availabilityId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }

    const availability = await this.prisma.doctorAvailabilityTemplate.findFirst({
      where: {
        id: availabilityId,
        doctorId: profile.id,
      },
    });

    if (!availability) {
      throw new NotFoundException('Availability not found or does not belong to you');
    }

    await this.prisma.doctorAvailabilityTemplate.delete({
      where: { id: availabilityId },
    });

    return {
      success: true,
      message: 'Availability deleted successfully',
    };
  }

  /**
   * Add unavailable date (block a specific date)
   */
  async addUnavailableDate(userId: string, dto: AddUnavailableDateDto) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new BadRequestException('Please create your doctor profile first');
    }

    const date = new Date(dto.date);

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      throw new BadRequestException('Cannot block dates in the past');
    }

    // Check if already blocked
    const existing = await this.prisma.doctorUnavailableDate.findFirst({
      where: {
        doctorId: profile.id,
        date,
      },
    });

    if (existing) {
      throw new ConflictException('This date is already marked as unavailable');
    }

    const unavailableDate = await this.prisma.doctorUnavailableDate.create({
      data: {
        doctorId: profile.id,
        date,
        reason: dto.reason,
      },
    });

    return {
      success: true,
      message: 'Date marked as unavailable',
      data: unavailableDate,
    };
  }

  /**
   * Get all unavailable dates for a doctor
   */
  async getUnavailableDates(userId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
      include: {
        unavailableDates: {
          where: {
            date: {
              gte: new Date(), // Only future dates
            },
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }

    return {
      success: true,
      data: profile.unavailableDates,
    };
  }

  /**
   * Delete unavailable date
   */
  async deleteUnavailableDate(userId: string, unavailableDateId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }

    const unavailableDate = await this.prisma.doctorUnavailableDate.findFirst({
      where: {
        id: unavailableDateId,
        doctorId: profile.id,
      },
    });

    if (!unavailableDate) {
      throw new NotFoundException('Unavailable date not found or does not belong to you');
    }

    await this.prisma.doctorUnavailableDate.delete({
      where: { id: unavailableDateId },
    });

    return {
      success: true,
      message: 'Unavailable date removed',
    };
  }

  /**
   * Add specialty to doctor profile
   */
  async addSpecialty(userId: string, dto: AddSpecialtyDto) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new BadRequestException('Please create your doctor profile first');
    }

    // Check if specialty exists
    const specialty = await this.prisma.specialty.findUnique({
      where: { id: dto.specialtyId },
    });

    if (!specialty) {
      throw new NotFoundException('Specialty not found');
    }

    // Check if already added
    const existing = await this.prisma.doctorSpecialty.findFirst({
      where: {
        doctorId: profile.id,
        specialtyId: dto.specialtyId,
      },
    });

    if (existing) {
      throw new ConflictException('Specialty already added to your profile');
    }

    const doctorSpecialty = await this.prisma.doctorSpecialty.create({
      data: {
        doctorId: profile.id,
        specialtyId: dto.specialtyId,
      },
      include: {
        specialty: true,
      },
    });

    return {
      success: true,
      message: 'Specialty added successfully',
      data: doctorSpecialty,
    };
  }

  /**
   * Remove specialty from doctor profile
   */
  async removeSpecialty(userId: string, specialtyId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }

    const doctorSpecialty = await this.prisma.doctorSpecialty.findFirst({
      where: {
        doctorId: profile.id,
        specialtyId,
      },
    });

    if (!doctorSpecialty) {
      throw new NotFoundException('Specialty not found in your profile');
    }

    await this.prisma.doctorSpecialty.delete({
      where: { id: doctorSpecialty.id },
    });

    return {
      success: true,
      message: 'Specialty removed from your profile',
    };
  }

  /**
   * Add language to doctor profile
   */
  async addLanguage(userId: string, dto: AddLanguageDto) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new BadRequestException('Please create your doctor profile first');
    }

    // Check if already added
    const existing = await this.prisma.doctorLanguage.findFirst({
      where: {
        doctorId: profile.id,
        language: dto.language,
      },
    });

    if (existing) {
      throw new ConflictException('Language already added to your profile');
    }

    const language = await this.prisma.doctorLanguage.create({
      data: {
        doctorId: profile.id,
        language: dto.language,
      },
    });

    return {
      success: true,
      message: 'Language added successfully',
      data: language,
    };
  }

  /**
   * Remove language from doctor profile
   */
  async removeLanguage(userId: string, languageId: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }

    const language = await this.prisma.doctorLanguage.findFirst({
      where: {
        id: languageId,
        doctorId: profile.id,
      },
    });

    if (!language) {
      throw new NotFoundException('Language not found in your profile');
    }

    await this.prisma.doctorLanguage.delete({
      where: { id: languageId },
    });

    return {
      success: true,
      message: 'Language removed from your profile',
    };
  }

  /**
   * Search and filter doctors
   * Returns only approved doctors
   */
  async searchDoctors(dto: SearchDoctorsDto) {
    const {
      specialty,
      language,
      minFee,
      maxFee,
      minExperience,
      minRating,
      name,
      page = 1,
      limit = 10,
    } = dto;

    // Build where clause
    const where: any = {
      status: DoctorStatus.APPROVED,
    };

    // Filter by name
    if (name) {
      where.fullName = {
        contains: name,
        mode: 'insensitive',
      };
    }

    // Filter by fee range
    if (minFee !== undefined || maxFee !== undefined) {
      where.consultationFee = {};
      if (minFee !== undefined) {
        where.consultationFee.gte = minFee;
      }
      if (maxFee !== undefined) {
        where.consultationFee.lte = maxFee;
      }
    }

    // Filter by experience
    if (minExperience !== undefined) {
      where.experience = {
        gte: minExperience,
      };
    }

    // Filter by specialty
    if (specialty) {
      where.specialties = {
        some: {
          specialty: {
            name: {
              contains: specialty,
              mode: 'insensitive',
            },
          },
        },
      };
    }

    // Filter by language
    if (language) {
      where.languages = {
        some: {
          language: {
            contains: language,
            mode: 'insensitive',
          },
        },
      };
    }

    // Get total count for pagination
    const total = await this.prisma.doctorProfile.count({ where });

    // Get doctors with relations
    const doctors = await this.prisma.doctorProfile.findMany({
      where,
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
        languages: true,
        availabilityTemplates: true,
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      skip: dto.skip,
      take: limit,
      orderBy: [
        {
          createdAt: 'desc',
        },
      ],
    });

    // Calculate average rating for each doctor
    const doctorsWithRatings = await Promise.all(
      doctors.map(async (doctor) => {
        const ratingStats = await this.prisma.review.aggregate({
          where: { doctorId: doctor.id },
          _avg: { rating: true },
          _count: true,
        });

        const averageRating = ratingStats._avg.rating || 0;

        // Apply rating filter
        if (minRating !== undefined && averageRating < minRating) {
          return null;
        }

        return {
          ...doctor,
          averageRating,
          totalReviews: ratingStats._count,
        };
      }),
    );

    // Filter out null results (doctors below min rating)
    const filteredDoctors = doctorsWithRatings.filter((d) => d !== null);

    return {
      success: true,
      data: filteredDoctors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get available slots for a specific doctor on a specific date
   * This is a simplified version - appointment booking will have more complex logic
   */
  async getAvailableSlots(doctorUserId: string, date: string) {
    const profile = await this.prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
      include: {
        availabilityTemplates: true,
        unavailableDates: {
          where: {
            date: new Date(date),
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }

    if (profile.status !== DoctorStatus.APPROVED) {
      throw new ForbiddenException('Doctor is not approved');
    }

    // Check if date is unavailable
    if (profile.unavailableDates.length > 0) {
      return {
        success: true,
        message: 'Doctor is unavailable on this date',
        data: {
          available: false,
          slots: [],
        },
      };
    }

    // Get day of week (0 = Sunday, 6 = Saturday)
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Map JS day to Prisma DayOfWeek enum
    const dayMapping = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayName = dayMapping[dayOfWeek];

    // Get availability templates for this day
    const availabilityForDay = profile.availabilityTemplates.filter(
      (template) => template.dayOfWeek === dayName,
    );

    if (availabilityForDay.length === 0) {
      return {
        success: true,
        message: 'Doctor is not available on this day of the week',
        data: {
          available: false,
          slots: [],
        },
      };
    }

    // Generate 30-minute slots for each availability template
    const slots: string[] = [];
    availabilityForDay.forEach((template) => {
      const [startHour, startMinute] = template.startTime.split(':').map(Number);
      const [endHour, endMinute] = template.endTime.split(':').map(Number);

      let currentHour = startHour;
      let currentMinute = startMinute;

      while (
        currentHour < endHour ||
        (currentHour === endHour && currentMinute < endMinute)
      ) {
        const timeSlot = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        slots.push(timeSlot);

        // Add 30 minutes
        currentMinute += 30;
        if (currentMinute >= 60) {
          currentMinute = 0;
          currentHour += 1;
        }
      }
    });

    // TODO: Filter out slots that are already booked (will be implemented in appointments module)

    return {
      success: true,
      data: {
        available: true,
        date,
        slots,
        timezone: profile.timezone,
      },
    };
  }
}
