import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma.service';
import { CreateAppointmentDto } from './dto/appointment.dto';

@UseGuards(JwtAuthGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@CurrentUser() userId: string) {
    return this.prisma.appointment.findMany({
      where: { participants: { some: { userId } } },
      include: { participants: { include: { user: true } } },
      orderBy: { startAt: 'asc' },
    });
  }

  // Creates the appointment and, as a convenience, mirrors it into each
  // participant's personal schedule so it shows up on their calendar too.
  // The iOS client is responsible for scheduling the local "N minutes
  // before" notification using reminderMinutesBefore.
  @Post()
  async create(@CurrentUser() userId: string, @Body() dto: CreateAppointmentDto) {
    const participantIds = Array.from(new Set([userId, ...dto.participantIds]));

    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.create({
        data: {
          title: dto.title,
          place: dto.place,
          memo: dto.memo,
          startAt: new Date(dto.startAt),
          endAt: new Date(dto.endAt),
          reminderMinutesBefore: dto.reminderMinutesBefore ?? 5,
          groupId: dto.groupId,
          createdById: userId,
          participants: {
            create: participantIds.map((uid) => ({ userId: uid })),
          },
        },
        include: { participants: true },
      });

      await tx.schedule.createMany({
        data: participantIds.map((uid) => ({
          userId: uid,
          title: `${dto.title}${dto.place ? ` (${dto.place})` : ''}`,
          memo: dto.memo,
          startAt: new Date(dto.startAt),
          endAt: new Date(dto.endAt),
          isAllDay: false,
          isPrivate: false,
        })),
      });

      return appointment;
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.prisma.appointment.delete({ where: { id } });
    return { success: true };
  }
}
