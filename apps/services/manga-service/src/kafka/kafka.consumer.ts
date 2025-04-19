import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka } from 'kafkajs';

@Injectable()
export class KafkaConsumer implements OnModuleInit {
  private kafka = new Kafka({
    clientId: 'kafka-manga-consumer',
    brokers: ['kafka:9092'], // Adjust based on your Kafka broker
  });
  private consumer = this.kafka.consumer({ groupId: 'manga-service-group' });

  async onModuleInit() {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'manga-topic' });

    this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        // Handle the message
        console.log(`Received message: ${message.value?.toString()}`);
      },
    });
  }
}
