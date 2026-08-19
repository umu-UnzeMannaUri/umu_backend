import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FeedbackController],
  providers: [PrismaService],
})
export class FeedbackModule {}
