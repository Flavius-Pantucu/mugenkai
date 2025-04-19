import { Injectable } from '@nestjs/common';
import { KafkaService } from './kafka/';

@Injectable()
export class AppService {
  constructor(private readonly kafkaService: KafkaService) {}

  sendMessage(topic: string, message: any): void {
    this.kafkaService.sendMessage(topic, message);
  }

  getHello(): string {
    return 'Anime Service Test!';
  }
}
