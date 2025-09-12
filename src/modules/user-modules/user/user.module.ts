import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { PrismaService } from 'src/services/prisma-service/prisma.service';
import { UserService } from './user.service';
import { ConfigService } from '@nestjs/config';
import { NotificationsGateway } from 'src/gateway/websocket.gateway';

@Module({
  controllers: [UserController],
  providers: [PrismaService, UserService, ConfigService, NotificationsGateway],
})
export class UserModule { }
