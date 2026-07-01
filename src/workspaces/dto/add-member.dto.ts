import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { WorkspaceRole } from '../../generated/prisma/client';

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(WorkspaceRole)
  @IsOptional()
  role?: WorkspaceRole;
}