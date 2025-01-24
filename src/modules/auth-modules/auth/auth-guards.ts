import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { Request } from 'express';
import { PrismaService } from 'src/services/prisma-service/prisma.service';

@Injectable()
export class AuthUserGuard implements CanActivate {
  private readonly secret: string;

  constructor(
    private jwtService: JwtService,
    private readonly configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.secret =
      this.configService.get<string>('app.secret') || 'kjdasbdkjasbdkjasbd';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException(`Invalid token`);
    }
    try {
      const payload = await this.jwtService.verify(token, {
        secret: this.secret,
      });

      request['auth'] = payload;
    } catch (error) {
      throw error;
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
