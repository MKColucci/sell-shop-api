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
import { CreateUserDto } from './dto/create-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';
import { AuthUserGuard } from 'src/modules/auth-modules/auth/auth-guards';
import { CreateAlertDTO } from 'src/modules/alert-modules/dto/create-alert.dto';
import { PrismaService } from 'src/services/prisma-service/prisma.service';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly user: UserService, private readonly prisma: PrismaService) { }

  @Post('create')
  @ApiOperation({
    summary: 'Create a user',
  })
  @ApiInternalServerErrorResponse({ description: 'Internal server error' })
  @ApiBadRequestResponse({
    description: 'Invalid email or password',
  })
  @ApiUnauthorizedResponse({
    description: 'This email already exists',
  })
  @ApiBody({
    type: CreateUserDto,
  })
  async create(@Body() data: CreateUserDto) {
    return await this.user.create(data);
  }

  /*  @Get(':id')
   @ApiBearerAuth()
   @UseGuards(AuthUserGuard)
   @ApiParam({
     name: 'id',
     type: Number,
   })
   @ApiResponse({
     status: 200,
     type: ResponseUserDto,
   })
   async findOne(@Param('id') id: number) {
     return await this.user.findOne(Number(id));
   } */

  @Post('create-alert')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiBody({
    type: CreateAlertDTO,
  })
  async createAlert(@Body() body: CreateAlertDTO, @Request() req) {
    const email = req.auth.email;

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) return

    return await this.user.createAlert(body, Number(user.id))
  }

  @Get('alert-count')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  async alertCount(@Request() req) {
    const email = req.auth.email;

    console.log(email)

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) return

    return await this.user.alertCount(Number(user.id))
  }

  @Get('get-alerts')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiQuery({
    name: 'page',
    type: Number,
  })
  @ApiQuery({
    name: 'perPage',
    type: Number,
  })
  async getAlerts(@Request() req, @Query('page') page: number = 1, @Query('perPage') perPage: number = 10) {
    const email = req.auth.email;

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) return

    return await this.user.getAlerts(Number(user.id), Number(page), Number(perPage))
  }

  @Get('get-global-alerts')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiQuery({
    name: 'page',
    type: Number,
  })
  @ApiQuery({
    name: 'perPage',
    type: Number,
  })
  async getGlobalAlerts(@Request() req, @Query('page') page: number = 1, @Query('perPage') perPage: number = 10) {
    const email = req.auth.email;

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) return

    return await this.user.getGlobalAlerts(Number(user.id), Number(page), Number(perPage))
  }

}
