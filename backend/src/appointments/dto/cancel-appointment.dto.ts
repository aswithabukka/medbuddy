import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelAppointmentDto {
  @ApiPropertyOptional({ example: 'Need to reschedule due to conflict' })
  @IsOptional()
  @IsString()
  reason?: string;
}
