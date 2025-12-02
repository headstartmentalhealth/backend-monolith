import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from '../generic/providers/paystack/paystack.provider';
import { SubscriptionPlanPriceService } from '../subscription_plan/price/price.service';
import { AuthService } from '../account/auth/auth.service';
import { BillingService } from '../account/billing/billing.service';
import { LogService } from '../log/log.service';
import { MailService } from '../notification/mail/mail.service';
import { GenericService } from '../generic/generic.service';
import { Logger } from '@nestjs/common';
import {
  CreateSubscriptionDto,
  VerifySubscriptionDto,
} from './subscription.dto';
import {
  HttpStatus,
  ConflictException,
  NotFoundException,
  BadGatewayException,
} from '@nestjs/common';
import {
  PaymentStatus,
  PurchaseType,
  PaymentMethod,
  Action,
  PrismaClient,
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { getIpAddress, getUserAgent } from '../generic/generic.utils';
import { Timezone } from '@/generic/generic.payload';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RoleService } from '../rbac/rbac.service';
import { RbacModule } from '../rbac/rbac.module';
import { MailModule } from '../notification/mail/mail.module';

describe('SubscriptionService Integration', () => {
  let subscriptionService: SubscriptionService;
  let prismaService: PrismaService;
  let paystackService: PaystackService;
  let subscriptionPlanPriceService: SubscriptionPlanPriceService;
  let authService: AuthService;
  let billingService: BillingService;
  let logService: LogService;
  let mailService: MailService;
  let genericService: GenericService;

  const mockRequest = {
    headers: { 'user-agent': 'TestAgent' },
    ip: '127.0.0.1',
  } as any;

  const mockCreateSubscriptionDto: CreateSubscriptionDto | any = {
    user_id: uuidv4(),
    plan_price_id: uuidv4(),
    payment_method: PaymentMethod.PAYSTACK,
    billing_id: uuidv4(),
    auto_renew: true,
  };

  const mockVerifySubscriptionDto: VerifySubscriptionDto = {
    payment_id: uuidv4(),
  };

  const mockPlanPrice = {
    id: mockCreateSubscriptionDto.plan_price_id,
    price: 1000, // Plain number
    period: 'monthly',
    subscription_plan: {
      id: uuidv4(),
      name: 'Test Plan',
      business_id: uuidv4(),
    },
  };

  const mockUser = {
    id: mockCreateSubscriptionDto.user_id,
    email: 'test@example.com',
    name: 'Test User',
    subscriptions: [],
  };

  const mockBillingDetails = {
    id: mockCreateSubscriptionDto.billing_id,
    user_id: mockCreateSubscriptionDto.user_id,
  };

  const mockPayment = {
    id: mockVerifySubscriptionDto.payment_id,
    user_id: mockCreateSubscriptionDto.user_id,
    purchase_type: PurchaseType.SUBSCRIPTION,
    purchase_id: mockPlanPrice.subscription_plan.id,
    amount: 1000, // Plain number
    payment_status: PaymentStatus.PENDING,
    payment_method: mockCreateSubscriptionDto.payment_method,
    transaction_id: 'test-transaction-id',
    billing_id: mockBillingDetails.id,
    billing_at_payment: mockBillingDetails,
    interval: mockPlanPrice.period,
    auto_renew: mockCreateSubscriptionDto.auto_renew,
    user: {
      id: mockCreateSubscriptionDto.user_id,
      name: 'Test User',
      email: 'test@example.com',
    },
    subscription_plan: {
      name: mockPlanPrice.subscription_plan.name,
      business_id: mockPlanPrice.subscription_plan.business_id,
      business: {
        business_contacts: [
          {
            is_owner: true,
            user: {
              id: uuidv4(),
              name: 'Business Owner',
              email: 'owner@example.com',
            },
          },
        ],
        business_wallet: {
          balance: 0, // Plain number
          previous_balance: 0, // Plain number
        },
      },
    },
  };

  const mockSubscription = {
    id: uuidv4(),
    user_id: mockCreateSubscriptionDto.user_id,
    plan_id: mockPlanPrice.subscription_plan.id,
    plan_name_at_subscription: mockPlanPrice.subscription_plan.name,
    plan_price_at_subscription: mockPlanPrice.price,
    start_date: new Date(),
    end_date: new Date(),
    grace_end_date: new Date(),
    is_active: true,
    payment_method: PaymentMethod.PAYSTACK,
    billing_interval: mockPlanPrice.period,
    next_payment_date: new Date(),
    auto_renew: mockCreateSubscriptionDto.auto_renew,
    charge_auth_code: 'test-auth-code',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn().mockImplementation(async (callback) => {
              const payment = {
                findUnique: jest.fn().mockResolvedValue(mockPayment),
                create: jest.fn().mockResolvedValue(mockPayment),
                update: jest.fn().mockResolvedValue(mockPayment),
              };

              const subscription = {
                findFirst: jest.fn().mockResolvedValue(null),
                create: jest.fn().mockResolvedValue(mockSubscription),
                update: jest.fn().mockResolvedValue(mockSubscription),
              };

              const businessWallet = {
                update: jest.fn().mockResolvedValue({}),
              };

              const log = {
                create: jest.fn().mockResolvedValue({}),
              };

              return callback({ payment, subscription, businessWallet, log });
            }),
          },
        },
        {
          provide: PaystackService,
          useValue: {
            initializeTransaction: jest.fn().mockResolvedValue({
              data: {
                authorization_url: 'https://paystack.com/authorize',
                reference: 'test-transaction-id',
              },
            }),
            verifyTransaction: jest.fn().mockResolvedValue({
              data: {
                status: 'success',
                authorization: {
                  authorization_code: 'test-auth-code',
                },
              },
            }),
          },
        },
        {
          provide: SubscriptionPlanPriceService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockPlanPrice),
          },
        },
        {
          provide: AuthService,
          useValue: {
            getUser: jest.fn().mockImplementation((prismaUser, userId) => {
              if (userId === mockCreateSubscriptionDto.user_id) {
                return mockUser;
              }
              return null;
            }),
          },
        },
        {
          provide: BillingService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockBillingDetails),
          },
        },
        {
          provide: LogService,
          useValue: {
            createWithTrx: jest.fn().mockResolvedValue({}),
          },
        },
        {
          provide: MailService,
          useValue: {
            subscriptionEmail: jest.fn().mockResolvedValue({}),
            subscriptionNotificationEmail: jest.fn().mockResolvedValue({}),
            subscriptionRenewalEmail: jest.fn().mockResolvedValue({}),
            subscriptionRenewalNotificationEmail: jest
              .fn()
              .mockResolvedValue({}),
            subscriptionUpgradeEmail: jest.fn().mockResolvedValue({}),
            subscriptionUpgradeNotificationEmail: jest
              .fn()
              .mockResolvedValue({}),
          },
        },
        {
          provide: GenericService,
          useValue: {
            encrypt: jest.fn().mockReturnValue('test-auth-code'),
          },
        },
        {
          provide: Logger,
          useValue: {
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
    prismaService = module.get<PrismaService>(PrismaService);
    paystackService = module.get<PaystackService>(PaystackService);
    subscriptionPlanPriceService = module.get<SubscriptionPlanPriceService>(
      SubscriptionPlanPriceService,
    );
    authService = module.get<AuthService>(AuthService);
    billingService = module.get<BillingService>(BillingService);
    logService = module.get<LogService>(LogService);
    mailService = module.get<MailService>(MailService);
    genericService = module.get<GenericService>(GenericService);
  });

  describe('createSubscription', () => {
    it('should create a subscription and initialize payment successfully', async () => {
      // Act
      const result = await subscriptionService.createSubscription(
        mockRequest,
        mockCreateSubscriptionDto,
      );

      // Assert
      expect(result.statusCode).toEqual(HttpStatus.OK);
      expect(result.message).toBe('Payment initialized successfully.');
      expect(result.data.authorization_url).toBe(
        'https://paystack.com/authorize',
      );
      expect(result.data.payment_id).toBe(mockPayment.id);

      // Verify dependencies were called
      expect(subscriptionPlanPriceService.findOne).toHaveBeenCalledWith(
        mockCreateSubscriptionDto.plan_price_id,
      );
      expect(authService.getUser).toHaveBeenCalledWith(
        prismaService.user,
        mockCreateSubscriptionDto.user_id,
      );
      expect(billingService.findOne).toHaveBeenCalledWith(
        mockCreateSubscriptionDto.billing_id,
        mockCreateSubscriptionDto.user_id,
      );
      expect(paystackService.initializeTransaction).toHaveBeenCalledWith({
        email: mockUser.email,
        amount: mockPlanPrice.price,
        metadata: {
          user_id: mockCreateSubscriptionDto.user_id,
          plan_id: mockPlanPrice.subscription_plan.id,
          plan: mockPlanPrice.subscription_plan.name,
          interval: mockPlanPrice.period,
        },
      });
    });

    it('should throw ConflictException if user already has an active subscription', async () => {
      // Mock the user to have an active subscription
      jest.spyOn(authService, 'getUser').mockResolvedValue({
        ...(mockUser as any),
        subscriptions: [mockSubscription as any],
      });

      // Act & Assert
      await expect(
        subscriptionService.createSubscription(
          mockRequest,
          mockCreateSubscriptionDto,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment and create subscription successfully', async () => {
      // Act
      const result = await subscriptionService.verifyPayment(
        mockRequest,
        mockVerifySubscriptionDto,
      );

      // Assert
      expect(result.statusCode).toEqual(HttpStatus.OK);
      expect(result.message).toBe(
        'Payment verified and subscription created successfully.',
      );

      // Verify dependencies were called
      expect(paystackService.verifyTransaction).toHaveBeenCalledWith(
        mockPayment.transaction_id,
      );
      expect(logService.createWithTrx).toHaveBeenCalled();
      expect(mailService.subscriptionEmail).toHaveBeenCalled();
      expect(mailService.subscriptionNotificationEmail).toHaveBeenCalled();
    });

    it('should throw NotFoundException if payment record does not exist', async () => {
      // Mock the payment record to be null
      // @ts-ignore
      jest
        // @ts-ignore
        .spyOn(prismaService, '$transaction')
        // @ts-ignore
        .mockImplementation(async (callback: any) => {
          return callback({
            payment: {
              findUnique: jest.fn().mockResolvedValue(null),
            },
          } as any);
        });

      // Act & Assert
      await expect(
        subscriptionService.verifyPayment(
          mockRequest,
          mockVerifySubscriptionDto,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if payment is already verified', async () => {
      // Mock the payment record to have a SUCCESS status
      // @ts-ignore
      jest
        // @ts-ignore
        .spyOn(prismaService, '$transaction')
        // @ts-ignore
        .mockImplementation(async (callback: any) => {
          return callback({
            payment: {
              findUnique: jest.fn().mockResolvedValue({
                ...mockPayment,
                payment_status: PaymentStatus.SUCCESS,
              }),
            },
          } as any);
        });

      // Act & Assert
      await expect(
        subscriptionService.verifyPayment(
          mockRequest,
          mockVerifySubscriptionDto,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadGatewayException if payment verification fails', async () => {
      // Mock Prisma transaction to execute business logic
      jest
        .spyOn(prismaService, '$transaction')
        .mockImplementation(async (callback) => {
          return callback({
            // @ts-ignore
            payment: {
              findUnique: jest.fn().mockResolvedValue({
                id: mockVerifySubscriptionDto.payment_id,
                payment_status: PaymentStatus.PENDING,
                subscription_plan: {
                  business: {
                    business_contacts: [{}], // Ensure there is at least one business contact
                  },
                },
              }),
              update: jest.fn().mockResolvedValue({
                id: mockVerifySubscriptionDto.payment_id,
                payment_status: PaymentStatus.FAILED,
              }),
            },
          });
        });

      // Mock Paystack verification to fail
      jest.spyOn(paystackService, 'verifyTransaction').mockResolvedValueOnce({
        data: {
          status: 'failed',
        },
      } as any);

      // Mock Paystack verification to fail
      // jest.spyOn(paystackService, 'verifyTransaction').mockResolvedValueOnce({
      //   data: {
      //     status: 'failed',
      //   },
      // });

      // Act & Assert
      await expect(
        subscriptionService.verifyPayment(
          mockRequest,
          mockVerifySubscriptionDto,
        ),
      ).rejects.toThrow(BadGatewayException);
    });
  });
});

describe('SubscriptionService - Auto renewal', () => {
  let subscriptionService: SubscriptionService;
  let prisma: PrismaService;
  let paystackService: PaystackService;
  let mailService: MailService;
  let logService: LogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [RbacModule],
      providers: [
        SubscriptionService,
        {
          provide: PrismaService,
          useValue: {
            subscription: {
              findMany: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            subscriptionPlanPrice: {
              findFirst: jest.fn(),
            },
            payment: {
              findFirst: jest.fn(),
              create: jest.fn(),
            },
            businessWallet: {
              update: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: PaystackService,
          useValue: {
            chargeAuthorization: jest.fn(),
          },
        },
        SubscriptionPlanPriceService,
        AuthService,
        BillingService,
        {
          provide: MailService,
          useValue: {
            subscriptionRenewalEmail: jest.fn(),
            subscriptionRenewalNotificationEmail: jest.fn(),
            paymentFailure: jest.fn(),
          },
        },
        Logger,
        GenericService,
        {
          provide: LogService,
          useValue: {
            createWithTrx: jest.fn(),
          },
        },
        ConfigService,
        JwtService,
      ],
    }).compile();

    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
    prisma = module.get<PrismaService>(PrismaService);
    paystackService = module.get<PaystackService>(PaystackService);
    mailService = module.get<MailService>(MailService);
    logService = module.get<LogService>(LogService);
  });

  describe('processAutoRenewals', () => {
    it('should process auto-renewals for subscriptions due for renewal', async () => {
      // Mock data
      const now = new Date();
      const mockSubscription: any = {
        id: 1,
        is_active: true,
        auto_renew: true,
        next_payment_date: now,
        grace_end_date: now,
        user_id: 1,
        plan_id: 1,
        billing_interval: 'monthly',
        currency: 'USD',
        charge_auth_code: 'encrypted_code',
        user: {
          id: 1,
          email: 'user@example.com',
          name: 'John Doe',
        },
        subscription_plan: {
          id: 1,
          business: {
            id: 1,
            user: {
              id: 2,
              email: 'business@example.com',
            },
            business_wallet: {
              id: 1,
              business_id: 1,
              balance: 1000,
            },
          },
        },
      };

      const mockSubscriptionPlanPrice: any = {
        id: 1,
        subscription_plan_id: 1,
        period: 'monthly',
        price: '100',
      };

      const mockPreviousPaymentRecord: any = {
        id: 1,
        user_id: 1,
        purchase_id: 1,
        purchase_type: 'SUBSCRIPTION',
        billing_id: 'billing_123',
        billing_at_payment: '2023-01-01',
      };

      const mockPaymentResponse: any = {
        status: true,
        data: {
          reference: 'paystack_ref_123',
        },
      };

      jest
        .spyOn(prisma.subscription, 'findMany')
        .mockResolvedValue([mockSubscription]);

      jest
        .spyOn(prisma.subscriptionPlanPrice, 'findFirst')
        .mockResolvedValue(mockSubscriptionPlanPrice);

      jest
        .spyOn(prisma.payment, 'findFirst')
        .mockResolvedValue(mockPreviousPaymentRecord);

      jest.spyOn(prisma.payment, 'create').mockResolvedValue({
        id: '2',
        user_id: '2',
        auto_renew: true,
        payment_method: PaymentMethod.PAYSTACK,
        transaction_id: mockPaymentResponse.data.reference,
        purchase_id: '1',
        purchase_type: 'SUBSCRIPTION',
        billing_id: 'billing_123',
        billing_at_payment: '2023-01-01',
      } as any);

      // Properly mock $transaction
      jest.spyOn(prisma, '$transaction').mockImplementation((callback) => {
        return callback(prisma);
      });

      // Mock Paystack chargeAuthorization
      jest
        .spyOn(paystackService, 'chargeAuthorization')
        .mockResolvedValue(mockPaymentResponse);

      // Call the method
      await subscriptionService.processAutoRenewals();

      // Assertions
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.subscription.findMany).toHaveBeenCalled();
      expect(paystackService.chargeAuthorization).toHaveBeenCalled();
      expect(prisma.payment.create).toHaveBeenCalled();
      expect(mailService.subscriptionRenewalEmail).toHaveBeenCalled();
      expect(
        mailService.subscriptionRenewalNotificationEmail,
      ).toHaveBeenCalled();
    });

    it('should handle payment failure and send failure email', async () => {
      // Mock data
      const now = new Date();
      const mockSubscription = {
        id: 1,
        is_active: true,
        auto_renew: true,
        next_payment_date: now,
        grace_end_date: now,
        user_id: 1,
        plan_id: 1,
        billing_interval: 'monthly',
        currency: 'USD',
        charge_auth_code: 'encrypted_code',
        user: {
          id: 1,
          email: 'user@example.com',
          name: 'John Doe',
        },
        subscription_plan: {
          id: 1,
          business: {
            id: 1,
            user: {
              id: 2,
              email: 'business@example.com',
            },
            business_wallet: {
              id: 1,
              business_id: 1,
              balance: 1000,
            },
          },
        },
      };

      const mockSubscriptionPlanPrice = {
        id: 1,
        subscription_plan_id: 1,
        period: 'monthly',
        price: '100',
      };

      const mockPreviousPaymentRecord = {
        id: 1,
        user_id: 1,
        purchase_id: 1,
        purchase_type: 'SUBSCRIPTION',
        billing_id: 'billing_123',
        billing_at_payment: '2023-01-01',
      };

      const mockPaymentResponse = {
        status: false,
        message: 'Payment failed',
      };

      // Mock Prisma methods
      // @ts-ignore
      prisma.subscription = {
        findMany: jest.fn().mockResolvedValue([mockSubscription]),
        update: jest.fn(),
      };
      // @ts-ignore
      prisma.subscriptionPlanPrice = {
        findFirst: jest.fn().mockResolvedValue(mockSubscriptionPlanPrice),
      };
      // @ts-ignore
      prisma.payment = {
        findFirst: jest.fn().mockResolvedValue(mockPreviousPaymentRecord),
        create: jest.fn(),
      };
      // @ts-ignore
      prisma.businessWallet = {
        update: jest.fn(),
      };
      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        return callback(prisma);
      });

      // Mock Paystack chargeAuthorization to fail
      // @ts-ignore
      paystackService.chargeAuthorization.mockResolvedValue(
        mockPaymentResponse,
      );

      // Call the method
      await subscriptionService.processAutoRenewals();

      // Assertions
      expect(paystackService.chargeAuthorization).toHaveBeenCalled();
      expect(mailService.paymentFailure).toHaveBeenCalled();
    });

    it('should log and skip subscriptions with missing plan price or payment record', async () => {
      // Mock data
      const now = new Date();
      const mockSubscription = {
        id: '1',
        is_active: true,
        auto_renew: true,
        next_payment_date: now,
        grace_end_date: now,
        user_id: 1,
        plan_id: 1,
        billing_interval: 'monthly',
        currency: 'USD',
        charge_auth_code: 'encrypted_code',
        user: {
          id: 1,
          email: 'user@example.com',
          name: 'John Doe',
        },
        subscription_plan: {
          id: 1,
          business: {
            id: 1,
            user: {
              id: 2,
              email: 'business@example.com',
            },
            business_wallet: {
              id: 1,
              business_id: 1,
              balance: 1000,
            },
          },
        },
      };

      // Mock Prisma methods
      // @ts-ignore
      prisma.subscription = {
        findMany: jest.fn().mockResolvedValue([mockSubscription]),
        update: jest.fn(),
      };
      // @ts-ignore
      prisma.subscriptionPlanPrice = {
        findFirst: jest.fn().mockResolvedValue(null), // Missing plan price
      };
      // @ts-ignore
      prisma.payment = {
        findFirst: jest.fn().mockResolvedValue(null), // Missing payment record
        create: jest.fn(),
      };
      // @ts-ignore
      prisma.businessWallet = {
        update: jest.fn(),
      };
      prisma.$transaction = jest.fn().mockImplementation(async (callback) => {
        return callback(prisma);
      });

      // Call the method
      await subscriptionService.processAutoRenewals();

      // Assertions
      expect(prisma.subscriptionPlanPrice.findFirst).toHaveBeenCalled();
      expect(prisma.payment.findFirst).toHaveBeenCalled();
      expect(paystackService.chargeAuthorization).not.toHaveBeenCalled();
    });
  });
});

