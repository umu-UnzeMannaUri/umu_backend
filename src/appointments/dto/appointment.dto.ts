import { IsArray, IsDateString, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  place?: string;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  reminderMinutesBefore?: number;

  @IsOptional()
  @IsString()
  groupId?: string;

  // userIds of everyone invited (creator is added automatically)
  @IsArray()
  participantIds: string[];
}
