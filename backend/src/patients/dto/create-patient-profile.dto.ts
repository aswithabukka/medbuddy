import { IsOptional, IsString, IsDate, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Gender, BloodType } from '@prisma/client';

export class CreatePatientProfileDto {
  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '1990-01-15',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateOfBirth?: Date;

  @ApiPropertyOptional({
    description: 'Gender',
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Height in centimeters',
    example: 175,
    minimum: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(50)
  height?: number;

  @ApiPropertyOptional({
    description: 'Weight in kilograms',
    example: 70,
    minimum: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  weight?: number;

  @ApiPropertyOptional({
    description: 'Blood type',
    enum: BloodType,
    example: BloodType.O_POSITIVE,
  })
  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @ApiPropertyOptional({
    description: 'Allergies (comma-separated)',
    example: 'Penicillin, Peanuts',
  })
  @IsOptional()
  @IsString()
  allergies?: string;

  @ApiPropertyOptional({
    description: 'Current medications',
    example: 'Lisinopril 10mg daily',
  })
  @IsOptional()
  @IsString()
  medications?: string;
}
