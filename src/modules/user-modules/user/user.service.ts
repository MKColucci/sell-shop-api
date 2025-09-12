import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/services/prisma-service/prisma.service';
import { genSaltSync, hash } from 'bcrypt';
import { ResponseUserDto } from './dto/response-user.dto';
import { NotificationsGateway } from 'src/gateway/websocket.gateway';
import { CreateAlertDTO } from 'src/modules/alert-modules/dto/create-alert.dto';
import { ResponseAlertDTO, ResponseAlerts } from 'src/modules/alert-modules/dto/response-alert.dto';
import { PaginationService } from 'src/services/pagination-service/pagination.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly pagination: PaginationService
  ) { }

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
          id: Number(id),
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

  async findMany(): Promise<ResponseUserDto[]> {
    try {
      const users = await this.prisma.user.findMany();

      const data = users.map((user) => {
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          active: user.active,
        }
      })

      return data;
    } catch (error) {
      throw error;
    }
  }


  async createAlert(body: CreateAlertDTO, userId: number) {
    try {
      const { isGlobal, message, userIds } = body

      const alertCreated = await this.prisma.alert.create({
        data: {
          message, userId: Number(userId), isGlobal,
        }
      })

      if (!isGlobal) {
        const data = userIds.map((id) => {
          this.notificationsGateway.sendUserNotification(id, message)
          return {
            userId: Number(id),
            alertId: alertCreated.id
          }
        })

        await this.prisma.alertReceived.createMany({
          data: data,
        })
      } else {
        this.notificationsGateway.sendGlobalNotification(message)
      }

      return 'success'
    } catch (error) {
      throw new BadRequestException('Error', error)
    }
  }

  async alertCount(userId: number): Promise<number> {
    try {
      const totalAlertsNotViewed = await this.prisma.alertReceived.count({
        where: {
          userId: Number(userId),
          viewed: false
        }
      })

      return totalAlertsNotViewed
    } catch (error) {
      throw new BadRequestException('Error', error)
    }
  }

  async getAlerts(userId: number, page: number = 1, perPage: number = 10): Promise<ResponseAlerts> {
    try {
      const alerts = await this.prisma.alertReceived.findMany({
        where: {
          userId: Number(userId)
        },
        include: {
          alert: {
            include: {
              createdByUser: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: Number(perPage),
        skip: (page - 1) * perPage,
      })

      const totalItems = await this.prisma.alertReceived.count({
        where: {
          userId: Number(userId)
        },
      });

      const pageInfo = await this.pagination.paginate({
        page,
        perPage,
        totalItems,
      });

      const data: ResponseAlertDTO[] = []
      const alertsId: number[] = []

      alerts.map((alert) => {
        alertsId.push(alert.id)
        data.push({
          id: alert.id,
          message: alert.alert.message,
          createdAt: alert.alert.createdAt,
          sendBy: alert.alert.createdByUser.name,
          viewed: alert.viewed
        })
      })

      await this.prisma.alertReceived.updateMany({
        where: {
          id: { in: alertsId }
        },
        data: {
          viewed: true
        }
      })

      return {
        data,
        pageInfo
      }
    } catch (error) {
      throw new BadRequestException('Error', error)
    }
  }

  async getGlobalAlerts(userId: number, page: number = 1, perPage: number = 10) {
    try {
      const alerts = await this.prisma.alert.findMany({
        where: {
          isGlobal: true
        },
        include: {
          createdByUser: true
        },
        take: Number(perPage),
        skip: (page - 1) * perPage,
      })

      const totalItems = await this.prisma.alert.count({
        where: {
          isGlobal: true,
          AlertReceived: {
            every: {
              userId: Number(userId),
            }
          }
        },
      });

      const pageInfo = await this.pagination.paginate({
        page,
        perPage,
        totalItems,
      });

      const data: ResponseAlertDTO[] = []
      const alertsId: number[] = []

      alerts.map((alert) => {
        alertsId.push(alert.id)
        data.push({
          id: alert.id,
          message: alert.message,
          createdAt: alert.createdAt,
          sendBy: alert.createdByUser.name,
          viewed: true
        })
      })

      await this.prisma.alertReceived.updateMany({
        where: {
          id: { in: alertsId }
        },
        data: {
          viewed: true
        }
      })

      return {
        data,
        pageInfo
      }
    } catch (error) {
      throw new BadRequestException('Error', error)
    }
  }
}
