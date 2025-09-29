import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { PrismaService } from 'src/services/prisma-service/prisma.service';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly user: UserService, private readonly prisma: PrismaService) { }

  @Get("/testing")
  async getAvaibleSlotsInMonth() {
    return this.user.getAvaibleSlotsInMonth()
  }
}
