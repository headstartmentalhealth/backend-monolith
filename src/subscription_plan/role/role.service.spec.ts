import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionPlanRoleService } from './role.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LogService } from '../../log/log.service';
import { GenericService } from '../../generic/generic.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '../../generic/generic.data';

describe('Subscription plan role service', () => {
  let service: SubscriptionPlanRoleService;
  let prisma: PrismaService;
  let logService: LogService;
  let genericService: GenericService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionPlanRoleService,
        PrismaService,
        LogService,
        GenericService,
      ],
    }).compile();

    service = module.get<SubscriptionPlanRoleService>(
      SubscriptionPlanRoleService,
    );
    prisma = module.get<PrismaService>(PrismaService);
    logService = module.get<LogService>(LogService);
    genericService = module.get<GenericService>(GenericService);
  });

  afterEach(() => {
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
    it('should create a subscription plan role successfully', async () => {
      const mockRequest: any = auth;
      const createDto = {
        title: 'Admin',
        subscription_plan_id: 'plan123',
      };

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prisma);
        });

      jest.spyOn(prisma.subscriptionPlan, 'findUnique').mockResolvedValue({
        id: 'plan123',
        business_id: 'biz123',
        subscription_plan_roles: [],
      } as any);

      jest.spyOn(genericService, 'isUserLinkedToBusiness').mockResolvedValue();

      jest
        .spyOn(prisma.subscriptionPlanRole, 'findUnique')
        .mockResolvedValue(null);

      jest.spyOn(prisma.subscriptionPlanRole, 'create').mockResolvedValue({
        id: 'role123',
        subscription_plan: { business_id: 'biz123' },
      } as any);

      jest.spyOn(logService, 'createWithTrx').mockResolvedValue(null);

      const response = await service.create(mockRequest as any, createDto);

      expect(response).toEqual({
        statusCode: 201,
        message: "Subscription plan's role created successfully.",
      });
    });

    it('should throw error if subscription plan role already exists', async () => {
      const mockRequest: any = auth;
      const createDto = {
        title: 'Admin',
        subscription_plan_id: 'plan123',
      };

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prisma);
        });

      jest.spyOn(prisma.subscriptionPlan, 'findUnique').mockResolvedValue({
        id: 'plan123',
        business_id: 'biz123',
        subscription_plan_roles: [],
      } as any);

      jest
        .spyOn(prisma.subscriptionPlanRole, 'findUnique')
        .mockResolvedValue({ id: 'role123' } as any);

      jest
        .spyOn(service['genericService'], 'isUserLinkedToBusiness')
        .mockResolvedValue();

      await expect(
        service.create(mockRequest as any, createDto),
      ).rejects.toThrow(
        new BadRequestException("Subscription plan's role exists."),
      );
    });
  });

  describe('fetch', () => {
    it('should return subscription plan roles with pagination', async () => {
      const payload: any = auth;
      const param = { subscription_plan_id: 'plan123' };
      const queryDto = { pagination: { page: 1, limit: 10 } };

      jest.spyOn(prisma.subscriptionPlan, 'findUnique').mockResolvedValue({
        id: 'plan123',
        business_id: 'biz123',
      } as any);

      jest
        .spyOn(service['subscriptionPlanRepository'], 'findOne')
        .mockResolvedValueOnce({ id: 'plan123', business_id: 'biz123' } as any);

      jest.spyOn(genericService, 'isUserLinkedToBusiness').mockResolvedValue();

      jest
        .spyOn(prisma.subscriptionPlanRole, 'findMany')
        .mockResolvedValue([{ id: 'role1', title: 'Admin' }] as any);

      jest.spyOn(prisma.subscriptionPlanRole, 'count').mockResolvedValue(1);

      const response = await service.fetch(payload, param, queryDto);

      expect(response).toEqual({
        statusCode: 200,
        data: [{ id: 'role1', title: 'Admin' }],
        count: 1,
      });
    });

    it('should throw an error if subscription plan does not exist', async () => {
      const payload: any = auth;
      const param = { subscription_plan_id: 'plan123' };
      const queryDto = { pagination: { page: 1, limit: 10 } };

      jest
        .spyOn(service['subscriptionPlanRepository'], 'findOne')
        .mockResolvedValueOnce(null); // Or mock it to return a subscription plan.

      jest.spyOn(prisma.subscriptionPlan, 'findUnique').mockResolvedValue(null);

      jest.spyOn(genericService, 'isUserLinkedToBusiness').mockResolvedValue();

      await expect(service.fetch(payload, param, queryDto)).rejects.toThrow(
        new NotFoundException(`Subscription plan not found.`),
      );
    });
  });

  describe('update', () => {
    it('should update a subscription plan role successfully', async () => {
      const mockRequest: any = auth;
      const param = { id: 'role123' };
      const updateDto: any = { title: 'Manager' };

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prisma);
        });

      jest.spyOn(service as any, 'findOne').mockResolvedValue({
        id: 'role123',
        subscription_plan: { id: 'plan123', business_id: 'biz123' },
      });

      jest.spyOn(genericService, 'isUserLinkedToBusiness').mockResolvedValue();

      jest.spyOn(prisma.subscriptionPlanRole, 'update').mockResolvedValue({
        id: 'role123',
        title: 'Manager',
      } as any);

      jest.spyOn(logService, 'createWithTrx').mockResolvedValue(null);

      const response = await service.update(
        mockRequest as any,
        param,
        updateDto,
      );

      expect(response).toEqual({
        statusCode: 200,
        message: "Subscription plan's role updated successfully.",
      });
    });

    it('should throw error if role does not exist', async () => {
      const mockRequest: any = auth;
      const param = { id: 'role123' };
      const updateDto: any = { title: 'Manager' };

      jest.spyOn(service as any, 'findOne').mockImplementation(() => {
        throw new NotFoundException(
          `Subscription plan's role not found for your subscription plan`,
        );
      });

      await expect(
        service.update(mockRequest as any, param, updateDto),
      ).rejects.toThrow(
        new NotFoundException(
          `Subscription plan's role not found for your subscription plan`,
        ),
      );
    });
  });

  describe('delete', () => {
    it('should delete a subscription plan role successfully', async () => {
      const mockRequest: any = auth;
      const param = { id: 'role123' };

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prisma);
        });

      jest.spyOn(service as any, 'findOne').mockResolvedValue({
        id: 'role123',
        title: 'Admin',
        role_id: 'admin123',
        subscription_plan: { id: 'plan123', business_id: 'biz123' },
      });

      jest.spyOn(genericService, 'isUserLinkedToBusiness').mockResolvedValue();

      jest.spyOn(prisma.subscriptionPlanRole, 'update').mockResolvedValue({
        id: 'role123',
        deleted_at: new Date(),
      } as any);

      jest.spyOn(logService, 'createWithTrx').mockResolvedValue(null);

      const response = await service.delete(mockRequest as any, param);

      expect(response).toEqual({
        statusCode: 200,
        message: "Subscription plan's role deleted successfully.",
      });
    });

    it('should throw error if role does not exist', async () => {
      const mockRequest: any = auth;
      const param = { id: 'role123' };

      jest.spyOn(service as any, 'findOne').mockImplementation(() => {
        throw new NotFoundException(
          `Subscription plan's role not found for your subscription plan`,
        );
      });

      await expect(service.delete(mockRequest as any, param)).rejects.toThrow(
        new NotFoundException(
          `Subscription plan's role not found for your subscription plan`,
        ),
      );
    });
  });
});
