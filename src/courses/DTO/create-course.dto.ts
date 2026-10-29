import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
    MinLength,
  } from 'class-validator';
  
  export class CreateCourseDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    title: string;
  
    @IsOptional()
    @IsString()
    description: string;
  
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    price: number;
  }