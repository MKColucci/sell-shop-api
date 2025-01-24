import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/services/prisma-service/prisma.service';
import { genSaltSync, hash } from 'bcrypt';
import { ResponseUserDto } from './dto/response-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    try {
      const { email, name, password } = data;

      const emailExists = await this.prisma.user.findUnique({
        where: {
          email: email.toLowerCase(),
        },
      });

      if (emailExists) {
        throw new UnprocessableEntityException('This email already exists');
      }

      const salt = genSaltSync(10);
      const hashedPassword = await hash(password, salt);

      const user = await this.prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
        },
      });

      return {
        userId: user.id,
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: number): Promise<ResponseUserDto> {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        active: user.active,
      };
    } catch (error) {
      throw error;
    }
  }
}
