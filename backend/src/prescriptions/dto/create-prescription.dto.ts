import { IsUUID, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePrescriptionDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  @IsNotEmpty()
  appointmentId: string;

  @ApiPropertyOptional({ example: 'Take medications as prescribed. Follow up in 2 weeks if symptoms persist.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
