import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SpecialtiesService } from './specialties.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';
import { UpdateSpecialtyDto } from './dto/update-specialty.dto';
import { Roles, Public } from '../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('specialties')
@Controller('specialties')
export class SpecialtiesController {
  constructor(private specialtiesService: SpecialtiesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all specialties' })
  @ApiResponse({ status: 200, description: 'Returns list of specialties' })
  async findAll() {
    return this.specialtiesService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get specialty by ID' })
  @ApiResponse({ status: 200, description: 'Returns specialty details' })
  @ApiResponse({ status: 404, description: 'Specialty not found' })
  async findOne(@Param('id') id: string) {
    return this.specialtiesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create specialty (Admin only)' })
  @ApiResponse({ status: 201, description: 'Specialty created successfully' })
  @ApiResponse({ status: 409, description: 'Specialty already exists' })
  async create(@Body() dto: CreateSpecialtyDto) {
    return this.specialtiesService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update specialty (Admin only)' })
  @ApiResponse({ status: 200, description: 'Specialty updated successfully' })
  @ApiResponse({ status: 404, description: 'Specialty not found' })
  @ApiResponse({ status: 409, description: 'Specialty name already exists' })
  async update(@Param('id') id: string, @Body() dto: UpdateSpecialtyDto) {
    return this.specialtiesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete specialty (Admin only)' })
  @ApiResponse({ status: 200, description: 'Specialty deleted successfully' })
  @ApiResponse({ status: 404, description: 'Specialty not found' })
  @ApiResponse({ status: 409, description: 'Specialty is in use' })
  async remove(@Param('id') id: string) {
    return this.specialtiesService.remove(id);
  }
}
