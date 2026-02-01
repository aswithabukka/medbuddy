import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddMedicineDto {
  @ApiProperty({ example: 'Lisinopril' })
  @IsString()
  @IsNotEmpty()
  medicineName: string;

  @ApiProperty({ example: '10mg' })
  @IsString()
  @IsNotEmpty()
  dosage: string;

  @ApiProperty({ example: 'Once daily' })
  @IsString()
  @IsNotEmpty()
  frequency: string;

  @ApiProperty({ example: '30 days' })
  @IsString()
  @IsNotEmpty()
  duration: string;

  @ApiPropertyOptional({ example: 'Take with food in the morning' })
  @IsOptional()
  @IsString()
  instructions?: string;
}
