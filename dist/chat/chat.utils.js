"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatChat = exports.formatChats = exports.toSlug = exports.sanitizeMessage = exports.isValidURL = exports.isPhoneNumber = exports.isEmail = exports.maxWords = void 0;
exports.maxWords = 1000;
const isEmail = (word) => {
    return Boolean(String(word)
        .toLowerCase()
        .match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/));
};
exports.isEmail = isEmail;
const isPhoneNumber = (word) => {
    const phoneExp = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/gim;
    return Boolean(String(word).match(phoneExp));
};
exports.isPhoneNumber = isPhoneNumber;
const isValidURL = (url) => {
    const regex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    return regex.test(url);
};
exports.isValidURL = isValidURL;
const sanitizeMessage = (message) => {
    const decomposedMessage = message.split(' ');
    const decomposedSanitizedMsg = decomposedMessage.map((word) => {
        let updatedWord = word;
        if (!(0, exports.isValidURL)(word) && (0, exports.isPhoneNumber)(word)) {
            updatedWord = '*****';
        }
        else if (word.includes('@')) {
            updatedWord = '*****';
        }
        return updatedWord;
    });
    const sanitizedMsg = decomposedSanitizedMsg.join(' ');
    return sanitizedMsg;
};
exports.sanitizeMessage = sanitizeMessage;
const toSlug = (text) => {
    return text.toLocaleLowerCase().split(' ').join('-');
};
exports.toSlug = toSlug;
const formatChats = (chats, user_id) => {
    const formattedChats = chats.map((chat) => (0, exports.formatChat)(chat, user_id));
    return formattedChats;
};
exports.formatChats = formatChats;
const formatChat = (chat, user_id) => {
    const unreadArray = chat.unread;
    const unreadEntry = unreadArray.find((item) => item?.user_id === user_id);
    const unreadCount = unreadEntry?.count || 0;
    const chat_buddy = chat?.initiator_id === user_id ? chat.chat_buddy : chat.initiator;
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
exports.formatChat = formatChat;
//# sourceMappingURL=chat.utils.js.map