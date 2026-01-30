import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsEnum, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DoctorStatus } from '@prisma/client';

export class CreateDoctorProfileDto {
  @ApiProperty({ example: 'Dr. Sarah Johnson' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'MD - Cardiology, MBBS' })
  @IsString()
  @IsNotEmpty()
  qualifications: string;

  @ApiProperty({ example: 10, description: 'Years of experience' })
  @IsInt()
  @Min(0)
  experience: number;

  @ApiProperty({ example: 150.00, description: 'Consultation fee in USD' })
  @IsNumber()
  @Min(0)
  consultationFee: number;

  @ApiPropertyOptional({ example: 'Specialized in cardiac surgeries and interventional cardiology...' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'Heart Care Clinic' })
  @IsOptional()
  @IsString()
  clinicName?: string;

  @ApiPropertyOptional({ example: 'MED123456' })
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @ApiPropertyOptional({ example: 'America/New_York' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ enum: DoctorStatus, default: DoctorStatus.PENDING })
  @IsOptional()
  @IsEnum(DoctorStatus)
  status?: DoctorStatus;
}
