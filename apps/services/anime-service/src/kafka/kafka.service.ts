import { Injectable } from '@nestjs/common';
import { Kafka } from 'kafkajs';

@Injectable()
export class KafkaService {
  private kafka = new Kafka({
    clientId: 'kafka-manga-service',
    brokers: ['kafka:9092'], // Adjust based on your Kafka broker
  });
  private producer = this.kafka.producer();

  async sendMessage(topic: string, message: object): Promise<void> {
    await this.producer.connect();
    await this.producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify(message),
        },
      ],
    });
    await this.producer.disconnect();
  }
}
