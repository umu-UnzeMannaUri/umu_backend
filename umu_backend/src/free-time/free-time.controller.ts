import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FreeTimeService } from './free-time.service';
import { FreeTimeQueryDto } from './dto/free-time-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('free-time')
export class FreeTimeController {
  constructor(private freeTimeService: FreeTimeService) {}

  // Example: GET /api/free-time?userIds=uid1,uid2&from=2026-08-20&to=2026-08-22
  //           &mode=duration&durationMinutes=120&minHour=9&maxHour=22
  @Get()
  find(@CurrentUser() userId: string, @Query() rawQuery: Record<string, string>) {
    const query: FreeTimeQueryDto = {
      userIds: rawQuery.userIds ? rawQuery.userIds.split(',').filter(Boolean) : [],
      from: rawQuery.from,
      to: rawQuery.to,
      mode: rawQuery.mode as 'duration' | 'fullday',
      durationMinutes: rawQuery.durationMinutes ? Number(rawQuery.durationMinutes) : undefined,
      minHour: rawQuery.minHour ? Number(rawQuery.minHour) : undefined,
      maxHour: rawQuery.maxHour ? Number(rawQuery.maxHour) : undefined,
    };
    return this.freeTimeService.findFreeTime(userId, query);
  }
}
