import { Controller } from '@nestjs/common';
import { RegisterDto } from './dtos/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { of } from 'rxjs';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @MessagePattern('auth_register')
  async register(@Payload() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @MessagePattern('auth_login')
  async login(@Payload() dto: LoginDto) {
    console.log('Login attempt:', dto);
    // const user = await this.authService.validateUser(
    //   dto.username,
    //   dto.password,
    // );
    // if (!user) throw new UnauthorizedException('Invalid credentials');

    // // Generate JWT or session
    // return { message: 'Login successful', userId: user.id };
    return of('Login successful');
  }
}
