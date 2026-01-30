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
import { PatientsService } from './patients.service';
import { CreatePatientProfileDto } from './dto/create-patient-profile.dto';
import { UpdatePatientProfileDto } from './dto/update-patient-profile.dto';
import { AddConditionDto } from './dto/add-condition.dto';
import { CurrentUser, Roles } from '../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('patients')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Post('me/profile')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Create or update patient profile' })
  @ApiResponse({ status: 200, description: 'Profile created/updated successfully' })
  @ApiResponse({ status: 403, description: 'Only patients can create patient profiles' })
  async createOrUpdateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreatePatientProfileDto,
  ) {
    return this.patientsService.createOrUpdateProfile(userId, dto);
  }

  @Get('me/profile')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Get my patient profile' })
  @ApiResponse({ status: 200, description: 'Returns patient profile' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getMyProfile(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.patientsService.getProfile(userId, userId, userRole);
  }

  @Get(':userId/profile')
  @ApiOperation({ summary: 'Get patient profile by user ID (doctor/admin only)' })
  @ApiResponse({ status: 200, description: 'Returns patient profile' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getProfile(
    @Param('userId') userId: string,
    @CurrentUser('sub') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: UserRole,
  ) {
    return this.patientsService.getProfile(userId, requestingUserId, requestingUserRole);
  }

  @Put('me/profile')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Update my patient profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateMyProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdatePatientProfileDto,
  ) {
    return this.patientsService.createOrUpdateProfile(userId, dto);
  }

  @Get('me/profile/history')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Get profile change history' })
  @ApiResponse({ status: 200, description: 'Returns profile history' })
  async getProfileHistory(
    @CurrentUser('sub') userId: string,
  ) {
    return this.patientsService.getProfileHistory(userId, userId);
  }

  @Post('me/conditions')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Add medical condition' })
  @ApiResponse({ status: 201, description: 'Condition added successfully' })
  @ApiResponse({ status: 400, description: 'Profile not found' })
  async addCondition(
    @CurrentUser('sub') userId: string,
    @Body() dto: AddConditionDto,
  ) {
    return this.patientsService.addCondition(userId, dto);
  }

  @Get('me/conditions')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Get all my medical conditions' })
  @ApiResponse({ status: 200, description: 'Returns list of conditions' })
  async getConditions(
    @CurrentUser('sub') userId: string,
  ) {
    return this.patientsService.getConditions(userId);
  }

  @Put('me/conditions/:conditionId')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Update medical condition' })
  @ApiResponse({ status: 200, description: 'Condition updated successfully' })
  @ApiResponse({ status: 404, description: 'Condition not found' })
  async updateCondition(
    @CurrentUser('sub') userId: string,
    @Param('conditionId') conditionId: string,
    @Body() dto: AddConditionDto,
  ) {
    return this.patientsService.updateCondition(userId, conditionId, dto);
  }

  @Delete('me/conditions/:conditionId')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Delete medical condition' })
  @ApiResponse({ status: 200, description: 'Condition deleted successfully' })
  @ApiResponse({ status: 404, description: 'Condition not found' })
  async deleteCondition(
    @CurrentUser('sub') userId: string,
    @Param('conditionId') conditionId: string,
  ) {
    return this.patientsService.deleteCondition(userId, conditionId);
  }
}
