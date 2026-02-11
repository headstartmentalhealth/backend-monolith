import {
  Action,
  BusinessContact,
  MemberStatus,
  Prisma,
  User,
  PaymentStatus,
} from '@prisma/client';
import { LogService } from '../../log/log.service';
import { MailService } from '../../notification/mail/mail.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaBaseRepository } from '../../prisma/prisma.base.repository';
import {
  AcceptInviteDto,
  FilterContactsDto,
  FilterInvitesDto,
  FilterUserDto,
  InviteContactDto,
  NewsletterSubscriptionDto,
  SendMessageDto,
} from './contact.dto';
import {
  AuthPayload,
  GenericDataPayload,
  GenericPayload,
  GenericPayloadAlias,
  PagePayload,
} from '../../generic/generic.payload';
import {
  getIpAddress,
  getRemainingDays,
  getUserAgent,
  isExpired,
  maskEmail,
  pageFilter,
  TransactionError,
  verifyBusiness,
} from '../../generic/generic.utils';
import { Role } from '../../generic/generic.data';
import * as moment from 'moment';
import { IdDto, QueryDto, TZ } from '../../generic/generic.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { update } from 'lodash';
import { ContactDto, TokenDto } from './contact.payload';
import { ConfigService } from '@nestjs/config';
import { TurnstileService } from '../auth/providers/cloudflare/turnstile.provider';
import axios from 'axios';

interface CustomerSelectOptions {
  id: boolean;
  name: boolean;
  email: boolean;
  phone: boolean;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  payments: {
    select: {
      id: boolean;
      purchase: boolean;
      currency: boolean;
      created_at: boolean;
      amount: boolean;
      discount_applied: boolean;
      payment_status: boolean;
      purchase_type: boolean;
      interval: boolean;
      auto_renew: boolean;
      is_renewal: boolean;
      is_upgrade: boolean;
      subscription_plan: boolean;
      payment_method: boolean;
    };
  };
  business_contacts: {
    take: number;
    select: {
      id: boolean;
      business_id: boolean;
      is_owner: boolean;
      joined_at: boolean;
      joined_via: boolean;
      status: boolean;
      role: boolean;
      created_at: boolean;
      business: {
        select: {
          id: boolean;
          business_name: boolean;
        };
      };
    };
  };
  created_at: boolean;
  updated_at: boolean;
  role: boolean;
  profile: boolean;
}

@Injectable()
export class ContactService {
  private readonly businessContactRepository: PrismaBaseRepository<
    BusinessContact,
    Prisma.BusinessContactCreateInput,
    Prisma.BusinessContactUpdateInput,
    Prisma.BusinessContactWhereUniqueInput,
    Prisma.BusinessContactWhereInput | Prisma.BusinessContactFindFirstArgs,
    Prisma.BusinessContactUpsertArgs
  >;
  private readonly userRepository: PrismaBaseRepository<
    User,
    Prisma.UserCreateInput,
    Prisma.UserUpdateInput,
    Prisma.UserWhereUniqueInput,
    Prisma.UserWhereInput | Prisma.UserFindFirstArgs,
    Prisma.UserUpsertArgs
  >;

