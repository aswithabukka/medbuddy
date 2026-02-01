import {
  Controller,
  Get,
  Put,
  Post,
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
import { ConsultationsService } from './consultations.service';
import { UpdateConsultationNoteDto } from './dto/update-consultation-note.dto';
import { CurrentUser, Roles } from '../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('consultations')
@Controller('consultations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ConsultationsController {
  constructor(private consultationsService: ConsultationsService) {}

  @Get('soap-template')
  @ApiOperation({ summary: 'Get SOAP note template' })
  @ApiResponse({ status: 200, description: 'Returns SOAP template structure' })
  getSoapTemplate() {
    return this.consultationsService.getSoapTemplate();
  }

  @Get(':appointmentId')
  @ApiOperation({ summary: 'Get consultation note for an appointment' })
  @ApiResponse({ status: 200, description: 'Returns consultation note' })
  @ApiResponse({ status: 403, description: 'Access denied or note not finalized' })
  @ApiResponse({ status: 404, description: 'Appointment or note not found' })
  async getNote(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.consultationsService.getNote(appointmentId, userId, userRole);
  }

  @Put(':appointmentId')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Create or update consultation note (auto-save)' })
  @ApiResponse({ status: 200, description: 'Note saved successfully' })
  @ApiResponse({ status: 400, description: 'Cannot modify finalized note' })
  @ApiResponse({ status: 403, description: 'Only assigned doctor can write notes' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async createOrUpdateNote(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateConsultationNoteDto,
  ) {
    return this.consultationsService.createOrUpdateNote(appointmentId, userId, dto);
  }

  @Post(':appointmentId/finalize')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Finalize consultation note (lock editing)' })
  @ApiResponse({ status: 200, description: 'Note finalized successfully' })
  @ApiResponse({ status: 400, description: 'Cannot finalize empty or already finalized note' })
  @ApiResponse({ status: 403, description: 'Only assigned doctor can finalize notes' })
  @ApiResponse({ status: 404, description: 'Appointment or note not found' })
  async finalizeNote(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.consultationsService.finalizeNote(appointmentId, userId);
  }
}
