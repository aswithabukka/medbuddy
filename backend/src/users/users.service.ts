import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get user by ID
   */
  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Get current user with profile
   */
  async getCurrentUserWithProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        patientProfile: {
          select: {
            id: true,
            dateOfBirth: true,
            gender: true,
            height: true,
            weight: true,
            bloodType: true,
            allergies: true,
            medications: true,
          },
        },
        doctorProfile: {
          select: {
            id: true,
            fullName: true,
            qualifications: true,
            experience: true,
            consultationFee: true,
            status: true,
            bio: true,
            clinicName: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Update user
   */
  async updateUser(userId: string, dto: UpdateUserDto, requestingUserId: string, requestingUserRole: UserRole) {
    // Only admin or the user themselves can update
    if (userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only update your own account');
    }

    // Check if email is already taken
    if (dto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Email already in use');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Delete user (soft delete by setting isActive to false)
   */
  async deleteUser(userId: string, requestingUserId: string, requestingUserRole: UserRole) {
    // Only admin or the user themselves can delete
    if (userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenException('You can only delete your own account');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return { message: 'User account deactivated successfully' };
  }

  /**
   * Get all users (Admin only)
   */
  async findAll(page: number = 1, limit: number = 10, role?: UserRole) {
    const skip = (page - 1) * limit;

    const where = role ? { role } : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          emailVerified: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }
}