jest.mock('../prisma/prisma.service');
jest.mock('../generic/providers/paystack/paystack.provider');
jest.mock('../log/log.service');

const mockRequest = {
  headers: { 'user-agent': 'TestAgent' },
  ip: '127.0.0.1',
} as any;

describe('SubscriptionService - initiateSubscriptionRenewal', () => {
  let service: SubscriptionService;
  let prisma: jest.Mocked<PrismaService>;
  let paystackService: jest.Mocked<PaystackService>;
  let logService: jest.Mocked<LogService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaService>();
    paystackService = mockDeep<PaystackService>();
    logService = mockDeep<LogService>();

    const module: TestingModule = await Test.createTestingModule({
      imports: [RbacModule],
      providers: [
        SubscriptionService,
        { provide: PrismaService, useValue: prisma },
        { provide: PaystackService, useValue: paystackService },
        { provide: LogService, useValue: logService },
        SubscriptionPlanPriceService,
        AuthService,
        BillingService,
        {
          provide: MailService,
          useValue: {
            subscriptionRenewalEmail: jest.fn(),
            subscriptionRenewalNotificationEmail: jest.fn(),
            paymentFailure: jest.fn(),
          },
        },
        Logger,
        GenericService,
        ConfigService,
        JwtService,
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
  });

  afterEach(() => {
    mockReset(prisma);
    mockReset(paystackService);
    mockReset(logService);
  });

  it('should throw NotFoundException if subscription is not found', async () => {
    prisma.$transaction.mockImplementation(async (callback) => {
      return callback(prisma); // Ensures transaction callback is executed
    });

    // @ts-ignore
    prisma.subscription.findUnique.mockResolvedValue(null);

    await expect(
      service.initiateSubscriptionRenewal({} as any, {
        subscription_id: 'invalid-id',
      }),
    ).rejects.toThrowError(new NotFoundException('Subscription not found.'));
  });

  it('should throw NotFoundException if subscription plan price is not found', async () => {
    prisma.$transaction.mockImplementation(async (callback) => {
      return callback(prisma);
    });

    // @ts-ignore
    prisma.subscription.findUnique.mockResolvedValue({
      id: 'sub-id',
      user: { email: 'test@example.com', id: 'user-id' },
      subscription_plan: { subscription_plan_prices: [] },
      billing_interval: 'monthly',
    });

    await expect(
      // @ts-ignore
      service.initiateSubscriptionRenewal({}, { subscription_id: 'sub-id' }),
    ).rejects.toThrow(
      new NotFoundException('Subscription plan price not found.'),
    );
  });

  it('should throw an error if Paystack transaction fails', async () => {
    prisma.$transaction.mockImplementation(async (callback) => {
      return callback(prisma);
    });

    // @ts-ignore
    prisma.subscription.findUnique.mockResolvedValue({
      id: 'sub-id',
      user: { email: 'test@example.com', id: 'user-id' },
      subscription_plan: {
        subscription_plan_prices: [{ period: 'monthly', price: 1000 }],
      },
      billing_interval: 'monthly',
    });

    paystackService.initializeTransaction.mockRejectedValue(
      new Error('Paystack error'),
    );

    await expect(
      // @ts-ignore
      service.initiateSubscriptionRenewal({}, { subscription_id: 'sub-id' }),
    ).rejects.toThrow('Paystack error');
  });

  it('should successfully initiate subscription renewal', async () => {
    prisma.$transaction.mockImplementation(async (callback) => {
      return callback(prisma);
    });

    // @ts-ignore
    prisma.subscription.findUnique.mockResolvedValue({
      id: 'sub-id',
      user: { email: 'test@example.com', id: 'user-id' },
      subscription_plan: {
        name: 'Premium',
        subscription_plan_prices: [{ period: 'monthly', price: 1000 }],
      },
      billing_interval: 'monthly',
    });

    paystackService.initializeTransaction.mockResolvedValue({
      // @ts-ignore
      data: {
        reference: 'trx-ref',
        authorization_url: 'https://paystack.com/pay',
      },
    });

    // @ts-ignore
    prisma.payment.create.mockResolvedValue({ id: 'payment-id' });

    const result = await service.initiateSubscriptionRenewal(
      // @ts-ignore
      mockRequest,
      { subscription_id: 'sub-id' },
    );

    expect(result).toEqual({
      statusCode: 200,
      message: 'Subscription renewal initiated successfully.',
      data: {
        authorization_url: 'https://paystack.com/pay',
        payment_id: 'payment-id',
      },
    });
  });
});
