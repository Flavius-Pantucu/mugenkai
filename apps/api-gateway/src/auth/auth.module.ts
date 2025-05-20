import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthKafkaClientService } from './auth-kafka.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_MICROSERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            brokers: [process.env.KAFKA_BROKER_URL || 'localhost:9092'],
          },
          consumer: {
            groupId: 'auth-consumer-' + Math.random(), // unique group id
          },
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthKafkaClientService],
})
export class AuthModule {}
