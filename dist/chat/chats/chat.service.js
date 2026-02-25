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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const fetch_chat_dto_1 = require("./dto/fetch-chat.dto");
const chat_utils_1 = require("../chat.utils");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const generic_service_1 = require("../../generic/generic.service");
const dispatch_service_1 = require("../../notification/dispatch/dispatch.service");
let ChatsService = class ChatsService {
    constructor(prisma, jwtService, configService, genericService, notificationDispatchService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.genericService = genericService;
        this.notificationDispatchService = notificationDispatchService;
        this.chatSelect = {
            initiator: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                    profile: {
                        select: {
                            profile_picture: true,
                        },
                    },
                },
            },
            chat_buddy: {
                select: {
                    id: true,
                    name: true,
                    role: true,
                    profile: {
                        select: {
                            profile_picture: true,
                        },
                    },
                },
            },
            chat_group: {
                include: {
                    subscription_plan: true,
                    multimedia: true,
                    group_members: {
                        include: {
                            member: {
                                select: {
                                    id: true,
                                    name: true,
                                    role: { select: { name: true, role_id: true } },
                                    profile: { select: { profile_picture: true } },
                                },
                            },
                        },
                    },
                },
            },
            messages: {
                take: 1,
                orderBy: { created_at: 'desc' },
                where: { deleted_at: null },
            },
        };
        this.chatGroupInclude = {
            subscription_plan: true,
            multimedia: true,
            creator: {
                select: {
                    id: true,
                    name: true,
                    role: { select: { role_id: true, name: true } },
                    profile: { select: { profile_picture: true } },
                },
            },
            group_members: {
                include: {
                    member: {
                        select: {
                            id: true,
                            name: true,
                            role: { select: { name: true, role_id: true } },
                            profile: { select: { profile_picture: true } },
                        },
                    },
                },
            },
            chat_messages: {
                take: 1,
                orderBy: { created_at: 'desc' },
                where: { deleted_at: null },
            },
        };
        this.pageSize = 20;
    }
    async verifyToken(token) {
        try {
            return this.jwtService.verify(token, {
                secret: this.configService.get('JWT_SECRET'),
            });
        }
        catch (error) {
            throw new common_1.BadRequestException('Invalid token');
        }
    }
    async chatExists(initiator_id, chat_buddy_id, chat_group_id, verify = false) {
        return this._chatExistsInternal({ initiator_id, chat_buddy_id, chat_group_id, verify }, this.prisma);
    }
    async chatExistsTrx({ initiator_id, chat_buddy_id, chat_group_id, verify = false, }, prisma) {
        return this._chatExistsInternal({ initiator_id, chat_buddy_id, chat_group_id, verify }, prisma);
    }
    async _chatExistsInternal({ initiator_id, chat_buddy_id, chat_group_id, verify, }, prisma) {
        if (chat_group_id) {
            const group = await prisma.chatGroup.findUnique({
                where: { id: chat_group_id },
            });
            if (!group) {
                throw new common_1.BadRequestException('Chat group not found');
            }
        }
        const chat = await prisma.chat.findFirst({
            where: {
                ...(chat_group_id
                    ? { chat_group_id }
                    : {
                        OR: [
                            { initiator_id, chat_buddy_id },
                            { initiator_id: chat_buddy_id, chat_buddy_id: initiator_id },
                        ],
                    }),
                deleted_at: null,
            },
            include: this.chatSelect,
        });
        if (verify && !chat) {
            throw new common_1.BadRequestException('Chat not found');
        }
        return chat;
    }
    prepareChatUnread(initiator_id, chat_buddy_id) {
        return [
            {
                user_id: initiator_id,
                unread: false,
                count: 0,
            },
            {
                user_id: chat_buddy_id,
                unread: true,
                count: 1,
            },
        ];
    }
    async createOrUpdateChat(createChatDto) {
        const { initiator, chatBuddy, lastMessage, chatGroup } = createChatDto;
        let chat = await this.chatExists(initiator, chatBuddy, chatGroup);
        if (!chat) {
            chat = await this.prisma.chat.create({
                data: {
                    ...(initiator && { initiator_id: initiator }),
                    ...(chatBuddy && { chat_buddy_id: chatBuddy }),
                    ...(chatGroup && { chat_group_id: chatGroup, is_group: true }),
                    ...(lastMessage && {
                        last_message: (0, chat_utils_1.sanitizeMessage)(lastMessage),
                        last_message_at: new Date(),
                    }),
                    unread: this.prepareChatUnread(initiator, chatBuddy),
                },
                include: this.chatSelect,
            });
        }
        else {
            const currentUnread = chat.unread;
            const updatedUnread = currentUnread.map((item) => {
                if (item.user_id === chatBuddy) {
                    return {
                        ...item,
                        unread: true,
                        ...(lastMessage ? { count: item.count + 1 } : { count: 0 }),
                    };
                }
                return item;
            });
            chat = await this.prisma.chat.update({
                where: { id: chat.id },
                data: {
                    ...(lastMessage && {
                        last_message: (0, chat_utils_1.sanitizeMessage)(lastMessage),
                        last_message_at: new Date(),
                    }),
                    unread: updatedUnread,
                },
                include: this.chatSelect,
            });
        }
        if (chat?.chat_group?.group_members) {
            chat.chat_group.group_members = chat.chat_group.group_members.filter((gm) => gm.deleted_at === null);
        }
        const user = await this.prisma.user.findFirst({
            where: { id: chatBuddy },
            select: { id: true, name: true, profile: true },
        });
        return Object.assign({}, chat, { chat_buddy: user });
    }
    async createOrUpdateChatWithTrx(createChatDto, prisma) {
        const { initiator, chatBuddy, lastMessage, chatGroup } = createChatDto;
        let chat = await this.chatExistsTrx({
            initiator_id: initiator,
            chat_buddy_id: chatBuddy,
            chat_group_id: chatGroup,
        }, prisma);
        if (!chat) {
            chat = await prisma.chat.create({
                data: {
                    initiator_id: initiator,
                    ...(chatBuddy && { chat_buddy_id: chatBuddy }),
                    ...(chatGroup && { chat_group_id: chatGroup, is_group: true }),
                    ...(lastMessage && {
                        last_message: (0, chat_utils_1.sanitizeMessage)(lastMessage),
                        last_message_at: new Date(),
                    }),
                    unread: this.prepareChatUnread(initiator, chatBuddy),
                },
                include: this.chatSelect,
            });
        }
        else {
            const currentUnread = chat.unread;
            const updatedUnread = currentUnread.map((item) => {
                if (item.user_id === chatBuddy) {
                    return { ...item, unread: true, count: item.count + 1 };
                }
                return item;
            });
            chat = await prisma.chat.update({
                where: { id: chat.id },
                data: {
                    ...(lastMessage && {
                        last_message: (0, chat_utils_1.sanitizeMessage)(lastMessage),
                        last_message_at: new Date(),
                    }),
                    unread: updatedUnread,
                },
                include: this.chatSelect,
            });
        }
        const user = await prisma.user.findFirst({
            where: { id: chatBuddy },
            select: { id: true, name: true, profile: true },
        });
        const formatted_chat = (0, chat_utils_1.formatChat)(chat, user.id);
        return Object.assign({}, formatted_chat, { chat_buddy: user });
    }
    async markChatAsRead(user_id, chat_id) {
        const chat = await this.prisma.chat.findUnique({
            where: { id: chat_id },
        });
        if (!chat) {
            throw new common_1.BadRequestException('Chat not found');
        }
        const unread = chat.unread;
        const updatedUnread = unread.map((item) => {
            if (item.user_id === user_id) {
                return { ...item, unread: false, count: 0 };
            }
            return item;
        });
        await this.prisma.chat.update({
            where: { id: chat_id },
            data: { unread: updatedUnread },
        });
        await this.prisma.chatMessage.updateMany({
            where: {
                chat_id,
                chat_buddy_id: user_id,
                read: false,
            },
            data: { read: true },
        });
    }
    async fetchChats(fetchChatsDto) {
        const payload = await this.verifyToken(fetchChatsDto.token);
        const user_id = payload.sub;
        const page = fetchChatsDto.page || 1;
        const skip = (page - 1) * this.pageSize;
        let where = {
            OR: [
                { initiator_id: user_id },
                { chat_buddy_id: user_id },
                {
                    chat_group: {
                        OR: [
                            {
                                group_members: {
                                    some: {
                                        member: {
                                            id: user_id,
                                        },
                                        deleted_at: null,
                                    },
                                },
                            },
                        ],
                    },
                },
            ],
            deleted_at: null,
        };
        if (fetchChatsDto.status) {
            where.unread = {
                array_contains: [
                    {
                        user_id: user_id,
                        unread: fetchChatsDto.status === fetch_chat_dto_1.ReadStatus.UNREAD,
                    },
                ],
            };
        }
        if (fetchChatsDto.q) {
            const searchCondition = {
                OR: [
                    {
                        initiator: {
                            name: { contains: fetchChatsDto.q, mode: 'insensitive' },
                        },
                    },
                    {
                        chat_buddy: {
                            name: { contains: fetchChatsDto.q, mode: 'insensitive' },
                        },
                    },
                    {
                        chat_group: {
                            name: { contains: fetchChatsDto.q, mode: 'insensitive' },
                        },
                    },
                ],
            };
            where = {
                AND: [where, searchCondition],
            };
        }
        try {
            const chats = await this.prisma.chat.findMany({
                where,
                include: {
                    initiator: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                            profile: {
                                select: {
                                    profile_picture: true,
                                },
                            },
                        },
                    },
                    chat_buddy: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                            profile: {
                                select: {
                                    profile_picture: true,
                                },
                            },
                        },
                    },
                    chat_group: {
                        include: {
                            subscription_plan: true,
                            multimedia: true,
                            group_members: {
                                include: {
                                    member: {
                                        select: {
                                            name: true,
                                            role: { select: { name: true, role_id: true } },
                                            profile: { select: { profile_picture: true } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    messages: {
                        take: 1,
                        orderBy: { created_at: 'desc' },
                        where: { deleted_at: null },
                    },
                },
                skip,
                take: this.pageSize,
            });
            const formattedChats = (0, chat_utils_1.formatChats)(chats, user_id);
            return {
                status: 'success',
                data: formattedChats,
                count: formattedChats.length,
                page,
                totalPages: Math.ceil(formattedChats.length / this.pageSize),
                user_id,
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch chats: ${error.message}`);
        }
    }
    async createMessage(createChatMessageDto) {
        const payload = await this.verifyToken(createChatMessageDto.token);
        const userId = payload.sub;
        const { chatBuddy: chat_buddy_id, message, file, chatGroup: chat_group_id, } = createChatMessageDto;
        if (message && message.length > chat_utils_1.maxWords) {
            throw new common_1.UnprocessableEntityException(` Message exceeds the maximum of ${chat_utils_1.maxWords} words`);
        }
        if (chat_buddy_id) {
            await this.genericService.findUser(chat_buddy_id);
        }
        const chat = await this.createOrUpdateChat({
            initiator: userId,
            chatBuddy: chat_buddy_id,
            lastMessage: message ? message : '🖼',
            chatGroup: chat_group_id,
        });
        const chatMessage = await this.prisma.chatMessage.create({
            data: {
                chat_id: chat.id,
                initiator_id: userId,
                ...(chat_buddy_id && { chat_buddy_id }),
                ...(chat_group_id && { chat_group_id }),
                ...(message && { message: (0, chat_utils_1.sanitizeMessage)(message) }),
                ...(file && { file: createChatMessageDto.file }),
            },
            include: {
                initiator: {
                    select: { id: true, name: true, role: true, profile: true },
                },
                chat_buddy: {
                    select: { id: true, name: true, role: true, profile: true },
                },
                chat: {
                    include: {
                        initiator: {
                            select: { id: true, name: true, role: true, profile: true },
                        },
                        chat_buddy: {
                            select: { id: true, name: true, role: true, profile: true },
                        },
                    },
                },
                chat_group: {
                    include: {
                        multimedia: true,
                        group_members: true,
                        chat_messages: {
                            take: 1,
                            orderBy: { created_at: 'desc' },
                            where: { deleted_at: null },
                        },
                    },
                },
            },
        });
        await this.notificationDispatchService.sendPush(chat_buddy_id, `A message from ${chatMessage.initiator.name}`, message ? message : '🖼', '', chatMessage);
        const formattedChat = {
            ...chatMessage.chat,
            chat_group: chatMessage.chat_group
                ? {
                    ...chatMessage.chat_group,
                    lastMessage: chatMessage?.chat_group?.chat_messages[0] || null,
                }
                : null,
            chat_buddy: chatMessage.chat.initiator_id === userId
                ? chatMessage.chat.chat_buddy
                : chatMessage.chat.initiator,
            initiator: undefined,
        };
        return { ...chatMessage, chat: formattedChat };
    }
    async getMessageStats(chat_id) {
        const [messagesWithLinks, filesWithFormats] = await Promise.all([
            this.prisma.chatMessage
                .findMany({
                where: {
                    chat_id,
                    message: {
                        contains: 'http',
                        mode: 'insensitive',
                    },
                    deleted_at: null,
                },
                select: { id: true, message: true },
            })
                .then((messages) => {
                const linkRegex = /(https?:\/\/|www\.)\S+/i;
                return messages.filter((m) => m.message && linkRegex.test(m.message))
                    .length;
            }),
            this.prisma.chatMessage.count({
                where: {
                    chat_id,
                    deleted_at: null,
                    OR: [
                        { file: { endsWith: '.png', mode: 'insensitive' } },
                        { file: { endsWith: '.jpg', mode: 'insensitive' } },
                        { file: { endsWith: '.jpeg', mode: 'insensitive' } },
                        { file: { endsWith: '.gif', mode: 'insensitive' } },
                        { file: { endsWith: '.pdf', mode: 'insensitive' } },
                        { file: { endsWith: '.doc', mode: 'insensitive' } },
                        { file: { endsWith: '.docx', mode: 'insensitive' } },
                    ],
                },
            }),
        ]);
        return {
            totalMessagesWithLinks: messagesWithLinks,
            totalFilesWithFormats: filesWithFormats,
        };
    }
    async fetchMessages(fetchChatMessagesDto) {
        const payload = await this.verifyToken(fetchChatMessagesDto.token);
        const userId = payload.sub;
        const { chatBuddy: chat_buddy_id, chatGroup: chat_group_id } = fetchChatMessagesDto;
        const page = fetchChatMessagesDto.page || 1;
        const skip = (page - 1) * this.pageSize;
        let chat = await this.createOrUpdateChat({
            initiator: userId,
            chatBuddy: chat_buddy_id,
            chatGroup: chat_group_id,
        });
        await this.markChatAsRead(userId, chat.id);
        const messageStats = await this.getMessageStats(chat.id);
        const [messages, total] = await Promise.all([
            this.prisma.chatMessage.findMany({
                where: {
                    ...(chat_group_id
                        ? { chat_group_id }
                        : {
                            OR: [
                                { initiator_id: userId, chat_buddy_id },
                                { initiator_id: chat_buddy_id, chat_buddy_id: userId },
                            ],
                        }),
                    deleted_at: null,
                },
                include: {
                    initiator: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                            profile: { select: { profile_picture: true } },
                        },
                    },
                    chat_buddy: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                            profile: { select: { profile_picture: true } },
                        },
                    },
                    chat_group: {
                        include: { multimedia: true, subscription_plan: true },
                    },
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: this.pageSize,
            }),
            this.prisma.chatMessage.count({
                where: {
                    ...(chat_group_id
                        ? { chat_group_id }
                        : {
                            OR: [
                                { initiator_id: userId, chat_buddy_id },
                                { initiator_id: chat_buddy_id, chat_buddy_id: userId },
                            ],
                        }),
                    deleted_at: null,
                },
            }),
        ]);
        return {
            data: messages.reverse(),
            count: total,
            userId,
            chatId: chat.id,
            chat: chat,
            stats: messageStats,
        };
    }
    async updateMessage(updateChatMessageDto) {
        await this.verifyToken(updateChatMessageDto.token);
        const message = await this.prisma.chatMessage.findUnique({
            where: { id: updateChatMessageDto.id },
        });
        if (!message) {
            throw new common_1.BadRequestException('Chat message not found');
        }
        const data = {};
        if (updateChatMessageDto.message) {
            data.message = (0, chat_utils_1.sanitizeMessage)(updateChatMessageDto.message);
        }
        if (updateChatMessageDto.read !== undefined) {
            data.read = updateChatMessageDto.read;
        }
        const updatedMessage = await this.prisma.chatMessage.update({
            where: { id: updateChatMessageDto.id },
            data,
            include: {
                initiator: true,
                chat_buddy: true,
                chat: {
                    include: {
                        initiator: true,
                        chat_buddy: true,
                    },
                },
            },
        });
        if (updateChatMessageDto.message) {
            await this.updateChatLastMessageAt(message.chat_id);
        }
        return updatedMessage;
    }
    async updateChatLastMessageAt(chatId) {
        await this.prisma.chat.update({
            where: { id: chatId },
            data: { last_message_at: new Date() },
        });
    }
    async findMessage(messageId) {
        const message = await this.prisma.chatMessage.findUnique({
            where: { id: messageId },
            include: {
                initiator: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
                chat_buddy: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
                chat: {
                    include: {
                        initiator: {
                            select: {
                                id: true,
                                name: true,
                                role: true,
                            },
                        },
                        chat_buddy: {
                            select: {
                                id: true,
                                name: true,
                                role: true,
                            },
                        },
                    },
                },
            },
        });
        if (!message) {
            throw new common_1.BadRequestException('Chat message not found');
        }
        return message;
    }
    async createChatGroup(createChatGroupDto) {
        const payload = await this.verifyToken(createChatGroupDto.token);
        const userId = payload.sub;
        const { name, description, multimedia_id, members } = createChatGroupDto;
        const { details, chat } = await this.prisma.$transaction(async (prisma) => {
            const group = await prisma.chatGroup.findFirst({ where: { name } });
            if (group) {
                throw new common_1.ConflictException(`Chat group name already exists.`);
            }
            const details = await prisma.chatGroup.create({
                data: {
                    name,
                    description,
                    multimedia_id,
                    auto_created: false,
                    creator_id: userId,
                },
                include: this.chatGroupInclude,
            });
            const chat = await this.createOrUpdateChatWithTrx({ initiator: userId, chatGroup: details.id }, prisma);
            await prisma.chatGroupMember.create({
                data: { member_id: userId, group_id: details.id, is_admin: true },
            });
            for (let index = 0; index < createChatGroupDto.members.length; index++) {
                const member = createChatGroupDto.members[index];
                const member_details = await prisma.user.findFirst({
                    where: { id: member.member_id },
                });
                if (!member_details) {
                    throw new common_1.NotFoundException(`Member details of ID [${member.member_id}] not found, `);
                }
                await prisma.chatGroupMember.create({
                    data: { member_id: member.member_id, group_id: details.id },
                });
            }
            return { details, chat };
        });
        return { ...details, members, chat: chat };
    }
    async fetchChatGroups(fetchChatGroupsDto) {
        const payload = await this.verifyToken(fetchChatGroupsDto.token);
        const user_id = payload.sub;
        const page = fetchChatGroupsDto.page || 1;
        const skip = (page - 1) * this.pageSize;
        let where = {
            deleted_at: null,
            group_members: {
                some: { member_id: user_id, deleted_at: null },
            },
        };
        if (fetchChatGroupsDto.q) {
            where = {
                ...where,
                OR: [
                    { name: { contains: fetchChatGroupsDto.q, mode: 'insensitive' } },
                    {
                        group_members: {
                            some: {
                                member: {
                                    name: { contains: fetchChatGroupsDto.q, mode: 'insensitive' },
                                },
                            },
                        },
                    },
                ],
            };
        }
        try {
            const groups = await this.prisma.chatGroup.findMany({
                where,
                include: {
                    subscription_plan: true,
                    multimedia: true,
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            role: { select: { role_id: true, name: true } },
                            profile: { select: { profile_picture: true } },
                        },
                    },
                    group_members: {
                        include: {
                            member: {
                                select: {
                                    id: true,
                                    name: true,
                                    role: { select: { name: true, role_id: true } },
                                    profile: { select: { profile_picture: true } },
                                },
                            },
                        },
                    },
                    chat_messages: {
                        take: 1,
                        orderBy: { created_at: 'desc' },
                        where: { deleted_at: null },
                    },
                },
                skip,
                take: this.pageSize,
                orderBy: { updated_at: 'desc' },
            });
            const formattedGroups = groups.map((group) => {
                const lastMessage = group.chat_messages[0] || null;
                return {
                    id: group.id,
                    name: group.name,
                    description: group.description,
                    created_at: group.created_at,
                    updated_at: group.updated_at,
                    creator: group.creator,
                    members: group.group_members.map((m) => m.member),
                    subscription_plan: group.subscription_plan,
                    multimedia: group.multimedia,
                    lastMessage,
                };
            });
            const totalCount = await this.prisma.chatGroup.count({ where });
            return {
                status: 'success',
                data: formattedGroups,
                count: totalCount,
                page,
                totalPages: Math.ceil(totalCount / this.pageSize),
                user_id,
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch chat groups: ${error.message}`);
        }
    }
    async createChat(createChatDto) {
        const response = await this.createOrUpdateChat(createChatDto);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Chat created successfully.',
            data: {
                id: response.id,
            },
        };
    }
    async updateChatGroup(dto) {
        const payload = await this.verifyToken(dto.token);
        const userId = payload.sub;
        const { name, description, multimedia_id, members } = dto;
        const { details, group, addedMembers } = await this.prisma.$transaction(async (prisma) => {
            const group_member = await prisma.chatGroupMember.findFirst({
                where: {
                    group_id: dto.group_id,
                    member_id: userId,
                },
                include: { chat_group: true },
            });
            if (!group_member.is_admin) {
                throw new common_1.ForbiddenException('You are not permitted to create a group member.');
            }
            const group = await prisma.chatGroup.findUnique({
                where: { id: dto.group_id },
                include: {
                    chat: { select: { id: true, is_group: true, ...this.chatSelect } },
                    group_members: true,
                },
            });
            if (!group) {
                throw new common_1.NotFoundException(`Chat group with ID ${dto.group_id} not found`);
            }
            const details = await prisma.chatGroup.update({
                where: { id: dto.group_id },
                data: {
                    ...(name && { name }),
                    ...(description && { description }),
                    ...(multimedia_id && { multimedia_id }),
                },
                include: this.chatGroupInclude,
            });
            const addedMembers = [];
            for (const m of dto.members) {
                const member = await prisma.user.findUnique({
                    where: { id: m.member_id },
                });
                if (!member) {
                    throw new common_1.NotFoundException(`User with ID ${m.member_id} not found`);
                }
                const existing = group.group_members.find((gm) => gm.member_id === m.member_id);
                let member_details;
                if (existing) {
                    if (existing.deleted_at) {
                        member_details = await prisma.chatGroupMember.update({
                            where: { id: existing.id },
                            data: { deleted_at: null },
                            include: {
                                member: {
                                    select: {
                                        id: true,
                                        name: true,
                                        profile: { select: { profile_picture: true } },
                                        role: { select: { role_id: true, name: true } },
                                    },
                                },
                            },
                        });
                        addedMembers.push(member_details);
                    }
                    continue;
                }
                const newMember = await prisma.chatGroupMember.create({
                    data: {
                        member_id: m.member_id,
                        group_id: dto.group_id,
                        is_admin: m.is_admin || false,
                    },
                    include: {
                        member: {
                            select: {
                                id: true,
                                name: true,
                                profile: { select: { profile_picture: true } },
                                role: { select: { role_id: true, name: true } },
                            },
                        },
                    },
                });
                addedMembers.push(newMember);
            }
            return {
                details,
                group,
                addedMembers,
            };
        });
        return {
            ...details,
            members,
            chat: group.chat,
            members_details: addedMembers,
        };
    }
    async leaveGroup(dto) {
        const payload = await this.verifyToken(dto.token);
        const userId = payload.sub;
        return this.prisma.$transaction(async (prisma) => {
            const groupMember = await prisma.chatGroupMember.findFirst({
                where: {
                    group_id: dto.group_id,
                    member_id: userId,
                },
                include: {
                    chat_group: {
                        include: this.chatGroupInclude,
                    },
                },
            });
            if (!groupMember) {
                throw new common_1.NotFoundException('You are not a member of this group.');
            }
            const { chat_group } = groupMember;
            const details = await prisma.chatGroupMember.update({
                where: {
                    id: groupMember.id,
                },
                data: { deleted_at: new Date() },
                include: { chat_group: { include: { chat: true } } },
            });
            if (groupMember.is_admin) {
                const remainingMembers = chat_group.group_members.filter((gm) => gm.member_id !== userId);
                if (remainingMembers.length > 0) {
                    const nextAdmin = remainingMembers[0];
                    await prisma.chatGroupMember.update({
                        where: { id: nextAdmin.id },
                        data: { is_admin: true },
                    });
                }
            }
            return {
                ...groupMember,
                group_id: dto.group_id,
            };
        });
    }
};
exports.ChatsService = ChatsService;
exports.ChatsService = ChatsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        generic_service_1.GenericService,
        dispatch_service_1.NotificationDispatchService])
], ChatsService);
//# sourceMappingURL=chat.service.js.map