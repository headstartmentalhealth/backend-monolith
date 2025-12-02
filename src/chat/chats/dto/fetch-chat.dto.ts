import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { TokenDto } from '../../chat-generics/dto/chat-token.dto';

export class FetchChatMessagesDto extends TokenDto {
  @IsOptional()
  @IsUUID()
  chatBuddy: string;

  @IsOptional()
  @IsUUID()
  chatGroup: string;

  @IsOptional()
  @IsNumber()
  page: number;
}

export enum ReadStatus {
  READ = 'read',
  UNREAD = 'unread',
}

export class FetchChatsDto extends TokenDto {
  @IsOptional()
  @IsNumber()
  page: number;

  @IsOptional()
  @IsEnum(ReadStatus)
  status: ReadStatus;

  @IsOptional()
  @IsString()
  q?: string;
}

export class FetchChatGroupsDto extends TokenDto {
  @IsOptional()
  @IsNumber()
  page: number;

  @IsOptional()
  @IsString()
  q?: string;
}
