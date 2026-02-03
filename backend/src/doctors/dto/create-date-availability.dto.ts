import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RecurrenceType } from '@prisma/client';

export class CreateDateAvailabilityDto {
  @ApiProperty({
    description: 'The date for this availability (YYYY-MM-DD)',
    example: '2026-02-15',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Start time in HH:MM format',
    example: '09:00',
  })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:MM format (00:00 to 23:59)',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time in HH:MM format',
    example: '17:00',
  })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:MM format (00:00 to 23:59)',
  })
  endTime: string;

  @ApiProperty({
    description: 'Recurrence type: NONE (one-time), DAILY, WEEKLY, or MONTHLY',
    enum: RecurrenceType,
    default: RecurrenceType.NONE,
  })
  @IsEnum(RecurrenceType)
  @IsOptional()
  recurrenceType?: RecurrenceType = RecurrenceType.NONE;

  @ApiProperty({
    description: 'End date for recurrence (YYYY-MM-DD), optional',
    example: '2026-03-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  recurrenceEnd?: string;
}
