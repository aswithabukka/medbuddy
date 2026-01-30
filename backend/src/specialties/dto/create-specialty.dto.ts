import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSpecialtyDto {
  @ApiProperty({
    description: 'Specialty name',
    example: 'Cardiology',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Specialty description',
    example: 'Heart and cardiovascular system specialists',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
