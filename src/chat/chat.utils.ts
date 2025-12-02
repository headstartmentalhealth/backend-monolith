import { Chat, ChatMessage, Prisma, User } from '@prisma/client';

export const maxWords = 1000;

/**
 * Check if word is an email
 * @param word
 * @returns
 */
export const isEmail = (word: string): boolean => {
  return Boolean(
    String(word)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      ),
  );
};

/**
 * Check if word is a number
 * @param word
 * @returns
 */
export const isPhoneNumber = (word: string): boolean => {
  const phoneExp =
    /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/gim;
  return Boolean(String(word).match(phoneExp));
};

export const isValidURL = (url: string) => {
  const regex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
  return regex.test(url);
};

/**
 * Sanitize message
 * @param message
 * @returns
 */
export const sanitizeMessage = (message: string): string => {
  const decomposedMessage = message.split(' ');

  // Loop through decomposed message
  const decomposedSanitizedMsg = decomposedMessage.map((word) => {
    let updatedWord = word;

    // if (isEmail(word)) {
    //   updatedWord = '*****';
    // }
    if (!isValidURL(word) && isPhoneNumber(word)) {
      updatedWord = '*****';
    } else if (word.includes('@')) {
      updatedWord = '*****';
    }

    return updatedWord;
  });

  // console.log(decomposedSanitizedMsg);

  const sanitizedMsg = decomposedSanitizedMsg.join(' ');

  // console.log(sanitizedMsg);

  return sanitizedMsg;
};

/**
 * Convert a text to a slug
 * @param text
 * @returns
 */
export const toSlug = (text: string): string => {
  return text.toLocaleLowerCase().split(' ').join('-');
};

export type ChatWithRelations = Prisma.ChatGetPayload<{
  include: {
    initiator: {
      select: {
        id: true;
        name: true;
        role: true;
        profile: {
          select: { profile_picture: true };
        };
      };
    };
    chat_buddy: {
      select: {
        id: true;
        name: true;
        role: true;
        profile: {
          select: { profile_picture: true };
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
                role: { select: { name: true; role_id: true } };
                profile: { select: { profile_picture: true } };
              };
            };
          };
        };
      };
    };
    messages: {
      take: 1;
      orderBy: { created_at: 'desc' };
      where: { deleted_at: null };
    };
  };
}>;

/**
 * Format chats
 * @param chats
 * @param user_id
 */
export const formatChats = (chats: ChatWithRelations[], user_id: string) => {
  // Format the chats
  const formattedChats = chats.map((chat) => formatChat(chat, user_id));

  return formattedChats;
};

/**
 * Format chat
 * @param chat
 * @param user_id
 * @returns
 */
export const formatChat = (chat: ChatWithRelations, user_id: string) => {
  // Type assertion for unread array
  const unreadArray = chat.unread as Array<{
    user_id?: string;
    unread: boolean;
    count?: number;
  }>;

  const unreadEntry = unreadArray.find((item) => item?.user_id === user_id);
  const unreadCount = unreadEntry?.count || 0;

  // Determine the chat buddy
  const chat_buddy =
    chat?.initiator_id === user_id ? chat.chat_buddy : chat.initiator;

  return {
    ...chat,
    id: chat.id,
    created_at: chat.created_at,
    updated_at: chat.updated_at,
    chat_buddy,
    messages: chat.messages,
    unread: unreadCount,
  };
};
