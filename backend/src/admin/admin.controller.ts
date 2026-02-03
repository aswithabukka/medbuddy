import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('doctors/pending')
  @ApiOperation({ summary: 'Get all pending doctor applications' })
  @ApiResponse({ status: 200, description: 'Returns list of pending doctors' })
  async getPendingDoctors() {
    return this.adminService.getPendingDoctors();
  }

  @Get('doctors')
  @ApiOperation({ summary: 'Get all doctors (all statuses)' })
  @ApiResponse({ status: 200, description: 'Returns list of all doctors' })
  async getAllDoctors() {
    return this.adminService.getAllDoctors();
  }

  @Get('patients')
  @ApiOperation({ summary: 'Get all registered patients' })
  @ApiResponse({ status: 200, description: 'Returns list of all patients' })
  async getAllPatients() {
    return this.adminService.getAllPatients();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Returns aggregated stats' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Post('doctors/:userId/approve')
  @ApiOperation({ summary: 'Approve a doctor application' })
  @ApiResponse({ status: 200, description: 'Doctor approved successfully' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async approveDoctor(@Param('userId') userId: string) {
    return this.adminService.approveDoctor(userId);
  }

  @Post('doctors/:userId/reject')
  @ApiOperation({ summary: 'Reject a doctor application' })
  @ApiResponse({ status: 200, description: 'Doctor rejected successfully' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async rejectDoctor(
    @Param('userId') userId: string,
    @Body() dto: { reason: string },
  ) {
    return this.adminService.rejectDoctor(userId, dto.reason);
  }

  @Post('doctors/:userId/remind')
  @ApiOperation({ summary: 'Send a reminder / direct message to a pending doctor' })
  @ApiResponse({ status: 201, description: 'Reminder sent successfully' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  async sendReminder(
    @Param('userId') userId: string,
    @Body() dto: { title: string; message: string },
  ) {
    return this.adminService.sendReminder(userId, dto.title, dto.message);
  }

  @Get('doctors/:userId/reminders')
  @ApiOperation({ summary: 'Get all reminders sent to a doctor' })
  @ApiResponse({ status: 200, description: 'Returns list of reminders' })
  async getReminders(@Param('userId') userId: string) {
    return this.adminService.getReminders(userId);
  }
}
