import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { IsInt, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma.service';

class UpdateFreeTimeRangeDto {
  @IsInt() @Min(0) @Max(23)
  minHour: number;

  @IsInt() @Min(1) @Max(24)
  maxHour: number;
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get('me')
  me(@CurrentUser() userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }

  // 최소/최대 시간 범위 설정 (기본 08:00~20:00, 새벽 추천 방지용)
  @Patch('me/free-time-range')
  updateFreeTimeRange(@CurrentUser() userId: string, @Body() dto: UpdateFreeTimeRangeDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        freeTimeMinHour: dto.minHour,
        freeTimeMaxHour: dto.maxHour,
      },
    });
  }
}