  private readonly customerSelectOptions: Prisma.UserSelect = {
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
      // take: 1,
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

  private readonly contactSelectOptions: Prisma.UserSelect = {
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

  constructor(
    private readonly prisma: PrismaService,
    private readonly logService: LogService, // Inject the LogService
    private readonly mailService: MailService, //  Inject the MailService){}
    private readonly logger: Logger, // Inject the Logger
    private readonly configService: ConfigService,
    private readonly turnstileService: TurnstileService,
  ) {
    this.businessContactRepository = new PrismaBaseRepository<
      BusinessContact,
      Prisma.BusinessContactCreateInput,
      Prisma.BusinessContactUpdateInput,
      Prisma.BusinessContactWhereUniqueInput,
      Prisma.BusinessContactWhereInput | Prisma.BusinessContactFindFirstArgs,
      Prisma.BusinessContactUpsertArgs
    >('businessContact', prisma);
    this.userRepository = new PrismaBaseRepository<
      User,
      Prisma.UserCreateInput,
      Prisma.UserUpdateInput,
      Prisma.UserWhereUniqueInput,
      Prisma.UserWhereInput | Prisma.UserFindFirstArgs,
      Prisma.UserUpsertArgs
    >('user', prisma);
  }

  private buildSearchFilter(searchQuery: string): Prisma.UserWhereInput {
    if (!searchQuery) return {};

    return {
      OR: [
        { id: { contains: searchQuery, mode: 'insensitive' } },
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
      ],
    };
  }

  private buildBusinessFilter(businessId: string): Prisma.UserWhereInput {
    if (!businessId) return {};

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
              payment_status: PaymentStatus.SUCCESS,
            },
          },
        },
        {
          business_contacts: {
            some: {
              business_id: businessId,
              status: 'active',
              role: Role.USER,
            },
          },
        },
      ],
    };
  }

  private buildBusinessFilterII(businessId: string): Prisma.UserWhereInput {
    if (!businessId) return {};

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
              payment_status: PaymentStatus.SUCCESS,
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

  private buildBusinessFilterAdmins(businessId: string): Prisma.UserWhereInput {
    if (!businessId) return {};

    return {
      OR: [
        {
          business_contacts: {
            some: {
              business_id: businessId,
              status: 'active',
              role: Role.BUSINESS_SUPER_ADMIN,
            },
          },
        },
        {
          business_contacts: {
            some: {
              business_id: businessId,
              status: 'active',
              role: Role.BUSINESS_ADMIN,
            },
          },
        },
      ],
    };
  }

  private buildRoleFilter(roleId: string): Prisma.UserWhereInput {
    if (!roleId) return {};

    return {
      role: { role_id: roleId },
    };
  }

  private buildBusinessContactsFilter(
    businessId: string,
  ): Prisma.UserWhereInput {
    if (!businessId) return {};

    return {
      business_contacts: {
        some: {
          business_id: businessId,
          status: 'active',
          role: Role.USER,
        },
      },
    };
  }

  /**
   * Invite a member
   * @param req
   * @param dto
   * @returns
   */
  async inviteMember(
    req: AuthPayload & Request,
    dto: InviteContactDto,
  ): Promise<GenericPayload> {
    const { email, name, business_id } = dto;
    const auth = req.user;

    try {
      const { business, role, token } = await this.prisma.$transaction(
        async (prisma) => {
          // Check for business' existence with business_id and owner's id
          const business = await prisma.businessInformation.findUnique({
            where: { user_id: auth.sub, id: business_id },
            include: { onboarding_status: true },
          });

          // Verify business - return error if not found
          verifyBusiness(business);

          // Add owner to business contact if non-existent
          await this.addBusinessOwner(auth, business_id);

          // Generate a unique token and expiry date
          const token = uuidv4();
          const expires_at = moment().add(7, 'day').toDate(); // Token expires in 7 days

          // Check if the user is already invited
          const existingInvite = await prisma.businessContact.findFirst({
            where: { business_id, email },
          });

          if (existingInvite) {
            if (existingInvite?.status === MemberStatus.active) {
              throw new BadRequestException('User is already a member');
            } else {
              throw new BadRequestException(
                'An invitation has already been sent to this email',
              );
            }
          }

          // Check if user has once registered with the email on the platform
          const user = await prisma.user.findFirst({ where: { email } });

          // Disallow any already registered user
          if (user) {
            throw new BadRequestException(
              'Email has already been registered on the platform.',
            );
          }

          // Create BusinessContact entry
          const businessContact = await prisma.businessContact.create({
            data: {
              email,
              ...(user && { user_id: user.id }),
              ...(user ? { name: user.name } : { name }),
              business_id,
              status: MemberStatus.pending,
              token,
              expires_at,
            },
          });

          // **Upgrade onboarding status to Step 4 - if not done yet **
          if (business.onboarding_status.current_step < 4) {
            await prisma.onboardingStatus.update({
              where: { business_id },
              data: {
                current_step: 4,
              },
            });
          }

          const role = businessContact.is_owner ? 'an owner' : 'a member';

          // Generate metadata as a sentence
          const metadata = `User with email ${email} was invited to join business ID ${business_id} as ${role}.`;

          // Create log
          await this.logService.createWithTrx(
            {
              user_id: auth.sub,
              action: Action.CONTACT_INVITATION,
              entity: 'BusinessContact',
              entity_id: businessContact.id,
              metadata,
              ip_address: getIpAddress(req),
              user_agent: getUserAgent(req),
            },
            prisma.log,
          );

          return {
            business,
            role,
            token,
          };
        },
      );

      // Send invitation email - if business contact record was successfully created
      await this.mailService.inviteMemberEmail(
        email,
        business.business_name,
        role,
        '7 days',
        token,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Invitation to member sent successfully.',
      };
    } catch (error) {
      TransactionError(error, this.logger);
    }
  }

  /**
   * Accept invite
   * @param req
   * @param acceptInviteDto
   * @returns
   */
  async acceptInvite(
    req: Request,
    acceptInviteDto: AcceptInviteDto,
  ): Promise<GenericPayload> {
    const { token, name, password } = acceptInviteDto;

    try {
      const { invitation, joined_date } = await this.prisma.$transaction(
        async (prisma) => {
          // 1. Find invitation by token
          const invitation = await prisma.businessContact.findFirst({
            where: { token },
            include: { business: { include: { user: true } }, user: true },
          });

          // 2. Check the validity of the invitation token
          if (!invitation) {
            throw new NotFoundException('Invalid invitation token');
          }

          // 3. Check if invitation token is expired
          if (invitation.expires_at && invitation.expires_at < new Date()) {
            throw new BadRequestException('Invitation has expired');
          }

          // 4. Check if invitation has already been accepted
          if (invitation.status === MemberStatus.active) {
            throw new ConflictException(
              'Invitation has already been accepted.',
            );
          }

          // Fetch ID for the Business Admin Role
          const role = await prisma.role.findFirst({
            where: { role_id: Role.BUSINESS_ADMIN },
          });

          // If invitee already has an account 👇🏽
          let member = invitation.user;

          // If not, create account
          if (!invitation.user) {
            // Ensure is password and name is passed
            if (!name || !password) {
              throw new UnprocessableEntityException(
                'Your name and password must be provided.',
              );
            }

            // Create account
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

          // Update member status to active
          await prisma.businessContact.update({
            where: { id: invitation.id },
            data: {
              ...(!invitation.user && { user_id: member.id }),
              ...(!invitation.user && { name: member.name }),
              status: MemberStatus.active,
              token: null,
              expires_at: null,
              joined_at,
            },
          });

          // Generate metadata as a sentence
          const metadata = `User with email ${invitation.email} has accepted the invitation from business ID ${invitation.business.id}.`;

          // Create log for the acceptance action
          await this.logService.createWithTrx(
            {
              user_id: member.id,
              action: Action.CONTACT_INVITATION,
              entity: 'BusinessContact',
              entity_id: invitation.id,
              metadata,
              ip_address: getIpAddress(req),
              user_agent: getUserAgent(req),
            },
            prisma.log,
          );

          const joined_date = moment(joined_at).format('LLL');

          return { invitation, joined_date };
        },
      );

      // Send Invitation acceptance email if log is created
      await this.mailService.acceptedInvitationEmail(
        invitation.business.user,
        invitation.business.business_name,
        joined_date,
        maskEmail(invitation.email),
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Invitation accepted successfully.',
      };
    } catch (error) {
      TransactionError(error, this.logger);
    }
  }

  /**
   * Add business owner (Review this method implementation again)
   * @param authPayload
   * @param args
   */
  private async addBusinessOwner(
    user: AuthPayload['user'],
    businessId: string,
  ): Promise<void> {
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
          status: MemberStatus.active,
          is_owner: true,
        },
      });
    }
  }

  /**
   * Get all/filtered invites
   * @param auth
   * @param param
   * @param filterInvitesDto
   * @returns
   */
  async getInvites(
    payload: AuthPayload,
    param: { business_id: string },
    filterDto: FilterInvitesDto & QueryDto,
  ): Promise<PagePayload<BusinessContact>> {
    const { business_id } = param;
    const { sub: user_id } = payload.user;
    const { status, role } = filterDto;

    const pagination = pageFilter(filterDto);

    const filters: Prisma.BusinessContactWhereInput & TZ = {
      ...(status && { status }),
      ...(role && { role }),
      business_id,
      business: { user_id },
      ...pagination.filters,
      tz: payload.timezone,
    };

    const select: Prisma.BusinessContactSelect = {
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
      this.businessContactRepository.findManyWithPagination(
        filters,
        pagination.pagination_options,
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.businessContactRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: invitations,
      count: total,
    };
  }

  /**
   * Get a single invite by token
   * @param param
   * @returns
   */
  async getInviteByToken(
    param: TokenDto,
  ): Promise<GenericDataPayload<BusinessContact>> {
    const { token } = param;

    const select: Prisma.BusinessContactSelect = {
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

    const invite = await this.businessContactRepository.findOne(
      {
        token,
      },
      null,
      select,
    );

    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    return {
      statusCode: HttpStatus.OK,
      data: invite,
    };
  }

  /**
   * Re-invite member
   * @param req
   * @param param
   * @returns
   */
  async reinviteMember(
    req: AuthPayload & Request,
    param: ContactDto,
  ): Promise<GenericPayload> {
    const auth = req.user;
    const { invite_id } = param;

    try {
      const { existingInvite, role, token, days_to_expiry } =
        await this.prisma.$transaction(async (prisma) => {
          // Get existing invite
          const existingInvite = await prisma.businessContact.findFirst({
            where: { id: invite_id, business: { user_id: auth.sub } },
            include: { business: true },
          });

          // Check if invitation ID is valid (with user_id)
          if (!existingInvite) {
            throw new NotFoundException('Invitation not found.');
          }

          // Check if the user is already a member
          if (existingInvite.status === MemberStatus.active) {
            throw new ConflictException(
              'Invitee is already a member with an active status.',
            );
          }

          // Define variables for generating new token and expiry date
          let token: string;
          let expires_at: Date; // Token expires in 7 days

          let days_to_expiry: string;
          // Check if invitation token is expired
          if (
            existingInvite.expires_at &&
            isExpired(existingInvite.expires_at)
          ) {
            token = uuidv4();
            expires_at = moment().add(7, 'day').toDate(); // Token expires in 7 days

            // Save new token and expiry date
            await prisma.businessContact.update({
              where: { id: existingInvite.id },
              data: {
                token,
                expires_at,
              },
            });
          } else {
            // Get remaining days
            const remaining_days = getRemainingDays(existingInvite.expires_at);
            days_to_expiry = `${remaining_days} days`;
          }

          const role = existingInvite.is_owner ? 'an owner' : 'a member';

          // Generate metadata as a sentence
          const metadata = `User with email ${existingInvite.email} was reinvited to join business ID ${existingInvite.business_id} as ${role}.`;

          // Create log
          await this.logService.createWithTrx(
            {
              user_id: auth.sub,
              action: Action.CONTACT_INVITATION,
              entity: 'BusinessContact',
              entity_id: existingInvite.id,
              metadata,
              ip_address: getIpAddress(req),
              user_agent: getUserAgent(req),
            },
            prisma.log,
          );

          return { existingInvite, role, token, days_to_expiry };
        });

      await this.mailService.reinviteMemberEmail(
        existingInvite.email,
        existingInvite.business.business_name,
        role,
        isExpired(existingInvite.expires_at) ? '7 days' : days_to_expiry,
        isExpired(existingInvite.expires_at) ? token : existingInvite.token,
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Re-invitation to member sent successfully.',
      };
    } catch (error) {
      TransactionError(error, this.logger);
    }
  }

  /**
   * Soft-delete a member from a business
   * @param payload
   * @param param
   */
  async removeMember(
    payload: AuthPayload & Request,
    param: ContactDto,
  ): Promise<GenericPayload> {
    const { invite_id: id } = param;
    const { sub: user_id } = payload.user;

    try {
      const { member } = await this.prisma.$transaction(async (prisma) => {
        // Ensure the member exists and belongs to the user's business
        const member = await prisma.businessContact.findFirst({
          where: { id, business: { user_id } },
          include: { business: true, user: true },
        });

        if (!member) {
          throw new NotFoundException('Member not found');
        }

        await prisma.businessContact.delete({
          where: { id },
        });

        // Generate metadata as a sentence
        const metadata = `User with email ${member.email} has been removed from the organization ID ${member.business_id}.`;

        // Create log
        await this.logService.createWithTrx(
          {
            user_id,
            action: Action.MANAGE_CONTACT,
            entity: 'BusinessContact',
            entity_id: member.id,
            metadata,
            ip_address: getIpAddress(payload),
            user_agent: getUserAgent(payload),
          },
          prisma.log,
        );

        return { member };
      });

      // Remove member from organization email
      await this.mailService.removeMemberFromOrganizationEmail(
        { email: member.email, name: member.name } as User,
        {
          business_name: member.business.business_name,
          position: member.is_owner ? 'an admin' : 'a member',
        },
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Member removed successfully',
      };
    } catch (error) {
      TransactionError(error, this.logger);
    }
  }

  /**
   * Deactivate a business member by setting status to "suspended"
   * @param payload
   * @param param
   */
  async deactivateMember(
    payload: AuthPayload & Request,
    param: ContactDto,
  ): Promise<GenericPayload> {
    const { invite_id: id } = param;
    const { sub: user_id } = payload.user;

    try {
      const { member } = await this.prisma.$transaction(async (prisma) => {
        // Ensure the member exists and belongs to the user's business
        const member = await prisma.businessContact.findFirst({
          where: { id, business: { user_id } },
          include: { business: true, user: true },
        });

        if (!member) {
          throw new NotFoundException('Member not found');
        }

        if (member.status === MemberStatus.pending) {
          throw new UnprocessableEntityException(
            'You cannot deactivate a pending member invitation.',
          );
        }

        if (member.status === MemberStatus.suspended) {
          throw new UnprocessableEntityException(
            'This member has already been suspended.',
          );
        }

        await prisma.businessContact.update({
          where: { id },
          data: { status: MemberStatus.suspended },
        });

        // Generate metadata as a sentence
        const metadata = `User with email ${member.email}, a member of the organization ID ${member.business_id}, has been ${MemberStatus.suspended}.`;

        // Create log
        await this.logService.createWithTrx(
          {
            user_id,
            action: Action.MANAGE_CONTACT,
            entity: 'BusinessContact',
            entity_id: member.id,
            metadata,
            ip_address: getIpAddress(payload),
            user_agent: getUserAgent(payload),
          },
          prisma.log,
        );

        return { member };
      });

      // deactivate member from organization email
      await this.mailService.suspendMemberInOrganizationEmail(
        { email: member.email, name: member.name } as User,
        {
          business_name: member.business.business_name,
          status: MemberStatus.suspended,
        },
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Member deactivated successfully',
      };
    } catch (error) {
      TransactionError(error, this.logger);
    }
  }

  /**
   * Restore business member by setting status back to "active"
   * @param payload
   * @param param
   */
  async restoreMember(
    payload: AuthPayload & Request,
    param: ContactDto,
  ): Promise<GenericPayload> {
    const { invite_id: id } = param;
    const { sub: user_id } = payload.user;

    try {
      const { member } = await this.prisma.$transaction(async (prisma) => {
        // Ensure the member exists and belongs to the user's business
        const member = await prisma.businessContact.findFirst({
          where: { id, business: { user_id } },
          include: { business: true, user: true },
        });

        if (!member) {
          throw new NotFoundException('Member not found');
        }

        if (member.status === MemberStatus.pending) {
          throw new UnprocessableEntityException(
            'You cannot deactivate a pending member invitation.',
          );
        }

        if (member.status === MemberStatus.active) {
          throw new UnprocessableEntityException(
            'This member has already been reactivated.',
          );
        }

        await prisma.businessContact.update({
          where: { id },
          data: { status: MemberStatus.active },
        });

        // Generate metadata as a sentence
        const metadata = `User with email ${member.email}, a member of the organization ID ${member.business_id}, has been reactivated.`;

        // Create log
        await this.logService.createWithTrx(
          {
            user_id,
            action: Action.MANAGE_CONTACT,
            entity: 'BusinessContact',
            entity_id: member.id,
            metadata,
            ip_address: getIpAddress(payload),
            user_agent: getUserAgent(payload),
          },
          prisma.log,
        );

        return { member };
      });

      // restore member from organization email
      await this.mailService.restoreMemberToOrganizationEmail(
        { email: member.email, name: member.name } as User,
        {
          business_name: member.business.business_name,
        },
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Member reactivated successfully',
      };
    } catch (error) {
      TransactionError(error, this.logger);
    }
  }

  /**
   * Scheduled job to run every hour
   * @returns
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoExpireInvitations() {
    this.logger.log('Running scheduled task to expire invitations...');

    const now = moment().toDate();

    // Find invitations that are past their expiry date and still pending
    const expiredInvitations = await this.businessContactRepository.findMany({
      expires_at: { lt: now },
      status: MemberStatus.pending,
    });

    if (expiredInvitations.length === 0) {
      this.logger.log('No invitations to expire at this time.');
      return;
    }

    // Bulk update expired invitations
    await this.businessContactRepository.updateMany(
      {
        id: { in: expiredInvitations.map((invite) => invite.id) },
      },
      { status: MemberStatus.expired },
    );

    this.logger.log(`Expired ${expiredInvitations.length} invitations.`);
  }

  /**
   * Get all/filtered invites - admin
   * @param auth
   * @param param
   * @param filterInvitesDto
   * @returns
   */
  async getBusinessContacts(
    payload: AuthPayload,
    param: { business_id: string },
    filterDto: FilterInvitesDto & QueryDto,
  ): Promise<PagePayload<BusinessContact>> {
    const { business_id } = param;
    const { status } = filterDto;

    const pagination = pageFilter(filterDto);

    const filters: Prisma.BusinessContactWhereInput & TZ = {
      ...(status && { status }),
      business_id,
      ...pagination.filters,
      tz: payload.timezone,
    };

    const select: Prisma.BusinessContactSelect = {
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
      this.businessContactRepository.findManyWithPagination(
        filters,
        pagination.pagination_options,
        Prisma.SortOrder.desc,
        undefined,
        select,
      ),
      this.businessContactRepository.count(filters),
    ]);

    return {
      statusCode: HttpStatus.OK,
      data: contacts,
      count: total,
    };
  }

  /**
   * Get all business customers - admin & business owner
   * @param auth
   * @param param
   * @param filterInvitesDto
   * @returns
   */
  async getBusinessCustomers(
    payload: AuthPayload,
    filterDto: FilterUserDto,
  ): Promise<PagePayload<User & { total_expenses?: number }>> {
    try {
      const { business_id, role, q, business_contacts } = filterDto;
      const pagination_filters = pageFilter(filterDto);

      // Build filters
      const filters: Prisma.UserWhereInput & TZ = {
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

      // Execute queries in parallel
      const [customers, total] = await Promise.all([
        this.userRepository.findManyWithPagination(
          filters,
          { ...pagination_filters.pagination_options },
          Prisma.SortOrder.desc,
          undefined,
          this.customerSelectOptions,
        ),
        this.userRepository.count(filters),
      ]);

      // Calculate total expenses for each customer
      const customersWithExpenses = await Promise.all(
        customers.map(async (customer) => {
          const totalExpenses = await this.calculateCustomerExpenses(
            customer.id,
            business_id,
          );
          return {
            ...customer,
            total_expenses: totalExpenses,
          };
        }),
      );

      return {
        statusCode: HttpStatus.OK,
        data: customersWithExpenses,
        count: total,
      };
    } catch (error) {
      this.logger.error('Error fetching business customers:', error);
      throw new InternalServerErrorException(
        'Failed to fetch business customers',
      );
    }
  }

  /**
   * Get all business contacts - admin & business owner
   * @param auth
   * @param param
   * @param filterInvitesDto
   * @returns
   */
  async fetchContacts(
    payload: AuthPayload,
    filterDto: FilterContactsDto,
  ): Promise<PagePayload<User>> {
    try {
      const { business_id, role, q, business_contacts } = filterDto;
      const pagination_filters = pageFilter(filterDto);

      // Build filters
      const filters: Prisma.UserWhereInput & TZ = {
        AND: [
          { NOT: { id: payload.user.sub } },
          this.buildSearchFilter(q),
          this.buildBusinessFilterII(business_id),
          // this.buildRoleFilter(role),
          ...(Array.isArray(pagination_filters.filters)
            ? pagination_filters.filters
            : [pagination_filters.filters].filter(Boolean)),
        ].filter(Boolean),
        tz: payload.timezone,
      };

      // Execute queries in parallel
      const [customers, total] = await Promise.all([
        this.userRepository.findManyWithPagination(
          filters,
          { ...pagination_filters.pagination_options },
          Prisma.SortOrder.desc,
          undefined,
          this.contactSelectOptions,
        ),
        this.userRepository.count(filters),
      ]);

      return {
        statusCode: HttpStatus.OK,
        data: customers,
        count: total,
      };
    } catch (error) {
      this.logger.error('Error fetching business customers:', error);
      throw new InternalServerErrorException(
        'Failed to fetch business customers',
      );
    }
  }

  /**
   * Get all org contacts
   * @param payload
   * @param filterDto
   * @returns
   */
  async fetchOrgContacts(
    payload: AuthPayload,
    filterDto: FilterContactsDto,
  ): Promise<PagePayload<User>> {
    try {
      const { business_id, role, q, business_contacts } = filterDto;
      const pagination_filters = pageFilter(filterDto);

      // Build filters
      const filters: Prisma.UserWhereInput & TZ = {
        AND: [
          this.buildSearchFilter(q),
          this.buildBusinessFilterAdmins(business_id),
          {
            OR: [
              { role: { role_id: Role.BUSINESS_SUPER_ADMIN } },
              { role: { role_id: Role.BUSINESS_ADMIN } },
            ],
          },
          ...(Array.isArray(pagination_filters.filters)
            ? pagination_filters.filters
            : [pagination_filters.filters].filter(Boolean)),
        ].filter(Boolean),
        tz: payload.timezone,
      };

      // Execute queries in parallel
      const [orgs, total] = await Promise.all([
        this.userRepository.findManyWithPagination(
          filters,
          { ...pagination_filters.pagination_options },
          Prisma.SortOrder.asc,
          undefined,
          this.contactSelectOptions,
        ),
        this.userRepository.count(filters),
      ]);

      return {
        statusCode: HttpStatus.OK,
        data: orgs,
        count: total,
      };
    } catch (error) {
      this.logger.error('Error fetching business orgs:', error);
      throw new InternalServerErrorException('Failed to fetch business orgs');
    }
  }

  /**
   * Calculate total expenses for a customer within a specific business
   * @param customerId
   * @param businessId
   * @returns Total expenses amount
   */
  private async calculateCustomerExpenses(
    customerId: string,
    businessId: string,
  ): Promise<number> {
    const result = await this.prisma.payment.aggregate({
      where: {
        user_id: customerId,
        payment_status: PaymentStatus.SUCCESS,
        OR: [
          // Payments for products from this business
          {
            purchase: {
              path: ['business_id'],
              string_contains: businessId,
            },
          },
          // Payments for subscription plans from this business
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

  /**
   * Get single business customer - admin & business owner
   * @param auth
   * @param param
   * @returns
   */
  async getBusinessCustomer(
    payload: AuthPayload,
    param: IdDto,
  ): Promise<GenericDataPayload<User>> {
    try {
      const { id } = param;

      // Build filters
      const filters: Prisma.UserWhereInput & TZ = {
        id,
        tz: payload.timezone,
      };

      // Execute queries in parallel
      const customer = await this.userRepository.findOne(
        filters,
        undefined,
        this.customerSelectOptions,
      );

      return {
        statusCode: HttpStatus.OK,
        data: customer,
      };
    } catch (error) {
      this.logger.error('Error fetching business customer details:', error);
      throw new InternalServerErrorException(
        'Failed to fetch business customer details',
      );
    }
  }

  /**
   * Send contact message
   * @param data
   * @returns
   */
  async sendMessage(
    request: Request | any,
    data: SendMessageDto,
  ): Promise<GenericPayload> {
    // Get client IP (supporting proxies/load balancers)
    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      request.socket.remoteAddress ||
      request.ip;

    // Validate Turnstile
    await this.turnstileService.validateToken(data.captcha_token, ip);

    await this.mailService.sendContactMessage(data);

    return {
      statusCode: HttpStatus.OK,
      message: 'Contact message sent successfully.',
    };
  }

  /**
   *
   * @param data
   * @returns
   */
  async subscribe(
    req: Request,
    data: NewsletterSubscriptionDto,
  ): Promise<GenericPayload> {
    const { email } = data;

    // First check if contact already exists
    const checkContactResponse = await axios(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          'api-key': this.configService.get<string>('BREVO_API_KEY'),
        },
      },
    );

    // If contact exists (status 200), return without sending email
    if (checkContactResponse.status === 200) {
      const contactData = await checkContactResponse.data;
      if (contactData.listIds?.includes(3)) {
        // Your list ID
        return {
          statusCode: HttpStatus.OK,
          message: 'You are already on our newsletter!',
        };
      }
    }

    // Create/update contact
    const brevoContactResponse = await fetch(
      'https://api.brevo.com/v3/contacts',
      {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': this.configService.get<string>('BREVO_API_KEY'),
        },
        body: JSON.stringify({
          email,
          attributes: {
            FIRSTNAME: 'N/A',
            SIGNUP_SOURCE: 'Newsletter',
            // SIGNUP_IP: req.headers.get('x-forwarded-for') || '',
            SIGNUP_DATE: new Date().toISOString(),
          },
          listIds: [6], // your Brevo list ID
          updateEnabled: true,
          emailBlacklisted: false,
          smtpBlacklistSender: [],
        }),
      },
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Newsletter subscription was successful.',
    };
  }
}
