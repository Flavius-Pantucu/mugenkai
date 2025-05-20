import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Inject,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthKafkaClientService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject('AUTH_MICROSERVICE') private readonly client: ClientKafka,
  ) {}

  async onModuleInit() {
    this.client.subscribeToResponseOf('auth_login');
    this.client.subscribeToResponseOf('auth_register');
    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  login(data: any) {
    return firstValueFrom(this.client.send('auth_login', data));
  }

  register(data: any) {
    return firstValueFrom(this.client.send('auth_register', data));
  }
}
