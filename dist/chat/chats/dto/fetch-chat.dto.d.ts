import { TokenDto } from '../../chat-generics/dto/chat-token.dto';
export declare class FetchChatMessagesDto extends TokenDto {
    chatBuddy: string;
    chatGroup: string;
    page: number;
}
export declare enum ReadStatus {
    READ = "read",
    UNREAD = "unread"
}
export declare class FetchChatsDto extends TokenDto {
    page: number;
    status: ReadStatus;
    q?: string;
}
export declare class FetchChatGroupsDto extends TokenDto {
    page: number;
    q?: string;
}
