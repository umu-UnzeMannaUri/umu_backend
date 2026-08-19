import { IsBoolean, IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateScheduleDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

export class UpdateScheduleDto extends CreateScheduleDto {}
