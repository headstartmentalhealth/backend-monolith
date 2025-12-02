import { IsNotEmpty, IsUUID } from 'class-validator';

export class ProgressDto {
  total_lessons: number;
  completed_lessons: number;
  progress: number;
}

export class ContentIdDto {
  @IsUUID()
  @IsNotEmpty()
  content_id: string;
}
