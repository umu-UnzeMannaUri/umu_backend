import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OAuthLoginDto } from './dto/oauth-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() dto: OAuthLoginDto) {
    return this.authService.loginWithOAuth(dto);
  }
}
