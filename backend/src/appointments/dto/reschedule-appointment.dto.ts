import { IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RescheduleAppointmentDto {
  @ApiProperty({ example: '2026-02-20T15:00:00Z', description: 'New appointment date and time in ISO format' })
  @IsDateString()
  @IsNotEmpty()
  newScheduledAt: string;
}
