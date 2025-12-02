// chats.service.ts
import {
  Injectable,
  BadRequestException,
  UnprocessableEntityException,
  ConflictException,
  NotFoundException,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import {
  CreateChatDto,
  CreateChatGroupDto,
  CreateChatMessageDto,
} from './dto/create-chat.dto';
import {
  FetchChatsDto,
  FetchChatMessagesDto,
  ReadStatus,
  FetchChatGroupsDto,
} from './dto/fetch-chat.dto';
import {
  LeaveGroupChatDto,
  UpdateChatMessageDto,
  UpdateGroupChatDto,
} from './dto/update-chat.dto';
import { ChatUnreadSchema } from './chat.interfaces';
import {
  formatChat,
  formatChats,
  maxWords,
  sanitizeMessage,
} from '@/chat/chat.utils';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GenericService } from '@/generic/generic.service';
import { Prisma, PrismaClient } from '@prisma/client';
import { NotificationDispatchService } from '@/notification/dispatch/dispatch.service';
import { includes } from 'lodash';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { AuthPayload } from '@/generic/generic.payload';

interface ChatListItem {
  id: string;
  created_at: Date;
  updated_at: Date;
  chat_buddy: {
    id: string;
    name: string;
    role: any; // Replace with proper role type
    profile?: {
      profile_picture?: string;
    };
  };
  messages: any[]; // Replace with proper message type
  unread: number;
}

@Injectable()
export class ChatsService {
  private readonly chatSelect: Prisma.ChatSelect = {
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

  private readonly chatGroupInclude: Prisma.ChatGroupInclude = {
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly genericService: GenericService,
    private readonly notificationDispatchService: NotificationDispatchService,
  ) {}

  private readonly pageSize = 20;

  async verifyToken(token: string): Promise<AuthPayload['user']> {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch (error) {
      throw new BadRequestException('Invalid token');
    }
  }

  async chatExists(
    initiator_id: string,
    chat_buddy_id?: string,
    chat_group_id?: string,
    verify = false,
  ) {
    return this._chatExistsInternal(
      { initiator_id, chat_buddy_id, chat_group_id, verify },
      this.prisma,
    );
  }

  async chatExistsTrx(
    {
      initiator_id,
      chat_buddy_id,
      chat_group_id,
      verify = false,
    }: {
      initiator_id: string;
      chat_buddy_id?: string;
      chat_group_id?: string;
      verify?: boolean;
    },
    prisma: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
  ) {
    return this._chatExistsInternal(
      { initiator_id, chat_buddy_id, chat_group_id, verify },
      prisma,
    );
  }

  /**
   * Internal reusable method
   */
  private async _chatExistsInternal(
    {
      initiator_id,
      chat_buddy_id,
      chat_group_id,
      verify,
    }: {
      initiator_id: string;
      chat_buddy_id?: string;
      chat_group_id?: string;
      verify?: boolean;
    },
    prisma: any,
  ) {
    // ✅ Ensure group exists if chat_group_id provided
    if (chat_group_id) {
      const group = await prisma.chatGroup.findUnique({
        where: { id: chat_group_id },
      });
      if (!group) {
        throw new BadRequestException('Chat group not found');
      }
    }

    // ✅ Look up the chat
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
      throw new BadRequestException('Chat not found');
    }

    return chat;
  }

