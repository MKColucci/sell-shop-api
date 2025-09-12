import { Module } from '@nestjs/common';
import { UserModule } from './modules/user-modules/user/user.module';
import { AuthModule } from './modules/auth-modules/auth/auth.module';
import { NotificationsGateway } from './gateway/websocket.gateway';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [],
  providers: [NotificationsGateway],
})
export class AppModule { }
