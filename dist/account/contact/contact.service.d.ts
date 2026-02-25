import { BusinessContact, User } from '@prisma/client';
import { LogService } from '../../log/log.service';
import { MailService } from '../../notification/mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { AcceptInviteDto, FilterContactsDto, FilterInvitesDto, FilterUserDto, InviteContactDto, NewsletterSubscriptionDto, SendMessageDto } from './contact.dto';
import { AuthPayload, GenericDataPayload, GenericPayload, PagePayload } from '../../generic/generic.payload';
import { IdDto, QueryDto } from '../../generic/generic.dto';
import { ContactDto, TokenDto } from './contact.payload';
import { ConfigService } from '@nestjs/config';
import { TurnstileService } from '../auth/providers/cloudflare/turnstile.provider';
export declare class ContactService {
    private readonly prisma;
    private readonly logService;
    private readonly mailService;
    private readonly logger;
    private readonly configService;
    private readonly turnstileService;
    private readonly businessContactRepository;
    private readonly userRepository;
    private readonly customerSelectOptions;
    private readonly contactSelectOptions;
    constructor(prisma: PrismaService, logService: LogService, mailService: MailService, logger: Logger, configService: ConfigService, turnstileService: TurnstileService);
    private buildSearchFilter;
    private buildBusinessFilter;
    private buildBusinessFilterII;
    private buildBusinessFilterAdmins;
    private buildRoleFilter;
    private buildBusinessContactsFilter;
    inviteMember(req: AuthPayload & Request, dto: InviteContactDto): Promise<GenericPayload>;
    acceptInvite(req: Request, acceptInviteDto: AcceptInviteDto): Promise<GenericPayload>;
    private addBusinessOwner;
    getInvites(payload: AuthPayload, param: {
        business_id: string;
    }, filterDto: FilterInvitesDto & QueryDto): Promise<PagePayload<BusinessContact>>;
    getInviteByToken(param: TokenDto): Promise<GenericDataPayload<BusinessContact>>;
    reinviteMember(req: AuthPayload & Request, param: ContactDto): Promise<GenericPayload>;
    removeMember(payload: AuthPayload & Request, param: ContactDto): Promise<GenericPayload>;
    deactivateMember(payload: AuthPayload & Request, param: ContactDto): Promise<GenericPayload>;
    restoreMember(payload: AuthPayload & Request, param: ContactDto): Promise<GenericPayload>;
    autoExpireInvitations(): Promise<void>;
    getBusinessContacts(payload: AuthPayload, param: {
        business_id: string;
    }, filterDto: FilterInvitesDto & QueryDto): Promise<PagePayload<BusinessContact>>;
    getBusinessCustomers(payload: AuthPayload, filterDto: FilterUserDto): Promise<PagePayload<User & {
        total_expenses?: number;
    }>>;
    fetchContacts(payload: AuthPayload, filterDto: FilterContactsDto): Promise<PagePayload<User>>;
    fetchOrgContacts(payload: AuthPayload, filterDto: FilterContactsDto): Promise<PagePayload<User>>;
    private calculateCustomerExpenses;
    getBusinessCustomer(payload: AuthPayload, param: IdDto): Promise<GenericDataPayload<User>>;
    sendMessage(request: Request | any, data: SendMessageDto): Promise<GenericPayload>;
    subscribe(req: Request, data: NewsletterSubscriptionDto): Promise<GenericPayload>;
}
