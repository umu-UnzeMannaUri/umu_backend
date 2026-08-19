import { Module } from '@nestjs/common';
import { FreeTimeController } from './free-time.controller';
import { FreeTimeService } from './free-time.service';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FreeTimeController],
  providers: [FreeTimeService, PrismaService],
})
export class FreeTimeModule {}
