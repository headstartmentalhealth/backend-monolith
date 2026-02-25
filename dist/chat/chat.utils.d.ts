import { Prisma } from '@prisma/client';
export declare const maxWords = 1000;
export declare const isEmail: (word: string) => boolean;
export declare const isPhoneNumber: (word: string) => boolean;
export declare const isValidURL: (url: string) => boolean;
export declare const sanitizeMessage: (message: string) => string;
export declare const toSlug: (text: string) => string;
export type ChatWithRelations = Prisma.ChatGetPayload<{
    include: {
        initiator: {
            select: {
                id: true;
                name: true;
                role: true;
                profile: {
                    select: {
                        profile_picture: true;
                    };
                };
            };
        };
        chat_buddy: {
            select: {
                id: true;
                name: true;
                role: true;
                profile: {
                    select: {
                        profile_picture: true;
                    };
                };
            };
        };
        chat_group: {
            include: {
                subscription_plan: true;
                multimedia: true;
                group_members: {
                    include: {
                        member: {
                            select: {
                                name: true;
                                role: {
                                    select: {
                                        name: true;
                                        role_id: true;
                                    };
                                };
                                profile: {
                                    select: {
                                        profile_picture: true;
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };
        messages: {
            take: 1;
            orderBy: {
                created_at: 'desc';
            };
            where: {
                deleted_at: null;
            };
        };
    };
}>;
export declare const formatChats: (chats: ChatWithRelations[], user_id: string) => {
    id: string;
    created_at: Date;
    updated_at: Date;
    chat_buddy: {
        id: string;
        name: string;
        role: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            name: string;
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
        initiator_id: string;
        chat_buddy_id: string | null;
        chat_group_id: string | null;
        file: string | null;
        chat_id: string;
    }[];
    unread: number;
    initiator: {
        id: string;
        name: string;
        role: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            name: string;
            description: string | null;
            role_group_id: string;
            role_id: string;
        };
        profile: {
            profile_picture: string;
        };
    };
    chat_group: {
        subscription_plan: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            business_id: string;
            name: string;
            product_id: string | null;
            description: string | null;
            cover_image: string | null;
            creator_id: string;
        };
        multimedia: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            type: import(".prisma/client").$Enums.MultimediaType;
            business_id: string | null;
            creator_id: string | null;
            provider: import(".prisma/client").$Enums.MultimediaProvider;
            url: string;
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
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        description: string | null;
        creator_id: string | null;
        subscription_plan_id: string | null;
        multimedia_id: string | null;
        auto_created: boolean;
    };
    deleted_at: Date | null;
    last_message: string | null;
    last_message_at: Date | null;
    is_archived: boolean;
    is_group: boolean;
    initiator_id: string | null;
    chat_buddy_id: string | null;
    chat_group_id: string | null;
}[];
export declare const formatChat: (chat: ChatWithRelations, user_id: string) => {
    id: string;
    created_at: Date;
    updated_at: Date;
    chat_buddy: {
        id: string;
        name: string;
        role: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            name: string;
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
        initiator_id: string;
        chat_buddy_id: string | null;
        chat_group_id: string | null;
        file: string | null;
        chat_id: string;
    }[];
    unread: number;
    initiator: {
        id: string;
        name: string;
        role: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            name: string;
            description: string | null;
            role_group_id: string;
            role_id: string;
        };
        profile: {
            profile_picture: string;
        };
    };
    chat_group: {
        subscription_plan: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            business_id: string;
            name: string;
            product_id: string | null;
            description: string | null;
            cover_image: string | null;
            creator_id: string;
        };
        multimedia: {
            id: string;
            created_at: Date;
            updated_at: Date;
            deleted_at: Date | null;
            type: import(".prisma/client").$Enums.MultimediaType;
            business_id: string | null;
            creator_id: string | null;
            provider: import(".prisma/client").$Enums.MultimediaProvider;
            url: string;
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
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        name: string;
        description: string | null;
        creator_id: string | null;
        subscription_plan_id: string | null;
        multimedia_id: string | null;
        auto_created: boolean;
    };
    deleted_at: Date | null;
    last_message: string | null;
    last_message_at: Date | null;
    is_archived: boolean;
    is_group: boolean;
    initiator_id: string | null;
    chat_buddy_id: string | null;
    chat_group_id: string | null;
};
