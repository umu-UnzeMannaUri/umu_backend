import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SchedulesController],
  providers: [PrismaService],
})
export class SchedulesModule {}
