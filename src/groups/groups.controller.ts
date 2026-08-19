import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GroupsService } from './groups.service';
import { CreateGroupDto, JoinGroupDto } from './dto/group.dto';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private groupsService: GroupsService) {}

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(userId, dto.name);
  }

  @Post('join')
  join(@CurrentUser() userId: string, @Body() dto: JoinGroupDto) {
    return this.groupsService.joinGroup(userId, dto.inviteCode);
  }

  @Get()
  myGroups(@CurrentUser() userId: string) {
    return this.groupsService.listMyGroups(userId);
  }

  @Get(':id/calendar')
  calendar(
    @CurrentUser() userId: string,
    @Param('id') groupId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.groupsService.getGroupCalendar(groupId, userId, new Date(from), new Date(to));
  }
}
