import { MoodCheckInService } from './mood-check-in.service';
import { CreateMoodCheckInDto } from './mood-check-in.dto';
import { AuthPayload } from '../generic/generic.payload';
export declare class MoodCheckInController {
    private readonly moodCheckInService;
    constructor(moodCheckInService: MoodCheckInService);
    create(req: AuthPayload, dto: CreateMoodCheckInDto): Promise<{
        id: string;
        user_id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        mood: import(".prisma/client").$Enums.Mood;
    }>;
    getLatest(req: AuthPayload): Promise<{
        id: string;
        user_id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        mood: import(".prisma/client").$Enums.Mood;
    }>;
    getHistory(req: AuthPayload): Promise<{
        id: string;
        user_id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        mood: import(".prisma/client").$Enums.Mood;
    }[]>;
}
