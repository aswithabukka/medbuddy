import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';

@Injectable()
export class SpecialtiesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new specialty
   */
  async create(dto: CreateSpecialtyDto) {
    // Check if specialty name already exists
    const existingSpecialty = await this.prisma.specialty.findUnique({
      where: { name: dto.name },
    });

    if (existingSpecialty) {
      throw new ConflictException('Specialty with this name already exists');
    }

    const specialty = await this.prisma.specialty.create({
      data: dto,
    });

    return {
      success: true,
      message: 'Specialty created successfully',
      data: specialty,
    };
  }

  /**
   * Get all specialties
   */
  async findAll() {
    const specialties = await this.prisma.specialty.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            doctors: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Specialties retrieved successfully',
      data: specialties,
    };
  }

  /**
   * Get specialty by ID
   */
  async findOne(id: string) {
    const specialty = await this.prisma.specialty.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            doctors: true,
          },
        },
      },
    });

    if (!specialty) {
      throw new NotFoundException('Specialty not found');
    }

    return {
      success: true,
      message: 'Specialty retrieved successfully',
      data: specialty,
    };
  }

  /**
   * Update specialty
   */
  async update(id: string, dto: UpdateSpecialtyDto) {
    // Check if specialty exists
    await this.findOne(id);

    // If updating name, check for conflicts
    if (dto.name) {
      const existingSpecialty = await this.prisma.specialty.findUnique({
        where: { name: dto.name },
      });

      if (existingSpecialty && existingSpecialty.id !== id) {
        throw new ConflictException('Specialty with this name already exists');
      }
    }

    const specialty = await this.prisma.specialty.update({
      where: { id },
      data: dto,
    });

    return {
      success: true,
      message: 'Specialty updated successfully',
      data: specialty,
    };
  }

  /**
   * Delete specialty
   */
  async remove(id: string) {
    // Check if specialty exists
    await this.findOne(id);

    // Check if specialty is being used by any doctors
    const doctorCount = await this.prisma.doctorSpecialty.count({
      where: { specialtyId: id },
    });

    if (doctorCount > 0) {
      throw new ConflictException(
        `Cannot delete specialty. It is currently assigned to ${doctorCount} doctor(s)`,
      );
    }

    await this.prisma.specialty.delete({
      where: { id },
    });

    return { message: 'Specialty deleted successfully' };
  }
}
