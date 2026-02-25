import { PrismaService } from '../prisma/prisma.service';
import { Mood } from '@prisma/client';
export declare class MoodCheckInService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(userId: string, mood: Mood): Promise<{
        id: string;
        user_id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        mood: import(".prisma/client").$Enums.Mood;
    }>;
    getLatest(userId: string): Promise<{
        id: string;
        user_id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        mood: import(".prisma/client").$Enums.Mood;
    }>;
    getHistory(userId: string): Promise<{
        id: string;
        user_id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        mood: import(".prisma/client").$Enums.Mood;
    }[]>;
}
