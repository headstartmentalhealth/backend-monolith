import { TokenDto } from '../../chat-generics/dto/chat-token.dto';
export declare class CreateChatMessageDto extends TokenDto {
    chatBuddy: string;
    chatGroup: string;
    message: string;
    file: string;
}
export declare class CreateChatDto {
    initiator: string;
    chatBuddy?: string;
    chatGroup?: string;
    lastMessage?: string;
    lastMessageId?: string;
}
export declare class CreateChatNotificationDto {
    chat: string;
    user: string;
    read?: boolean;
    count?: number;
}
export declare class CreateChatGroupDto extends TokenDto {
    name: string;
    description: string;
    multimedia_id: string;
    members: GroupMember[];
}
export declare class GroupMember {
    member_id: string;
}
