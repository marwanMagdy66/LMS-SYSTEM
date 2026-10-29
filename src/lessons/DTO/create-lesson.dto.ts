
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateLessonsDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  position: number;
}
