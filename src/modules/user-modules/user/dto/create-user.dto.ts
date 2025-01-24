import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    name: 'name',
    type: String,
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    name: 'email',
    type: String,
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    name: 'password',
    type: String,
    required: true,
  })
  @IsString()
  password: string;
}
