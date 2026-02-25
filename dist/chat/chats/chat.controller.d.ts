import { ChatsService } from './chat.service';
import { CreateChatDto } from './dto/create-chat.dto';
export declare class ChatController {
    private chatService;
    constructor(chatService: ChatsService);
    create(createChatDto: CreateChatDto): Promise<{
        statusCode: import("@nestjs/common").HttpStatus;
        message: string;
        data: {
            id: any;
        };
    }>;
}
