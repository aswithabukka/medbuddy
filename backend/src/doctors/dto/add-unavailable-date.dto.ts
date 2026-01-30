import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddUnavailableDateDto {
  @ApiProperty({ example: '2026-02-15', description: 'Date in YYYY-MM-DD format' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: 'Personal leave' })
  @IsOptional()
  @IsString()
  reason?: string;
}
