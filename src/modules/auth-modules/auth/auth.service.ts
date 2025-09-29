import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/services/prisma-service/prisma.service';
import { ConfigService } from '@nestjs/config';

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

}
