import { TokenDto } from '../../chat-generics/dto/chat-token.dto';
export declare class UpdateChatMessageDto extends TokenDto {
    id: string;
    message: string;
    read: boolean;
}
export declare class UpdateGroupChatDto extends TokenDto {
    group_id: string;
    name?: string;
    description?: string;
    multimedia_id: string;
    members: GroupMemberDto[];
}
export declare class GroupMemberDto {
    member_id: string;
    is_admin?: boolean;
}
export declare class LeaveGroupChatDto extends TokenDto {
    group_id: string;
}
