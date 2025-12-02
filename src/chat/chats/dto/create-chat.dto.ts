import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { TokenDto } from '../../chat-generics/dto/chat-token.dto';
import { Type } from 'class-transformer';

export class CreateChatMessageDto extends TokenDto {
  @IsOptional()
  @IsUUID()
  chatBuddy: string;

  @IsOptional()
  @IsUUID()
  chatGroup: string;

  @ValidateIf((o) => !o.file)
  @IsNotEmpty()
  @IsString()
  message: string;

  @ValidateIf((o) => !o.message)
  @IsNotEmpty()
  @IsString()
  file: string;
}

export class CreateChatDto {
  @IsNotEmpty()
  @IsUUID()
  initiator: string;

  @IsOptional()
  @IsUUID()
  chatBuddy?: string;

  @IsOptional()
  @IsUUID()
  chatGroup?: string;

  @IsOptional()
  @IsString()
  lastMessage?: string;

  @IsOptional()
  @IsString()
  lastMessageId?: string;
}

export class CreateChatNotificationDto {
  chat: string;
  user: string;
  read?: boolean;
  count?: number;
}

export class CreateChatGroupDto extends TokenDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsUUID()
  multimedia_id: string;

  // @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupMember)
  members: GroupMember[];
}

export class GroupMember {
  @IsNotEmpty()
  @IsUUID()
  member_id: string;
}
