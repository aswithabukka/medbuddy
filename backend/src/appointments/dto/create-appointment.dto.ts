import { IsUUID, IsDateString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  @IsUUID()
  @IsNotEmpty()
  doctorUserId: string;

  @ApiProperty({ example: '2026-02-15T14:00:00Z', description: 'Appointment date and time in ISO format' })
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @ApiPropertyOptional({ example: 30, default: 30, description: 'Duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(15)
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 'America/New_York', description: 'Patient timezone' })
  @IsOptional()
  @IsNotEmpty()
  patientTimezone?: string;
}
