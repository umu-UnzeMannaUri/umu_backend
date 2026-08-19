import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class FreeTimeQueryDto {
  // other participants to compare against (current user is always included)
  @IsArray()
  @Type(() => String)
  userIds: string[];

  @IsDateString()
  from: string;

  @IsDateString()
  to: string;

  @IsIn(['duration', 'fullday'])
  mode: 'duration' | 'fullday';

  // required when mode === 'duration'
  @IsOptional()
  @IsInt()
  @Min(15)
  durationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(23)
  minHour?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  maxHour?: number;
}
