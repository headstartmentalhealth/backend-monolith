"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const socket_io_1 = require("socket.io");
const chat_service_1 = require("./chats/chat.service");
const chats_payload_1 = require("./chats/chats.payload");
const create_chat_dto_1 = require("./chats/dto/create-chat.dto");
const validation_pipe_1 = require("./chat-generics/pipes/validation.pipe");
const fetch_chat_dto_1 = require("./chats/dto/fetch-chat.dto");
const ws_exception_filter_1 = require("./chat-generics/filters/ws-exception.filter");
const update_chat_dto_1 = require("./chats/dto/update-chat.dto");
let ChatGateway = class ChatGateway {
    constructor(chatService) {
        this.chatService = chatService;
        this.clients = new Set();
        this.rooms = {};
    }
    afterInit() {
        console.log('WebSocket Gateway initialized');
    }
    handleConnection(client) {
        this.clients.add(client);
        console.log(`Client connected: ${client.id}`);
        console.log(`Total connected: ${this.clients.size}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        this.clients.delete(client);
    }
    async retrieveChats(fetchChatsDto) {
        const response = await this.chatService.fetchChats(fetchChatsDto);
        this.server.emit(`chatsRetrieved:${response.user_id}`, {
            status: chats_payload_1.chatResponse.SUCCESS,
            message: 'Chats retrieved successfully.',
            data: {
                result: response.data,
                count: response.count,
            },
        });
    }
    async retrieveMessages(fetchChatMessagesDto) {
        const response = await this.chatService.fetchMessages(fetchChatMessagesDto);
        this.server.emit(`messagesRetrieved:${response.userId}`, {
            status: chats_payload_1.chatResponse.SUCCESS,
            message: 'User chat messages retrieved successfully.',
            data: {
                result: response.data,
                chatId: response.chatId,
                chat: response.chat,
                count: response.count,
                stats: response.stats,
            },
        });
        this.server.emit(`messagesRetrieved:${response.chatId}:${response.userId}`, {
            status: chats_payload_1.chatResponse.SUCCESS,
            message: 'Chat messages retrieved successfully.',
            data: {
                result: response.data,
                chat: response.chat,
                count: response.count,
                stats: response.stats,
            },
        });
        this.server.emit(`messagesRead:${response.chatId}`, {
            status: chats_payload_1.chatResponse.SUCCESS,
            message: `Chat messages read.`,
            data: {
                read_by: response.userId,
            },
        });
    }
    async create(createChatMessageDto) {
        const response = await this.chatService.createMessage(createChatMessageDto);
        this.server.emit(`messageSent:${response.chat.id}`, {
            status: chats_payload_1.chatResponse.SUCCESS,
            message: 'Chat message sent successfully.',
            data: response,
        });
        let chat_members = [];
        if (response.chat_group_id) {
            chat_members = [
                ...response.chat_group.group_members.map((member) => member.member_id),
            ];
        }
        else {
            chat_members = [response.initiator.id, response.chat_buddy.id];
        }
        chat_members.forEach((userId) => {
            this.server.emit(`recentChatRetrieved:${userId}`, {
                status: chats_payload_1.chatResponse.SUCCESS,
                message: 'Recent chat retrieved successfully.',
                data: Object.assign({}, response.chat, {
                    lastMessageId: response.id,
                    messages: [response],
                }),
            });
        });
        this.server.emit(`messagesRead:${response.chat.id}`, {
            status: chats_payload_1.chatResponse.SUCCESS,
            message: `Chat messages read.`,
            data: {
                read_by: response.initiator_id,
            },
        });
    }
    async createGroupChat(createChatGroupDto) {
        const response = await this.chatService.createChatGroup(createChatGroupDto);
        this.server.emit(`groupChatCreated:${response.creator_id}`, {
            status: chats_payload_1.chatResponse.SUCCESS,
            message: 'Chat group created successfully.',
            data: response,
        });
        response.members.forEach((member) => {
            this.server.emit(`groupChatCreated:${member.member_id}`, {
                status: chats_payload_1.chatResponse.SUCCESS,
                message: 'Chat group created successfully.',
                data: response,
            });
        });
        response.members.forEach((member) => {
            this.server.emit(`recentChatRetrieved:${member.member_id}`, {
                status: chats_payload_1.chatResponse.SUCCESS,
                message: 'Recent chat retrieved successfully.',
                data: Object.assign({}, response.chat, {
                    lastMessageId: response.id,
                    messages: [response],
                }),
            });
        });
    }
    async retrieveChatGroups(fetchChatGroupsDto) {
        const response = await this.chatService.fetchChatGroups(fetchChatGroupsDto);
        this.server.emit(`groupChatsRetrieved:${response.user_id}`, {
            status: chats_payload_1.chatResponse.SUCCESS,
            message: 'Group chats retrieved successfully.',
            data: {
                result: response.data,
                count: response.count,
            },
        });
    }
    async updateGroupChat(updateChatGroupDto) {
        const response = await this.chatService.updateChatGroup(updateChatGroupDto);
        response.members.forEach((member) => {
            this.server.emit(`groupChatUpdated:${member.member_id}`, {
                status: chats_payload_1.chatResponse.SUCCESS,
                message: 'Chat group updated successfully.',
                data: response,
            });
        });
        response.members.forEach((member) => {
            this.server.emit(`recentChatRetrieved:${member.member_id}`, {
                status: chats_payload_1.chatResponse.SUCCESS,
                message: 'Recent chat retrieved successfully.',
                data: Object.assign({}, response.chat.id, {
                    lastMessageId: response.id,
                    messages: [response],
                }),
            });
        });
    }
    async leaveGroup(leaveChatGroupDto) {
        const response = await this.chatService.leaveGroup(leaveChatGroupDto);
        response.chat_group.group_members.forEach((member) => {
            this.server.emit(`groupChatLeft:${member.member_id}`, {
                status: chats_payload_1.chatResponse.SUCCESS,
                message: 'Chat group updated successfully.',
                data: response,
            });
        });
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('retrieveChats'),
    __param(0, (0, websockets_1.MessageBody)(new validation_pipe_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fetch_chat_dto_1.FetchChatsDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "retrieveChats", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('retrieveMessages'),
    __param(0, (0, websockets_1.MessageBody)(new validation_pipe_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fetch_chat_dto_1.FetchChatMessagesDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "retrieveMessages", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.MessageBody)(new validation_pipe_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_chat_dto_1.CreateChatMessageDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "create", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('createGroupChat'),
    __param(0, (0, websockets_1.MessageBody)(new validation_pipe_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_chat_dto_1.CreateChatGroupDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "createGroupChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('retrieveGroupChats'),
    __param(0, (0, websockets_1.MessageBody)(new validation_pipe_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fetch_chat_dto_1.FetchChatGroupsDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "retrieveChatGroups", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('updateGroupChat'),
    __param(0, (0, websockets_1.MessageBody)(new validation_pipe_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_chat_dto_1.UpdateGroupChatDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "updateGroupChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveGroupChat'),
    __param(0, (0, websockets_1.MessageBody)(new validation_pipe_1.ValidationPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_chat_dto_1.LeaveGroupChatDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "leaveGroup", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    (0, common_1.UseFilters)(new ws_exception_filter_1.WsExceptionFilter()),
    __metadata("design:paramtypes", [chat_service_1.ChatsService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map