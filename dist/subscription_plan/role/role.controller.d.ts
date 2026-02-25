import { SubscriptionPlanRoleService } from './role.service';
import { AuthPayload, GenericPayload, PagePayload } from '@/generic/generic.payload';
import { CreateSubscriptionPlanRoleDto, UpdateSubscriptionPlanRoleDto } from './role.dto';
import { SubscriptionPlanRole } from '@prisma/client';
import { QueryDto } from '@/generic/generic.dto';
export declare class SubscriptionPlanRoleController {
    private readonly subscriptionPlanRoleService;
    constructor(subscriptionPlanRoleService: SubscriptionPlanRoleService);
    create(request: AuthPayload & Request, createSubcriptionPlanRoleDto: CreateSubscriptionPlanRoleDto): Promise<GenericPayload>;
    fetch(request: AuthPayload & Request, param: {
        subscription_plan_id: string;
    }, queryDto: QueryDto): Promise<PagePayload<SubscriptionPlanRole>>;
    update(request: AuthPayload & Request, param: {
        id: string;
    }, updateSubscriptionPlanRoleDto: UpdateSubscriptionPlanRoleDto): Promise<GenericPayload>;
    delete(request: AuthPayload & Request, param: {
        id: string;
    }): Promise<GenericPayload>;
}
