import { Body, Controller, Injectable, Post, Req } from '@nestjs/common';
import { ChatsService } from './chat.service';
import { AuthPayload } from '@/generic/generic.payload';
import { CreateChatDto } from './dto/create-chat.dto';

@Controller('v1/chat')
export class ChatController {
  constructor(private chatService: ChatsService) {}

  @Post('create')
  create(@Body() createChatDto: CreateChatDto) {
    return this.chatService.createChat(createChatDto);
  }
}
