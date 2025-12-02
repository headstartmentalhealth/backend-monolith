import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { UseFilters } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatsService } from './chats/chat.service';
import { chatResponse } from './chats/chats.payload';
import {
  CreateChatGroupDto,
  CreateChatMessageDto,
} from './chats/dto/create-chat.dto';

import { ValidationPipe } from './chat-generics/pipes/validation.pipe';
import {
  FetchChatGroupsDto,
  FetchChatMessagesDto,
  FetchChatsDto,
} from './chats/dto/fetch-chat.dto';
import { WsExceptionFilter } from './chat-generics/filters/ws-exception.filter';
import {
  LeaveGroupChatDto,
  UpdateGroupChatDto,
} from './chats/dto/update-chat.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@UseFilters(new WsExceptionFilter())
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    // private readonly chatService: ChatMessagesService,
    private readonly chatService: ChatsService,
  ) {}

  private clients: Set<Socket> = new Set();

  private rooms: { [roomId: string]: Set<string> } = {};

  @WebSocketServer() server: Server;

  afterInit() {
    console.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.clients.add(client);
    console.log(`Client connected: ${client.id}`);
    console.log(`Total connected: ${this.clients.size}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.clients.delete(client);
  }

  /**
   * Retrieve chats
   * @param fetchChatsDto
   */
  @SubscribeMessage('retrieveChats')
  async retrieveChats(
    @MessageBody(new ValidationPipe())
    fetchChatsDto: FetchChatsDto,
  ) {
    const response = await this.chatService.fetchChats(fetchChatsDto);

    this.server.emit(`chatsRetrieved:${response.user_id}`, {
      status: chatResponse.SUCCESS,
      message: 'Chats retrieved successfully.',
      data: {
        result: response.data,
        count: response.count,
      },
    });
  }

  /**
   * Retrieve messages event emitter
   * @param fetchChatsDto
   */
  @SubscribeMessage('retrieveMessages')
  async retrieveMessages(
    @MessageBody(new ValidationPipe())
    fetchChatMessagesDto: FetchChatMessagesDto,
  ) {
    const response = await this.chatService.fetchMessages(fetchChatMessagesDto);

    this.server.emit(`messagesRetrieved:${response.userId}`, {
      status: chatResponse.SUCCESS,
      message: 'User chat messages retrieved successfully.',
      data: {
        result: response.data,
        chatId: response.chatId,
        chat: response.chat,
        count: response.count,
        stats: response.stats,
      },
    });

    this.server.emit(
      `messagesRetrieved:${response.chatId}:${response.userId}`,
      {
        status: chatResponse.SUCCESS,
        message: 'Chat messages retrieved successfully.',
        data: {
          result: response.data,
          chat: response.chat,
          count: response.count,
          stats: response.stats,
        },
      },
    );

    // This is to tell the chat partner that his buddy has read their chat message(s)
    this.server.emit(`messagesRead:${response.chatId}`, {
      status: chatResponse.SUCCESS,
      message: `Chat messages read.`,
      data: {
        read_by: response.userId,
      },
    });
  }

  /**
   * Send message event emitter
   * @param createChatMessageDto
   */
  @SubscribeMessage('sendMessage')
  async create(
    @MessageBody(new ValidationPipe())
    createChatMessageDto: CreateChatMessageDto,
  ) {
    const response = await this.chatService.createMessage(createChatMessageDto);

    this.server.emit(`messageSent:${response.chat.id}`, {
      status: chatResponse.SUCCESS,
      message: 'Chat message sent successfully.',
      data: response,
    });

    let chat_members: string[] = [];
    if (response.chat_group_id) {
      chat_members = [
        ...response.chat_group.group_members.map((member) => member.member_id),
      ];
    } else {
      chat_members = [response.initiator.id, response.chat_buddy.id];
    }

    chat_members.forEach((userId) => {
      this.server.emit(`recentChatRetrieved:${userId}`, {
        status: chatResponse.SUCCESS,
        message: 'Recent chat retrieved successfully.',
        data: Object.assign({}, response.chat, {
          lastMessageId: response.id,
          messages: [response],
        }),
      });
    });

    // This is to tell the chat partner that his buddy has read their chat message(s) - (This is needed if you are in the DM of your  chat  buddy when he sent his message.)
    this.server.emit(`messagesRead:${response.chat.id}`, {
      status: chatResponse.SUCCESS,
      message: `Chat messages read.`,
      data: {
        read_by: response.initiator_id,
      },
    });
  }

  /**
   * Create group event emitter
   * @param createChatGroupDto
   */
  @SubscribeMessage('createGroupChat')
  async createGroupChat(
    @MessageBody(new ValidationPipe())
    createChatGroupDto: CreateChatGroupDto,
  ) {
    const response = await this.chatService.createChatGroup(createChatGroupDto);

    this.server.emit(`groupChatCreated:${response.creator_id}`, {
      status: chatResponse.SUCCESS,
      message: 'Chat group created successfully.',
      data: response,
    });

    response.members.forEach((member) => {
      this.server.emit(`groupChatCreated:${member.member_id}`, {
        status: chatResponse.SUCCESS,
        message: 'Chat group created successfully.',
        data: response,
      });
    });

    response.members.forEach((member) => {
      this.server.emit(`recentChatRetrieved:${member.member_id}`, {
        status: chatResponse.SUCCESS,
        message: 'Recent chat retrieved successfully.',
        data: Object.assign({}, response.chat, {
          lastMessageId: response.id,
          messages: [response],
        }),
      });
    });
  }

  /**
   * Retrieve chat groups
   * @param fetchChatGroupsDto
   */
  @SubscribeMessage('retrieveGroupChats')
  async retrieveChatGroups(
    @MessageBody(new ValidationPipe())
    fetchChatGroupsDto: FetchChatGroupsDto,
  ) {
    const response = await this.chatService.fetchChatGroups(fetchChatGroupsDto);

    this.server.emit(`groupChatsRetrieved:${response.user_id}`, {
      status: chatResponse.SUCCESS,
      message: 'Group chats retrieved successfully.',
      data: {
        result: response.data,
        count: response.count,
      },
    });
  }

  /**
   * Create group event emitter
   * @param updateChatGroupDto
   */
  @SubscribeMessage('updateGroupChat')
  async updateGroupChat(
    @MessageBody(new ValidationPipe())
    updateChatGroupDto: UpdateGroupChatDto,
  ) {
    const response = await this.chatService.updateChatGroup(updateChatGroupDto);

    // this.server.emit(`groupChatUpdated:${response.creator_id}`, {
    //   status: chatResponse.SUCCESS,
    //   message: 'Chat group updated successfully.',
    //   data: response,
    // });

    response.members.forEach((member) => {
      this.server.emit(`groupChatUpdated:${member.member_id}`, {
        status: chatResponse.SUCCESS,
        message: 'Chat group updated successfully.',
        data: response,
      });
    });

    response.members.forEach((member) => {
      this.server.emit(`recentChatRetrieved:${member.member_id}`, {
        status: chatResponse.SUCCESS,
        message: 'Recent chat retrieved successfully.',
        data: Object.assign({}, response.chat.id, {
          lastMessageId: response.id,
          messages: [response],
        }),
      });
    });
  }

  /**
   * Leave group event emitter
   * @param leaveChatGroupDto
   */
  @SubscribeMessage('leaveGroupChat')
  async leaveGroup(
    @MessageBody(new ValidationPipe())
    leaveChatGroupDto: LeaveGroupChatDto,
  ) {
    const response = await this.chatService.leaveGroup(leaveChatGroupDto);

    response.chat_group.group_members.forEach((member) => {
      this.server.emit(`groupChatLeft:${member.member_id}`, {
        status: chatResponse.SUCCESS,
        message: 'Chat group updated successfully.',
        data: response,
      });
    });
  }
}
