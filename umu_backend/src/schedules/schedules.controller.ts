import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto/schedule.dto';

@UseGuards(JwtAuthGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() userId: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.prisma.schedule.findMany({
      where: {
        userId,
        ...(from && to ? { startAt: { lte: new Date(to) }, endAt: { gte: new Date(from) } } : {}),
      },
      orderBy: { startAt: 'asc' },
    });
  }

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreateScheduleDto) {
    return this.prisma.schedule.create({
      data: {
        userId,
        title: dto.title,
        memo: dto.memo,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        isAllDay: dto.isAllDay ?? false,
        isPrivate: dto.isPrivate ?? false,
      },
    });
  }

  @Patch(':id')
  async update(
    @CurrentUser() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    await this.assertOwner(id, userId);
    return this.prisma.schedule.update({
      where: { id },
      data: {
        title: dto.title,
        memo: dto.memo,
        startAt: new Date(dto.startAt),
        endAt: new Date(dto.endAt),
        isAllDay: dto.isAllDay ?? false,
        isPrivate: dto.isPrivate ?? false,
      },
    });
  }

  @Delete(':id')
  async remove(@CurrentUser() userId: string, @Param('id') id: string) {
    await this.assertOwner(id, userId);
    await this.prisma.schedule.delete({ where: { id } });
    return { success: true };
  }

  private async assertOwner(id: string, userId: string) {
    const schedule = await this.prisma.schedule.findUnique({ where: { id } });
    if (!schedule) throw new NotFoundException('Schedule not found');
    if (schedule.userId !== userId) throw new ForbiddenException('Not your schedule');
  }
}
