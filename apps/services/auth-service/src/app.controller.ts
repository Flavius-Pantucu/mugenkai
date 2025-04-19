import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('send-message')
  watchAnime(): void {
    const topic = 'auth-topic';
    const message = {
      username: 'test',
      password: 'randompassword',
      action: 'login',
    };
    this.appService.sendMessage(topic, message);
  }
}
