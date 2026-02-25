import { HttpStatus, Logger } from '@nestjs/common';
import { AuthPayload, GenericDataPayload, GenericPayloadAlias, PagePayload, Timezone } from '../../generic/generic.payload';
import { GenericPayload } from '../../generic/generic.payload';
import { ExportBusinessUsersDto, FilterBusinessDto, FilterBusinessOwnerDto, ImportBusinessUsersDto, SaveBusinessInfoDto, SuspendBusinessOwnerDto, UpsertWithdrawalAccountDto, AddCustomerDto, UpsertKycDto, ReviewKycDto, BusinessNameDto, UpdateBusinessProcessesDto } from './onboard.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessInformation, Prisma, User } from '@prisma/client';
import { LogService } from '../../log/log.service';
import { PaystackService } from '../../generic/providers/paystack/paystack.provider';
import { BusinessDto, IdDto, UserDto } from '@/generic/generic.dto';
import { MailService } from '@/notification/mail/mail.service';
import { GenericService } from '@/generic/generic.service';
import { UploadService } from '@/multimedia/upload/upload.service';
import { ConfigService } from '@nestjs/config';
import { CartService } from '@/cart/cart.service';
import { NotificationDispatchService } from '@/notification/dispatch/dispatch.service';
export declare class OnboardService {
    private readonly prisma;
    private readonly logService;
    private readonly paystackService;
    private readonly mailService;
    private readonly genericService;
    private readonly uploadService;
    private readonly cartService;
    private readonly configService;
    private readonly logger;
    private readonly notificationDispatchService;
    private readonly businessInformationRepository;
    private readonly businessWalletRepository;
    private readonly onboardingStatusRepository;
    private readonly paymentRepository;
    private readonly businessOwnerSelect;
    private readonly onboardingStatusSelect;
    private readonly businessInformationSelect;
    private readonly businessWalletSelect;
    private readonly withdrawalAccountRepository;
    private readonly withdrawalAccountSelect;
    private readonly userRepository;
    constructor(prisma: PrismaService, logService: LogService, paystackService: PaystackService, mailService: MailService, genericService: GenericService, uploadService: UploadService, cartService: CartService, configService: ConfigService, logger: Logger, notificationDispatchService: NotificationDispatchService);
    saveBusinessInformation(req: AuthPayload & Request, saveBusinessInfoDto: SaveBusinessInfoDto): Promise<GenericPayload>;
    fetchBusinesses(req: AuthPayload & Request): Promise<GenericDataPayload<any[]>>;
    fetchBusinessInformation(req: AuthPayload & Request, param: {
        id: string;
    }): Promise<GenericPayloadAlias<BusinessInformation>>;
    findBusinessInformation(req: AuthPayload & Request, businessNameDto: BusinessNameDto): Promise<GenericPayloadAlias<BusinessInformation>>;
    saveWithdrawalAccount(req: Request & AuthPayload, dto: UpsertWithdrawalAccountDto): Promise<GenericPayload>;
    viewBusinessInformationPublic(req: Timezone & Request, param: {
        id: string;
    }): Promise<GenericPayloadAlias<BusinessInformation>>;
    fetchAllBusinesses(req: AuthPayload & Request, filterBusinessDto: FilterBusinessDto): Promise<PagePayload<BusinessInformation>>;
    fetchBusinessDetails(req: AuthPayload & Request, param: IdDto): Promise<GenericPayloadAlias<BusinessInformation>>;
    suspendBusinessOwner(req: AuthPayload & Request, param: UserDto, suspendBusinessOwnerDto: SuspendBusinessOwnerDto): Promise<GenericPayload>;
    unsuspendBusinessOwner(req: AuthPayload & Request, param: UserDto): Promise<GenericPayload>;
    fetchBusinessOwners(req: AuthPayload & Request, filterBusinessOwnerDto: FilterBusinessOwnerDto): Promise<PagePayload<User>>;
    deleteBusiness(req: AuthPayload & Request, param: {
        id: string;
    }): Promise<GenericPayload>;
    importBusinessUsers(req: AuthPayload & Request, importDto: ImportBusinessUsersDto): Promise<GenericPayload>;
    exportBusinessUsers(req: AuthPayload & Request, query: ExportBusinessUsersDto): Promise<any>;
    addCustomer(req: Request, dto: AddCustomerDto): Promise<GenericPayloadAlias<{
        customer_id: string;
        contact_id: string;
        business_name: string;
    }>>;
    upsertKyc(req: AuthPayload & Request, dto: UpsertKycDto): Promise<GenericPayload>;
    fetchKyc(req: AuthPayload & Request): Promise<GenericDataPayload<any>>;
    fetchSubmittedKyc(req: AuthPayload & Request, paramDto: BusinessDto): Promise<GenericDataPayload<any>>;
    reviewKyc(req: AuthPayload & Request, kyc_id: string, dto: ReviewKycDto): Promise<GenericPayload>;
    updateOnboardingProcess(req: AuthPayload & Request, updateBusinessProcessesDto: UpdateBusinessProcessesDto): Promise<{
        statusCode: HttpStatus;
        message: string;
        data: {
            onboard_processes: Prisma.JsonValue;
        };
    }>;
}
