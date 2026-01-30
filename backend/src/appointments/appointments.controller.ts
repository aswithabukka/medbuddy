import {
  Controller,
  Get,
  Post,
  Put,
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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CurrentUser, Roles } from '../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Book a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment booked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request or slot not available' })
  @ApiResponse({ status: 409, description: 'Slot is being booked by another patient' })
  async bookAppointment(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.bookAppointment(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all my appointments' })
  @ApiResponse({ status: 200, description: 'Returns list of appointments' })
  async findAll(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.appointmentsService.findAll(userId, userRole);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment details by ID' })
  @ApiResponse({ status: 200, description: 'Returns appointment details' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async findOne(
    @Param('id') appointmentId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.appointmentsService.findOne(appointmentId, userId, userRole);
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel an appointment' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel this appointment' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async cancel(
    @Param('id') appointmentId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancel(appointmentId, userId, userRole, dto);
  }

  @Put(':id/reschedule')
  @Roles(UserRole.PATIENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Reschedule an appointment (Patient only)' })
  @ApiResponse({ status: 200, description: 'Appointment rescheduled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot reschedule this appointment' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  @ApiResponse({ status: 409, description: 'New time slot not available' })
  async reschedule(
    @Param('id') appointmentId: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.reschedule(appointmentId, userId, userRole, dto);
  }

  @Put(':id/complete')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Mark appointment as completed (Doctor only)' })
  @ApiResponse({ status: 200, description: 'Appointment marked as completed' })
  @ApiResponse({ status: 400, description: 'Cannot complete this appointment' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async markCompleted(
    @Param('id') appointmentId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.appointmentsService.markCompleted(appointmentId, userId);
  }

  @Put(':id/no-show')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Mark appointment as no-show (Doctor only)' })
  @ApiResponse({ status: 200, description: 'Appointment marked as no-show' })
  @ApiResponse({ status: 400, description: 'Cannot mark as no-show' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async markNoShow(
    @Param('id') appointmentId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.appointmentsService.markNoShow(appointmentId, userId);
  }
}
