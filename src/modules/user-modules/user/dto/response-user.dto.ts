import { ApiProperty } from '@nestjs/swagger';

export class ResponseUserDto {
  @ApiProperty({
    name: 'name',
    type: Number,
  })
  id: number;

  @ApiProperty({
    name: 'name',
    type: String,
  })
  name: string;

  @ApiProperty({
    name: 'email',
    type: String,
  })
  email: string;

  @ApiProperty({
    name: 'active',
    type: Boolean,
  })
  active: boolean;
}
