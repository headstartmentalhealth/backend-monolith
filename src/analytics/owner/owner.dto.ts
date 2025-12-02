import { IsNotEmpty, IsNumber } from 'class-validator';

export class FilterByYearDto {
  @IsNotEmpty()
  year: number;
}
