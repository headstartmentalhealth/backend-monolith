import { Role } from './generic.data';
export declare class GenericPayload {
    statusCode: number;
    message: string;
}
export declare class GenericPayloadAlias<T> {
    statusCode: number;
    message: string;
    data?: T;
}
export declare class GenericDataPayload<T> {
    statusCode: number;
    data: T;
}
export declare class PagePayload<T> {
    statusCode?: number;
    message?: string;
    data: Array<T>;
    userId?: string;
    count: number;
    unread_count?: number;
}
export declare class AltPagePayload<T> {
    statusCode?: number;
    data: T;
    count: number;
}
export declare class TotalPayload {
    total?: number;
    active?: number;
    drafts?: number;
    cancelled?: number;
    inactive?: number;
    pending?: number;
}
export declare class Timezone {
    timezone: string;
}
export declare class AuthPayload extends Timezone {
    user: {
        sub: string;
        email: string;
        name: string;
        role: Role;
    };
    'Business-Id'?: string;
}
export declare class PaginationFiltersPayload {
    filters: {
        created_at: {
            gte: Date;
            lte: Date;
        };
    };
    pagination_options: {
        page: number;
        limit: number;
    };
}
