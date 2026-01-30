import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DoctorsService } from './doctors.service';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';
import { UpdateDoctorProfileDto } from './dto/update-doctor-profile.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { AddUnavailableDateDto } from './dto/add-unavailable-date.dto';
import { AddSpecialtyDto } from './dto/add-specialty.dto';
import { AddLanguageDto } from './dto/add-language.dto';
import { SearchDoctorsDto } from './dto/search-doctors.dto';
import { CurrentUser, Roles, Public } from '../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('doctors')
@Controller('doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class DoctorsController {
  constructor(private doctorsService: DoctorsService) {}

  // ========== Public Search & Discovery ==========

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search doctors with filters' })
  @ApiResponse({ status: 200, description: 'Returns list of approved doctors' })
  async searchDoctors(@Query() dto: SearchDoctorsDto) {
    return this.doctorsService.searchDoctors(dto);
  }

  @Public()
  @Get(':userId/slots')
  @ApiOperation({ summary: 'Get available appointment slots for a doctor' })
  @ApiResponse({ status: 200, description: 'Returns available time slots' })
  @ApiResponse({ status: 404, description: 'Doctor not found' })
  @ApiResponse({ status: 403, description: 'Doctor not approved' })
  async getAvailableSlots(
    @Param('userId') userId: string,
    @Query('date') date: string,
  ) {
    return this.doctorsService.getAvailableSlots(userId, date);
  }

  // ========== Profile Management ==========

  @Post('me/profile')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Create or update my doctor profile' })
  @ApiResponse({ status: 200, description: 'Profile created/updated successfully' })
  @ApiResponse({ status: 403, description: 'Only doctors can create doctor profiles' })
  async createOrUpdateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateDoctorProfileDto,
  ) {
    return this.doctorsService.createOrUpdateProfile(userId, dto);
  }

  @Get('me/profile')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get my doctor profile' })
  @ApiResponse({ status: 200, description: 'Returns doctor profile' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getMyProfile(@CurrentUser('sub') userId: string) {
    return this.doctorsService.getProfile(userId, userId, UserRole.DOCTOR);
  }

  @Put('me/profile')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Update my doctor profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateMyProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateDoctorProfileDto,
  ) {
    return this.doctorsService.createOrUpdateProfile(userId, dto);
  }

  @Get(':userId/profile')
  @ApiOperation({ summary: 'Get doctor profile by user ID' })
  @ApiResponse({ status: 200, description: 'Returns doctor profile' })
  @ApiResponse({ status: 403, description: 'Profile not approved' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  async getProfile(
    @Param('userId') userId: string,
    @CurrentUser('sub') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: UserRole,
  ) {
    return this.doctorsService.getProfile(userId, requestingUserId, requestingUserRole);
  }

  // ========== Availability Management ==========

  @Post('me/availability')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Set availability for a day of the week' })
  @ApiResponse({ status: 201, description: 'Availability set successfully' })
  @ApiResponse({ status: 400, description: 'Invalid time range or profile not found' })
  async setAvailability(
    @CurrentUser('sub') userId: string,
    @Body() dto: SetAvailabilityDto,
  ) {
    return this.doctorsService.setAvailability(userId, dto);
  }

  @Get('me/availability')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get my availability templates' })
  @ApiResponse({ status: 200, description: 'Returns availability templates' })
  async getAvailability(@CurrentUser('sub') userId: string) {
    return this.doctorsService.getAvailability(userId);
  }

  @Delete('me/availability/:id')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Delete availability for a specific day' })
  @ApiResponse({ status: 200, description: 'Availability deleted successfully' })
  @ApiResponse({ status: 404, description: 'Availability not found' })
  async deleteAvailability(
    @CurrentUser('sub') userId: string,
    @Param('id') availabilityId: string,
  ) {
    return this.doctorsService.deleteAvailability(userId, availabilityId);
  }

  // ========== Unavailable Dates Management ==========

  @Post('me/unavailable-dates')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Block a specific date' })
  @ApiResponse({ status: 201, description: 'Date marked as unavailable' })
  @ApiResponse({ status: 400, description: 'Invalid date or profile not found' })
  @ApiResponse({ status: 409, description: 'Date already blocked' })
  async addUnavailableDate(
    @CurrentUser('sub') userId: string,
    @Body() dto: AddUnavailableDateDto,
  ) {
    return this.doctorsService.addUnavailableDate(userId, dto);
  }

  @Get('me/unavailable-dates')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Get my unavailable dates' })
  @ApiResponse({ status: 200, description: 'Returns unavailable dates' })
  async getUnavailableDates(@CurrentUser('sub') userId: string) {
    return this.doctorsService.getUnavailableDates(userId);
  }

  @Delete('me/unavailable-dates/:id')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Remove unavailable date' })
  @ApiResponse({ status: 200, description: 'Unavailable date removed' })
  @ApiResponse({ status: 404, description: 'Unavailable date not found' })
  async deleteUnavailableDate(
    @CurrentUser('sub') userId: string,
    @Param('id') unavailableDateId: string,
  ) {
    return this.doctorsService.deleteUnavailableDate(userId, unavailableDateId);
  }

  // ========== Specialties Management ==========

  @Post('me/specialties')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Add specialty to my profile' })
  @ApiResponse({ status: 201, description: 'Specialty added successfully' })
  @ApiResponse({ status: 404, description: 'Specialty not found' })
  @ApiResponse({ status: 409, description: 'Specialty already added' })
  async addSpecialty(
    @CurrentUser('sub') userId: string,
    @Body() dto: AddSpecialtyDto,
  ) {
    return this.doctorsService.addSpecialty(userId, dto);
  }

  @Delete('me/specialties/:specialtyId')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Remove specialty from my profile' })
  @ApiResponse({ status: 200, description: 'Specialty removed successfully' })
  @ApiResponse({ status: 404, description: 'Specialty not found in profile' })
  async removeSpecialty(
    @CurrentUser('sub') userId: string,
    @Param('specialtyId') specialtyId: string,
  ) {
    return this.doctorsService.removeSpecialty(userId, specialtyId);
  }

  // ========== Languages Management ==========

  @Post('me/languages')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Add language to my profile' })
  @ApiResponse({ status: 201, description: 'Language added successfully' })
  @ApiResponse({ status: 409, description: 'Language already added' })
  async addLanguage(
    @CurrentUser('sub') userId: string,
    @Body() dto: AddLanguageDto,
  ) {
    return this.doctorsService.addLanguage(userId, dto);
  }

  @Delete('me/languages/:languageId')
  @Roles(UserRole.DOCTOR)
  @ApiOperation({ summary: 'Remove language from my profile' })
  @ApiResponse({ status: 200, description: 'Language removed successfully' })
  @ApiResponse({ status: 404, description: 'Language not found in profile' })
  async removeLanguage(
    @CurrentUser('sub') userId: string,
    @Param('languageId') languageId: string,
  ) {
    return this.doctorsService.removeLanguage(userId, languageId);
  }
}
