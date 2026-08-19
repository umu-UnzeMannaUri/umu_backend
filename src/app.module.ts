import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { SchedulesModule } from './schedules/schedules.module';
import { FreeTimeModule } from './free-time/free-time.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { WeatherModule } from './weather/weather.module';
import { FeedbackModule } from './feedback/feedback.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    GroupsModule,
    SchedulesModule,
    FreeTimeModule,
    AppointmentsModule,
    WeatherModule,
    FeedbackModule,
  ],
})
export class AppModule {}
