import { QueryDto } from '@/generic/generic.dto';
import { OtherCurrencyDto } from '@/product/course/crud/crud.dto';
import { EventType, ProductStatus, TicketTierStatus, ProductType } from '@prisma/client';
export declare class BaseTicketTierDto {
    id?: string;
    name: string;
    amount: number;
    original_amount: number;
    description?: string;
    quantity?: number;
    remaining_quantity?: number;
    max_per_purchase?: number;
    default_view?: boolean;
    status?: TicketTierStatus;
    other_currencies?: OtherCurrencyDto[];
}
export declare class CreateTicketTierDto extends BaseTicketTierDto {
}
declare const UpdateTicketTierDto_base: import("@nestjs/mapped-types").MappedType<Partial<BaseTicketTierDto>>;
export declare class UpdateTicketTierDto extends UpdateTicketTierDto_base {
    id?: string;
}
export declare class BaseTicketDto {
    title: string;
    slug: string;
    description?: string;
    keywords?: string;
    metadata?: any;
    category_id: string;
    status?: ProductStatus;
    multimedia_id: string;
    event_time?: string;
    event_start_date: Date;
    event_end_date: Date;
    event_location: string;
    event_type: EventType;
    auth_details?: string;
    ticket_tiers: CreateTicketTierDto[];
}
export declare class CreateTicketDto extends BaseTicketDto {
    ticket_tiers: CreateTicketTierDto[];
}
declare const UpdateTicketDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<BaseTicketDto, "ticket_tiers">>>;
export declare class UpdateTicketDto extends UpdateTicketDto_base {
    ticket_tiers?: UpdateTicketTierDto[];
}
export declare class FilterProductDto extends QueryDto {
    q?: string;
    status?: ProductStatus;
    business_id: string;
    type?: ProductType;
    min_price?: number;
    max_price?: number;
    currency?: string;
}
export declare class TicketTierIdDto {
    ticket_tier_id: string;
}
export {};
