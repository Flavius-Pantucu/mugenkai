import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaProducer } from './kafka.producer';
import { KafkaConsumer } from './kafka.consumer';

@Module({
  imports: [],
  providers: [KafkaService, KafkaConsumer, KafkaProducer], // Add the services here
  exports: [KafkaService], // Export KafkaService for use in other modules
})
export class KafkaModule {}
