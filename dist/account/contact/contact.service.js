"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactService = void 0;
const client_1 = require("@prisma/client");
const log_service_1 = require("../../log/log.service");
const mail_service_1 = require("../../notification/mail/mail.service");
const prisma_service_1 = require("../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const uuid_1 = require("uuid");
const prisma_base_repository_1 = require("../../prisma/prisma.base.repository");
const generic_utils_1 = require("../../generic/generic.utils");
const generic_data_1 = require("../../generic/generic.data");
const moment = require("moment");
const schedule_1 = require("@nestjs/schedule");
const config_1 = require("@nestjs/config");
const turnstile_provider_1 = require("../auth/providers/cloudflare/turnstile.provider");
const axios_1 = require("axios");
let ContactService = class ContactService {
    constructor(prisma, logService, mailService, logger, configService, turnstileService) {
        this.prisma = prisma;
        this.logService = logService;
        this.mailService = mailService;
        this.logger = logger;
        this.configService = configService;
        this.turnstileService = turnstileService;
        this.customerSelectOptions = {
            id: true,
            name: true,
            email: true,
            phone: true,
            is_email_verified: true,
            is_phone_verified: true,
            payments: {
                select: {
                    id: true,
                    purchase: true,
                    currency: true,
                    created_at: true,
                    amount: true,
                    discount_applied: true,
                    payment_status: true,
                    purchase_type: true,
                    interval: true,
                    auto_renew: true,
                    is_renewal: true,
                    is_upgrade: true,
                    subscription_plan: true,
                    payment_method: true,
                },
            },
            business_contacts: {
                take: 1,
                select: {
                    id: true,
                    business_id: true,
                    is_owner: true,
                    joined_at: true,
                    joined_via: true,
                    status: true,
                    role: true,
                    created_at: true,
                    business: {
                        select: {
                            id: true,
                            business_name: true,
                        },
                    },
                },
            },
            created_at: true,
            updated_at: true,
            role: true,
            profile: true,
        };
        this.contactSelectOptions = {
            id: true,
            name: true,
            email: true,
            phone: true,
            is_email_verified: true,
            is_phone_verified: true,
            created_at: true,
            updated_at: true,
            role: true,
            profile: true,
        };
        this.businessContactRepository = new prisma_base_repository_1.PrismaBaseRepository('businessContact', prisma);
        this.userRepository = new prisma_base_repository_1.PrismaBaseRepository('user', prisma);
    }
    buildSearchFilter(searchQuery) {
        if (!searchQuery)
            return {};
        return {
            OR: [
                { id: { contains: searchQuery, mode: 'insensitive' } },
                { name: { contains: searchQuery, mode: 'insensitive' } },
                { email: { contains: searchQuery, mode: 'insensitive' } },
            ],
        };
    }
    buildBusinessFilter(businessId) {
        if (!businessId)
            return {};
        return {
            OR: [
                {
                    payments: {
                        some: {
                            purchase: {
                                path: ['business_id'],
                                equals: businessId,
                            },
                        },
                    },
                },
                {
                    payments: {
                        some: {
                            subscription_plan: {
                                business_id: businessId,
                            },
                            payment_status: client_1.PaymentStatus.SUCCESS,
                        },
                    },
                },
                {
                    business_contacts: {
                        some: {
                            business_id: businessId,
                            status: 'active',
                            role: generic_data_1.Role.USER,
                        },
                    },
                },
            ],
        };
    }
    buildBusinessFilterII(businessId) {
        if (!businessId)
            return {};
        return {
            OR: [
                {
                    payments: {
                        some: {
                            purchase: {
                                path: ['business_id'],
                                equals: businessId,
                            },
                        },
                    },
                },
                {
                    payments: {
                        some: {
                            subscription_plan: {
                                business_id: businessId,
                            },
                            payment_status: client_1.PaymentStatus.SUCCESS,
                        },
                    },
                },
                {
                    business_contacts: {
                        some: {
                            business_id: businessId,
                            status: 'active',
                        },
                    },
                },
            ],
        };
    }
    buildBusinessFilterAdmins(businessId) {
        if (!businessId)
            return {};
        return {
            OR: [
                {
                    business_contacts: {
                        some: {
                            business_id: businessId,
                            status: 'active',
                            role: generic_data_1.Role.BUSINESS_SUPER_ADMIN,
                        },
                    },
                },
                {
                    business_contacts: {
                        some: {
                            business_id: businessId,
                            status: 'active',
                            role: generic_data_1.Role.BUSINESS_ADMIN,
                        },
                    },
                },
            ],
        };
    }
    buildRoleFilter(roleId) {
        if (!roleId)
            return {};
        return {
            role: { role_id: roleId },
        };
    }
    buildBusinessContactsFilter(businessId) {
        if (!businessId)
            return {};
        return {
            business_contacts: {
                some: {
                    business_id: businessId,
                    status: 'active',
                    role: generic_data_1.Role.USER,
                },
            },
        };
    }
    async inviteMember(req, dto) {
        const { email, name, business_id } = dto;
        const auth = req.user;
        try {
            const { business, role, token } = await this.prisma.$transaction(async (prisma) => {
                const business = await prisma.businessInformation.findUnique({
                    where: { user_id: auth.sub, id: business_id },
                    include: { onboarding_status: true },
                });
                (0, generic_utils_1.verifyBusiness)(business);
                await this.addBusinessOwner(auth, business_id);
                const token = (0, uuid_1.v4)();
                const expires_at = moment().add(7, 'day').toDate();
                const existingInvite = await prisma.businessContact.findFirst({
                    where: { business_id, email },
                });
                if (existingInvite) {
                    if (existingInvite?.status === client_1.MemberStatus.active) {
                        throw new common_1.BadRequestException('User is already a member');
                    }
                    else {
                        throw new common_1.BadRequestException('An invitation has already been sent to this email');
                    }
                }
                const user = await prisma.user.findFirst({ where: { email } });
                if (user) {
                    throw new common_1.BadRequestException('Email has already been registered on the platform.');
                }
                const businessContact = await prisma.businessContact.create({
                    data: {
                        email,
                        ...(user && { user_id: user.id }),
                        ...(user ? { name: user.name } : { name }),
                        business_id,
                        status: client_1.MemberStatus.pending,
                        token,
                        expires_at,
                    },
                });
                if (business.onboarding_status.current_step < 4) {
                    await prisma.onboardingStatus.update({
                        where: { business_id },
                        data: {
                            current_step: 4,
                        },
                    });
                }
                const role = businessContact.is_owner ? 'an owner' : 'a member';
                const metadata = `User with email ${email} was invited to join business ID ${business_id} as ${role}.`;
                await this.logService.createWithTrx({
                    user_id: auth.sub,
                    action: client_1.Action.CONTACT_INVITATION,
                    entity: 'BusinessContact',
                    entity_id: businessContact.id,
                    metadata,
                    ip_address: (0, generic_utils_1.getIpAddress)(req),
                    user_agent: (0, generic_utils_1.getUserAgent)(req),
                }, prisma.log);
                return {
                    business,
                    role,
                    token,
                };
            });
            await this.mailService.inviteMemberEmail(email, business.business_name, role, '7 days', token);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Invitation to member sent successfully.',
            };
        }
        catch (error) {
            (0, generic_utils_1.TransactionError)(error, this.logger);
        }
    }
    async acceptInvite(req, acceptInviteDto) {
        const { token, name, password } = acceptInviteDto;
        try {
            const { invitation, joined_date } = await this.prisma.$transaction(async (prisma) => {
                const invitation = await prisma.businessContact.findFirst({
                    where: { token },
                    include: { business: { include: { user: true } }, user: true },
                });
                if (!invitation) {
                    throw new common_1.NotFoundException('Invalid invitation token');
                }
                if (invitation.expires_at && invitation.expires_at < new Date()) {
                    throw new common_1.BadRequestException('Invitation has expired');
                }
                if (invitation.status === client_1.MemberStatus.active) {
                    throw new common_1.ConflictException('Invitation has already been accepted.');
                }
                const role = await prisma.role.findFirst({
                    where: { role_id: generic_data_1.Role.BUSINESS_ADMIN },
                });
                let member = invitation.user;
                if (!invitation.user) {
                    if (!name || !password) {
                        throw new common_1.UnprocessableEntityException('Your name and password must be provided.');
                    }
                    member = await prisma.user.create({
                        data: {
                            name: name,
                            email: invitation.email,
                            password_hash: await bcrypt.hash(password, 10),
                            role_identity: role.id,
                            is_email_verified: true,
                        },
                    });
                }
                let joined_at = new Date();
                await prisma.businessContact.update({
                    where: { id: invitation.id },
                    data: {
                        ...(!invitation.user && { user_id: member.id }),
                        ...(!invitation.user && { name: member.name }),
                        status: client_1.MemberStatus.active,
                        token: null,
                        expires_at: null,
                        joined_at,
                    },
                });
                const metadata = `User with email ${invitation.email} has accepted the invitation from business ID ${invitation.business.id}.`;
                await this.logService.createWithTrx({
                    user_id: member.id,
                    action: client_1.Action.CONTACT_INVITATION,
                    entity: 'BusinessContact',
                    entity_id: invitation.id,
                    metadata,
                    ip_address: (0, generic_utils_1.getIpAddress)(req),
                    user_agent: (0, generic_utils_1.getUserAgent)(req),
                }, prisma.log);
                const joined_date = moment(joined_at).format('LLL');
                return { invitation, joined_date };
            });
            await this.mailService.acceptedInvitationEmail(invitation.business.user, invitation.business.business_name, joined_date, (0, generic_utils_1.maskEmail)(invitation.email));
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Invitation accepted successfully.',
            };
        }
        catch (error) {
            (0, generic_utils_1.TransactionError)(error, this.logger);
        }
    }
    async addBusinessOwner(user, businessId) {
        const { sub: user_id, email, name } = user;
        const existingOwner = await this.prisma.businessContact.findFirst({
            where: { user_id, email, business_id: businessId, is_owner: true },
        });
        if (!existingOwner) {
            await this.prisma.businessContact.create({
                data: {
                    user_id,
                    email,
                    name,
                    business_id: businessId,
                    status: client_1.MemberStatus.active,
                    is_owner: true,
                },
            });
        }
    }
    async getInvites(payload, param, filterDto) {
        const { business_id } = param;
        const { sub: user_id } = payload.user;
        const { status, role } = filterDto;
        const pagination = (0, generic_utils_1.pageFilter)(filterDto);
        const filters = {
            ...(status && { status }),
            ...(role && { role }),
            business_id,
            business: { user_id },
            ...pagination.filters,
            tz: payload.timezone,
        };
        const select = {
            id: true,
            name: true,
            email: true,
            is_owner: true,
            user: {
                select: {
                    id: true,
                    role: { select: { name: true, role_id: true } },
                    profile: true,
                },
            },
            token: true,
            status: true,
            expires_at: true,
            created_at: true,
        };
        const [invitations, total] = await Promise.all([
            this.businessContactRepository.findManyWithPagination(filters, pagination.pagination_options, client_1.Prisma.SortOrder.desc, undefined, select),
            this.businessContactRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: invitations,
            count: total,
        };
    }
    async getInviteByToken(param) {
        const { token } = param;
        const select = {
            id: true,
            name: true,
            email: true,
            is_owner: true,
            user: {
                select: {
                    id: true,
                    role: { select: { name: true, role_id: true } },
                    profile: true,
                },
            },
            business: true,
            token: true,
            status: true,
            expires_at: true,
            created_at: true,
        };
        const invite = await this.businessContactRepository.findOne({
            token,
        }, null, select);
        if (!invite) {
            throw new common_1.NotFoundException('Invite not found');
        }
        return {
            statusCode: common_1.HttpStatus.OK,
            data: invite,
        };
    }
    async reinviteMember(req, param) {
        const auth = req.user;
        const { invite_id } = param;
        try {
            const { existingInvite, role, token, days_to_expiry } = await this.prisma.$transaction(async (prisma) => {
                const existingInvite = await prisma.businessContact.findFirst({
                    where: { id: invite_id, business: { user_id: auth.sub } },
                    include: { business: true },
                });
                if (!existingInvite) {
                    throw new common_1.NotFoundException('Invitation not found.');
                }
                if (existingInvite.status === client_1.MemberStatus.active) {
                    throw new common_1.ConflictException('Invitee is already a member with an active status.');
                }
                let token;
                let expires_at;
                let days_to_expiry;
                if (existingInvite.expires_at &&
                    (0, generic_utils_1.isExpired)(existingInvite.expires_at)) {
                    token = (0, uuid_1.v4)();
                    expires_at = moment().add(7, 'day').toDate();
                    await prisma.businessContact.update({
                        where: { id: existingInvite.id },
                        data: {
                            token,
                            expires_at,
                        },
                    });
                }
                else {
                    const remaining_days = (0, generic_utils_1.getRemainingDays)(existingInvite.expires_at);
                    days_to_expiry = `${remaining_days} days`;
                }
                const role = existingInvite.is_owner ? 'an owner' : 'a member';
                const metadata = `User with email ${existingInvite.email} was reinvited to join business ID ${existingInvite.business_id} as ${role}.`;
                await this.logService.createWithTrx({
                    user_id: auth.sub,
                    action: client_1.Action.CONTACT_INVITATION,
                    entity: 'BusinessContact',
                    entity_id: existingInvite.id,
                    metadata,
                    ip_address: (0, generic_utils_1.getIpAddress)(req),
                    user_agent: (0, generic_utils_1.getUserAgent)(req),
                }, prisma.log);
                return { existingInvite, role, token, days_to_expiry };
            });
            await this.mailService.reinviteMemberEmail(existingInvite.email, existingInvite.business.business_name, role, (0, generic_utils_1.isExpired)(existingInvite.expires_at) ? '7 days' : days_to_expiry, (0, generic_utils_1.isExpired)(existingInvite.expires_at) ? token : existingInvite.token);
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Re-invitation to member sent successfully.',
            };
        }
        catch (error) {
            (0, generic_utils_1.TransactionError)(error, this.logger);
        }
    }
    async removeMember(payload, param) {
        const { invite_id: id } = param;
        const { sub: user_id } = payload.user;
        try {
            const { member } = await this.prisma.$transaction(async (prisma) => {
                const member = await prisma.businessContact.findFirst({
                    where: { id, business: { user_id } },
                    include: { business: true, user: true },
                });
                if (!member) {
                    throw new common_1.NotFoundException('Member not found');
                }
                await prisma.businessContact.delete({
                    where: { id },
                });
                const metadata = `User with email ${member.email} has been removed from the organization ID ${member.business_id}.`;
                await this.logService.createWithTrx({
                    user_id,
                    action: client_1.Action.MANAGE_CONTACT,
                    entity: 'BusinessContact',
                    entity_id: member.id,
                    metadata,
                    ip_address: (0, generic_utils_1.getIpAddress)(payload),
                    user_agent: (0, generic_utils_1.getUserAgent)(payload),
                }, prisma.log);
                return { member };
            });
            await this.mailService.removeMemberFromOrganizationEmail({ email: member.email, name: member.name }, {
                business_name: member.business.business_name,
                position: member.is_owner ? 'an admin' : 'a member',
            });
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Member removed successfully',
            };
        }
        catch (error) {
            (0, generic_utils_1.TransactionError)(error, this.logger);
        }
    }
    async deactivateMember(payload, param) {
        const { invite_id: id } = param;
        const { sub: user_id } = payload.user;
        try {
            const { member } = await this.prisma.$transaction(async (prisma) => {
                const member = await prisma.businessContact.findFirst({
                    where: { id, business: { user_id } },
                    include: { business: true, user: true },
                });
                if (!member) {
                    throw new common_1.NotFoundException('Member not found');
                }
                if (member.status === client_1.MemberStatus.pending) {
                    throw new common_1.UnprocessableEntityException('You cannot deactivate a pending member invitation.');
                }
                if (member.status === client_1.MemberStatus.suspended) {
                    throw new common_1.UnprocessableEntityException('This member has already been suspended.');
                }
                await prisma.businessContact.update({
                    where: { id },
                    data: { status: client_1.MemberStatus.suspended },
                });
                const metadata = `User with email ${member.email}, a member of the organization ID ${member.business_id}, has been ${client_1.MemberStatus.suspended}.`;
                await this.logService.createWithTrx({
                    user_id,
                    action: client_1.Action.MANAGE_CONTACT,
                    entity: 'BusinessContact',
                    entity_id: member.id,
                    metadata,
                    ip_address: (0, generic_utils_1.getIpAddress)(payload),
                    user_agent: (0, generic_utils_1.getUserAgent)(payload),
                }, prisma.log);
                return { member };
            });
            await this.mailService.suspendMemberInOrganizationEmail({ email: member.email, name: member.name }, {
                business_name: member.business.business_name,
                status: client_1.MemberStatus.suspended,
            });
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Member deactivated successfully',
            };
        }
        catch (error) {
            (0, generic_utils_1.TransactionError)(error, this.logger);
        }
    }
    async restoreMember(payload, param) {
        const { invite_id: id } = param;
        const { sub: user_id } = payload.user;
        try {
            const { member } = await this.prisma.$transaction(async (prisma) => {
                const member = await prisma.businessContact.findFirst({
                    where: { id, business: { user_id } },
                    include: { business: true, user: true },
                });
                if (!member) {
                    throw new common_1.NotFoundException('Member not found');
                }
                if (member.status === client_1.MemberStatus.pending) {
                    throw new common_1.UnprocessableEntityException('You cannot deactivate a pending member invitation.');
                }
                if (member.status === client_1.MemberStatus.active) {
                    throw new common_1.UnprocessableEntityException('This member has already been reactivated.');
                }
                await prisma.businessContact.update({
                    where: { id },
                    data: { status: client_1.MemberStatus.active },
                });
                const metadata = `User with email ${member.email}, a member of the organization ID ${member.business_id}, has been reactivated.`;
                await this.logService.createWithTrx({
                    user_id,
                    action: client_1.Action.MANAGE_CONTACT,
                    entity: 'BusinessContact',
                    entity_id: member.id,
                    metadata,
                    ip_address: (0, generic_utils_1.getIpAddress)(payload),
                    user_agent: (0, generic_utils_1.getUserAgent)(payload),
                }, prisma.log);
                return { member };
            });
            await this.mailService.restoreMemberToOrganizationEmail({ email: member.email, name: member.name }, {
                business_name: member.business.business_name,
            });
            return {
                statusCode: common_1.HttpStatus.OK,
                message: 'Member reactivated successfully',
            };
        }
        catch (error) {
            (0, generic_utils_1.TransactionError)(error, this.logger);
        }
    }
    async autoExpireInvitations() {
        this.logger.log('Running scheduled task to expire invitations...');
        const now = moment().toDate();
        const expiredInvitations = await this.businessContactRepository.findMany({
            expires_at: { lt: now },
            status: client_1.MemberStatus.pending,
        });
        if (expiredInvitations.length === 0) {
            this.logger.log('No invitations to expire at this time.');
            return;
        }
        await this.businessContactRepository.updateMany({
            id: { in: expiredInvitations.map((invite) => invite.id) },
        }, { status: client_1.MemberStatus.expired });
        this.logger.log(`Expired ${expiredInvitations.length} invitations.`);
    }
    async getBusinessContacts(payload, param, filterDto) {
        const { business_id } = param;
        const { status } = filterDto;
        const pagination = (0, generic_utils_1.pageFilter)(filterDto);
        const filters = {
            ...(status && { status }),
            business_id,
            ...pagination.filters,
            tz: payload.timezone,
        };
        const select = {
            id: true,
            name: true,
            email: true,
            is_owner: true,
            user: {
                select: {
                    id: true,
                    role: { select: { name: true, role_id: true } },
                },
            },
            status: true,
            expires_at: true,
            created_at: true,
        };
        const [contacts, total] = await Promise.all([
            this.businessContactRepository.findManyWithPagination(filters, pagination.pagination_options, client_1.Prisma.SortOrder.desc, undefined, select),
            this.businessContactRepository.count(filters),
        ]);
        return {
            statusCode: common_1.HttpStatus.OK,
            data: contacts,
            count: total,
        };
    }
    async getBusinessCustomers(payload, filterDto) {
        try {
            const { business_id, role, q, business_contacts } = filterDto;
            const pagination_filters = (0, generic_utils_1.pageFilter)(filterDto);
            const filters = {
                AND: [
                    this.buildSearchFilter(q),
                    this.buildBusinessFilter(business_id),
                    this.buildRoleFilter(role),
                    ...(Array.isArray(pagination_filters.filters)
                        ? pagination_filters.filters
                        : [pagination_filters.filters].filter(Boolean)),
                ].filter(Boolean),
                tz: payload.timezone,
            };
            const [customers, total] = await Promise.all([
                this.userRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, this.customerSelectOptions),
                this.userRepository.count(filters),
            ]);
            const customersWithExpenses = await Promise.all(customers.map(async (customer) => {
                const totalExpenses = await this.calculateCustomerExpenses(customer.id, business_id);
                return {
                    ...customer,
                    total_expenses: totalExpenses,
                };
            }));
            return {
                statusCode: common_1.HttpStatus.OK,
                data: customersWithExpenses,
                count: total,
            };
        }
        catch (error) {
            this.logger.error('Error fetching business customers:', error);
            throw new common_1.InternalServerErrorException('Failed to fetch business customers');
        }
    }
    async fetchContacts(payload, filterDto) {
        try {
            const { business_id, role, q, business_contacts } = filterDto;
            const pagination_filters = (0, generic_utils_1.pageFilter)(filterDto);
            const filters = {
                AND: [
                    { NOT: { id: payload.user.sub } },
                    this.buildSearchFilter(q),
                    this.buildBusinessFilterII(business_id),
                    ...(Array.isArray(pagination_filters.filters)
                        ? pagination_filters.filters
                        : [pagination_filters.filters].filter(Boolean)),
                ].filter(Boolean),
                tz: payload.timezone,
            };
            const [customers, total] = await Promise.all([
                this.userRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.desc, undefined, this.contactSelectOptions),
                this.userRepository.count(filters),
            ]);
            return {
                statusCode: common_1.HttpStatus.OK,
                data: customers,
                count: total,
            };
        }
        catch (error) {
            this.logger.error('Error fetching business customers:', error);
            throw new common_1.InternalServerErrorException('Failed to fetch business customers');
        }
    }
    async fetchOrgContacts(payload, filterDto) {
        try {
            const { business_id, role, q, business_contacts } = filterDto;
            const pagination_filters = (0, generic_utils_1.pageFilter)(filterDto);
            const filters = {
                AND: [
                    this.buildSearchFilter(q),
                    this.buildBusinessFilterAdmins(business_id),
                    {
                        OR: [
                            { role: { role_id: generic_data_1.Role.BUSINESS_SUPER_ADMIN } },
                            { role: { role_id: generic_data_1.Role.BUSINESS_ADMIN } },
                        ],
                    },
                    ...(Array.isArray(pagination_filters.filters)
                        ? pagination_filters.filters
                        : [pagination_filters.filters].filter(Boolean)),
                ].filter(Boolean),
                tz: payload.timezone,
            };
            const [orgs, total] = await Promise.all([
                this.userRepository.findManyWithPagination(filters, { ...pagination_filters.pagination_options }, client_1.Prisma.SortOrder.asc, undefined, this.contactSelectOptions),
                this.userRepository.count(filters),
            ]);
            return {
                statusCode: common_1.HttpStatus.OK,
                data: orgs,
                count: total,
            };
        }
        catch (error) {
            this.logger.error('Error fetching business orgs:', error);
            throw new common_1.InternalServerErrorException('Failed to fetch business orgs');
        }
    }
    async calculateCustomerExpenses(customerId, businessId) {
        const result = await this.prisma.payment.aggregate({
            where: {
                user_id: customerId,
                payment_status: client_1.PaymentStatus.SUCCESS,
                OR: [
                    { business_id: businessId },
                    {
                        purchase: {
                            path: ['business_id'],
                            string_contains: businessId,
                        },
                    },
                    {
                        subscription_plan: {
                            business_id: businessId,
                        },
                    },
                ],
            },
            _sum: {
                amount: true,
            },
        });
        return Number(result._sum.amount || 0);
    }
    async getBusinessCustomer(payload, param) {
        try {
            const { id } = param;
            const filters = {
                id,
                tz: payload.timezone,
            };
            const customer = await this.userRepository.findOne(filters, undefined, this.customerSelectOptions);
            return {
                statusCode: common_1.HttpStatus.OK,
                data: customer,
            };
        }
        catch (error) {
            this.logger.error('Error fetching business customer details:', error);
            throw new common_1.InternalServerErrorException('Failed to fetch business customer details');
        }
    }
    async sendMessage(request, data) {
        const ip = request.headers['x-forwarded-for']?.split(',')[0] ||
            request.socket.remoteAddress ||
            request.ip;
        await this.turnstileService.validateToken(data.captcha_token, ip);
        await this.mailService.sendContactMessage(data);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Contact message sent successfully.',
        };
    }
    async subscribe(req, data) {
        const { email } = data;
        const checkContactResponse = await (0, axios_1.default)(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                'api-key': this.configService.get('BREVO_API_KEY'),
            },
        });
        if (checkContactResponse.status === 200) {
            const contactData = await checkContactResponse.data;
            if (contactData.listIds?.includes(3)) {
                return {
                    statusCode: common_1.HttpStatus.OK,
                    message: 'You are already on our newsletter!',
                };
            }
        }
        const brevoContactResponse = await fetch('https://api.brevo.com/v3/contacts', {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'api-key': this.configService.get('BREVO_API_KEY'),
            },
            body: JSON.stringify({
                email,
                attributes: {
                    FIRSTNAME: 'N/A',
                    SIGNUP_SOURCE: 'Newsletter',
                    SIGNUP_DATE: new Date().toISOString(),
                },
                listIds: [6],
                updateEnabled: true,
                emailBlacklisted: false,
                smtpBlacklistSender: [],
            }),
        });
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Newsletter subscription was successful.',
        };
    }
};
exports.ContactService = ContactService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContactService.prototype, "autoExpireInvitations", null);
exports.ContactService = ContactService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        log_service_1.LogService,
        mail_service_1.MailService,
        common_1.Logger,
        config_1.ConfigService,
        turnstile_provider_1.TurnstileService])
], ContactService);
//# sourceMappingURL=contact.service.js.map