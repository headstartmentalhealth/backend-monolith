import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionPlanPriceService } from './price.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LogService } from '../../log/log.service';
import { GenericService } from '../../generic/generic.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '../../generic/generic.data';
import { AuthPayload } from '../../generic/generic.payload';

describe('Subscription plan price service', () => {
  let service: SubscriptionPlanPriceService;
  let prisma: PrismaService;
  let logService: LogService;
  let genericService: GenericService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionPlanPriceService,
        PrismaService,
        LogService,
        GenericService,
      ],
    }).compile();

    service = module.get<SubscriptionPlanPriceService>(
      SubscriptionPlanPriceService,
    );
    prisma = module.get<PrismaService>(PrismaService);
    logService = module.get<LogService>(LogService);
    genericService = module.get<GenericService>(GenericService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
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

  describe('create', () => {
    it('should create a subscription plan price successfully', async () => {
      const mockRequest: AuthPayload = auth;
      const createDto = {
        period: 'monthly',
        price: 10,
        subscription_plan_id: 'plan123',
      } as any;

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prisma); // Pass the mocked Prisma client to the callback
        });

      jest
        .spyOn(prisma.subscriptionPlan, 'findUnique')
        .mockResolvedValue({ id: 'plan123', business_id: 'biz123' } as any);

      jest.spyOn(genericService, 'isUserLinkedToBusiness').mockResolvedValue();

      jest
        .spyOn(prisma.subscriptionPlanPrice, 'findUnique')
        .mockResolvedValue(null);

      jest.spyOn(prisma.subscriptionPlanPrice, 'create').mockResolvedValue({
        id: 'price123',
        subscription_plan: { business_id: 'biz123' }, // Ensure `subscription_plan` is included
      } as any);

      jest.spyOn(logService, 'createWithTrx').mockResolvedValue(null);

      const response = await service.create(mockRequest as any, createDto);

      expect(response).toEqual({
        statusCode: 201,
        message: "Subscription plan's price created successfully.",
      });
    });

    it('should throw BadRequestException if subscription plan price exists', async () => {
      const mockRequest = auth as any;
      const createDto = {
        period: 'monthly',
        price: 10,
        subscription_plan_id: 'plan123',
      } as any;

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prisma); // Pass the mocked Prisma client to the callback
        });
      jest
        .spyOn(prisma.subscriptionPlan, 'findUnique')
        .mockResolvedValue({ id: 'plan123', business_id: 'biz123' } as any);

      jest.spyOn(genericService, 'isUserLinkedToBusiness').mockResolvedValue();

      jest
        .spyOn(prisma.subscriptionPlanPrice, 'findUnique')
        .mockResolvedValue({ id: 'existing_price' } as any);

      await expect(service.create(mockRequest, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('fetch', () => {
    it('should return a paginated list of subscription plan prices', async () => {
      const mockPayload = auth as any;
      const param = { subscription_plan_id: 'plan123' };
      const queryDto = { pagination: { page: 1, limit: 10 } };

      jest
        .spyOn(service, 'fetch')
        .mockResolvedValue({ statusCode: 200, data: [], count: 0 });

      const response = await service.fetch(mockPayload, param, queryDto);
      expect(response).toEqual({ statusCode: 200, data: [], count: 0 });
    });

    it('should throw NotFoundException if the subscription plan does not exist', async () => {
      const mockPayload = auth as any;
      const param = { subscription_plan_id: 'invalid_plan' };
      const queryDto = { pagination: { page: 1, limit: 10 } };

      jest.spyOn(service, 'fetch').mockRejectedValue(new NotFoundException());

      await expect(service.fetch(mockPayload, param, queryDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a subscription plan price successfully', async () => {
      const mockRequest = auth as any;
      const param = { id: 'price123' };
      const updateDto: any = { price: '15.20' };

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prisma); // Pass the mocked Prisma client to the callback
        });

      // @ts-ignore
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'price123',
        subscription_plan: { id: 'plan123', business_id: 'biz123' },
      } as any);

      jest.spyOn(genericService, 'isUserLinkedToBusiness').mockResolvedValue();

      jest
        .spyOn(prisma.subscriptionPlanPrice, 'update')
        .mockResolvedValue({ ...updateDto });

      jest.spyOn(logService, 'createWithTrx').mockResolvedValue(null);

      const response = await service.update(mockRequest, param, updateDto);

      expect(response).toEqual({
        statusCode: 200,
        message: "Subscription plan's price updated successfully.",
      });
    });

    it('should throw NotFoundException if the price does not exist', async () => {
      const mockRequest = auth as any;
      const param = { id: 'invalid_price' };
      const updateDto = { price: 15 };

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prisma); // Pass the mocked Prisma client to the callback
        });

      // @ts-ignore
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(
        service.update(mockRequest, param, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a subscription plan price successfully', async () => {
      const mockRequest = auth as any;
      const param = { id: 'price123' };

      const data: any = {
        deleted_at: new Date(),
      };

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prisma); // Pass the mocked Prisma client to the callback
        });

      // @ts-ignore
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'price123',
        subscription_plan: { id: 'plan123', business_id: 'biz123' },
      } as any);

      jest.spyOn(genericService, 'isUserLinkedToBusiness').mockResolvedValue();

      jest
        .spyOn(prisma.subscriptionPlanPrice, 'update')
        .mockResolvedValue(data);

      jest.spyOn(logService, 'createWithTrx').mockResolvedValue(null);

      const response = await service.delete(mockRequest, param);

      expect(response).toEqual({
        statusCode: 200,
        message: "Subscription plan's price deleted successfully.",
      });
    });

    it('should throw NotFoundException if the price does not exist', async () => {
      const mockRequest = { user: { sub: 'user123' } } as any;
      const param = { id: 'invalid_price' };

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prisma); // Pass the mocked Prisma client to the callback
        });

      // @ts-ignore
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.delete(mockRequest, param)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
