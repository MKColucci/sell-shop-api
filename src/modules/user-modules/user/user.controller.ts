import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResponseUserDto } from './dto/response-user.dto';

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly user: UserService) {}

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
}
