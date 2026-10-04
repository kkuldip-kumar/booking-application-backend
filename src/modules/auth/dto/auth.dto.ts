import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const normalizeEmail = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).+$/;
const PASSWORD_MESSAGE = 'Password must contain at least one letter and one number';

export class RegisterDto {
  @ApiProperty() @Transform(normalizeEmail) @IsEmail() @MaxLength(255) email!: string;
  @ApiProperty() @IsString() @MinLength(2) @MaxLength(120) name!: string;
  @ApiProperty() @IsString() @MinLength(8) @MaxLength(128) @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE }) password!: string;
  @ApiProperty({ required: false }) @IsOptional() @Matches(/^\+?[0-9]{7,15}$/) phone?: string;
}

export class LoginDto {
  @ApiProperty() @Transform(normalizeEmail) @IsEmail() email!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(128) password!: string;
}

export class EmailDto {
  @ApiProperty() @Transform(normalizeEmail) @IsEmail() email!: string;
}

export class TokenDto {
  @ApiProperty() @IsString() @MinLength(20) @MaxLength(128) token!: string;
}

export class ResetPasswordDto extends TokenDto {
  @ApiProperty() @IsString() @MinLength(8) @MaxLength(128) @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE }) newPassword!: string;
}

export class ChangePasswordDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(128) currentPassword!: string;
  @ApiProperty() @IsString() @MinLength(8) @MaxLength(128) @Matches(PASSWORD_RULE, { message: PASSWORD_MESSAGE }) newPassword!: string;
}
