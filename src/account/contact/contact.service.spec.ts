import { Test, TestingModule } from '@nestjs/testing';
import { ContactService } from './contact.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LogService } from '../../log/log.service';
import { MailService } from '../../notification/mail/mail.service';
import { Request } from 'express';
import {
  InviteContactDto,
  AcceptInviteDto,
  FilterInvitesDto,
} from './contact.dto';
import { QueryDto } from '../../generic/generic.dto';
import { AuthPayload } from '../../generic/generic.payload';
import {
  HttpStatus,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { MemberStatus } from '@prisma/client';

import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import { maskEmail } from '../../generic/generic.utils';
import { Role as UserRole } from '../../generic/generic.data';

describe('Contact Service', () => {
  let service: ContactService;
  let prisma: PrismaService;
  let logService: LogService;
  let mailService: MailService;
  let logger: Logger;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            businessContact: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
            businessInformation: {
              findUnique: jest.fn(),
            },
            onboardingStatus: {
              update: jest.fn(),
            },
            role: {
              findFirst: jest.fn(),
            },
            user: {
              create: jest.fn(),
            },
            log: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: LogService,
          useValue: {
            createWithTrx: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            inviteMemberEmail: jest.fn(),
            acceptedInvitationEmail: jest.fn(),
            reinviteMemberEmail: jest.fn(),
          },
        },
        {
          provide: Logger,
          useValue: {
            log: jest.fn(), // Mock the log method
          },
        },
      ],
    }).compile();

    service = module.get<ContactService>(ContactService);
    prisma = module.get<PrismaService>(PrismaService);
    logService = module.get<LogService>(LogService);
    mailService = module.get<MailService>(MailService);
    logger = module.get<Logger>(Logger); // Get the mocked Logger instance
  });

  describe('invite member', () => {
    it('should successfully invite a member', async () => {
      const req = {
        user: { sub: 'user-id' },
        headers: { 'user-agent': 'TestAgent' },
        ip: '127.0.0.1',
      } as (AuthPayload & Request) | any;
      const dto: InviteContactDto = {
        email: 'test@example.com',
        name: 'Test User',
        business_id: 'business-id',
      };

      const business = {
        id: 'business-id',
        user_id: 'user-id',
        business_name: 'Test Business',
        onboarding_status: { current_step: 2 },
      };

      const token = 'test token';
      const expires_at = moment().add(7, 'day').toDate();

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback: any) => {
          return callback({
            businessInformation: {
              findUnique: jest.fn().mockResolvedValue(business),
            },
            businessContact: {
              findFirst: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockResolvedValue({
                id: 'contact-id',
                email: dto.email,
                name: dto.name,
                business_id: dto.business_id,
                status: 'pending',
                token,
                expires_at,
              }),
            },
            onboardingStatus: {
              update: jest.fn().mockResolvedValue({}),
            },
            log: {
              create: jest.fn().mockResolvedValue({}),
            },
          });
        });

      const result = await service.inviteMember(req, dto);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Invitation to member sent successfully.');
    });

    it('should throw BadRequestException if user is already a member', async () => {
      const req = {
        user: { sub: 'user-id' },
        headers: { 'user-agent': 'TestAgent' },
        ip: '127.0.0.1',
      } as (AuthPayload & Request) | any;
      const dto: InviteContactDto = {
        email: 'test@example.com',
        name: 'Test User',
        business_id: 'business-id',
      };

      const business = {
        id: 'business-id',
        user_id: 'user-id',
        business_name: 'Test Business',
        onboarding_status: { current_step: 2 },
      };

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback: any) => {
          return callback({
            businessInformation: {
              findUnique: jest.fn().mockResolvedValue(business),
            },
            businessContact: {
              findFirst: jest.fn().mockResolvedValue({
                id: 'contact-id',
                email: dto.email,
                name: dto.name,
                business_id: dto.business_id,
                status: MemberStatus.active,
              }),
            },
          });
        });

      await expect(service.inviteMember(req, dto)).rejects.toThrow(
        new BadRequestException('User is already a member'),
      );
    });
  });

  describe('accept invite', () => {
    it('should successfully accept an invitation', async () => {
      const req = {
        headers: { 'user-agent': 'TestAgent' },
        ip: '127.0.0.1',
      } as Request | any;
      const dto: AcceptInviteDto = {
        token: 'valid-token',
        name: 'Test User',
        password: 'password',
      };

      const invitation = {
        id: 'invitation-id',
        email: 'test@example.com',
        business_id: 'business-id',
        status: MemberStatus.pending,
        expires_at: moment().add(1, 'day').toDate(),
        business: {
          id: 'business-id',
          business_name: 'Test Business',
          user: {
            id: 'user-id',
            email: 'owner@example.com',
          },
        },
      };

      const role = {
        id: 'role-id',
        role_id: UserRole.BUSINESS_ADMIN,
      };

      const member = {
        id: 'user-id',
        name: dto.name,
        email: invitation.email,
        password_hash: await bcrypt.hash(dto.password, 10),
        role_identity: role.id,
        is_email_verified: true,
      };

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback: any) => {
          return callback({
            businessContact: {
              findFirst: jest.fn().mockResolvedValue(invitation),
              update: jest.fn().mockResolvedValue({}),
            },
            role: {
              findFirst: jest.fn().mockResolvedValue(role),
            },
            user: {
              create: jest.fn().mockResolvedValue(member),
            },
            log: {
              create: jest.fn().mockResolvedValue({}),
            },
          });
        });

      const result = await service.acceptInvite(req, dto);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Invitation accepted successfully.');
      expect(mailService.acceptedInvitationEmail).toHaveBeenCalledWith(
        invitation.business.user,
        invitation.business.business_name,
        expect.any(String),
        maskEmail(invitation.email),
      );
    });

    it('should throw NotFoundException if invitation token is invalid', async () => {
      const req = {
        headers: { 'user-agent': 'TestAgent' },
        ip: '127.0.0.1',
      } as Request | any;
      const dto: AcceptInviteDto = {
        token: 'invalid-token',
        name: 'Test User',
        password: 'password',
      };

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback: any) => {
          return callback({
            businessContact: {
              findFirst: jest.fn().mockResolvedValue(null),
            },
          });
        });

      await expect(service.acceptInvite(req, dto)).rejects.toThrow(
        new NotFoundException('Invalid invitation token'),
      );
    });
  });

  describe('get invites', () => {
    it('should return a list of filtered invites', async () => {
      const auth = { user: { sub: 'user-id' } } as AuthPayload;
      const param = { business_id: 'business-id' };
      const filterInvitesDto: FilterInvitesDto & QueryDto = {
        status: MemberStatus.pending,
        pagination: { page: 1, limit: 10 },
      };

      const invitations = [
        {
          id: 'invitation-id',
          name: 'Test User',
          user: { email: 'test@example.com', id: 'user-id' },
          token: 'token',
          status: MemberStatus.pending,
          expires_at: moment().add(1, 'day').toDate(),
          created_at: new Date(),
        },
      ] as any;

      jest
        .spyOn(service['businessContactRepository'], 'findManyWithPagination')
        .mockResolvedValue(invitations);
      jest
        .spyOn(service['businessContactRepository'], 'count')
        .mockResolvedValue(1);

      const result = await service.getInvites(auth, param, filterInvitesDto);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data).toEqual(invitations);
      expect(result.count).toBe(1);
    });
  });

  describe('Reinvite member', () => {
    it('should successfully re-invite a member', async () => {
      const req = {
        user: { sub: 'user-id' },
        headers: { 'user-agent': 'TestAgent' },
        ip: '127.0.0.1',
      } as (AuthPayload & Request) | any;
      const param = { invite_id: 'invite-id' };

      const existingInvite = {
        id: 'invite-id',
        email: 'test@example.com',
        business_id: 'business-id',
        status: MemberStatus.pending,
        expires_at: moment().add(1, 'day').toDate(),
        token: uuidv4(),
        business: {
          id: 'business-id',
          business_name: 'Test Business',
        },
      };

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback: any) => {
          return callback({
            businessContact: {
              findFirst: jest.fn().mockResolvedValue(existingInvite),
              update: jest.fn().mockResolvedValue({}),
            },
            log: {
              create: jest.fn().mockResolvedValue({}),
            },
          });
        });

      const result = await service.reinviteMember(req, param);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Re-invitation to member sent successfully.');
      expect(mailService.reinviteMemberEmail).toHaveBeenCalledWith(
        existingInvite.email,
        existingInvite.business.business_name,
        'a member',
        expect.any(String),
        existingInvite.token,
      );
    });

    it('should throw NotFoundException if invitation not found', async () => {
      const req = {
        user: { sub: 'user-id' },
        headers: { 'user-agent': 'TestAgent' },
        ip: '127.0.0.1',
      } as (AuthPayload & Request) | any;
      const param = { invite_id: 'invalid-invite-id' };

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback: any) => {
          return callback({
            businessContact: {
              findFirst: jest.fn().mockResolvedValue(null),
            },
          });
        });

      await expect(service.reinviteMember(req, param)).rejects.toThrow(
        new NotFoundException('Invitation not found.'),
      );
    });
  });

  describe('Autoexpire invitations', () => {
    it('should expire pending invitations', async () => {
      const expiredInvitations = [
        {
          id: 'invitation-id',
          email: 'test@example.com',
          business_id: 'business-id',
          status: MemberStatus.pending,
          expires_at: moment().subtract(1, 'day').toDate(),
        },
      ] as any;

      jest
        .spyOn(service['businessContactRepository'], 'findMany')
        .mockResolvedValue(expiredInvitations);
      jest
        .spyOn(service['businessContactRepository'], 'updateMany')
        .mockResolvedValue({ count: 1 } as any);

      await service.autoExpireInvitations();

      expect(
        service['businessContactRepository'].updateMany,
      ).toHaveBeenCalledWith(
        {
          id: { in: expiredInvitations.map((invite) => invite.id) },
        },
        { status: MemberStatus.expired },
      );
    });

    it('should log if no invitations to expire', async () => {
      jest
        .spyOn(service['businessContactRepository'], 'findMany')
        .mockResolvedValue([]);

      await service.autoExpireInvitations();

      // Ensure the logger.log method was called with the expected message
      expect(logger.log).toHaveBeenCalledWith(
        'No invitations to expire at this time.',
      );
    });
  });
});
