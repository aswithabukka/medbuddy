import { IsString, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddConditionDto {
  @ApiProperty({
    description: 'Medical condition name',
    example: 'Diabetes Type 2',
  })
  @IsString()
  condition: string;

  @ApiPropertyOptional({
    description: 'Date when condition was diagnosed',
    example: '2020-05-15',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  diagnosedAt?: Date;

  @ApiPropertyOptional({
    description: 'Additional notes about the condition',
    example: 'Well controlled with medication',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
