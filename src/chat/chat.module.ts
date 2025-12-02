import { Module } from '@nestjs/common';
import { ChatsService } from './chats/chat.service';
import { ChatGateway } from './chat.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { NotificationDispatchModule } from '@/notification/dispatch/dispatch.module';
import { ChatController } from './chats/chat.controller';

@Module({
  imports: [NotificationDispatchModule],
  controllers: [ChatController],
  providers: [JwtService, ChatGateway, ChatsService],
})
export class ChatModule {}
