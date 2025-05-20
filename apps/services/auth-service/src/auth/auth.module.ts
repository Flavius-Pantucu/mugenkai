import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  providers: [AuthService],
  imports: [PrismaModule],
  controllers: [AuthController],
})
export class AuthModule {}
