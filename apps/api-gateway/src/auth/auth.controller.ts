import { Body, Controller, Post } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { AuthKafkaClientService } from './auth-kafka.service';
import { LoginDto } from '../dtos/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authClientService: AuthKafkaClientService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authClientService.login(loginDto);
  }
}
