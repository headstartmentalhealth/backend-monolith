import { NotificationTokenService } from './token.service';
import { CreateNotificationTokenDto } from './dto/create-notification-token.dto';
import { AuthPayload, GenericPayload, GenericPayloadAlias } from '@/generic/generic.payload';
import { NotificationToken } from '@prisma/client';
import { IdDto } from '@/generic/generic.dto';
export declare class NotificationTokenController {
    private readonly notificationTokenService;
    constructor(notificationTokenService: NotificationTokenService);
    addPushNotification(request: AuthPayload & Request, createNotificationTokenDto: CreateNotificationTokenDto): Promise<GenericPayload>;
    getUserTokens(request: AuthPayload & Request): Promise<GenericPayloadAlias<NotificationToken[]>>;
    deactivateToken(request: AuthPayload & Request, param: IdDto): Promise<GenericPayload>;
}
