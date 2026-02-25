import { IsEnum, IsNotEmpty } from 'class-validator';
import { Mood } from '@prisma/client';

export class CreateMoodCheckInDto {
  @IsEnum(Mood)
  @IsNotEmpty()
  mood: Mood;
}
