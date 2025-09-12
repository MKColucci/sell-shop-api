import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true }) // Permite CORS, ajuste conforme seu front
export class NotificationsGateway {
    @WebSocketServer()
    server: Server;

    // Evento para mensagens globais
    sendGlobalNotification(message: string) {
        this.server.emit('global_notification', message);
    }

    // Evento para mensagens específicas de um usuário
    sendUserNotification(userId: number | string, message: string) {
        this.server.to(String(userId)).emit('user_notification', message);
    }
    // Quando um cliente se conecta
    handleConnection(client: Socket) {
        const userId = String(client.handshake.query.userId); // garante que seja string
        if (userId) {
            client.join(userId);
            console.log(`User ${userId} joined room ${userId}`);
        }
    }

    // Quando um cliente envia uma mensagem (opcional)
    @SubscribeMessage('message')
    handleMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
        console.log(`Received message from ${client.id}:`, data);
    }

    // Quando um cliente se desconecta
    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }
}
