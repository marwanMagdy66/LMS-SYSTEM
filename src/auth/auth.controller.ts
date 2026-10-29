import { Body, Controller, Get, Post, UseGuards,Request } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './DTO/register.dto.js';
import { LoginDto } from './DTO/login.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(
    @Request()
    req: {
      user: {
        userId: string;
        email: string;
        role: string;
      };
    },
  ) {
    return req.user;
  }
}
