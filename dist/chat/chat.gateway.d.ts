import { OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatsService } from './chats/chat.service';
import { CreateChatGroupDto, CreateChatMessageDto } from './chats/dto/create-chat.dto';
import { FetchChatGroupsDto, FetchChatMessagesDto, FetchChatsDto } from './chats/dto/fetch-chat.dto';
import { LeaveGroupChatDto, UpdateGroupChatDto } from './chats/dto/update-chat.dto';
export declare class ChatGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    constructor(chatService: ChatsService);
    private clients;
    private rooms;
    server: Server;
    afterInit(): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    retrieveChats(fetchChatsDto: FetchChatsDto): Promise<void>;
    retrieveMessages(fetchChatMessagesDto: FetchChatMessagesDto): Promise<void>;
    create(createChatMessageDto: CreateChatMessageDto): Promise<void>;
    createGroupChat(createChatGroupDto: CreateChatGroupDto): Promise<void>;
    retrieveChatGroups(fetchChatGroupsDto: FetchChatGroupsDto): Promise<void>;
    updateGroupChat(updateChatGroupDto: UpdateGroupChatDto): Promise<void>;
    leaveGroup(leaveChatGroupDto: LeaveGroupChatDto): Promise<void>;
}
