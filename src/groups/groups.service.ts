import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async createGroup(userId: string, name: string) {
    const inviteCode = randomBytes(4).toString('hex');
    return this.prisma.group.create({
      data: {
        name,
        inviteCode,
        ownerId: userId,
        members: { create: { userId, role: 'OWNER' } },
      },
      include: { members: true },
    });
  }

  async joinGroup(userId: string, inviteCode: string) {
    const group = await this.prisma.group.findUnique({ where: { inviteCode } });
    if (!group) throw new NotFoundException('Invalid invite code');

    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });
    if (existing) throw new BadRequestException('Already a member');

    await this.prisma.groupMember.create({
      data: { groupId: group.id, userId, role: 'MEMBER' },
    });
    return group;
  }

  listMyGroups(userId: string) {
    return this.prisma.group.findMany({
      where: { members: { some: { userId } } },
      include: { members: { include: { user: true } } },
    });
  }

  async getGroupCalendar(groupId: string, userId: string, from: Date, to: Date) {
    await this.assertMember(groupId, userId);

    const members = await this.prisma.groupMember.findMany({
      where: { groupId },
      include: { user: true },
    });
    const memberIds = members.map((m) => m.userId);

    const schedules = await this.prisma.schedule.findMany({
      where: {
        userId: { in: memberIds },
        startAt: { lte: to },
        endAt: { gte: from },
      },
    });

    // Private schedules are shown to other members only as an opaque busy block.
    return schedules.map((s) => {
      const isOwner = s.userId === userId;
      const showFull = isOwner || !s.isPrivate;
      return {
        userId: s.userId,
        startAt: s.startAt,
        endAt: s.endAt,
        isAllDay: s.isAllDay,
        title: showFull ? s.title : '비공개 일정',
        memo: showFull ? s.memo : null,
      };
    });
  }

  private async assertMember(groupId: string, userId: string) {
    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
    });
    if (!member) throw new BadRequestException('Not a member of this group');
  }
}
