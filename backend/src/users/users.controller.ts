import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser, Roles } from '../common/decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns current user with profile data' })
  async getCurrentUser(@CurrentUser('sub') userId: string) {
    return this.usersService.getCurrentUserWithProfile(userId);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('role') role?: UserRole,
  ) {
    return this.usersService.findAll(pagination.page, pagination.limit, role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Returns user data' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser('sub') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: UserRole,
  ) {
    return this.usersService.updateUser(
      id,
      updateUserDto,
      requestingUserId,
      requestingUserRole,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  @ApiResponse({ status: 200, description: 'User deactivated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('sub') requestingUserId: string,
    @CurrentUser('role') requestingUserRole: UserRole,
  ) {
    return this.usersService.deleteUser(
      id,
      requestingUserId,
      requestingUserRole,
    );
  }
}
