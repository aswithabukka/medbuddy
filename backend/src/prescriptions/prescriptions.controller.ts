import {
  Controller,
  Get,
  Post,
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
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { AddMedicineDto } from './dto/add-medicine.dto';
import { CurrentUser, Roles } from '../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('prescriptions')
@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PrescriptionsController {
  constructor(private prescriptionsService: PrescriptionsService) {}

  @Post()
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Create prescription for an appointment' })
  @ApiResponse({ status: 201, description: 'Prescription created successfully' })
  @ApiResponse({ status: 400, description: 'Prescription already exists' })
  @ApiResponse({ status: 403, description: 'Only assigned doctor can create prescription' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async create(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreatePrescriptionDto,
  ) {
    return this.prescriptionsService.create(userId, dto);
  }

  @Get('me')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Get all my prescriptions (Patient only)' })
  @ApiResponse({ status: 200, description: 'Returns list of prescriptions' })
  async getMyPrescriptions(@CurrentUser('sub') userId: string) {
    return this.prescriptionsService.findPatientPrescriptions(userId);
  }

  @Get('appointment/:appointmentId')
  @ApiOperation({ summary: 'Get prescription by appointment ID' })
  @ApiResponse({ status: 200, description: 'Returns prescription' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async getByAppointment(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.prescriptionsService.findByAppointment(appointmentId, userId, userRole);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prescription by ID' })
  @ApiResponse({ status: 200, description: 'Returns prescription details' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  async findOne(
    @Param('id') prescriptionId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.prescriptionsService.findOne(prescriptionId, userId, userRole);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download prescription as PDF' })
  @ApiResponse({ status: 200, description: 'Returns PDF file' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  async downloadPdf(
    @Param('id') prescriptionId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.prescriptionsService.generatePdf(prescriptionId, userId, userRole);
  }

  @Post(':id/medicines')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Add medicine to prescription' })
  @ApiResponse({ status: 201, description: 'Medicine added successfully' })
  @ApiResponse({ status: 403, description: 'Only prescribing doctor can add medicines' })
  @ApiResponse({ status: 404, description: 'Prescription not found' })
  async addMedicine(
    @Param('id') prescriptionId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: AddMedicineDto,
  ) {
    return this.prescriptionsService.addMedicine(prescriptionId, userId, dto);
  }

  @Delete(':prescriptionId/medicines/:medicineId')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Remove medicine from prescription' })
  @ApiResponse({ status: 200, description: 'Medicine removed successfully' })
  @ApiResponse({ status: 403, description: 'Only prescribing doctor can remove medicines' })
  @ApiResponse({ status: 404, description: 'Prescription or medicine not found' })
  async removeMedicine(
    @Param('prescriptionId') prescriptionId: string,
    @Param('medicineId') medicineId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.prescriptionsService.removeMedicine(prescriptionId, medicineId, userId);
  }
}
