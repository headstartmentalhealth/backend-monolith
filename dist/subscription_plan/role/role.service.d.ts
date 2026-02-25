import { AuthPayload, GenericPayload, PagePayload } from '../../generic/generic.payload';
import { GenericService } from '../../generic/generic.service';
import { LogService } from '../../log/log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriptionPlanRoleDto, UpdateSubscriptionPlanRoleDto } from './role.dto';
import { SubscriptionPlanRole } from '@prisma/client';
import { QueryDto } from '../../generic/generic.dto';
export declare class SubscriptionPlanRoleService {
    private prisma;
    private readonly logService;
    private readonly genericService;
    private readonly subscriptionPlanRoleRepository;
    private readonly subscriptionPlanRepository;
    private readonly select;
    constructor(prisma: PrismaService, logService: LogService, genericService: GenericService);
    create(request: AuthPayload & Request, dto: CreateSubscriptionPlanRoleDto): Promise<GenericPayload>;
    fetch(payload: AuthPayload, param: {
        subscription_plan_id: string;
    }, queryDto: QueryDto): Promise<PagePayload<SubscriptionPlanRole>>;
    private findOne;
    update(request: AuthPayload & Request, param: {
        id: string;
    }, dto: UpdateSubscriptionPlanRoleDto): Promise<GenericPayload>;
    delete(request: AuthPayload & Request, param: {
        id: string;
    }): Promise<GenericPayload>;
}
