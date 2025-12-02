import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { OnboardService } from './onboard.service';
import { LogService } from '../../log/log.service';
import {
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { SaveBusinessInfoDto, UpsertWithdrawalAccountDto } from './onboard.dto';
import { DEFAULT_CURRENCY } from '../../generic/generic.data';
import { BusinessInformation, Prisma } from '@prisma/client';
import { PaystackService } from '../../generic/providers/paystack/paystack.provider';

describe('Onboard Service', () => {
  let service: OnboardService;
  let prisma: PrismaService;
  let logService: LogService;
  let paystackService: PaystackService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardService,
        {
          provide: PrismaService,
          useValue: {
            businessInformation: {
              findUnique: jest.fn(),
              upsert: jest.fn(),
              findMany: jest.fn(),
            },
            withdrawalAccount: {
              create: jest.fn(),
              update: jest.fn(),
              findUnique: jest.fn(),
            },
            businessWallet: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            onboardingStatus: {
              upsert: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(prisma)),
          },
        },
        {
          provide: LogService,
          useValue: {
            createWithTrx: jest.fn(),
          },
        },
        {
          provide: PaystackService,
          useValue: {
            resolveAccountNumber: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OnboardService>(OnboardService);
    prisma = module.get<PrismaService>(PrismaService);
    logService = module.get<LogService>(LogService);
    paystackService = module.get<PaystackService>(PaystackService);
  });

  describe('Save business information', () => {
    it('should save business information successfully', async () => {
      const mockAuthPayload = { user: { sub: 'user-123' } };
      const mockRequest = {
        user: mockAuthPayload.user,
        headers: { 'user-agent': 'TestAgent' },
        ip: '127.0.0.1',
      } as any;
      const saveBusinessInfoDto: SaveBusinessInfoDto = {
        business_name: 'New Business',
        industry: 'Tech',
        country: 'Nigeria',
        business_size: 'small',
      };

      prisma.businessInformation.findUnique = jest.fn().mockResolvedValue(null);
      prisma.businessInformation.upsert = jest
        .fn()
        .mockResolvedValue({ id: 'business-456' });
      prisma.businessWallet.findFirst = jest.fn().mockResolvedValue(null);
      prisma.businessWallet.create = jest.fn();
      prisma.onboardingStatus.upsert = jest.fn();
      logService.createWithTrx = jest.fn();

      const result = await service.saveBusinessInformation(
        mockRequest,
        saveBusinessInfoDto,
      );

      expect(prisma.businessInformation.findUnique).toHaveBeenCalledWith({
        where: {
          user_id: { not: mockAuthPayload.user.sub },
          business_name: saveBusinessInfoDto.business_name,
        },
      });

      expect(prisma.businessInformation.upsert).toHaveBeenCalled();
      expect(prisma.businessWallet.create).toHaveBeenCalled();
      expect(prisma.onboardingStatus.upsert).toHaveBeenCalled();
      expect(logService.createWithTrx).toHaveBeenCalled();

      expect(result).toEqual({
        statusCode: 200,
        message: 'Business information saved successfully.',
      });
    });

    it('should throw error if business name already exists', async () => {
      const mockAuthPayload = { user: { sub: 'user-123' } };
      const mockRequest = {
        user: mockAuthPayload.user,
        headers: { 'user-agent': 'TestAgent' },
        ip: '127.0.0.1',
      } as any;
      const saveBusinessInfoDto: SaveBusinessInfoDto = {
        business_name: 'Existing Business',
        industry: 'Tech',
        country: 'Nigeria',
        business_size: 'small',
      };

      prisma.businessInformation.findUnique = jest
        .fn()
        .mockResolvedValue({ id: 'business-999' });

      await expect(
        service.saveBusinessInformation(mockRequest, saveBusinessInfoDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should not create a new wallet if one already exists', async () => {
      const mockAuthPayload = { user: { sub: 'user-123' } };
      const mockRequest = {
        user: mockAuthPayload.user,
        headers: { 'user-agent': 'TestAgent' },
        ip: '127.0.0.1',
      } as any;
      const saveBusinessInfoDto: SaveBusinessInfoDto = {
        business_name: 'Business with Wallet',
        industry: 'Finance',
        country: 'USA',
        business_size: 'small',
      };

      prisma.businessInformation.findUnique = jest.fn().mockResolvedValue(null);
      prisma.businessInformation.upsert = jest
        .fn()
        .mockResolvedValue({ id: 'business-789' });
      prisma.businessWallet.findFirst = jest
        .fn()
        .mockResolvedValue({ id: 'wallet-456' });

      const result = await service.saveBusinessInformation(
        mockRequest,
        saveBusinessInfoDto,
      );

      expect(prisma.businessWallet.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        statusCode: 200,
        message: 'Business information saved successfully.',
      });
    });
  });

  describe('Fetch businesses', () => {
    it('should fetch businesses for the authenticated user', async () => {
      const mockAuthPayload = { user: { sub: 'user-123' } };
      const mockRequest = {
        user: mockAuthPayload.user,
        headers: { 'user-agent': 'TestAgent' },
        ip: '127.0.0.1',
      } as any;

      const mockBusinesses = [
        { id: '1', business_name: 'Business 1', user_id: 'user-123' },
        { id: '2', business_name: 'Business 2', user_id: 'user-123' },
      ];

      prisma.businessInformation.findMany = jest
        .fn()
        .mockResolvedValue(mockBusinesses);

      const result = await service.fetchBusinesses(mockRequest);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        data: mockBusinesses,
      });
    });

    it('should return empty data if no businesses are found', async () => {
      const mockAuthPayload = { user: { sub: 'user-123' } };
      const mockRequest = {
        user: mockAuthPayload.user,
        headers: { 'user-agent': 'TestAgent' },
        ip: '127.0.0.1',
      } as any;

      prisma.businessInformation.findMany = jest.fn().mockResolvedValue([]);

      const result = await service.fetchBusinesses(mockRequest);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        data: [],
      });
    });
  });

  describe('Fetch business information', () => {
    it('should fetch business information successfully', async () => {
      const mockAuthPayload = { user: { sub: 'user-123' } };
      const mockRequest = {
        user: mockAuthPayload.user,
        headers: { 'user-agent': 'TestAgent' },
        ip: '127.0.0.1',
      } as any;
      const param = { id: 'business-123' };

      const mockBusiness: BusinessInformation & { onboarding_status: any } & {
        business_wallet: any;
      } & any = {
        id: 'business-123',
        business_name: 'Tech Business',
        industry: 'Tech',
        country: 'USA',
        business_size: 'medium',
        user_id: 'user-123',
        onboarding_status: { status: 'pending' },
        business_wallet: { id: 'wallet-123' },
      };

      prisma.businessInformation.findFirst = jest
        .fn()
        .mockResolvedValue(mockBusiness);

      const result = await service.fetchBusinessInformation(mockRequest, param);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Business information retrieved successfully.',
        data: mockBusiness,
      });
    });

    it('should throw NotFoundException if business information is not found', async () => {
      const mockAuthPayload = { user: { sub: 'user-123' } };
      const mockRequest = {
        user: mockAuthPayload.user,
        headers: { 'user-agent': 'TestAgent' },
        ip: '127.0.0.1',
      } as any;
      const param = { id: 'non-existent-business-id' };

      prisma.businessInformation.findFirst = jest.fn().mockResolvedValue(null);

      await expect(
        service.fetchBusinessInformation(mockRequest, param),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('Save withdrawal account', () => {
    it('should add a new withdrawal account successfully', async () => {
      const mockAuthPayload = { user: { sub: 'user-123' } };
      const mockRequest = {
        user: mockAuthPayload.user,
        headers: { 'user-agent': 'TestAgent' },
        ip: '127.0.0.1',
      } as any;
      const dto: UpsertWithdrawalAccountDto = {
        business_id: 'business-123',
        account_number: '1234567890',
        account_type: 'savings',
        bank_name: 'Test Bank',
        routing_number: '12345',
        country: 'Nigeria',
        bank_code: '076',
      };

      const mockBusiness = {
        id: 'business-123',
        business_name: 'Test Business',
        user_id: 'user-123',
        withdrawal_account: null,
      };
      const mockResolvedAccount = true; // Simulating valid account check

      prisma.businessInformation.findUnique = jest
        .fn()
        .mockResolvedValue(mockBusiness);
      paystackService.resolveAccountNumber = jest
        .fn()
        .mockResolvedValue(mockResolvedAccount);
      prisma.withdrawalAccount.create = jest
        .fn()
        .mockResolvedValue({ id: 'account-123', ...dto });
      logService.createWithTrx = jest.fn();
      prisma.onboardingStatus.upsert = jest.fn();

      const result = await service.saveWithdrawalAccount(mockRequest, dto);

      expect(prisma.businessInformation.findUnique).toHaveBeenCalledWith({
        where: { id: dto.business_id, user_id: mockAuthPayload.user.sub },
        include: { withdrawal_account: true },
      });

      expect(paystackService.resolveAccountNumber).toHaveBeenCalledWith(
        dto.account_number,
        dto.bank_code,
      );
      expect(prisma.withdrawalAccount.create).toHaveBeenCalledWith({
        data: {
          business_id: dto.business_id,
          account_number: dto.account_number,
          account_type: dto.account_type,
          bank_name: dto.bank_name,
          routing_number: dto.routing_number,
          country: dto.country || 'Nigeria',
        },
      });

      expect(logService.createWithTrx).toHaveBeenCalled();
      expect(prisma.onboardingStatus.upsert).toHaveBeenCalled();

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Withdrawal account added successfully.',
      });
    });

    it('should update an existing withdrawal account successfully', async () => {
      const mockAuthPayload = { user: { sub: 'user-123' } };
      const mockRequest = {
        user: mockAuthPayload.user,
        headers: { 'user-agent': 'TestAgent' },
        ip: '127.0.0.1',
      } as any;
      const dto: UpsertWithdrawalAccountDto = {
        business_id: 'business-123',
        account_number: '1234567890',
        account_type: 'savings',
        bank_name: 'Test Bank',
        routing_number: '12345',
        country: 'Nigeria',
        bank_code: '076',
      };

      const mockBusiness = {
        id: 'business-123',
        business_name: 'Test Business',
        user_id: 'user-123',
        withdrawal_account: { id: 'account-123' },
      };
      const mockResolvedAccount = true; // Simulating valid account check
      const mockExistingAccount = {
        id: 'account-123',
        account_number: '1234567890',
        account_type: 'savings',
        bank_name: 'Test Bank',
      };

      prisma.businessInformation.findUnique = jest
        .fn()
        .mockResolvedValue(mockBusiness);
      paystackService.resolveAccountNumber = jest
        .fn()
        .mockResolvedValue(mockResolvedAccount);
      prisma.withdrawalAccount.findUnique = jest
        .fn()
        .mockResolvedValue(mockExistingAccount);
      prisma.withdrawalAccount.update = jest
        .fn()
        .mockResolvedValue(mockExistingAccount);
      logService.createWithTrx = jest.fn();
      prisma.onboardingStatus.upsert = jest.fn();

      const result = await service.saveWithdrawalAccount(mockRequest, dto);

      expect(prisma.businessInformation.findUnique).toHaveBeenCalledWith({
        where: { id: dto.business_id, user_id: mockAuthPayload.user.sub },
        include: { withdrawal_account: true },
      });

      expect(paystackService.resolveAccountNumber).toHaveBeenCalledWith(
        dto.account_number,
        dto.bank_code,
      );
      expect(prisma.withdrawalAccount.update).toHaveBeenCalledWith({
        where: { id: mockExistingAccount.id },
        data: {
          account_number: dto.account_number,
          account_type: dto.account_type,
          bank_name: dto.bank_name,
          routing_number: dto.routing_number,
          country: dto.country,
        },
      });

      expect(logService.createWithTrx).toHaveBeenCalled();
      expect(prisma.onboardingStatus.upsert).toHaveBeenCalled();

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Withdrawal account updated successfully.',
      });
    });

    it('should throw NotFoundException if business is not found', async () => {
      const mockAuthPayload = { user: { sub: 'user-123' } };
      const mockRequest = {
        user: mockAuthPayload.user,
        headers: { 'user-agent': 'TestAgent' },
        ip: '127.0.0.1',
      } as any;
      const dto: UpsertWithdrawalAccountDto = {
        business_id: 'business-123',
        account_number: '1234567890',
        account_type: 'savings',
        bank_name: 'Test Bank',
        routing_number: '12345',
        country: 'Nigeria',
        bank_code: '076',
      };

      prisma.businessInformation.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.saveWithdrawalAccount(mockRequest, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if account number or bank code is invalid', async () => {
      const mockAuthPayload = { user: { sub: 'user-123' } };
      const mockRequest = {
        user: mockAuthPayload.user,
        headers: { 'user-agent': 'TestAgent' },
        ip: '127.0.0.1',
      } as any;
      const dto: UpsertWithdrawalAccountDto = {
        business_id: 'business-123',
        account_number: '1234567890',
        account_type: 'savings',
        bank_name: 'Test Bank',
        routing_number: '12345',
        country: 'Nigeria',
        bank_code: '076',
      };

      const mockBusiness = {
        id: 'business-123',
        business_name: 'Test Business',
        user_id: 'user-123',
        withdrawal_account: null,
      };
      const mockResolvedAccount = false; // Simulating invalid account check

      prisma.businessInformation.findUnique = jest
        .fn()
        .mockResolvedValue(mockBusiness);
      paystackService.resolveAccountNumber = jest
        .fn()
        .mockResolvedValue(mockResolvedAccount);

      await expect(
        service.saveWithdrawalAccount(mockRequest, dto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