  private prepareChatUnread(
    initiator_id: string,
    chat_buddy_id: string,
  ): ChatUnreadSchema[] {
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

  async createOrUpdateChat(createChatDto: CreateChatDto) {
    const { initiator, chatBuddy, lastMessage, chatGroup } = createChatDto;

    let chat = await this.chatExists(initiator, chatBuddy, chatGroup);

    if (!chat) {
      chat = await this.prisma.chat.create({
        data: {
          ...(initiator && { initiator_id: initiator }),
          ...(chatBuddy && { chat_buddy_id: chatBuddy }),
          ...(chatGroup && { chat_group_id: chatGroup, is_group: true }),
          ...(lastMessage && {
            last_message: sanitizeMessage(lastMessage),
            last_message_at: new Date(),
          }),
          unread: this.prepareChatUnread(initiator, chatBuddy) as
            | ChatUnreadSchema[]
            | any,
        },
        include: this.chatSelect,
      });
    } else {
      const currentUnread: ChatUnreadSchema[] = chat.unread as
        | ChatUnreadSchema[]
        | any;
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
            last_message: sanitizeMessage(lastMessage),
            last_message_at: new Date(),
          }),
          unread: updatedUnread as ChatUnreadSchema[] | any,
        },
        include: this.chatSelect,
      });
    }

    if (chat?.chat_group?.group_members) {
      chat.chat_group.group_members = chat.chat_group.group_members.filter(
        (gm) => gm.deleted_at === null,
      );
    }

    const user = await this.prisma.user.findFirst({
      where: { id: chatBuddy },
      select: { id: true, name: true, profile: true },
    });
    return Object.assign({}, chat, { chat_buddy: user });
  }

  async createOrUpdateChatWithTrx(
    createChatDto: CreateChatDto,
    prisma: Omit<
      PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
  ) {
    const { initiator, chatBuddy, lastMessage, chatGroup } = createChatDto;
    let chat = await this.chatExistsTrx(
      {
        initiator_id: initiator,
        chat_buddy_id: chatBuddy,
        chat_group_id: chatGroup,
      },
      prisma,
    );
    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          initiator_id: initiator,
          ...(chatBuddy && { chat_buddy_id: chatBuddy }),
          ...(chatGroup && { chat_group_id: chatGroup, is_group: true }),
          ...(lastMessage && {
            last_message: sanitizeMessage(lastMessage),
            last_message_at: new Date(),
          }),
          unread: this.prepareChatUnread(initiator, chatBuddy) as
            | ChatUnreadSchema[]
            | any,
        },
        include: this.chatSelect,
      });
    } else {
      const currentUnread: ChatUnreadSchema[] = chat.unread as
        | ChatUnreadSchema[]
        | any;
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
            last_message: sanitizeMessage(lastMessage),
            last_message_at: new Date(),
          }),
          unread: updatedUnread as ChatUnreadSchema[] | any,
        },
        include: this.chatSelect,
      });
    }
    const user = await prisma.user.findFirst({
      where: { id: chatBuddy },
      select: { id: true, name: true, profile: true },
    });

    const formatted_chat = formatChat(chat, user.id);

    return Object.assign({}, formatted_chat, { chat_buddy: user });
  }

  async markChatAsRead(user_id: string, chat_id: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chat_id },
    });

    if (!chat) {
      throw new BadRequestException('Chat not found');
    }

    const unread: ChatUnreadSchema[] = chat.unread as ChatUnreadSchema[] | any;
    const updatedUnread: ChatUnreadSchema[] = unread.map((item) => {
      if (item.user_id === user_id) {
        return { ...item, unread: false, count: 0 };
      }
      return item;
    });

    await this.prisma.chat.update({
      where: { id: chat_id },
      data: { unread: updatedUnread as ChatUnreadSchema[] | any },
    });

    // Mark messages as read
    await this.prisma.chatMessage.updateMany({
      where: {
        chat_id,
        chat_buddy_id: user_id,
        read: false,
      },
      data: { read: true },
    });
  }

  async fetchChats(fetchChatsDto: FetchChatsDto) {
    const payload = await this.verifyToken(fetchChatsDto.token);
    const user_id = payload.sub;

    const page = fetchChatsDto.page || 1;
    const skip = (page - 1) * this.pageSize;

    // Base where condition
    let where: Prisma.ChatWhereInput = {
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

    // Add status filter if provided
    if (fetchChatsDto.status) {
      where.unread = {
        // path: ['unread'],
        array_contains: [
          {
            user_id: user_id,
            unread: fetchChatsDto.status === ReadStatus.UNREAD,
          },
        ],
      };
    }

    // Apply search filter if a query is provided
    if (fetchChatsDto.q) {
      const searchCondition: Prisma.ChatWhereInput = {
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

      // Merge search condition with the base where clause using AND
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
        // orderBy: { last_message_at: 'desc' },
        skip,
        take: this.pageSize,
      });

      const formattedChats = formatChats(chats, user_id);

      return {
        status: 'success',
        data: formattedChats,
        count: formattedChats.length,
        page,
        totalPages: Math.ceil(formattedChats.length / this.pageSize),
        user_id,
      };
    } catch (error) {
      throw new Error(`Failed to fetch chats: ${error.message}`);
    }
  }

  async createMessage(createChatMessageDto: CreateChatMessageDto) {
    const payload = await this.verifyToken(createChatMessageDto.token);
    const userId = payload.sub;
    const {
      chatBuddy: chat_buddy_id,
      message,
      file,
      chatGroup: chat_group_id,
    } = createChatMessageDto;
    if (message && message.length > maxWords) {
      throw new UnprocessableEntityException(
        ` Message exceeds the maximum of ${maxWords} words`,
      );
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
        ...(message && { message: sanitizeMessage(message) }),
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

    await this.notificationDispatchService.sendPush(
      chat_buddy_id,
      `A message from ${chatMessage.initiator.name}`,
      message ? message : '🖼',
      '',
      chatMessage,
    );
    // Format response
    const formattedChat = {
      ...chatMessage.chat,
      chat_group: chatMessage.chat_group
        ? {
            ...chatMessage.chat_group,
            lastMessage: chatMessage?.chat_group?.chat_messages[0] || null,
          }
        : null,
      chat_buddy:
        chatMessage.chat.initiator_id === userId
          ? chatMessage.chat.chat_buddy
          : chatMessage.chat.initiator,
      initiator: undefined,
    };

    return { ...chatMessage, chat: formattedChat };
  }

  async getMessageStats(chat_id: string) {
    const [messagesWithLinks, filesWithFormats] = await Promise.all([
      // 1. Messages that might contain links
      this.prisma.chatMessage
        .findMany({
          where: {
            chat_id,
            message: {
              contains: 'http', // broad filter to reduce records
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

      // 2. Files with formats
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

  async fetchMessages(fetchChatMessagesDto: FetchChatMessagesDto) {
    const payload = await this.verifyToken(fetchChatMessagesDto.token);

    const userId = payload.sub;

    const { chatBuddy: chat_buddy_id, chatGroup: chat_group_id } =
      fetchChatMessagesDto;

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

  async updateMessage(updateChatMessageDto: UpdateChatMessageDto) {
    await this.verifyToken(updateChatMessageDto.token);

    const message = await this.prisma.chatMessage.findUnique({
      where: { id: updateChatMessageDto.id },
    });

    if (!message) {
      throw new BadRequestException('Chat message not found');
    }

    const data: any = {};
    if (updateChatMessageDto.message) {
      data.message = sanitizeMessage(updateChatMessageDto.message);
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

    // Update chat's last_message_at if message content was updated
    if (updateChatMessageDto.message) {
      await this.updateChatLastMessageAt(message.chat_id);
    }

    return updatedMessage;
  }

  private async updateChatLastMessageAt(chatId: string) {
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { last_message_at: new Date() },
    });
  }

  async findMessage(messageId: string) {
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
      throw new BadRequestException('Chat message not found');
    }

    return message;
  }

  async createChatGroup(createChatGroupDto: CreateChatGroupDto) {
    const payload = await this.verifyToken(createChatGroupDto.token);
    const userId = payload.sub;
    const { name, description, multimedia_id, members } = createChatGroupDto;
    const { details, chat } = await this.prisma.$transaction(async (prisma) => {
      // Check the existence of the chat group name
      const group = await prisma.chatGroup.findFirst({ where: { name } });
      if (group) {
        throw new ConflictException(`Chat group name already exists.`);
      }
      // Create group
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
      // Create chat
      const chat = await this.createOrUpdateChatWithTrx(
        { initiator: userId, chatGroup: details.id },
        prisma,
      );
      // Add group creator to group
      await prisma.chatGroupMember.create({
        data: { member_id: userId, group_id: details.id, is_admin: true },
      });
      for (let index = 0; index < createChatGroupDto.members.length; index++) {
        const member = createChatGroupDto.members[index];
        // Check if member is a valid user
        const member_details = await prisma.user.findFirst({
          where: { id: member.member_id },
        });
        if (!member_details) {
          throw new NotFoundException(
            `Member details of ID [${member.member_id}] not found, `,
          );
        }
        await prisma.chatGroupMember.create({
          data: { member_id: member.member_id, group_id: details.id },
        });
      }

      return { details, chat };
    });

    return { ...details, members, chat: chat };
  }

  async fetchChatGroups(fetchChatGroupsDto: FetchChatGroupsDto) {
    const payload = await this.verifyToken(fetchChatGroupsDto.token);
    const user_id = payload.sub;

    const page = fetchChatGroupsDto.page || 1;
    const skip = (page - 1) * this.pageSize;

    // Base where condition: user must be a member of the group
    let where: Prisma.ChatGroupWhereInput = {
      deleted_at: null,
      group_members: {
        some: { member_id: user_id, deleted_at: null },
      },
    };

    // Apply search filter (by group name or member names)
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

      // Format the groups
      const formattedGroups = groups.map((group) => {
        // get last message (if any)
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
    } catch (error) {
      throw new Error(`Failed to fetch chat groups: ${error.message}`);
    }
  }

  /**
   * Create chat
   * @param createChatDto
   * @returns
   */
  async createChat(createChatDto: CreateChatDto) {
    const response = await this.createOrUpdateChat(createChatDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Chat created successfully.',
      data: {
        id: response.id,
      },
    };
  }

  /**
   * Update chat group
   * @param dto
   * @returns
   */
  async updateChatGroup(dto: UpdateGroupChatDto) {
    const payload = await this.verifyToken(dto.token);
    const userId = payload.sub;

    const { name, description, multimedia_id, members } = dto;

    const { details, group, addedMembers } = await this.prisma.$transaction(
      async (prisma) => {
        const group_member = await prisma.chatGroupMember.findFirst({
          where: {
            group_id: dto.group_id,
            member_id: userId,
          },
          include: { chat_group: true },
        });

        if (!group_member.is_admin) {
          throw new ForbiddenException(
            'You are not permitted to create a group member.',
          );
        }

        // Check if group exists
        const group = await prisma.chatGroup.findUnique({
          where: { id: dto.group_id },
          include: {
            chat: { select: { id: true, is_group: true, ...this.chatSelect } },
            group_members: true,
          },
        });

        if (!group) {
          throw new NotFoundException(
            `Chat group with ID ${dto.group_id} not found`,
          );
        }

        // Update group
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
          // Check if user exists
          const member = await prisma.user.findUnique({
            where: { id: m.member_id },
          });

          if (!member) {
            throw new NotFoundException(
              `User with ID ${m.member_id} not found`,
            );
          }

          // Prevent duplicate membership
          const existing = group.group_members.find(
            (gm) => gm.member_id === m.member_id,
          );
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
            continue; // skip duplicates
          }

          // Add member
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
      },
    );

    return {
      ...details,
      members,
      chat: group.chat,
      members_details: addedMembers,
    };
  }

  /**
   * Leave a chat group
   * If the leaving member is an admin, transfer admin role
   * @param dto
   */
  async leaveGroup(dto: LeaveGroupChatDto) {
    const payload = await this.verifyToken(dto.token);

    const userId = payload.sub;

    return this.prisma.$transaction(async (prisma) => {
      // Check if group exists and user is a member
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
        throw new NotFoundException('You are not a member of this group.');
      }

      const { chat_group } = groupMember;

      // Remove the member from the group
      const details = await prisma.chatGroupMember.update({
        where: {
          id: groupMember.id,
        },
        data: { deleted_at: new Date() },
        include: { chat_group: { include: { chat: true } } },
      });

      // If the member was an admin, assign admin role to the next member
      if (groupMember.is_admin) {
        const remainingMembers = chat_group.group_members.filter(
          (gm) => gm.member_id !== userId,
        );

        if (remainingMembers.length > 0) {
          // Pick the next in line (first member in sorted order)
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
}
