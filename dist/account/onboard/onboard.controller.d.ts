import { AuthPayload, GenericDataPayload, GenericPayload, GenericPayloadAlias, PagePayload, Timezone } from '@/generic/generic.payload';
import { FilterBusinessDto, FilterBusinessOwnerDto, SaveBusinessInfoDto, SuspendBusinessOwnerDto, UpsertWithdrawalAccountDto, ImportBusinessUsersDto, ExportBusinessUsersDto, AddCustomerDto, UpsertKycDto, ReviewKycDto, BusinessNameDto, UpdateBusinessProcessesDto } from './onboard.dto';
import { OnboardService } from './onboard.service';
import { BusinessInformation, User } from '@prisma/client';
import { BusinessDto, IdDto, UserDto } from '@/generic/generic.dto';
export declare class OnboardController {
    private readonly onboardService;
    constructor(onboardService: OnboardService);
    saveBusinessInfo(req: AuthPayload & Request, saveBusinessInfoDto: SaveBusinessInfoDto): Promise<GenericPayload>;
    fetchBusinesses(req: AuthPayload & Request): Promise<GenericDataPayload<BusinessInformation[]>>;
    findBusinessInformation(req: AuthPayload & Request, businessNameDto: BusinessNameDto): Promise<GenericPayloadAlias<BusinessInformation>>;
    fetchBusinessInformation(req: AuthPayload & Request, param: {
        id: string;
    }): Promise<GenericPayloadAlias<BusinessInformation>>;
    saveWithdrawalAccount(req: AuthPayload & Request, upsertWithdrawalAccountDto: UpsertWithdrawalAccountDto): Promise<GenericPayload>;
    viewBusinessInformationPublic(req: Timezone & Request, param: {
        id: string;
    }): Promise<GenericPayloadAlias<BusinessInformation>>;
    fetchAllBusinesses(req: AuthPayload & Request, filterBusinessDto: FilterBusinessDto): Promise<PagePayload<BusinessInformation>>;
    fetchBusinessDetails(req: AuthPayload & Request, param: IdDto): Promise<GenericPayloadAlias<BusinessInformation>>;
    suspendBusinessOwner(req: AuthPayload & Request, param: UserDto, suspendBusinessOwnerDto: SuspendBusinessOwnerDto): Promise<GenericPayload>;
    unsuspendBusinessOwner(req: AuthPayload & Request, param: UserDto): Promise<GenericPayload>;
    fetchAllBusinesOwners(req: AuthPayload & Request, filterBusinessOwnerDto: FilterBusinessOwnerDto): Promise<PagePayload<User>>;
    deleteBusiness(req: AuthPayload & Request, param: {
        id: string;
    }): Promise<GenericPayload>;
    importBusinessUsers(req: AuthPayload & Request, importDto: ImportBusinessUsersDto): Promise<GenericPayload>;
    exportBusinessUsers(req: AuthPayload & Request, query: ExportBusinessUsersDto): Promise<any>;
    addCustomer(req: Request, addCustomerDto: AddCustomerDto): Promise<GenericPayload>;
    upsertKyc(req: AuthPayload & Request, dto: UpsertKycDto): Promise<GenericPayload>;
    fetchKyc(req: AuthPayload & Request): Promise<GenericDataPayload<any>>;
    fetchSubmittedKyc(req: AuthPayload & Request, paramDto: BusinessDto): Promise<GenericDataPayload<any>>;
    reviewKyc(req: AuthPayload & Request, kyc_id: string, dto: ReviewKycDto): Promise<GenericPayload>;
    updateOnboardingProcess(req: AuthPayload & Request, dto: UpdateBusinessProcessesDto): Promise<GenericPayload>;
}
