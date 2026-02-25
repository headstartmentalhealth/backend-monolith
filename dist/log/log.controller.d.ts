import { LogService } from './log.service';
import { FilterLogDto } from './log.dto';
import { AuthPayload } from '@/generic/generic.payload';
export declare class LogController {
    private readonly logService;
    constructor(logService: LogService);
    fetch(request: AuthPayload & Request, filterLogDto: FilterLogDto): Promise<import("@/generic/generic.payload").PagePayload<{
        id: string;
        user_id: string | null;
        action: import(".prisma/client").$Enums.Action;
        entity: string;
        entity_id: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue;
        ip_address: string | null;
        user_agent: string | null;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
    }>>;
}
