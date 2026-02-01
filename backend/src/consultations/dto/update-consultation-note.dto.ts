import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConsultationNoteDto {
  @ApiPropertyOptional({
    example: 'Patient complains of chest pain radiating to left arm. Pain started 2 hours ago.',
    description: 'Subjective - Patient complaints and symptoms'
  })
  @IsOptional()
  @IsString()
  subjective?: string;

  @ApiPropertyOptional({
    example: 'BP: 140/90, Heart Rate: 88 bpm, Temperature: 98.6°F. Chest examination reveals no abnormalities.',
    description: 'Objective - Doctor observations and measurements'
  })
  @IsOptional()
  @IsString()
  objective?: string;

  @ApiPropertyOptional({
    example: 'Suspected angina pectoris. ECG shows ST depression in leads II, III, aVF.',
    description: 'Assessment - Diagnosis and clinical impression'
  })
  @IsOptional()
  @IsString()
  assessment?: string;

  @ApiPropertyOptional({
    example: 'Prescribe nitroglycerin 0.4mg sublingual PRN. Order cardiac enzymes and stress test. Follow up in 1 week.',
    description: 'Plan - Treatment plan and next steps'
  })
  @IsOptional()
  @IsString()
  plan?: string;
}
