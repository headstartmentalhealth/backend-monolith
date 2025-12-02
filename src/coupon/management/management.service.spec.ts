import { Test, TestingModule } from '@nestjs/testing';
import { CouponManagementService } from './management.service';
import { PrismaService } from '../../prisma/prisma.service';
import { LogService } from '../../log/log.service';
import { GenericService } from '../../generic/generic.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  CreateCouponDto,
  FilterCouponsDto,
  UpdateCouponDto,
} from './management.dto';
import { AuthPayload } from '../../generic/generic.payload';
import * as moment from 'moment';
import { Role } from '../../generic/generic.data';
import { QueryDto } from '../../generic/generic.dto';
import { BooleanOptions } from '../../generic/generic.utils';

describe('Coupon management service', () => {
  let service: CouponManagementService;
  let prisma: PrismaService;
  let logService: LogService;
  let genericService: GenericService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponManagementService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn(),
            coupon: {
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
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
          provide: GenericService,
          useValue: {
            isUserLinkedToBusiness: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CouponManagementService>(CouponManagementService);
    prisma = module.get<PrismaService>(PrismaService);
    logService = module.get<LogService>(LogService);
    genericService = module.get<GenericService>(GenericService);
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
    it('should create a coupon successfully', async () => {
      const authPayload: AuthPayload = auth;
      const createCouponDto: CreateCouponDto = {
        code: 'TEST123',
        business_id: 'business-id',
        start_date: '2023-01-01',
        end_date: '2023-12-31',
      } as any;

      const mockCoupon: any = {
        id: 'coupon-id',
        ...createCouponDto,
        start_date: moment(createCouponDto.start_date).toDate(),
        end_date: moment(createCouponDto.end_date).toDate(),
        creator_id: authPayload.user.sub,
      };

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prisma);
        });

      jest.spyOn(prisma.coupon, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.coupon, 'create').mockResolvedValue(mockCoupon);
      jest.spyOn(logService, 'createWithTrx').mockResolvedValue(null);

      const result = await service.create(authPayload as any, createCouponDto);

      expect(result.statusCode).toEqual(201);
      expect(result.message).toEqual('Coupon created successfully.');
      expect(prisma.coupon.create).toHaveBeenCalledWith({
        data: {
          ...createCouponDto,
          start_date: moment(createCouponDto.start_date).toDate(),
          end_date: moment(createCouponDto.end_date).toDate(),
          creator_id: authPayload.user.sub,
        },
      });
    });

    it('should throw ConflictException if coupon already exists', async () => {
      const authPayload: AuthPayload = auth;

      const createCouponDto: CreateCouponDto = {
        code: 'TEST123',
        business_id: 'business-id',
        start_date: '2023-01-01',
        end_date: '2023-12-31',
      } as any;

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prisma);
        });

      jest.spyOn(prisma.coupon, 'findUnique').mockResolvedValue({
        id: 'existing-coupon-id',
        ...createCouponDto,
      } as any);

      await expect(
        service.create(authPayload as any, createCouponDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('fetch', () => {
    it('should fetch coupons successfully', async () => {
      const authPayload: AuthPayload = auth;

      const filterDto: (FilterCouponsDto & QueryDto) | any = {
        is_active: BooleanOptions.true,
        pagination: { page: 1, limit: 10 },
      };
      const param = { business_id: 'business-id' };

      const mockCoupons: any = [
        {
          id: 'coupon-id',
          code: 'TEST123',
          business_id: 'business-id',
          is_active: true,
        },
      ];

      jest.spyOn(prisma.coupon, 'findMany').mockResolvedValue(mockCoupons);
      jest.spyOn(prisma.coupon, 'count').mockResolvedValue(1);

      const result = await service.fetch(authPayload, param, filterDto);

      expect(result.statusCode).toEqual(200);
      expect(result.data).toEqual(mockCoupons);
      expect(result.count).toEqual(1);
    });
  });

  describe('findOne', () => {
    it('should return a coupon by ID', async () => {
      const couponId = 'coupon-id';
      const mockCoupon: any = {
        id: couponId,
        code: 'TEST123',
        business_id: 'business-id',
        is_active: true,
      };

      jest.spyOn(prisma.coupon, 'findFirst').mockResolvedValue(mockCoupon);

      const result = await service.findOne(couponId);

      expect(result).toEqual(mockCoupon);
    });

    it('should throw NotFoundException if coupon is not found', async () => {
      const couponId = 'non-existent-coupon-id';

      jest.spyOn(prisma.coupon, 'findFirst').mockResolvedValue(null);

      await expect(service.findOne(couponId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a coupon successfully', async () => {
      const authPayload: AuthPayload = auth;

      const updateCouponDto: UpdateCouponDto | any = {
        code: 'UPDATED123',
        start_date: '2023-01-01',
        end_date: '2023-12-31',
      };
      const param = { id: 'coupon-id' };

      const mockCoupon: any = {
        id: 'coupon-id',
        code: 'TEST123',
        business_id: 'business-id',
        is_active: true,
        business: {
          id: 'business-id',
        },
      };

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prisma);
        });

      jest.spyOn(service, 'findOne').mockResolvedValue(mockCoupon as any);
      jest.spyOn(prisma.coupon, 'update').mockResolvedValue(mockCoupon);
      jest.spyOn(logService, 'createWithTrx').mockResolvedValue(null);

      const result = await service.update(
        authPayload as any,
        param,
        updateCouponDto,
      );

      expect(result.statusCode).toEqual(200);
      expect(result.message).toEqual('Coupon updated successfully.');
    });
  });

  describe('delete', () => {
    it('should delete a coupon successfully', async () => {
      const authPayload: AuthPayload = auth;

      const param = { id: 'coupon-id' };

      const mockCoupon: any = {
        id: 'coupon-id',
        code: 'TEST123',
        business_id: 'business-id',
        is_active: true,
        business: {
          id: 'business-id',
        },
      };

      jest
        .spyOn(prisma, '$transaction')
        .mockImplementation(async (callback) => {
          return callback(prisma);
        });

      jest.spyOn(service, 'findOne').mockResolvedValue(mockCoupon as any);
      jest.spyOn(prisma.coupon, 'update').mockResolvedValue(mockCoupon);
      jest.spyOn(logService, 'createWithTrx').mockResolvedValue(null);

      const result = await service.delete(authPayload as any, param);

      expect(result.statusCode).toEqual(200);
      expect(result.message).toEqual('Coupon deleted successfully.');
    });
  });
});
