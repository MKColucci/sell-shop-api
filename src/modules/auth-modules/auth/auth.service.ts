import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/services/prisma-service/prisma.service';
import { User } from '@prisma/client';
import { compareSync, genSaltSync, hashSync } from 'bcrypt';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { AuthLoginResponseDto } from './dtos/auth-login-response.dto';
import { AuthLoginServiceDto } from './dtos/auth-login.dto';

@Injectable()
export class AuthService {
  private readonly secret: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.secret = this.configService.get<string>('app.secret') || '';
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user && compareSync(password, user.password)) {
      return user;
    }
    return null;
  }

  async changePassword(password: string, userId: number) {
    const salt = genSaltSync(10);
    const hashedPassword = hashSync(password, salt);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return user;
  }

  async login(user: AuthLoginServiceDto): Promise<AuthLoginResponseDto> {
    const tokenId = randomUUID();

    const payload = {
      email: user.email,
      name: user.name,
      tokenId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.secret,
    });

    return {
      access_token: accessToken,
    };
  }
}
