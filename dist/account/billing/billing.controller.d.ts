import { BillingService } from './billing.service';
import { CreateBillingInformationDto, UpdateBillingInformationDto } from './billing.dto';
import { AuthPayload, GenericPayload, PagePayload } from '@/generic/generic.payload';
import { BillingInformation } from '@prisma/client';
import { QueryDto } from '@/generic/generic.dto';
export declare class BillingController {
    private readonly billingService;
    constructor(billingService: BillingService);
    create(request: AuthPayload & Request, createBillingInformationDto: CreateBillingInformationDto): Promise<GenericPayload>;
    fetch(request: AuthPayload & Request, queryDto: QueryDto): Promise<PagePayload<BillingInformation>>;
    update(request: AuthPayload & Request, param: {
        id: string;
    }, updateBillingInformationDto: UpdateBillingInformationDto): Promise<GenericPayload>;
    delete(request: AuthPayload & Request, param: {
        id: string;
    }): Promise<GenericPayload>;
}
