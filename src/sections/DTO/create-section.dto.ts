import {
    IsInt,
    IsNotEmpty,
    IsString,
    Min,
    MinLength,
  } from 'class-validator';
  
  export class CreateSectionDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    title: string;
  
    @IsInt()
    @Min(1)
    position: number;
  }