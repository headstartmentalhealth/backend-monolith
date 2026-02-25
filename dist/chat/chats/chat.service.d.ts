import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateChatDto, CreateChatGroupDto, CreateChatMessageDto } from './dto/create-chat.dto';
import { FetchChatsDto, FetchChatMessagesDto, FetchChatGroupsDto } from './dto/fetch-chat.dto';
import { LeaveGroupChatDto, UpdateChatMessageDto, UpdateGroupChatDto } from './dto/update-chat.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GenericService } from '@/generic/generic.service';
import { Prisma, PrismaClient } from '@prisma/client';
import { NotificationDispatchService } from '@/notification/dispatch/dispatch.service';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { AuthPayload } from '@/generic/generic.payload';
export declare class ChatsService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly genericService;
    private readonly notificationDispatchService;
    private readonly chatSelect;
    private readonly chatGroupInclude;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, genericService: GenericService, notificationDispatchService: NotificationDispatchService);
    private readonly pageSize;
    verifyToken(token: string): Promise<AuthPayload['user']>;
    chatExists(initiator_id: string, chat_buddy_id?: string, chat_group_id?: string, verify?: boolean): Promise<any>;
    chatExistsTrx({ initiator_id, chat_buddy_id, chat_group_id, verify, }: {
        initiator_id: string;
        chat_buddy_id?: string;
        chat_group_id?: string;
        verify?: boolean;
    }, prisma: Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>): Promise<any>;
    private _chatExistsInternal;
    private prepareChatUnread;
    createOrUpdateChat(createChatDto: CreateChatDto): Promise<any>;
    createOrUpdateChatWithTrx(createChatDto: CreateChatDto, prisma: Omit<PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>): Promise<{
        id: string;
        created_at: Date;
        updated_at: Date;
        chat_buddy: {
            name: string;
            id: string;
            role: {
                name: string;
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                description: string | null;
                role_group_id: string;
                role_id: string;
            };
            profile: {
                profile_picture: string;
            };
        };
        messages: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            message: string | null;
            read: boolean;
            chat_group_id: string | null;
            initiator_id: string;
            chat_buddy_id: string | null;
            file: string | null;
            chat_id: string;
        }[];
        unread: number;
        initiator: {
            name: string;
            id: string;
            role: {
                name: string;
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                description: string | null;
                role_group_id: string;
                role_id: string;
            };
            profile: {
                profile_picture: string;
            };
        };
        chat_group: {
            multimedia: {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                url: string;
                business_id: string | null;
                type: import(".prisma/client").$Enums.MultimediaType;
                creator_id: string | null;
                provider: import(".prisma/client").$Enums.MultimediaProvider;
            };
            subscription_plan: {
                name: string;
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                business_id: string;
                creator_id: string;
                product_id: string | null;
                description: string | null;
                cover_image: string | null;
            };
            group_members: ({
                member: {
                    name: string;
                    role: {
                        name: string;
                        role_id: string;
                    };
                    profile: {
                        profile_picture: string;
                    };
                };
            } & {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                member_id: string;
                is_admin: boolean;
                group_id: string;
            })[];
        } & {
            name: string;
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            subscription_plan_id: string | null;
            creator_id: string | null;
            description: string | null;
            multimedia_id: string | null;
            auto_created: boolean;
        };
        deleted_at: Date | null;
        chat_group_id: string | null;
        initiator_id: string | null;
        chat_buddy_id: string | null;
        last_message: string | null;
        last_message_at: Date | null;
        is_archived: boolean;
        is_group: boolean;
    } & {
        chat_buddy: {
            name: string;
            id: string;
            profile: {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                address: string | null;
                user_id: string;
                country: string | null;
                state: string | null;
                country_code: string | null;
                profile_picture: string | null;
                bio: string | null;
                date_of_birth: Date | null;
                gender: import(".prisma/client").$Enums.Gender | null;
                country_dial_code: string | null;
            };
        };
    }>;
    markChatAsRead(user_id: string, chat_id: string): Promise<void>;
    fetchChats(fetchChatsDto: FetchChatsDto): Promise<{
        status: string;
        data: {
            id: string;
            created_at: Date;
            updated_at: Date;
            chat_buddy: {
                name: string;
                id: string;
                role: {
                    name: string;
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    description: string | null;
                    role_group_id: string;
                    role_id: string;
                };
                profile: {
                    profile_picture: string;
                };
            };
            messages: {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                message: string | null;
                read: boolean;
                chat_group_id: string | null;
                initiator_id: string;
                chat_buddy_id: string | null;
                file: string | null;
                chat_id: string;
            }[];
            unread: number;
            initiator: {
                name: string;
                id: string;
                role: {
                    name: string;
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    description: string | null;
                    role_group_id: string;
                    role_id: string;
                };
                profile: {
                    profile_picture: string;
                };
            };
            chat_group: {
                multimedia: {
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    url: string;
                    business_id: string | null;
                    type: import(".prisma/client").$Enums.MultimediaType;
                    creator_id: string | null;
                    provider: import(".prisma/client").$Enums.MultimediaProvider;
                };
                subscription_plan: {
                    name: string;
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    business_id: string;
                    creator_id: string;
                    product_id: string | null;
                    description: string | null;
                    cover_image: string | null;
                };
                group_members: ({
                    member: {
                        name: string;
                        role: {
                            name: string;
                            role_id: string;
                        };
                        profile: {
                            profile_picture: string;
                        };
                    };
                } & {
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    member_id: string;
                    is_admin: boolean;
                    group_id: string;
                })[];
            } & {
                name: string;
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                subscription_plan_id: string | null;
                creator_id: string | null;
                description: string | null;
                multimedia_id: string | null;
                auto_created: boolean;
            };
            deleted_at: Date | null;
            chat_group_id: string | null;
            initiator_id: string | null;
            chat_buddy_id: string | null;
            last_message: string | null;
            last_message_at: Date | null;
            is_archived: boolean;
            is_group: boolean;
        }[];
        count: number;
        page: number;
        totalPages: number;
        user_id: string;
    }>;
    createMessage(createChatMessageDto: CreateChatMessageDto): Promise<{
        chat: {
            chat_group: {
                lastMessage: {
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    message: string | null;
                    read: boolean;
                    chat_group_id: string | null;
                    initiator_id: string;
                    chat_buddy_id: string | null;
                    file: string | null;
                    chat_id: string;
                };
                multimedia: {
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    url: string;
                    business_id: string | null;
                    type: import(".prisma/client").$Enums.MultimediaType;
                    creator_id: string | null;
                    provider: import(".prisma/client").$Enums.MultimediaProvider;
                };
                group_members: {
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    member_id: string;
                    is_admin: boolean;
                    group_id: string;
                }[];
                chat_messages: {
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    message: string | null;
                    read: boolean;
                    chat_group_id: string | null;
                    initiator_id: string;
                    chat_buddy_id: string | null;
                    file: string | null;
                    chat_id: string;
                }[];
                name: string;
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                subscription_plan_id: string | null;
                creator_id: string | null;
                description: string | null;
                multimedia_id: string | null;
                auto_created: boolean;
            };
            chat_buddy: {
                name: string;
                id: string;
                role: {
                    name: string;
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    description: string | null;
                    role_group_id: string;
                    role_id: string;
                };
                profile: {
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    address: string | null;
                    user_id: string;
                    country: string | null;
                    state: string | null;
                    country_code: string | null;
                    profile_picture: string | null;
                    bio: string | null;
                    date_of_birth: Date | null;
                    gender: import(".prisma/client").$Enums.Gender | null;
                    country_dial_code: string | null;
                };
            };
            initiator: any;
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            chat_group_id: string | null;
            initiator_id: string | null;
            chat_buddy_id: string | null;
            last_message: string | null;
            last_message_at: Date | null;
            is_archived: boolean;
            unread: Prisma.JsonValue;
            is_group: boolean;
        };
        initiator: {
            name: string;
            id: string;
            role: {
                name: string;
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                description: string | null;
                role_group_id: string;
                role_id: string;
            };
            profile: {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                address: string | null;
                user_id: string;
                country: string | null;
                state: string | null;
                country_code: string | null;
                profile_picture: string | null;
                bio: string | null;
                date_of_birth: Date | null;
                gender: import(".prisma/client").$Enums.Gender | null;
                country_dial_code: string | null;
            };
        };
        chat_buddy: {
            name: string;
            id: string;
            role: {
                name: string;
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                description: string | null;
                role_group_id: string;
                role_id: string;
            };
            profile: {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                address: string | null;
                user_id: string;
                country: string | null;
                state: string | null;
                country_code: string | null;
                profile_picture: string | null;
                bio: string | null;
                date_of_birth: Date | null;
                gender: import(".prisma/client").$Enums.Gender | null;
                country_dial_code: string | null;
            };
        };
        chat_group: {
            multimedia: {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                url: string;
                business_id: string | null;
                type: import(".prisma/client").$Enums.MultimediaType;
                creator_id: string | null;
                provider: import(".prisma/client").$Enums.MultimediaProvider;
            };
            group_members: {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                member_id: string;
                is_admin: boolean;
                group_id: string;
            }[];
            chat_messages: {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                message: string | null;
                read: boolean;
                chat_group_id: string | null;
                initiator_id: string;
                chat_buddy_id: string | null;
                file: string | null;
                chat_id: string;
            }[];
        } & {
            name: string;
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            subscription_plan_id: string | null;
            creator_id: string | null;
            description: string | null;
            multimedia_id: string | null;
            auto_created: boolean;
        };
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        message: string | null;
        read: boolean;
        chat_group_id: string | null;
        initiator_id: string;
        chat_buddy_id: string | null;
        file: string | null;
        chat_id: string;
    }>;
    getMessageStats(chat_id: string): Promise<{
        totalMessagesWithLinks: number;
        totalFilesWithFormats: number;
    }>;
    fetchMessages(fetchChatMessagesDto: FetchChatMessagesDto): Promise<{
        data: ({
            initiator: {
                name: string;
                id: string;
                role: {
                    name: string;
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    description: string | null;
                    role_group_id: string;
                    role_id: string;
                };
                profile: {
                    profile_picture: string;
                };
            };
            chat_buddy: {
                name: string;
                id: string;
                role: {
                    name: string;
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    description: string | null;
                    role_group_id: string;
                    role_id: string;
                };
                profile: {
                    profile_picture: string;
                };
            };
            chat_group: {
                multimedia: {
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    url: string;
                    business_id: string | null;
                    type: import(".prisma/client").$Enums.MultimediaType;
                    creator_id: string | null;
                    provider: import(".prisma/client").$Enums.MultimediaProvider;
                };
                subscription_plan: {
                    name: string;
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    business_id: string;
                    creator_id: string;
                    product_id: string | null;
                    description: string | null;
                    cover_image: string | null;
                };
            } & {
                name: string;
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                subscription_plan_id: string | null;
                creator_id: string | null;
                description: string | null;
                multimedia_id: string | null;
                auto_created: boolean;
            };
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            message: string | null;
            read: boolean;
            chat_group_id: string | null;
            initiator_id: string;
            chat_buddy_id: string | null;
            file: string | null;
            chat_id: string;
        })[];
        count: number;
        userId: string;
        chatId: any;
        chat: any;
        stats: {
            totalMessagesWithLinks: number;
            totalFilesWithFormats: number;
        };
    }>;
    updateMessage(updateChatMessageDto: UpdateChatMessageDto): Promise<{
        chat: {
            initiator: {
                name: string;
                id: string;
                email: string;
                password_hash: string | null;
                phone: string | null;
                is_email_verified: boolean;
                is_phone_verified: boolean;
                is_first_signup: boolean;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                role_identity: string | null;
                is_suspended: boolean | null;
                suspended_by: string | null;
                suspended_at: Date | null;
                suspension_reason: string | null;
                signin_option: string | null;
                alternative_phone: string | null;
                referral_source: string | null;
            };
            chat_buddy: {
                name: string;
                id: string;
                email: string;
                password_hash: string | null;
                phone: string | null;
                is_email_verified: boolean;
                is_phone_verified: boolean;
                is_first_signup: boolean;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                role_identity: string | null;
                is_suspended: boolean | null;
                suspended_by: string | null;
                suspended_at: Date | null;
                suspension_reason: string | null;
                signin_option: string | null;
                alternative_phone: string | null;
                referral_source: string | null;
            };
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            chat_group_id: string | null;
            initiator_id: string | null;
            chat_buddy_id: string | null;
            last_message: string | null;
            last_message_at: Date | null;
            is_archived: boolean;
            unread: Prisma.JsonValue;
            is_group: boolean;
        };
        initiator: {
            name: string;
            id: string;
            email: string;
            password_hash: string | null;
            phone: string | null;
            is_email_verified: boolean;
            is_phone_verified: boolean;
            is_first_signup: boolean;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            role_identity: string | null;
            is_suspended: boolean | null;
            suspended_by: string | null;
            suspended_at: Date | null;
            suspension_reason: string | null;
            signin_option: string | null;
            alternative_phone: string | null;
            referral_source: string | null;
        };
        chat_buddy: {
            name: string;
            id: string;
            email: string;
            password_hash: string | null;
            phone: string | null;
            is_email_verified: boolean;
            is_phone_verified: boolean;
            is_first_signup: boolean;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            role_identity: string | null;
            is_suspended: boolean | null;
            suspended_by: string | null;
            suspended_at: Date | null;
            suspension_reason: string | null;
            signin_option: string | null;
            alternative_phone: string | null;
            referral_source: string | null;
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        message: string | null;
        read: boolean;
        chat_group_id: string | null;
        initiator_id: string;
        chat_buddy_id: string | null;
        file: string | null;
        chat_id: string;
    }>;
    private updateChatLastMessageAt;
    findMessage(messageId: string): Promise<{
        chat: {
            initiator: {
                name: string;
                id: string;
                role: {
                    name: string;
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    description: string | null;
                    role_group_id: string;
                    role_id: string;
                };
            };
            chat_buddy: {
                name: string;
                id: string;
                role: {
                    name: string;
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    description: string | null;
                    role_group_id: string;
                    role_id: string;
                };
            };
        } & {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            chat_group_id: string | null;
            initiator_id: string | null;
            chat_buddy_id: string | null;
            last_message: string | null;
            last_message_at: Date | null;
            is_archived: boolean;
            unread: Prisma.JsonValue;
            is_group: boolean;
        };
        initiator: {
            name: string;
            id: string;
            role: {
                name: string;
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                description: string | null;
                role_group_id: string;
                role_id: string;
            };
        };
        chat_buddy: {
            name: string;
            id: string;
            role: {
                name: string;
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                description: string | null;
                role_group_id: string;
                role_id: string;
            };
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        message: string | null;
        read: boolean;
        chat_group_id: string | null;
        initiator_id: string;
        chat_buddy_id: string | null;
        file: string | null;
        chat_id: string;
    }>;
    createChatGroup(createChatGroupDto: CreateChatGroupDto): Promise<{
        members: import("./dto/create-chat.dto").GroupMember[];
        chat: {
            id: string;
            created_at: Date;
            updated_at: Date;
            chat_buddy: {
                name: string;
                id: string;
                role: {
                    name: string;
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    description: string | null;
                    role_group_id: string;
                    role_id: string;
                };
                profile: {
                    profile_picture: string;
                };
            };
            messages: {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                message: string | null;
                read: boolean;
                chat_group_id: string | null;
                initiator_id: string;
                chat_buddy_id: string | null;
                file: string | null;
                chat_id: string;
            }[];
            unread: number;
            initiator: {
                name: string;
                id: string;
                role: {
                    name: string;
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    description: string | null;
                    role_group_id: string;
                    role_id: string;
                };
                profile: {
                    profile_picture: string;
                };
            };
            chat_group: {
                multimedia: {
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    url: string;
                    business_id: string | null;
                    type: import(".prisma/client").$Enums.MultimediaType;
                    creator_id: string | null;
                    provider: import(".prisma/client").$Enums.MultimediaProvider;
                };
                subscription_plan: {
                    name: string;
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    business_id: string;
                    creator_id: string;
                    product_id: string | null;
                    description: string | null;
                    cover_image: string | null;
                };
                group_members: ({
                    member: {
                        name: string;
                        role: {
                            name: string;
                            role_id: string;
                        };
                        profile: {
                            profile_picture: string;
                        };
                    };
                } & {
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    member_id: string;
                    is_admin: boolean;
                    group_id: string;
                })[];
            } & {
                name: string;
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                subscription_plan_id: string | null;
                creator_id: string | null;
                description: string | null;
                multimedia_id: string | null;
                auto_created: boolean;
            };
            deleted_at: Date | null;
            chat_group_id: string | null;
            initiator_id: string | null;
            chat_buddy_id: string | null;
            last_message: string | null;
            last_message_at: Date | null;
            is_archived: boolean;
            is_group: boolean;
        } & {
            chat_buddy: {
                name: string;
                id: string;
                profile: {
                    id: string;
                    created_at: Date;
                    updated_at: Date;
                    deleted_at: Date | null;
                    address: string | null;
                    user_id: string;
                    country: string | null;
                    state: string | null;
                    country_code: string | null;
                    profile_picture: string | null;
                    bio: string | null;
                    date_of_birth: Date | null;
                    gender: import(".prisma/client").$Enums.Gender | null;
                    country_dial_code: string | null;
                };
            };
        };
        multimedia: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            url: string;
            business_id: string | null;
            type: import(".prisma/client").$Enums.MultimediaType;
            creator_id: string | null;
            provider: import(".prisma/client").$Enums.MultimediaProvider;
        };
        _count: {
            multimedia: number;
            subscription_plan: number;
            creator: number;
            group_members: number;
            chat: number;
            chat_messages: number;
        };
        subscription_plan: {
            name: string;
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            business_id: string;
            creator_id: string;
            product_id: string | null;
            description: string | null;
            cover_image: string | null;
        };
        creator: {
            name: string;
            id: string;
            email: string;
            password_hash: string | null;
            phone: string | null;
            is_email_verified: boolean;
            is_phone_verified: boolean;
            is_first_signup: boolean;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            role_identity: string | null;
            is_suspended: boolean | null;
            suspended_by: string | null;
            suspended_at: Date | null;
            suspension_reason: string | null;
            signin_option: string | null;
            alternative_phone: string | null;
            referral_source: string | null;
        };
        group_members: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            member_id: string;
            is_admin: boolean;
            group_id: string;
        }[];
        chat_messages: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            message: string | null;
            read: boolean;
            chat_group_id: string | null;
            initiator_id: string;
            chat_buddy_id: string | null;
            file: string | null;
            chat_id: string;
        }[];
        name: string;
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        subscription_plan_id: string | null;
        creator_id: string | null;
        description: string | null;
        multimedia_id: string | null;
        auto_created: boolean;
    }>;
    fetchChatGroups(fetchChatGroupsDto: FetchChatGroupsDto): Promise<{
        status: string;
        data: {
            id: string;
            name: string;
            description: string;
            created_at: Date;
            updated_at: Date;
            creator: {
                name: string;
                id: string;
                role: {
                    name: string;
                    role_id: string;
                };
                profile: {
                    profile_picture: string;
                };
            };
            members: {
                name: string;
                id: string;
                role: {
                    name: string;
                    role_id: string;
                };
                profile: {
                    profile_picture: string;
                };
            }[];
            subscription_plan: {
                name: string;
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                business_id: string;
                creator_id: string;
                product_id: string | null;
                description: string | null;
                cover_image: string | null;
            };
            multimedia: {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                url: string;
                business_id: string | null;
                type: import(".prisma/client").$Enums.MultimediaType;
                creator_id: string | null;
                provider: import(".prisma/client").$Enums.MultimediaProvider;
            };
            lastMessage: {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                message: string | null;
                read: boolean;
                chat_group_id: string | null;
                initiator_id: string;
                chat_buddy_id: string | null;
                file: string | null;
                chat_id: string;
            };
        }[];
        count: number;
        page: number;
        totalPages: number;
        user_id: string;
    }>;
    createChat(createChatDto: CreateChatDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            id: any;
        };
    }>;
    updateChatGroup(dto: UpdateGroupChatDto): Promise<{
        members: import("./dto/update-chat.dto").GroupMemberDto[];
        chat: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date;
            _count: {
                initiator: number;
                chat_buddy: number;
                chat_group: number;
                messages: number;
            };
            chat_group_id: string;
            initiator_id: string;
            chat_buddy_id: string;
            last_message: string;
            last_message_at: Date;
            is_archived: boolean;
            unread: Prisma.JsonValue;
            is_group: boolean;
            initiator: {
                name: string;
                id: string;
                email: string;
                password_hash: string | null;
                phone: string | null;
                is_email_verified: boolean;
                is_phone_verified: boolean;
                is_first_signup: boolean;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                role_identity: string | null;
                is_suspended: boolean | null;
                suspended_by: string | null;
                suspended_at: Date | null;
                suspension_reason: string | null;
                signin_option: string | null;
                alternative_phone: string | null;
                referral_source: string | null;
            };
            chat_buddy: {
                name: string;
                id: string;
                email: string;
                password_hash: string | null;
                phone: string | null;
                is_email_verified: boolean;
                is_phone_verified: boolean;
                is_first_signup: boolean;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                role_identity: string | null;
                is_suspended: boolean | null;
                suspended_by: string | null;
                suspended_at: Date | null;
                suspension_reason: string | null;
                signin_option: string | null;
                alternative_phone: string | null;
                referral_source: string | null;
            };
            chat_group: {
                name: string;
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                subscription_plan_id: string | null;
                creator_id: string | null;
                description: string | null;
                multimedia_id: string | null;
                auto_created: boolean;
            };
            messages: {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                message: string | null;
                read: boolean;
                chat_group_id: string | null;
                initiator_id: string;
                chat_buddy_id: string | null;
                file: string | null;
                chat_id: string;
            }[];
        };
        members_details: any[];
        multimedia: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            url: string;
            business_id: string | null;
            type: import(".prisma/client").$Enums.MultimediaType;
            creator_id: string | null;
            provider: import(".prisma/client").$Enums.MultimediaProvider;
        };
        _count: {
            multimedia: number;
            subscription_plan: number;
            creator: number;
            group_members: number;
            chat: number;
            chat_messages: number;
        };
        subscription_plan: {
            name: string;
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            business_id: string;
            creator_id: string;
            product_id: string | null;
            description: string | null;
            cover_image: string | null;
        };
        creator: {
            name: string;
            id: string;
            email: string;
            password_hash: string | null;
            phone: string | null;
            is_email_verified: boolean;
            is_phone_verified: boolean;
            is_first_signup: boolean;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            role_identity: string | null;
            is_suspended: boolean | null;
            suspended_by: string | null;
            suspended_at: Date | null;
            suspension_reason: string | null;
            signin_option: string | null;
            alternative_phone: string | null;
            referral_source: string | null;
        };
        group_members: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            member_id: string;
            is_admin: boolean;
            group_id: string;
        }[];
        chat_messages: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            message: string | null;
            read: boolean;
            chat_group_id: string | null;
            initiator_id: string;
            chat_buddy_id: string | null;
            file: string | null;
            chat_id: string;
        }[];
        name: string;
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        subscription_plan_id: string | null;
        creator_id: string | null;
        description: string | null;
        multimedia_id: string | null;
        auto_created: boolean;
    }>;
    leaveGroup(dto: LeaveGroupChatDto): Promise<{
        group_id: string;
        chat_group: {
            multimedia: {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                url: string;
                business_id: string | null;
                type: import(".prisma/client").$Enums.MultimediaType;
                creator_id: string | null;
                provider: import(".prisma/client").$Enums.MultimediaProvider;
            };
            _count: {
                multimedia: number;
                subscription_plan: number;
                creator: number;
                group_members: number;
                chat: number;
                chat_messages: number;
            };
            chat: {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                chat_group_id: string | null;
                initiator_id: string | null;
                chat_buddy_id: string | null;
                last_message: string | null;
                last_message_at: Date | null;
                is_archived: boolean;
                unread: Prisma.JsonValue;
                is_group: boolean;
            };
            subscription_plan: {
                name: string;
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                business_id: string;
                creator_id: string;
                product_id: string | null;
                description: string | null;
                cover_image: string | null;
            };
            creator: {
                name: string;
                id: string;
                email: string;
                password_hash: string | null;
                phone: string | null;
                is_email_verified: boolean;
                is_phone_verified: boolean;
                is_first_signup: boolean;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                role_identity: string | null;
                is_suspended: boolean | null;
                suspended_by: string | null;
                suspended_at: Date | null;
                suspension_reason: string | null;
                signin_option: string | null;
                alternative_phone: string | null;
                referral_source: string | null;
            };
            group_members: {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                member_id: string;
                is_admin: boolean;
                group_id: string;
            }[];
            chat_messages: {
                id: string;
                created_at: Date;
                updated_at: Date;
                deleted_at: Date | null;
                message: string | null;
                read: boolean;
                chat_group_id: string | null;
                initiator_id: string;
                chat_buddy_id: string | null;
                file: string | null;
                chat_id: string;
            }[];
        } & {
            name: string;
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            subscription_plan_id: string | null;
            creator_id: string | null;
            description: string | null;
            multimedia_id: string | null;
            auto_created: boolean;
        };
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        member_id: string;
        is_admin: boolean;
    }>;
}
