import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { PrismaService } from 'src/services/prisma-service/prisma.service';
import { UserService } from './user.service';
import { ConfigService } from '@nestjs/config';
import { NotificationsGateway } from 'src/gateway/websocket.gateway';
import { PaginationService } from 'src/services/pagination-service/pagination.service';

@Module({
  controllers: [UserController],
  providers: [PrismaService, UserService, ConfigService, NotificationsGateway, PaginationService],
})
export class UserModule { }
