export interface ChatUnreadSchema {
  user_id: string;
  unread: boolean;
  count: number;
}

export interface PagePayload<T> {
  data: T[];
  count: number;
}

export interface ChatResponse {
  id: string;
  last_message: string;
  is_archived: boolean;
  unread: number;
  created_date: Date;
  updated_date: Date;
  chat_buddy: UserResponse;
}

export interface UserResponse {
  id: string;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  role: string;
  verifiedAsHost: boolean;
  picture?: string;
}

export interface ChatMessageResponse {
  id: string;
  message: string;
  file?: string;
  read: boolean;
  createdDate: Date;
  updatedDate: Date;
  initiator: UserResponse;
  chatBuddy: UserResponse;
  chat: ChatResponse;
}
