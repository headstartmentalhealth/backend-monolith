import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriptionPlanPriceDto, UpdateSubscriptionPlanPriceDto } from './price.dto';
import { AuthPayload, GenericPayload, PagePayload } from '../../generic/generic.payload';
import { Prisma, SubscriptionPlanPrice } from '@prisma/client';
import { LogService } from '../../log/log.service';
import { QueryDto } from '../../generic/generic.dto';
import { GenericService } from '../../generic/generic.service';
export declare class SubscriptionPlanPriceService {
    private prisma;
    private readonly logService;
    private readonly genericService;
    private readonly subscriptionPlanPriceRepository;
    private readonly subscriptionPlanRepository;
    private readonly select;
    constructor(prisma: PrismaService, logService: LogService, genericService: GenericService);
    create(request: AuthPayload & Request, dto: CreateSubscriptionPlanPriceDto): Promise<GenericPayload>;
    fetch(payload: AuthPayload, param: {
        subscription_plan_id: string;
    }, queryDto: QueryDto): Promise<PagePayload<SubscriptionPlanPrice>>;
    findOne(id: string): Promise<{
        subscription_plan: {
            id: string;
            business_id: string;
            name: string;
        };
        creator: {
            id: string;
            name: string;
            role: {
                name: string;
                role_id: string;
            };
        };
    } & {
        id: string;
        created_at: Date;
        updated_at: Date;
        deleted_at: Date | null;
        currency: string;
        creator_id: string;
        subscription_plan_id: string;
        price: Prisma.Decimal;
        period: import(".prisma/client").$Enums.SubscriptionPeriod;
        other_currencies: Prisma.JsonValue | null;
    }>;
    update(request: AuthPayload & Request, param: {
        id: string;
    }, dto: UpdateSubscriptionPlanPriceDto): Promise<GenericPayload>;
    private hasRelatedRecords;
    delete(request: AuthPayload & Request, param: {
        id: string;
    }): Promise<GenericPayload>;
}
