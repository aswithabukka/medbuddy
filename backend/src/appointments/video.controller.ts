import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VideoService } from './services/video.service';
import { CurrentUser, Roles } from '../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('video')
@Controller('video')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class VideoController {
  constructor(private videoService: VideoService) {}

  @Post(':appointmentId/token')
  @Roles(UserRole.PATIENT, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get Twilio video token for an appointment' })
  @ApiResponse({ status: 200, description: 'Returns token, room name, and identity' })
  @ApiResponse({ status: 400, description: 'Video not configured or appointment not confirmed' })
  @ApiResponse({ status: 403, description: 'User is not part of this appointment' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async getToken(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.videoService.getToken(appointmentId, userId);
  }

  @Post(':appointmentId/end')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'End a video session (doctor only)' })
  @ApiResponse({ status: 200, description: 'Video session ended' })
  @ApiResponse({ status: 403, description: 'Only the doctor can end the session' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async endSession(
    @Param('appointmentId') appointmentId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.videoService.endSession(appointmentId, userId);
  }
}
