import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { BillingService } from './billing.service';
import { LogService } from '../../log/log.service';
import { GenericService } from '../../generic/generic.service';
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import {
  CreateBillingInformationDto,
  UpdateBillingInformationDto,
} from './billing.dto';
import {
  HttpStatus,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Action } from '@prisma/client';

describe('BillingService', () => {
  let billingService: BillingService;
  let prisma: PrismaService;
  let logService: LogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaClient>(),
        },
        {
          provide: LogService,
          useValue: {
            createWithTrx: jest.fn(),
          },
        },
        {
          provide: GenericService,
          useValue: {
            getCountryName: jest.fn(),
            getIpAddress: jest.fn(),
            getUserAgent: jest.fn(),
          },
        },
      ],
    }).compile();

    billingService = module.get<BillingService>(BillingService);
    prisma = module.get<PrismaService>(PrismaService);
    logService = module.get<LogService>(LogService);
  });

  describe('create', () => {
    it('should create billing information successfully', async () => {
      const mockAuthPayload = {
        user: { sub: 'user-id' },
      };
      const mockRequest = {
        headers: {},
      };
      const mockDto: CreateBillingInformationDto = {
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        apartment: 'Apt 4B',
        postal_code: '10001',
        country: 'US',
        selected: true,
      };

      // Mock Prisma methods
      // @ts-ignore
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(prisma);
      });
      // @ts-ignore
      prisma.billingInformation.findFirst.mockResolvedValue(null); // No existing billing info
      // @ts-ignore
      prisma.billingInformation.updateMany.mockResolvedValue({ count: 0 }); // Deselect other billing info
      // @ts-ignore
      prisma.billingInformation.create.mockResolvedValue({
        id: 'billing-id',
        ...mockDto,
        user_id: 'user-id',
        country_code: 'US',
        country: 'United States',
      });

      // Mock GenericService methods
      // @ts-ignore
      billingService['genericService'].getCountryName.mockReturnValue(
        'United States',
      );
      // @ts-ignore
      billingService['genericService'].getIpAddress.mockReturnValue(
        '127.0.0.1',
      );
      // @ts-ignore
      billingService['genericService'].getUserAgent.mockReturnValue(
        'Test Agent',
      );

      const result = await billingService.create(
        { ...mockAuthPayload, ...mockRequest } as any,
        mockDto,
      );

      // Assertions
      expect(result.statusCode).toBe(HttpStatus.CREATED);
      expect(result.message).toBe('Billing information created successfully.');
      expect(prisma.billingInformation.create).toHaveBeenCalledWith({
        data: {
          ...mockDto,
          user_id: 'user-id',
          country_code: 'US',
          country: 'United States',
        },
      });
      expect(logService.createWithTrx).toHaveBeenCalled();
    });

    it('should throw ConflictException if billing information already exists', async () => {
      const mockAuthPayload = {
        user: { sub: 'user-id' },
      };
      const mockRequest = {
        headers: {},
      };
      const mockDto: CreateBillingInformationDto = {
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        apartment: 'Apt 4B',
        postal_code: '10001',
        country: 'US',
        selected: true,
      };

      // Mock Prisma methods
      // @ts-ignore
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(prisma);
      });
      // @ts-ignore
      prisma.billingInformation.findFirst.mockResolvedValue({
        id: 'existing-billing-id',
      }); // Existing billing info

      await expect(
        billingService.create(
          { ...mockAuthPayload, ...mockRequest } as any,
          mockDto,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if country code is invalid', async () => {
      const mockAuthPayload = {
        user: { sub: 'user-id' },
      };
      const mockRequest = {
        headers: {},
      };
      const mockDto: CreateBillingInformationDto = {
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        apartment: 'Apt 4B',
        postal_code: '10001',
        country: 'INVALID',
        selected: true,
      };

      // Mock GenericService methods
      // @ts-ignore
      billingService['genericService'].getCountryName.mockReturnValue(null);

      // Mock Prisma transaction
      // @ts-ignore
      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(prisma);
      });

      await expect(
        billingService.create(
          { ...mockAuthPayload, ...mockRequest } as any,
          mockDto,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('fetch', () => {
    it('should fetch all billing information for a user', async () => {
      const mockAuthPayload = {
        user: { sub: 'user-id' },
        timezone: 'UTC',
      };
      const mockQueryDto = {
        page: 1,
        limit: 10,
      };

      // Mock Prisma methods
      // @ts-ignore
      prisma.billingInformation.findMany.mockResolvedValue([
        {
          id: 'billing-id',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          apartment: 'Apt 4B',
          postal_code: '10001',
          country: 'United States',
          selected: true,
          user: {
            id: 'user-id',
            name: 'John Doe',
            role: { name: 'USER', role_id: 'role-id' },
          },
        },
      ]);
      // @ts-ignore
      prisma.billingInformation.count.mockResolvedValue(1);

      const result = await billingService.fetch(
        mockAuthPayload as any,
        mockQueryDto as any,
      );

      // Assertions
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.data.length).toBe(1);
      expect(result.count).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should fetch a single billing information by ID', async () => {
      const mockBillingInfo = {
        id: 'billing-id',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        apartment: 'Apt 4B',
        postal_code: '10001',
        country: 'United States',
        selected: true,
        user: {
          id: 'user-id',
          name: 'John Doe',
          role: { name: 'USER', role_id: 'role-id' },
        },
      };

      // Mock the billingInformationRepository's findOne method
      jest
        .spyOn(billingService['billingInformationRepository'], 'findOne')
        .mockResolvedValue(mockBillingInfo);

      const result = await billingService.findOne('billing-id', 'user-id');

      // Assertions
      expect(result.id).toBe('billing-id');
      expect(result.user.id).toBe('user-id');
    });

    it('should throw NotFoundException if billing information is not found', async () => {
      // Mock Prisma methods
      // @ts-ignore
      prisma.billingInformation.findUnique.mockResolvedValue(null);

      await expect(
        billingService.findOne('invalid-id', 'user-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update billing information successfully', async () => {
      const mockAuthPayload = {
        user: { sub: 'user-id' },
      };
      const mockRequest = {
        headers: {},
      };
      const mockDto: UpdateBillingInformationDto = {
        country: 'US',
        selected: true,
      };

      // Mock the billingInformationRepository's findOne method
      jest
        .spyOn(billingService['billingInformationRepository'], 'findOne')
        .mockResolvedValue({
          id: 'billing-id',
          user_id: 'user-id',
        });

      // Mock Prisma methods
      // @ts-ignore
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(prisma);
      });
      // @ts-ignore
      // prisma.billingInformation.findUnique.mockResolvedValue({
      //   id: 'billing-id',
      //   user_id: 'user-id',
      // });
      // @ts-ignore
      prisma.billingInformation.updateMany.mockResolvedValue({ count: 0 }); // Deselect other billing info
      // @ts-ignore
      prisma.billingInformation.update.mockResolvedValue({
        id: 'billing-id',
        ...mockDto,
      });

      // Mock GenericService methods
      // @ts-ignore
      billingService['genericService'].getCountryName.mockReturnValue(
        'United States',
      );

      const result = await billingService.update(
        { ...mockAuthPayload, ...mockRequest } as any,
        { id: 'billing-id' },
        mockDto,
      );

      // Assertions
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Billing information updated successfully.');
      expect(prisma.billingInformation.update).toHaveBeenCalled();
      expect(logService.createWithTrx).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete billing information successfully', async () => {
      const mockAuthPayload = {
        user: { sub: 'user-id' },
      };
      const mockRequest = {
        headers: {},
      };

      // Mock the billingInformationRepository's findOne method
      jest
        .spyOn(billingService['billingInformationRepository'], 'findOne')
        .mockResolvedValue({
          id: 'billing-id',
          user_id: 'user-id',
          address: '123 Main St',
          state: 'NY',
          country: 'United States',
        });

      // Mock Prisma methods
      // @ts-ignore
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(prisma);
      });

      // @ts-ignore
      prisma.billingInformation.update.mockResolvedValue({
        id: 'billing-id',
        deleted_at: new Date(),
      });

      const result = await billingService.delete(
        { ...mockAuthPayload, ...mockRequest } as any,
        { id: 'billing-id' },
      );

      // Assertions
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.message).toBe('Billing information deleted successfully.');
      expect(prisma.billingInformation.update).toHaveBeenCalled();
      expect(logService.createWithTrx).toHaveBeenCalled();
    });
  });
});
