import { ApiProperty } from '@nestjs/swagger';

export class AuthLoginDto {
  @ApiProperty({
    type: String,
    name: 'email',
    required: true,
  })
  email: string;

  @ApiProperty({
    type: String,
    name: 'password',
    required: true,
  })
  password: string;
}

export class AuthLoginServiceDto {
  @ApiProperty({
    type: Number,
    name: 'id',
    required: true,
  })
  id: number;

  @ApiProperty({
    type: String,
    name: 'email',
    required: true,
  })
  email: string;

  @ApiProperty({
    type: String,
    name: 'name',
    required: true,
  })
  name: string;
}
