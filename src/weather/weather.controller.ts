import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { WeatherService } from './weather.service';

@UseGuards(JwtAuthGuard)
@Controller('recommendations')
export class WeatherController {
  constructor(private weatherService: WeatherService) {}

  // GET /api/recommendations?lat=37.5&lon=127.0
  @Get()
  async getRecommendation(@Query('lat') lat: string, @Query('lon') lon: string) {
    const forecast = await this.weatherService.fetchForecast(Number(lat), Number(lon));
    const result = this.weatherService.recommendActivities({
      precipitationType: forecast.precipitationType,
    });
    return { forecast, ...result };
  }
}
