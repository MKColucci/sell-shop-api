import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly user: UserService) { }

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

  @Get(':id')
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
  }

  @Post('global-alert')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiQuery({
    name: 'message',
    type: String,
  })
  sendGlobalAlert(@Query('message') message: string) {
    return this.user.sendGlobalAlert(message);
  }

  @Post('user-alert')
  @ApiBearerAuth()
  @UseGuards(AuthUserGuard)
  @ApiQuery({
    name: 'message',
    type: String,
  })
  @ApiQuery({
    name: 'id',
    type: String,
  })
  sendUserAlert(@Query('message') message: string, @Query('id') id: string) {
    return this.user.sendUserAlert(id, message);
  }
}
