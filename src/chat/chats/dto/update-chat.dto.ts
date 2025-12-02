import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { TokenDto } from '../../chat-generics/dto/chat-token.dto';
import { Type } from 'class-transformer';

export class UpdateChatMessageDto extends TokenDto {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  message: string;

  @IsOptional()
  @IsBoolean()
  read: boolean;
}

export class UpdateGroupChatDto extends TokenDto {
  @IsString()
  group_id: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsUUID()
  multimedia_id: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GroupMemberDto)
  members: GroupMemberDto[];
}

export class GroupMemberDto {
  @IsString()
  member_id: string;

  @IsOptional()
  @IsBoolean()
  is_admin?: boolean = false;
}

export class LeaveGroupChatDto extends TokenDto {
  @IsString()
  @IsNotEmpty()
  group_id: string;
}
