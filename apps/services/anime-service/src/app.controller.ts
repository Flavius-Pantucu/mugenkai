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
    const topic = 'anime-topic';
    const message = { userId: 1, action: 'watch', animeId: 2 };
    this.appService.sendMessage(topic, message);
  }
}
