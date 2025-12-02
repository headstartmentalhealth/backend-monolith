import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { faker } from '@faker-js/faker/.';
import { v4 as uuidv4 } from 'uuid';
import {
  PaymentMethod,
  PaymentStatus,
  SubscriptionPeriod,
  User,
} from '@prisma/client';

describe('MailService', () => {
  let mailService: MailService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env', // Ensure you have a test-specific .env file if required
        }),
        MailerModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            transport: {
              host: configService.get('MAIL_HOST'),
              // port: configService.get('MAIL_PORT', 587),
              secure: false, // Use true for 465 (SSL)
              auth: {
                user: configService.get('MAIL_USER'),
                pass: configService.get('MAIL_PASSWORD'),
              },
            },
            defaults: {
              from: `"${configService.get('APP_NAME')}" <${configService.get('MAIL_FROM')}>`,
            },
            template: {
              dir: join(__dirname, 'templates'), // Path to email templates
              adapter:
                new (require('@nestjs-modules/mailer/dist/adapters/handlebars.adapter').HandlebarsAdapter)(),
              options: {
                strict: true,
              },
            },
          }),
        }),
      ],
      providers: [MailService],
      exports: [MailService],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(mailService).toBeDefined();
  });

  it('should send an email verification message', async () => {
    await mailService.emailVerification(
      {
        email: 'olaleyeemmanuel23@gmail.com',
        name: faker.person.firstName,
      } as any,
      String(Math.random()).split('.')[1] as any,
    );
  });

  it('should invoke the resend email verification notification method', async () => {
    await mailService.resendEmailVerification(
      {
        email: 'olaleyeemmanuel23@gmail.com',
        name: faker.person.firstName,
      } as any,
      String(Math.random()).split('.')[1],
    );
  });

  it('should invoke the verified email notification method', async () => {
    await mailService.verifiedEmail({
      email: 'olaleyeemmanuel23@gmail.com',
      name: faker.person.firstName,
    } as any);
  });

  it('should invoke the login request email', async () => {
    await mailService.loginRequest(
      {
        email: 'olaleyeemmanuel23@gmail.com',
        name: faker.person.firstName,
      } as any,
      '123456',
    );
  });

  it('should invoke the password reset request email', async () => {
    await mailService.requestPasswordReset(
      {
        email: 'olaleyeemmanuel23@gmail.com',
        name: faker.person.firstName,
      } as any,
      uuidv4(),
    );
  });

  it('should invoke the updated password email', async () => {
    await mailService.updatedPassword({
      email: 'olaleyeemmanuel23@gmail.com',
      name: faker.person.firstName,
    } as any);
  });

  describe('Account Module', () => {
    let mailService: MailService;
    let mailerService: MailerService;
    let configService: ConfigService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: MailerService,
            useValue: {
              sendMail: jest.fn().mockResolvedValue({}), // Mock sendMail method
            },
          },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                switch (key) {
                  case 'FRONTEND_URL':
                    return 'http://localhost:3000';
                  case 'BUSINESS_FRONTEND_URL':
                    return 'http://business.localhost:3000';
                  case 'APP_NAME':
                    return 'MyApp';
                  case 'APP_LOGO':
                    return 'http://localhost:3000/logo.png';
                  case 'COMPANY_ADDRESS':
                    return '123 Main St, City, Country';
                  default:
                    return null;
                }
              }),
            },
          },
        ],
      }).compile();

      mailService = module.get<MailService>(MailService);
      mailerService = module.get<MailerService>(MailerService);
      configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
      expect(mailService).toBeDefined();
    });

    describe('Invite Member Email', () => {
      it('should send an invite member email', async () => {
        const email = 'test@example.com';
        const business_name = 'Test Business';
        const role = 'member';
        const expiry = '7 days';
        const token = 'test-token';

        const result = await mailService.inviteMemberEmail(
          email,
          business_name,
          role,
          expiry,
          token,
        );

        expect(mailerService.sendMail).toHaveBeenCalledWith({
          to: email,
          subject: `You’re invited to join ${business_name} on MyApp!`,
          template: './invite-member-email',
          context: {
            business_name,
            role,
            expiry,
            url: 'http://localhost:3000/invitation/join?token=test-token',
            app: 'MyApp',
            logo: 'http://localhost:3000/logo.png',
            address: '123 Main St, City, Country',
            year: new Date().getFullYear(),
          },
        });
        expect(result).toBeDefined();
      });

      it('should handle errors when sending invite member email', async () => {
        const email = 'test@example.com';
        const business_name = 'Test Business';
        const role = 'member';
        const expiry = '7 days';
        const token = 'test-token';

        jest
          .spyOn(mailerService, 'sendMail')
          .mockRejectedValue(new Error('Failed to send email'));

        const result = await mailService.inviteMemberEmail(
          email,
          business_name,
          role,
          expiry,
          token,
        );

        expect(result).toBeInstanceOf(Error);
      });
    });

    describe('Accepted Invitation Email', () => {
      it('should send an accepted invitation email', async () => {
        const user: User | any = {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
        };
        const business_name = 'Test Business';
        const joined_date = '2023-10-01';
        const invitee_email = 'test@example.com';

        const result = await mailService.acceptedInvitationEmail(
          user,
          business_name,
          joined_date,
          invitee_email,
        );

        expect(mailerService.sendMail).toHaveBeenCalledWith({
          to: user.email,
          subject: `Your invitee has accepted your invitation to join ${business_name}`,
          template: './accepted-invitation-email',
          context: {
            name: user.name,
            business_name,
            url: 'http://business.localhost:3000/dashboard/invitations',
            joined_date,
            invitee_email,
            app: 'MyApp',
            logo: 'http://localhost:3000/logo.png',
            address: '123 Main St, City, Country',
            year: new Date().getFullYear(),
          },
        });
        expect(result).toBeDefined();
      });

      it('should handle errors when sending accepted invitation email', async () => {
        const user: User | any = {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
        };
        const business_name = 'Test Business';
        const joined_date = '2023-10-01';
        const invitee_email = 'test@example.com';

        jest
          .spyOn(mailerService, 'sendMail')
          .mockRejectedValue(new Error('Failed to send email'));

        const result = await mailService.acceptedInvitationEmail(
          user,
          business_name,
          joined_date,
          invitee_email,
        );

        expect(result).toBeInstanceOf(Error);
      });
    });

    describe('Reinvite Member Email', () => {
      it('should send a re-invite member email', async () => {
        const email = 'test@example.com';
        const business_name = 'Test Business';
        const role = 'member';
        const expiry = '7 days';
        const token = 'test-token';

        const result = await mailService.reinviteMemberEmail(
          email,
          business_name,
          role,
          expiry,
          token,
        );

        expect(mailerService.sendMail).toHaveBeenCalledWith({
          to: email,
          subject: `🚀 Just a quick reminder - you’re invited to join ${business_name}!`,
          template: './reinvite-member-email',
          context: {
            business_name,
            role,
            expiry,
            url: 'http://localhost:3000/invitation/join?token=test-token',
            app: 'MyApp',
            logo: 'http://localhost:3000/logo.png',
            address: '123 Main St, City, Country',
            year: new Date().getFullYear(),
          },
        });
        expect(result).toBeDefined();
      });

      it('should handle errors when sending re-invite member email', async () => {
        const email = 'test@example.com';
        const business_name = 'Test Business';
        const role = 'member';
        const expiry = '7 days';
        const token = 'test-token';

        jest
          .spyOn(mailerService, 'sendMail')
          .mockRejectedValue(new Error('Failed to send email'));

        const result = await mailService.reinviteMemberEmail(
          email,
          business_name,
          role,
          expiry,
          token,
        );

        expect(result).toBeInstanceOf(Error);
      });
    });
  });

  describe('Subscription Module', () => {
    let mailService: MailService;
    let mailerService: MailerService;
    let configService: ConfigService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          MailService,
          {
            provide: MailerService,
            useValue: {
              sendMail: jest.fn().mockResolvedValue({}),
            },
          },
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string) => {
                switch (key) {
                  case 'FRONTEND_URL':
                    return 'https://example.com';
                  case 'BUSINESS_FRONTEND_URL':
                    return 'https://business.example.com';
                  case 'APP_NAME':
                    return 'Test App';
                  case 'SUPPORT_EMAIL':
                    return 'support@example.com';
                  case 'APP_LOGO':
                    return 'https://example.com/logo.png';
                  case 'COMPANY_ADDRESS':
                    return '123 Main St, New York, NY 10001';
                  default:
                    return null;
                }
              }),
            },
          },
        ],
      }).compile();

      mailService = module.get<MailService>(MailService);
      mailerService = module.get<MailerService>(MailerService);
      configService = module.get<ConfigService>(ConfigService);
    });

    describe('welcomeCustomerEmail', () => {
      it('should send a welcome email to the customer', async () => {
        const user: User = {
          id: 'user-id',
          name: 'John Doe',
          email: 'john.doe@example.com',
          // Add other required fields
        } as User;
        const token = 'test-token';

        const result = await mailService.welcomeCustomerEmail(user, token);

        // Assertions
        expect(mailerService.sendMail).toHaveBeenCalledWith({
          to: user.email,
          subject: `Welcome to ${configService.get('APP_NAME')}! Let’s get your account set up 🚀`,
          template: './welcome-customer',
          context: {
            name: user.name,
            set_password_url: `${configService.get('FRONTEND_URL')}/auth/set-password?token=${token}`,
            login_url: `${configService.get('FRONTEND_URL')}/auth/customer-signin`,
            support_email: configService.get<string>('SUPPORT_EMAIL'),
            app: configService.get<string>('APP_NAME'),
            logo: configService.get<string>('APP_LOGO'),
            address: configService.get<string>('COMPANY_ADDRESS'),
            year: new Date().getFullYear(),
          },
        });
        expect(result).toEqual({});
      });
    });

    describe('subscriptionEmail', () => {
      it('should send a subscription email to the customer', async () => {
        const user: User = {
          id: 'user-id',
          name: 'John Doe',
          email: 'john.doe@example.com',
          // Add other required fields
        } as User;
        const data = {
          business_name: 'Test Business',
          subscription: {
            id: 'subscription-id',
            created_at: '2023-01-01',
            plan_name: 'Test Plan',
            amount: '$10.00',
            interval: 'monthly',
            renewal_date: '2024-01-01',
            payment_method: PaymentMethod.PAYSTACK,
            auto_renew: 'Enabled',
          },
        };

        const result = await mailService.subscriptionEmail(user, data);

        // Assertions
        expect(mailerService.sendMail).toHaveBeenCalledWith({
          to: user.email,
          subject: `Your ${data.subscription.plan_name} subscription receipt 🚀`,
          template: './subscription',
          context: {
            name: user.name,
            business_name: data.business_name,
            subscription_id: data.subscription.id,
            subscription_date: data.subscription.created_at,
            plan_name: data.subscription.plan_name,
            amount: data.subscription.amount,
            interval: data.subscription.interval,
            renewal_date: data.subscription.renewal_date,
            payment_method: data.subscription.payment_method,
            auto_renew: data.subscription.auto_renew,
            support_email: configService.get<string>('SUPPORT_EMAIL'),
            app: configService.get<string>('APP_NAME'),
            logo: configService.get<string>('APP_LOGO'),
            address: configService.get<string>('COMPANY_ADDRESS'),
            year: new Date().getFullYear(),
          },
        });
        expect(result).toEqual({});
      });
    });

    describe('subscriptionNotificationEmail', () => {
      it('should send a subscription notification email to the business owner', async () => {
        const user: User = {
          id: 'user-id',
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          // Add other required fields
        } as User;
        const data = {
          subscriber_name: 'John Doe',
          subscription: {
            id: 'subscription-id',
            created_at: '2023-01-01',
            plan_name: 'Test Plan',
            amount: '$10.00',
            interval: 'monthly',
            end_date: '2024-01-01',
            payment_method: PaymentMethod.PAYSTACK,
            auto_renew: 'Enabled',
            payment_status: PaymentStatus.SUCCESS,
          },
        };

        const result = await mailService.subscriptionNotificationEmail(
          user,
          data,
        );

        // Assertions
        expect(mailerService.sendMail).toHaveBeenCalledWith({
          to: user.email,
          subject: `📊 New Subscription: ${data.subscriber_name} has subscribed to ${data.subscription.plan_name}`,
          template: './subscription-notification-email',
          context: {
            business_owner_name: user.name,
            subscriber_name: data.subscriber_name,
            subscription_id: data.subscription.id,
            subscription_date: data.subscription.created_at,
            plan_name: data.subscription.plan_name,
            amount: data.subscription.amount,
            interval: data.subscription.interval,
            subscription_end_date: data.subscription.end_date,
            payment_method: data.subscription.payment_method,
            payment_status: data.subscription.payment_status,
            auto_renew: data.subscription.auto_renew,
            business_subscription_page_link: `${configService.get<string>('BUSINESS_FRONTEND_URL')}/subscription/${data.subscription.id}`,
            support_email: configService.get<string>('SUPPORT_EMAIL'),
            app: configService.get<string>('APP_NAME'),
            logo: configService.get<string>('APP_LOGO'),
            address: configService.get<string>('COMPANY_ADDRESS'),
            year: new Date().getFullYear(),
          },
        });
        expect(result).toEqual({});
      });
    });

    describe('subscriptionRenewalEmail', () => {
      it('should send a subscription renewal email to the customer', async () => {
        const user: User = {
          id: 'user-id',
          name: 'John Doe',
          email: 'john.doe@example.com',
          // Add other required fields
        } as User;
        const data = {
          business_name: 'Test Business',
          subscription: {
            id: 'subscription-id',
            created_at: '2023-01-01',
            plan_name: 'Test Plan',
            amount: '$10.00',
            interval: 'monthly',
            next_renewal_date: '2024-01-01',
            payment_method: PaymentMethod.PAYSTACK,
            auto_renew: 'Enabled',
          },
        };

        const result = await mailService.subscriptionRenewalEmail(user, data);

        // Assertions
        expect(mailerService.sendMail).toHaveBeenCalledWith({
          to: user.email,
          subject: `🎉 Your ${data.subscription.plan_name} subscription has been renewed!`,
          template: './subscription-renewal',
          context: {
            name: user.name,
            business_name: data.business_name,
            subscription_id: data.subscription.id,
            subscription_date: data.subscription.created_at,
            plan_name: data.subscription.plan_name,
            amount: data.subscription.amount,
            interval: data.subscription.interval,
            next_renewal_date: data.subscription.next_renewal_date,
            payment_method: data.subscription.payment_method,
            auto_renew: data.subscription.auto_renew,
            support_email: configService.get<string>('SUPPORT_EMAIL'),
            app: configService.get<string>('APP_NAME'),
            logo: configService.get<string>('APP_LOGO'),
            address: configService.get<string>('COMPANY_ADDRESS'),
            year: new Date().getFullYear(),
          },
        });
        expect(result).toEqual({});
      });
    });

    describe('subscriptionRenewalNotificationEmail', () => {
      it('should send a subscription renewal notification email to the business owner', async () => {
        const user: User = {
          id: 'user-id',
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          // Add other required fields
        } as User;
        const data = {
          subscriber_name: 'John Doe',
          subscription: {
            id: 'subscription-id',
            created_at: '2023-01-01',
            plan_name: 'Test Plan',
            amount: '$10.00',
            interval: 'monthly',
            end_date: '2024-01-01',
            payment_method: PaymentMethod.PAYSTACK,
            auto_renew: 'Enabled',
            payment_status: PaymentStatus.SUCCESS,
          },
        };

        const result = await mailService.subscriptionRenewalNotificationEmail(
          user,
          data,
        );

        // Assertions
        expect(mailerService.sendMail).toHaveBeenCalledWith({
          to: user.email,
          subject: `📊 Subscription Renewed: ${data.subscriber_name} has renewed their ${data.subscription.plan_name} subscription`,
          template: './subscription-renewal-notification-email',
          context: {
            business_owner_name: user.name,
            subscriber_name: data.subscriber_name,
            subscription_id: data.subscription.id,
            subscription_date: data.subscription.created_at,
            plan_name: data.subscription.plan_name,
            amount: data.subscription.amount,
            interval: data.subscription.interval,
            subscription_end_date: data.subscription.end_date,
            payment_method: data.subscription.payment_method,
            payment_status: data.subscription.payment_status,
            auto_renew: data.subscription.auto_renew,
            business_subscription_page_link: `${configService.get<string>('BUSINESS_FRONTEND_URL')}/subscription/${data.subscription.id}`,
            support_email: configService.get<string>('SUPPORT_EMAIL'),
            app: configService.get<string>('APP_NAME'),
            logo: configService.get<string>('APP_LOGO'),
            address: configService.get<string>('COMPANY_ADDRESS'),
            year: new Date().getFullYear(),
          },
        });
        expect(result).toEqual({});
      });
    });

    describe('paymentFailure', () => {
      it('should send a payment failure email to the customer', async () => {
        const user: User = {
          id: 'user-id',
          name: 'John Doe',
          email: 'john.doe@example.com',
          // Add other required fields
        } as User;
        const data = {
          subscription: {
            id: 'subscription-id',
            grace_period_days: 7,
            plan_name: 'Test Plan',
          },
        };

        const result = await mailService.paymentFailure(user, data);

        // Assertions
        expect(mailerService.sendMail).toHaveBeenCalledWith({
          to: user.email,
          subject: `🚨 Payment failed - Renew your subscription`,
          template: './payment-failure',
          context: {
            name: user.name,
            plan_name: data.subscription.plan_name,
            subscription_id: data.subscription.id,
            grace_period_days: data.subscription.grace_period_days,
            subscription_renewal_link: `${configService.get<string>('FRONTEND_URL')}/subscription/${data.subscription.id}`,
            support_email: configService.get<string>('SUPPORT_EMAIL'),
            app: configService.get<string>('APP_NAME'),
            logo: configService.get<string>('APP_LOGO'),
            address: configService.get<string>('COMPANY_ADDRESS'),
            year: new Date().getFullYear(),
          },
        });
        expect(result).toEqual({});
      });
    });

    describe('subscriptionDeactivated', () => {
      it('should send a subscription deactivated email to the customer', async () => {
        const user: User = {
          id: 'user-id',
          name: 'John Doe',
          email: 'john.doe@example.com',
          // Add other required fields
        } as User;
        const data = {
          subscription: {
            id: 'subscription-id',
            plan_name: 'Test Plan',
          },
        };

        const result = await mailService.subscriptionDeactivated(user, data);

        // Assertions
        expect(mailerService.sendMail).toHaveBeenCalledWith({
          to: user.email,
          subject: `😢 Subscription Deactivated - Reactivate Now`,
          template: './subscription-deactivated',
          context: {
            name: user.name,
            plan_name: data.subscription.plan_name,
            subscription_id: data.subscription.id,
            subscription_reactivation_link: `${configService.get<string>('FRONTEND_URL')}/subscription/${data.subscription.id}`,
            support_email: configService.get<string>('SUPPORT_EMAIL'),
            app: configService.get<string>('APP_NAME'),
            logo: configService.get<string>('APP_LOGO'),
            address: configService.get<string>('COMPANY_ADDRESS'),
            year: new Date().getFullYear(),
          },
        });
        expect(result).toEqual({});
      });
    });

    describe('subscriptionUpgradeEmail', () => {
      it('should send a subscription upgrade email to the customer', async () => {
        const user: User = {
          id: 'user-id',
          name: 'John Doe',
          email: 'john.doe@example.com',
          // Add other required fields
        } as User;
        const data = {
          business_name: 'Test Business',
          subscription: {
            id: 'subscription-id',
            created_at: '2023-01-01',
            old_plan_name: 'Old Plan',
            old_plan_period: SubscriptionPeriod.monthly,
            new_plan_name: 'New Plan',
            amount: '$20.00',
            interval: SubscriptionPeriod.monthly,
            next_renewal_date: '2024-01-01',
            payment_method: PaymentMethod.PAYSTACK,
            auto_renew: 'Enabled',
          },
        };

        const result = await mailService.subscriptionUpgradeEmail(user, data);

        // Assertions
        expect(mailerService.sendMail).toHaveBeenCalledWith({
          to: user.email,
          subject: `🎉 Your subscription has been upgraded!`,
          template: './subscription-upgrade',
          context: {
            name: user.name,
            business_name: data.business_name,
            subscription_id: data.subscription.id,
            subscription_date: data.subscription.created_at,
            old_plan_name: data.subscription.old_plan_name,
            old_plan_period: data.subscription.old_plan_period,
            new_plan_name: data.subscription.new_plan_name,
            amount: data.subscription.amount,
            interval: data.subscription.interval,
            next_renewal_date: data.subscription.next_renewal_date,
            payment_method: data.subscription.payment_method,
            auto_renew: data.subscription.auto_renew,
            support_email: configService.get<string>('SUPPORT_EMAIL'),
            app: configService.get<string>('APP_NAME'),
            logo: configService.get<string>('APP_LOGO'),
            address: configService.get<string>('COMPANY_ADDRESS'),
            year: new Date().getFullYear(),
          },
        });
        expect(result).toEqual({});
      });
    });

    describe('subscriptionUpgradeNotificationEmail', () => {
      it('should send a subscription upgrade notification email to the business owner', async () => {
        const user: User = {
          id: 'user-id',
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          // Add other required fields
        } as User;
        const data = {
          subscriber_name: 'John Doe',
          subscription: {
            id: 'subscription-id',
            created_at: '2023-01-01',
            old_plan_name: 'Old Plan',
            old_plan_period: SubscriptionPeriod.monthly,
            new_plan_name: 'New Plan',
            amount: '$20.00',
            interval: SubscriptionPeriod.monthly,
            end_date: '2024-01-01',
            payment_method: PaymentMethod.PAYSTACK,
            auto_renew: 'Enabled',
            payment_status: PaymentStatus.SUCCESS,
          },
        };

        const result = await mailService.subscriptionUpgradeNotificationEmail(
          user,
          data,
        );

        // Assertions
        expect(mailerService.sendMail).toHaveBeenCalledWith({
          to: user.email,
          subject: `🔔 Subscription upgrade alert: ${data.subscriber_name}`,
          template: './subscription-upgrade-notification-email',
          context: {
            business_owner_name: user.name,
            subscriber_name: data.subscriber_name,
            subscription_id: data.subscription.id,
            subscription_date: data.subscription.created_at,
            old_plan_name: data.subscription.old_plan_name,
            old_plan_period: data.subscription.old_plan_period,
            new_plan_name: data.subscription.new_plan_name,
            amount: data.subscription.amount,
            interval: data.subscription.interval,
            subscription_end_date: data.subscription.end_date,
            payment_method: data.subscription.payment_method,
            payment_status: data.subscription.payment_status,
            auto_renew: data.subscription.auto_renew,
            business_subscription_page_link: `${configService.get<string>('BUSINESS_FRONTEND_URL')}/subscription/${data.subscription.id}`,
            support_email: configService.get<string>('SUPPORT_EMAIL'),
            app: configService.get<string>('APP_NAME'),
            logo: configService.get<string>('APP_LOGO'),
            address: configService.get<string>('COMPANY_ADDRESS'),
            year: new Date().getFullYear(),
          },
        });
        expect(result).toEqual({});
      });
    });
  });
});
