
import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { CreateUserDto } from './create-user.dto.js';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @IsOptional()
  @IsString()
  @Matches(/^(?:\+20|0)?1[0125]\d{8}$/, {
    message: 'Phone must be a valid Egyptian mobile number',
  })
  phone?: string;
}
