import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty() @Matches(/^[A-Z][A-Z0-9_]{2,49}$/) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(255) description?: string;
}

export class SetRolePermissionsDto {
  @ApiProperty({ type: [String] }) @IsArray() @ArrayMaxSize(200) @IsString({ each: true }) permissionCodes!: string[];
}

export class AssignRoleDto {
  @ApiProperty() @IsUUID() roleId!: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() cinemaId?: string;
}
