import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionPlanService } from './plan.service';
import { LogService } from '../../log/log.service';
import { GenericService } from '../../generic/generic.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { mockDeep, mockReset } from 'jest-mock-extended';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from './plan.dto';
import { AuthPayload } from '../../generic/generic.payload';
import { QueryDto } from '../../generic/generic.dto';
import { Role } from '../../generic/generic.data';

describe('Subscription plan service', () => {
  let service: SubscriptionPlanService;
  let prisma: PrismaService;
  let logService: LogService;
  let genericService: GenericService;

  const mockPrisma = mockDeep<PrismaClient>();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionPlanService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
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
            isUserLinkedToBusiness: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SubscriptionPlanService>(SubscriptionPlanService);
    prisma = module.get<PrismaService>(PrismaService);
    logService = module.get<LogService>(LogService);
    genericService = module.get<GenericService>(GenericService);

    mockReset(mockPrisma);
  });

  const auth = {
    headers: { 'user-agent': 'TestAgent' },
    ip: '127.0.0.1',
    user: {
      sub: 'user-id',
      name: 'userid',
      email: 'user@example.com',
      role: Role.BUSINESS_SUPER_ADMIN,
    },
    timezone: 'Africa/Lagos',
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a subscription plan successfully', async () => {
      const authPayload: AuthPayload = auth;

      const createDto: CreateSubscriptionPlanDto | any = {
        name: 'Test Plan',
        business_id: 'business-id',
        description: 'Test Description',
        cover_image: 'test-image-url',
      };

      const business = { id: 'business-id', name: 'Test Business' } as any;
      const createdPlan = {
        id: 'plan-id',
        ...createDto,
        creator_id: 'user-id',
      } as any;

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prisma); // Pass the mocked Prisma client to the callback
        });

      jest.spyOn(genericService, 'isUserLinkedToBusiness').mockResolvedValue();
      jest
        .spyOn(prisma.businessInformation, 'findUnique')
        .mockResolvedValue(business);
      jest.spyOn(prisma.subscriptionPlan, 'findUnique').mockResolvedValue(null);
      jest
        .spyOn(prisma.subscriptionPlan, 'create')
        .mockResolvedValue(createdPlan);
      jest.spyOn(logService, 'createWithTrx').mockResolvedValue(null);

      const result = await service.create(authPayload as any, createDto);

      expect(result).toEqual({
        statusCode: 201,
        message: 'Subscription plan created successfully.',
      });
    });

    it('should throw BadRequestException if subscription plan already exists', async () => {
      const authPayload: AuthPayload = auth;
      const createDto: CreateSubscriptionPlanDto | any = {
        name: 'Test Plan',
        business_id: 'business-id',
        description: 'Test Description',
        cover_image: 'test-image-url',
      };

      const business = { id: 'business-id', name: 'Test Business' } as any;
      const existingPlan = {
        id: 'plan-id',
        ...createDto,
        creator_id: 'user-id',
      } as any;

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prisma); // Pass the mocked Prisma client to the callback
        });

      jest.spyOn(genericService, 'isUserLinkedToBusiness').mockResolvedValue();
      jest
        .spyOn(prisma.businessInformation, 'findUnique')
        .mockResolvedValue(business);
      jest
        .spyOn(prisma.subscriptionPlan, 'findUnique')
        .mockResolvedValue(existingPlan);

      await expect(
        service.create(authPayload as any, createDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('fetch', () => {
    it('should fetch subscription plans with pagination', async () => {
      const authPayload: AuthPayload = auth;
      const queryDto: QueryDto = { pagination: { page: 1, limit: 10 } };
      const business_id = 'business-id';

      const plans = [
        {
          id: 'plan-id-1',
          name: 'Test Plan 1',
          description: 'Test Description 1',
          cover_image: 'test-image-url-1',
          business_id: 'business-id',
          created_at: new Date(),
        },
        {
          id: 'plan-id-2',
          name: 'Test Plan 2',
          description: 'Test Description 2',
          cover_image: 'test-image-url-2',
          business_id: 'business-id',
          created_at: new Date(),
        },
      ] as any;

      jest.spyOn(genericService, 'isUserLinkedToBusiness').mockResolvedValue();
      jest.spyOn(prisma.subscriptionPlan, 'findMany').mockResolvedValue(plans);
      jest.spyOn(prisma.subscriptionPlan, 'count').mockResolvedValue(2);

      const result = await service.fetch(
        authPayload,
        { business_id },
        queryDto,
      );

      expect(result).toEqual({
        statusCode: 200,
        data: plans,
        count: 2,
      });
    });
  });

  describe('update', () => {
    it('should update a subscription plan successfully', async () => {
      const authPayload: AuthPayload = auth;
      const updateDto: UpdateSubscriptionPlanDto = {
        name: 'Updated Plan',
        description: 'Updated Description',
        cover_image: 'updated-image-url',
      } as any;
      const existingPlan = {
        id: 'plan-id',
        name: 'Test Plan',
        description: 'Test Description',
        cover_image: 'test-image-url',
        business_id: 'business-id',
      } as any;

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prisma); // Pass the mocked Prisma client to the callback
        });

      // @ts-ignore
      jest.spyOn(service, 'findOne').mockResolvedValue(existingPlan);
      jest.spyOn(genericService, 'isUserLinkedToBusiness').mockResolvedValue();
      jest
        .spyOn(prisma.subscriptionPlan, 'update')
        .mockResolvedValue({ ...existingPlan, ...updateDto });
      jest.spyOn(logService, 'createWithTrx').mockResolvedValue(null);

      const result = await service.update(
        authPayload as any,
        { id: 'plan-id' },
        updateDto,
      );

      expect(result).toEqual({
        statusCode: 200,
        message: 'Subscription plan updated successfully.',
      });
    });

    it('should throw NotFoundException if subscription plan does not exist', async () => {
      const authPayload: AuthPayload = auth;
      const updateDto: UpdateSubscriptionPlanDto | any = {
        name: 'Updated Plan',
        description: 'Updated Description',
        cover_image: 'updated-image-url',
      };

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prisma); // Pass the mocked Prisma client to the callback
        });

      // @ts-ignore
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(
        service.update(
          authPayload as any,
          { id: 'non-existent-id' },
          updateDto,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a subscription plan successfully', async () => {
      const authPayload: AuthPayload = auth;
      const existingPlan = {
        id: 'plan-id',
        name: 'Test Plan',
        description: 'Test Description',
        cover_image: 'test-image-url',
        business_id: 'business-id',
      } as SubscriptionPlan;

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prisma); // Pass the mocked Prisma client to the callback
        });

      // @ts-ignore
      jest.spyOn(service, 'findOne').mockResolvedValue(existingPlan as any);
      jest.spyOn(genericService, 'isUserLinkedToBusiness').mockResolvedValue();
      jest
        .spyOn(prisma.subscriptionPlan, 'update')
        .mockResolvedValue({ ...existingPlan, deleted_at: new Date() });
      jest.spyOn(logService, 'createWithTrx').mockResolvedValue(null);

      const result = await service.delete(authPayload as any, {
        id: 'plan-id',
      });

      expect(result).toEqual({
        statusCode: 200,
        message: 'Subscription plan deleted successfully.',
      });
    });

    it('should throw ForbiddenException if related records exist', async () => {
      const authPayload: AuthPayload = auth;
      const existingPlan = {
        id: 'plan-id',
        name: 'Test Plan',
        description: 'Test Description',
        cover_image: 'test-image-url',
        business_id: 'business-id',
      };

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prisma); // Pass the mocked Prisma client to the callback
        });
      // @ts-ignore
      jest.spyOn(service, 'findOne').mockResolvedValue(existingPlan as any);
      jest.spyOn(genericService, 'isUserLinkedToBusiness').mockResolvedValue();
      jest.spyOn(prisma.subscriptionPlanRole, 'count').mockResolvedValue(1);

      await expect(
        service.delete(authPayload as any, { id: 'plan-id' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
