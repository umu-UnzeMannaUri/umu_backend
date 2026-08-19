import { IsString, MinLength } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @MinLength(1)
  name: string;
}

export class JoinGroupDto {
  @IsString()
  inviteCode: string;
}
