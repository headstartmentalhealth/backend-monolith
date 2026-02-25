import { PrismaService } from '@/prisma/prisma.service';
import { CreateNotificationTokenDto } from './dto/create-notification-token.dto';
import { NotificationToken } from '@prisma/client';
import { AuthPayload, GenericPayload, GenericPayloadAlias } from '@/generic/generic.payload';
import { IdDto } from '@/generic/generic.dto';
export declare class NotificationTokenService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    addPushNotification(payload: AuthPayload, createNotificationTokenDto: CreateNotificationTokenDto): Promise<GenericPayload>;
    private reactivateToken;
    deactivateToken(request: AuthPayload, param: IdDto): Promise<GenericPayload>;
    findByToken(token: string): Promise<{
        id: string;
        user_id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        token: string;
        is_active: boolean;
        device_type: string;
    }>;
    findManyByUser(payload: AuthPayload): Promise<GenericPayloadAlias<NotificationToken[]>>;
    findOneByUser(user_id: string): Promise<NotificationToken>;
}
