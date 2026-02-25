import { PrismaService } from '../../prisma/prisma.service';
import { CreateBillingInformationDto, UpdateBillingInformationDto } from './billing.dto';
import { BillingInformation } from '@prisma/client';
import { LogService } from '../../log/log.service';
import { GenericService } from '../../generic/generic.service';
import { AuthPayload, GenericPayload, PagePayload } from '../../generic/generic.payload';
import { QueryDto } from '../../generic/generic.dto';
import { BillingInformationSelection, RelatedModels } from './billing.utils';
export declare class BillingService {
    private readonly prisma;
    private readonly logService;
    private readonly genericService;
    private readonly model;
    private readonly billingInformationRepository;
    private readonly select;
    constructor(prisma: PrismaService, logService: LogService, genericService: GenericService);
    create(request: AuthPayload & Request, dto: CreateBillingInformationDto): Promise<GenericPayload>;
    fetch(payload: AuthPayload, queryDto: QueryDto): Promise<PagePayload<BillingInformation>>;
    findOne(id: string, user_id?: string): Promise<BillingInformationSelection & RelatedModels>;
    update(request: AuthPayload & Request, param: {
        id: string;
    }, dto: UpdateBillingInformationDto): Promise<GenericPayload>;
    delete(request: AuthPayload & Request, param: {
        id: string;
    }): Promise<GenericPayload>;
}
