import { IsEmail, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { StrongPassword } from '../validators/strong-password.validator';

export class RegisterDto {
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(20)
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @StrongPassword()
  password: string;
}
