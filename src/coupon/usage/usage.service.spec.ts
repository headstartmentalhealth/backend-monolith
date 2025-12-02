import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { mockDeep, MockProxy } from 'jest-mock-extended';
import { CouponUsageService } from './usage.service';
import { PrismaService } from '../../prisma/prisma.service';
import { GenericService } from '../../generic/generic.service';
import { CouponManagementService } from '../management/management.service';
import { LogService } from '../../log/log.service';
import { CreateCouponUsageDto } from './usage.dto';
import { PagePayload } from '../../generic/generic.payload';
import { QueryDto } from '../../generic/generic.dto';
import { Role } from '../../generic/generic.data';

describe('CouponUsageService', () => {
  let service: CouponUsageService;
  let prisma: MockProxy<PrismaService>;
  let genericService: MockProxy<GenericService>;
  let couponManagementService: MockProxy<CouponManagementService>;

  // Sample test data
  const mockAuthPayload = {
    headers: { 'user-agent': 'TestAgent' },
    ip: '127.0.0.1',
    user: {
      sub: 'user-1',
      email: 'test@test.com',
      name: 'userid',
      role: Role.BUSINESS_SUPER_ADMIN,
    },
    timezone: 'Africa/Lagos',
  };

  const mockCouponUsage: Prisma.CouponUsageGetPayload<{}> = {
    id: 'usage-1',
    user_id: 'user-1',
    coupon_id: 'coupon-1',
    discount_applied: 10,
    created_at: new Date(),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponUsageService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
        { provide: GenericService, useValue: mockDeep<GenericService>() },
        {
          provide: CouponManagementService,
          useValue: mockDeep<CouponManagementService>(),
        },
        { provide: LogService, useValue: mockDeep<LogService>() },
      ],
    }).compile();

    service = module.get<CouponUsageService>(CouponUsageService);
    prisma = module.get(PrismaService);
    genericService = module.get(GenericService);
    couponManagementService = module.get(CouponManagementService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWithTrx', () => {
    it('should create coupon usage within transaction', async () => {
      // Arrange
      const dto: CreateCouponUsageDto | any = {
        user_id: 'user-1',
        coupon_id: 'coupon-1',
        discount_applied: 10,
      };

      const spy = jest
        .spyOn(prisma.couponUsage, 'create')
        .mockResolvedValue(mockCouponUsage);

      // Act
      const result = await service.createWithTrx(dto, prisma.couponUsage);

      // Assert
      expect(result).toEqual(mockCouponUsage);
      expect(spy).toHaveBeenCalledWith({
        data: dto,
      });
    });
  });

  describe('fetch', () => {
    it('should return paginated coupon usages', async () => {
      // Arrange
      const mockCoupon = {
        id: 'coupon-1',
        business: { id: 'business-1' },
      };

      const mockResponse: PagePayload<Prisma.CouponUsageGetPayload<{}>> = {
        statusCode: HttpStatus.OK,
        data: [mockCouponUsage],
        count: 1,
      };

      // Mock dependencies
      couponManagementService.findOne.mockResolvedValue(mockCoupon as any);
      genericService.isUserLinkedToBusiness.mockResolvedValue(null);

      // Mock Prisma methods directly
      const findManySpy = jest
        .spyOn(prisma.couponUsage, 'findMany')
        .mockResolvedValue([mockCouponUsage]);

      const countSpy = jest
        .spyOn(prisma.couponUsage, 'count')
        .mockResolvedValue(1);

      // Act
      const result = await service.fetch(
        mockAuthPayload,
        { coupon_id: 'coupon-1' },
        { pagination: { page: 1, limit: 10 } } as QueryDto,
      );

      // Assert
      expect(result).toEqual(mockResponse);
      expect(couponManagementService.findOne).toHaveBeenCalledWith('coupon-1');
      expect(genericService.isUserLinkedToBusiness).toHaveBeenCalledWith(
        prisma,
        { user_id: 'user-1', business_id: 'business-1' },
      );
      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { coupon_id: 'coupon-1' },
          skip: 0,
          take: 10,
          orderBy: { created_at: 'desc' },
          select: expect.any(Object),
        }),
      );
      expect(countSpy).toHaveBeenCalledWith({
        where: { coupon_id: 'coupon-1' },
      });
    });
  });

  describe('error handling', () => {
    it('should throw if user not linked to business', async () => {
      // Arrange
      couponManagementService.findOne.mockResolvedValue({
        id: 'coupon-1',
        business: { id: 'business-1' },
      } as any);

      genericService.isUserLinkedToBusiness.mockRejectedValue(
        new Error('Not authorized'),
      );

      // Act & Assert
      await expect(
        service.fetch(mockAuthPayload, { coupon_id: 'coupon-1' }, {
          pagination: { page: 1, limit: 10 },
        } as QueryDto),
      ).rejects.toThrow('Not authorized');
    });
  });
});
