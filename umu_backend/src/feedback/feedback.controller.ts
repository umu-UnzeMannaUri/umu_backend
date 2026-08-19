import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma.service';

class CreateFeedbackDto {
  @IsString()
  @MinLength(1)
  content: string;
}

@UseGuards(JwtAuthGuard)
@Controller('feedback')
export class FeedbackController {
  constructor(private prisma: PrismaService) {}

  @Post()
  create(@CurrentUser() userId: string, @Body() dto: CreateFeedbackDto) {
    return this.prisma.feedback.create({
      data: { userId, content: dto.content },
    });
  }

  // Simple admin-style listing; lock this down or remove before real deployment.
  @Get()
  list() {
    return this.prisma.feedback.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
