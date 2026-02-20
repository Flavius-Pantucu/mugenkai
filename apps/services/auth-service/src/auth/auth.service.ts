import { RegisterDto } from './dtos/register.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.userAuth.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
      },
    });

    return { message: 'User registered', userId: user.id };
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.userAuth.findUnique({ where: { email } });
    if (!user) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : null;
  }
}
