import { QueryDto } from '@/generic/generic.dto';
import { Action } from '@prisma/client';
export declare class CreateLogDto {
    user_id?: string;
    action: Action;
    entity: string;
    entity_id?: string;
    metadata: any;
    ip_address?: string;
    user_agent?: string;
}
export declare class FilterLogDto extends QueryDto {
    q?: string;
}
