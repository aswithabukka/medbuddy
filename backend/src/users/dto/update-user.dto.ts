import { IsEmail, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User email address',
    example: 'newemail@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Account active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
