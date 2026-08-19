import { Module } from '@nestjs/common';
import { AppointmentsController } from './appointments.controller';
import { PrismaService } from '../prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AppointmentsController],
  providers: [PrismaService],
})
export class AppointmentsModule {}
