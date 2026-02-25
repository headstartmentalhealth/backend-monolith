import { SubscriptionPlanPriceService } from './price.service';
import { AuthPayload, GenericPayload, PagePayload } from '@/generic/generic.payload';
import { CreateSubscriptionPlanPriceDto, UpdateSubscriptionPlanPriceDto } from './price.dto';
import { QueryDto } from '@/generic/generic.dto';
import { SubscriptionPlanPrice } from '@prisma/client';
export declare class SubscriptionPlanPriceController {
    private readonly subscriptionPlanPriceService;
    constructor(subscriptionPlanPriceService: SubscriptionPlanPriceService);
    create(request: AuthPayload & Request, createSubcriptionPlanPriceDto: CreateSubscriptionPlanPriceDto): Promise<GenericPayload>;
    fetch(request: AuthPayload & Request, param: {
        subscription_plan_id: string;
    }, queryDto: QueryDto): Promise<PagePayload<SubscriptionPlanPrice>>;
    update(request: AuthPayload & Request, param: {
        id: string;
    }, updateSubscriptionPlanPriceDto: UpdateSubscriptionPlanPriceDto): Promise<GenericPayload>;
    delete(request: AuthPayload & Request, param: {
        id: string;
    }): Promise<GenericPayload>;
}
