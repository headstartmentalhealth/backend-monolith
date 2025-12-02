import { Role } from '@/generic/generic.data';
import { PurchaseSchema } from '@/payment/payment.payload';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  User,
  PaymentMethod,
  PaymentStatus,
  SubscriptionPeriod,
  Notification,
  BusinessInformation,
} from '@prisma/client';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  /**
   * Send any verification email
   * @param any
   * @param token - token
   * @returns
   */
  async emailVerification(
    user: User,
    data: { token: string; allowOtp?: boolean },
  ) {
    try {
      const { token, allowOtp = true } = data;

      const url =
        !allowOtp &&
        `${this.configService.get('BUSINESS_FRONTEND_URL')}/auth/confirm?token=${token}`;

      const otp = allowOtp && token;

      return await this.mailerService.sendMail({
        to: user.email,
        subject: `Welcome to ${this.configService.get('APP_NAME')}! Verify Your Email to Get Started 🚀`,
        template: allowOtp
          ? './email-verification-otp'
          : './email-verification', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          name: user.name,
          url,
          otp,
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Resend verification email
   * @param user
   * @param token
   * @returns
   */
  async resendEmailVerification(user: User, token: string, allowOtp?: boolean) {
    try {
      const url =
        !allowOtp &&
        `${this.configService.get('BUSINESS_FRONTEND_URL')}/auth/confirm?token=${token}`;

      const otp = allowOtp && token;

      return await this.mailerService.sendMail({
        to: user.email,
        subject: `Verify Your Email Address to Complete Your Registration`,
        template: allowOtp
          ? './resend-email-verification-otp'
          : './resend-email-verification', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          name: user.name,
          url,
          otp,
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Message for verified email
   * @param user
   * @returns
   */
  async verifiedEmail(user: User) {
    try {
      const url = `${this.configService.get('BUSINESS_FRONTEND_URL')}/auth/signin`;

      return await this.mailerService.sendMail({
        to: user.email,
        subject: `Your Email Has Been Verified - Let's Get Started!`,
        template: './verified-email', // `.hbs` extension is appended automatically
        context: {
          name: user.name,
          url,
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Login request email
   * @param user
   * @param otp
   * @returns
   */
  async loginRequest(user: User, otp: string) {
    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `🔐 Your Login OTP is Here!`,
        template: './login-request-email', // `.hbs` extension is appended automatically
        context: {
          name: user.name,
          otp,
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Request password reset
   * @param user
   * @param token
   * @returns
   */
  async requestPasswordReset(user: User, token: string) {
    try {
      const url = `${this.configService.get(
        'BUSINESS_FRONTEND_URL',
      )}/auth/change-password?token=${token}`;

      return await this.mailerService.sendMail({
        to: user.email,
        subject: `🔑 Password Reset Request`,
        template: './password-reset', // `.hbs` extension is appended automatically
        context: {
          name: user.name,
          url,
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Request password creation link
   * @param user
   * @param token
   * @returns
   */
  async requestPasswordCreationLink(user: User, token: string) {
    try {
      const url = `${this.configService.get(
        'BUSINESS_FRONTEND_URL',
      )}/auth/set-password?token=${token}`;

      return await this.mailerService.sendMail({
        to: user.email,
        subject: `🔑 Here’s your new Doexcess password setup link`,
        template: './password-creation', // `.hbs` extension is appended automatically
        context: {
          name: user.name,
          url,
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Password updated email
   * @param user
   * @returns
   */
  async updatedPassword(user: User) {
    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `🎉 Your Password Has Been Reset Successfully!`,
        template: './password-reset-done', // `.hbs` extension is appended automatically
        context: {
          name: user.name,
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Request email update
   * @param user
   * @param otp
   * @returns
   */
  async requestEmailUpdate(user: User, otp: string) {
    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `Confirm Your Email Update Request`,
        template: './request-email-update', // `.hbs` extension is appended automatically
        context: {
          name: user.name,
          otp,
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Updated email
   * @param user
   * @returns
   */
  async updatedEmail(user: User) {
    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `Your Account's Email Address Has Been Updated Successfully`,
        template: './updated-email', // `.hbs` extension is appended automatically
        context: {
          name: user.name,
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Invite member email
   * @param email
   * @param business_name
   * @param role
   * @param expiry_date
   * @param token
   * @returns
   */
  async inviteMemberEmail(
    email: string,
    business_name: string,
    role: string,
    expiry: string,
    token: string,
  ) {
    const url = `${this.configService.get(
      'BUSINESS_FRONTEND_URL',
    )}/invitation/join?token=${token}`;

    try {
      return await this.mailerService.sendMail({
        to: email,
        subject: `You're invited to join ${business_name} on ${this.configService.get<string>('APP_NAME')}!`,
        template: './invite-member-email', // `.hbs` extension is appended automatically
        context: {
          business_name,
          role,
          expiry,
          url,
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Accepted invitation email
   * @param user
   * @param business_name
   * @param role
   * @param joined_date
   * @param invitee_email
   * @returns
   */
  async acceptedInvitationEmail(
    user: User,
    business_name: string,
    joined_date: string,
    invitee_email: string,
  ) {
    const url = `${this.configService.get(
      'BUSINESS_FRONTEND_URL',
    )}/signin?redirect_url=/team`;

    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `Your invitee has accepted your invitation to join ${business_name}`,
        template: './accepted-invitation-email', // `.hbs` extension is appended automatically
        context: {
          name: user.name,
          business_name,
          url,
          joined_date,
          invitee_email,
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Re-invite member email
   * @param email
   * @param business_name
   * @param role
   * @param expiry_date
   * @param token
   * @returns
   */
  async reinviteMemberEmail(
    email: string,
    business_name: string,
    role: string,
    expiry: string,
    token: string,
  ) {
    const url = `${this.configService.get(
      'BUSINESS_FRONTEND_URL',
    )}/invitation/join?token=${token}`;

    try {
      return await this.mailerService.sendMail({
        to: email,
        subject: `🚀 Just a quick reminder - you're invited to join ${business_name}!`,
        template: './reinvite-member-email', // `.hbs` extension is appended automatically
        context: {
          business_name,
          role,
          expiry,
          url,
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Welcome customer email
   * @param user
   * @param token
   * @returns
   */
  async welcomeCustomerEmail(user: User, token: string) {
    try {
      const set_password_url = `${this.configService.get(
        'BUSINESS_FRONTEND_URL',
      )}/auth/set-password?token=${token}`;

      const login_url = `${this.configService.get(
        'BUSINESS_FRONTEND_URL',
      )}/auth/signin`;

      return await this.mailerService.sendMail({
        to: user.email,
        subject: `Welcome to ${this.configService.get('APP_NAME')}! Let's get your account set up 🚀`,
        template: './welcome-customer', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          name: user.name,
          set_password_url,
          login_url,
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Subscription email
   * @param user
   * @param token
   * @returns
   */
  async subscriptionEmail(
    user: User,
    data: {
      business_name: string;
      subscription: {
        id: string;
        created_at: string;
        plan_name: string;
        amount: string;
        interval: string;
        renewal_date: string;
        payment_method: PaymentMethod;
        auto_renew: string;
      };
    },
  ) {
    const { business_name, subscription } = data;
    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `Your ${subscription.plan_name} subscription receipt 🚀`,
        template: './subscription', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          name: user.name,
          business_name,
          subscription_id: subscription.id,
          subscription_date: subscription.created_at,
          plan_name: subscription.plan_name,
          amount: subscription.amount,
          interval: subscription.interval,
          renewal_date: subscription.renewal_date,
          payment_method: subscription.payment_method,
          auto_renew: subscription.auto_renew,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Subscription notification to business owner
   * @param user
   * @param data
   * @returns
   */
  async subscriptionNotificationEmail(
    user: User,
    data: {
      subscriber_name: string;
      subscription: {
        id: string;
        created_at: string;
        plan_name: string;
        amount: string;
        interval: string;
        end_date: string;
        payment_method: PaymentMethod;
        auto_renew: string;
        payment_status: PaymentStatus;
      };
    },
  ) {
    const { subscriber_name, subscription } = data;

    const business_subscription_page_link = `${this.configService.get<string>('BUSINESS_FRONTEND_URL')}/auth/signin?redir_url=/payments/${subscription.id}/details`;

    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `📊 New Subscription: ${subscriber_name} has subscribed to ${subscription.plan_name}`,
        template: './subscription-notification-email', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          business_owner_name: user.name,
          subscriber_name,
          subscription_id: subscription.id,
          subscription_date: subscription.created_at,
          plan_name: subscription.plan_name,
          amount: subscription.amount,
          interval: subscription.interval,
          subscription_end_date: subscription.end_date,
          payment_method: subscription.payment_method,
          payment_status: subscription.payment_status,
          auto_renew: subscription.auto_renew,
          business_subscription_page_link,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Subscription renewal email
   * @param user
   * @param token
   * @returns
   */
  async subscriptionRenewalEmail(
    user: User,
    data: {
      business_name: string;
      subscription: {
        id: string;
        created_at: string;
        plan_name: string;
        amount: string;
        interval: string;
        next_renewal_date: string;
        payment_method: PaymentMethod;
        auto_renew: string;
      };
    },
  ) {
    const { business_name, subscription } = data;
    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `🎉 Your ${subscription.plan_name} subscription has been renewed!`,
        template: './subscription-renewal', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          name: user.name,
          business_name,
          subscription_id: subscription.id,
          subscription_date: subscription.created_at,
          plan_name: subscription.plan_name,
          amount: subscription.amount,
          interval: subscription.interval,
          next_renewal_date: subscription.next_renewal_date,
          payment_method: subscription.payment_method,
          auto_renew: subscription.auto_renew,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Subscription renewal notification to business owner
   * @param user
   * @param data
   * @returns
   */
  async subscriptionRenewalNotificationEmail(
    user: User,
    data: {
      subscriber_name: string;
      subscription: {
        id: string;
        created_at: string;
        plan_name: string;
        amount: string;
        interval: string;
        end_date: string;
        payment_method: PaymentMethod;
        auto_renew: string;
        payment_status: PaymentStatus;
      };
    },
  ) {
    const { subscriber_name, subscription } = data;

    const business_subscription_page_link = `${this.configService.get<string>('BUSINESS_FRONTEND_URL')}/subscription/${subscription.id}`;

    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `📊 Subscription Renewed: ${subscriber_name} has renewed their ${subscription.plan_name} subscription`,
        template: './subscription-renewal-notification-email', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          business_owner_name: user.name,
          subscriber_name,
          subscription_id: subscription.id,
          subscription_date: subscription.created_at,
          plan_name: subscription.plan_name,
          amount: subscription.amount,
          interval: subscription.interval,
          subscription_end_date: subscription.end_date,
          payment_method: subscription.payment_method,
          payment_status: subscription.payment_status,
          auto_renew: subscription.auto_renew,
          business_subscription_page_link,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Subscription payment failure notification
   * @param user
   * @param data
   * @returns
   */
  async paymentFailure(
    user: User,
    data: {
      subscription: {
        id: string;
        grace_period_days: number;
        plan_name: string;
      };
    },
  ) {
    const { subscription } = data;

    const subscription_renewal_link = `${this.configService.get<string>('BUSINESS_FRONTEND_URL')}/subscription/${subscription.id}`;

    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `🚨 Payment failed - Renew your subscription`,
        template: './payment-failure', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          name: user.name,
          plan_name: subscription.plan_name,
          subscription_id: subscription.id,
          grace_period_days: subscription.grace_period_days,
          subscription_renewal_link,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Subscription deactivated email
   * @param user
   * @param data
   * @returns
   */
  async subscriptionDeactivated(
    user: User,
    data: { subscription: { id: string; plan_name: string } },
  ) {
    const { subscription } = data;

    const subscription_reactivation_link = `${this.configService.get<string>('BUSINESS_FRONTEND_URL')}/subscription/${subscription.id}`;

    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `😢 Subscription Deactivated - Reactivate Now`,
        template: './subscription-deactivated', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          name: user.name,
          plan_name: subscription.plan_name,
          subscription_id: subscription.id,
          subscription_reactivation_link,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Subscription upgrade email
   * @param user
   * @param data
   * @returns
   */
  async subscriptionUpgradeEmail(
    user: User,
    data: {
      business_name: string;
      subscription: {
        id: string;
        created_at: string;
        old_plan_name: string;
        old_plan_period: SubscriptionPeriod;
        new_plan_name: string;
        amount: string;
        interval: SubscriptionPeriod;
        next_renewal_date: string;
        payment_method: PaymentMethod;
        auto_renew: string;
      };
    },
  ) {
    const { business_name, subscription } = data;
    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `🎉 Your subscription has been upgraded!`,
        template: './subscription-upgrade', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          name: user.name,
          business_name,
          subscription_id: subscription.id,
          subscription_date: subscription.created_at,
          old_plan_name: subscription.old_plan_name,
          old_plan_period: subscription.old_plan_period,
          new_plan_name: subscription.new_plan_name,
          amount: subscription.amount,
          interval: subscription.interval,
          next_renewal_date: subscription.next_renewal_date,
          payment_method: subscription.payment_method,
          auto_renew: subscription.auto_renew,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Subscription upgrade notification to business owner
   * @param user
   * @param data
   * @returns
   */
  async subscriptionUpgradeNotificationEmail(
    user: User,
    data: {
      subscriber_name: string;
      subscription: {
        id: string;
        created_at: string;
        old_plan_name: string;
        old_plan_period: SubscriptionPeriod;
        new_plan_name: string;
        amount: string;
        interval: SubscriptionPeriod;
        end_date: string;
        payment_method: PaymentMethod;
        auto_renew: string;
        payment_status: PaymentStatus;
      };
    },
  ) {
    const { subscriber_name, subscription } = data;

    const business_subscription_page_link = `${this.configService.get<string>('BUSINESS_FRONTEND_URL')}/subscription/${subscription.id}`;

    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `🔔 Subscription upgrade alert: ${subscriber_name}`,
        template: './subscription-upgrade-notification-email', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          business_owner_name: user.name,
          subscriber_name,
          subscription_id: subscription.id,
          subscription_date: subscription.created_at,
          old_plan_name: subscription.old_plan_name,
          old_plan_period: subscription.old_plan_period,
          new_plan_name: subscription.new_plan_name,
          amount: subscription.amount,
          interval: subscription.interval,
          subscription_end_date: subscription.end_date,
          payment_method: subscription.payment_method,
          payment_status: subscription.payment_status,
          auto_renew: subscription.auto_renew,
          business_subscription_page_link,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Custom email
   * @param user
   * @param notification
   * @returns
   */
  async customEmail(
    user: User,
    notification: Notification & { business: BusinessInformation },
  ) {
    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `${notification.title}`,
        template: './custom', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          body: notification.message,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: notification.business.logo_url,
          is_client_logo: true,
          business_name: notification.business.business_name,
          company_page: `${this.configService.get<string>('FRONTEND_URL')}/${notification.business_id}`,
          social_media_handles: notification.business.social_media_handles,
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Purchase confirmation email
   * @param user
   * @param data
   * @returns
   */
  async purchaseConfirmation(
    user: User,
    data: {
      business_name: string;
      gateway: string;
      payment_status: string;
      currency: string;
      total: string;
      discount_applied: string;
      sub_total: string;
      items: PurchaseSchema[];
      payment_date: string;
      payment_id: string;
    },
  ) {
    const {
      business_name,
      gateway,
      payment_status,
      currency,
      total,
      discount_applied,
      sub_total,
      items,
      payment_date,
      payment_id,
    } = data;
    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `Your Purchase Was Successful! 🎉`,
        template: './purchase-confirmation', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          business_name,
          name: user.name,
          gateway,
          payment_status,
          currency,
          total,
          discount_applied,
          sub_total,
          items,
          payment_date,
          payment_id,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Purchase confirmation notification to business owner
   * @param user
   * @param data
   * @returns
   */
  async purchaseConfirmationNotificationEmail(
    user: User,
    data: {
      buyer_name: string;
      gateway: string;
      payment_status: string;
      currency: string;
      total: string;
      discount_applied: string;
      sub_total: string;
      items: PurchaseSchema[];
      payment_date: string;
      payment_id: string;
    },
  ) {
    const {
      buyer_name,
      gateway,
      payment_status,
      currency,
      total,
      discount_applied,
      sub_total,
      items,
      payment_date,
      payment_id,
    } = data;

    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `New Purchase Alert! 🎉`,
        template: './purchase-confirmation-notification-email', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          buyer_name,
          business_owner_name: user.name,
          gateway,
          payment_status,
          currency,
          total,
          discount_applied,
          sub_total,
          items,
          payment_date,
          payment_id,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Cart reminder email
   * @param user
   * @param data
   * @returns
   */
  async cartReminderEmail(
    user: User,
    data: {
      items: PurchaseSchema[];
    },
  ) {
    const { items } = data;
    const cart_link = `${this.configService.get<string>('BUSINESS_FRONTEND_URL')}/cart`;

    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `Don't Miss Out! Your Cart is Waiting for You 🛍️`,
        template: './cart-reminder', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          name: user.name,
          items,
          cart_link,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Account suspension email
   * @param user
   * @param data
   * @returns
   */
  async accountSuspensionEmail(
    user: User,
    data: {
      account_id: string;
      suspension_reason: string;
    },
  ) {
    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `⚠️ Account Suspension Notice for Your Business Account`,
        template: './account-suspension-email', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          name: user.name,
          ...data,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Account restoration email
   * @param user
   * @param data
   * @returns
   */
  async accountRestorationEmail(user: User, data: { account_id: string }) {
    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `🎉 Your Account has been successfully restored`,
        template: './account-unsuspension-email', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          name: user.name,
          ...data,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Account password update email
   * @param user
   * @param data
   * @returns
   */
  async accountPasswordUpdateEmail(user: User, data: { role: Role }) {
    const { role } = data;
    let link = '';

    switch (role) {
      case Role.BUSINESS_ADMIN:
      case Role.BUSINESS_SUPER_ADMIN:
        link = `${this.configService.get<string>('BUSINESS_FRONTEND_URL')}/reset-password`;
      case Role.OWNER_ADMIN:
      case Role.OWNER_SUPER_ADMIN:
        link = `${this.configService.get<string>('ADMIN_FRONTEND_URL')}/reset-password`;
      case Role.USER:
        link = `${this.configService.get<string>('BUSINESS_FRONTEND_URL')}/reset-password`;
    }
    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `🔐 Your Password Was Updated Successfully`,
        template: './updated-password', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          name: user.name,
          link,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Remove member from organization email
   * @param user
   * @param data
   * @returns
   */
  async removeMemberFromOrganizationEmail(
    user: User,
    data: { business_name: string; position: string },
  ) {
    const { business_name } = data;
    let link = '';

    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `You've been removed from ${business_name} organization`,
        template: './remove-member-org-email', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          name: user.name,
          ...data,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Suspend member in organization email
   * @param user
   * @param data
   * @returns
   */
  async suspendMemberInOrganizationEmail(
    user: User,
    data: { business_name: string; status: string },
  ) {
    const { business_name } = data;

    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `Your access to ${business_name} organization has been suspended`,
        template: './suspend-member-in-org-email', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          name: user.name,
          ...data,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * restore member to organization email
   * @param user
   * @param data
   * @returns
   */
  async restoreMemberToOrganizationEmail(
    user: User,
    data: { business_name: string },
  ) {
    const { business_name } = data;

    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `Your access to ${business_name} organization has been restored`,
        template: './restore-member-in-org-email', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          name: user.name,
          ...data,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * Send onboarding email to customer
   */
  // async onboardCustomerEmail(customer: User, businessName: string) {
  //   try {
  //     return await this.mailerService.sendMail({
  //       to: customer.email,
  //       subject: `Welcome to ${businessName}! Your Onboarding is Complete`,
  //       template: './onboard-customer',
  //       context: {
  //         name: customer.name,
  //         business_name: businessName,
  //         app: this.configService.get<string>('APP_NAME'),
  //         logo: this.configService.get<string>('APP_LOGO'),
  //         address: this.configService.get<string>('COMPANY_ADDRESS'),
  //         year: new Date().getFullYear(),
  //       },
  //     });
  //   } catch (error) {
  //     console.log(error);
  //     return error;
  //   }
  // }

  /**
   * Send onboarding notification email to business owner
   */
  // async onboardOwnerEmail(
  //   owner: User,
  //   customerName: string,
  //   businessName: string,
  // ) {
  //   try {
  //     return await this.mailerService.sendMail({
  //       to: owner.email,
  //       subject: `A New Customer Has Been Successfully Onboarded`,
  //       template: './onboard-owner',
  //       context: {
  //         name: owner.name,
  //         customer_name: customerName,
  //         business_name: businessName,
  //         app: this.configService.get<string>('APP_NAME'),
  //         logo: this.configService.get<string>('APP_LOGO'),
  //         address: this.configService.get<string>('COMPANY_ADDRESS'),
  //         year: new Date().getFullYear(),
  //       },
  //     });
  //   } catch (error) {
  //     console.log(error);
  //     return error;
  //   }
  // }

  /**
   * Send onboarding email to customer (with credentials)
   */
  async onboardCustomerEmailWithCredentials(
    customer: User,
    businessName: string,
    email: string,
    password: string,
    loginUrl: string,
    business_page: string,
  ) {
    try {
      return await this.mailerService.sendMail({
        to: customer.email,
        subject: `Welcome to ${businessName}! Your onboarding is complete`,
        template: './onboard-customer',
        context: {
          name: customer.name,
          business_name: businessName,
          email,
          password,
          login_url: loginUrl,
          business_page,
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  /**
   * Notify business owner of new onboarded customer
   */
  async onboardCustomerNotification(
    owner: User,
    customerId: string,
    customerName: string,
    businessName: string,
  ) {
    try {
      return await this.mailerService.sendMail({
        to: owner.email,
        subject: `A new customer has been successfully onboarded`,
        template: './onboard-customer-notification',
        context: {
          name: owner.name,
          customer_id: customerId,
          customer_name: customerName,
          business_name: businessName,
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async sendContactMessage(data: {
    inquiry: string;
    description: string;
    name: string;
    organization: string;
    email: string;
    phone: string;
    message: string;
  }) {
    const url = `mailto:${data.email}`;

    await this.mailerService.sendMail({
      to: this.configService.get<string>('CONTACT_EMAIL'),
      // from: '"Support Team" <support@example.com>', // override default from
      subject: `Contact message from ${data.name}`,
      template: './contact-message', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        ...data,
        app: this.configService.get<string>('APP_NAME'),
        logo: this.configService.get<string>('APP_LOGO'),
        address: this.configService.get<string>('COMPANY_ADDRESS'),
        url,
        year: new Date().getFullYear(),
      },
    });
  }

  async transferPaymentReceipt(
    user: User,
    data: {
      referenceID: string;
      date: string;
      amount: string;
      balance: string;
      previous_balance: string;
      payment_method: string;
    },
  ) {
    await this.mailerService.sendMail({
      to: user.email,
      // from: '"Support Team" <support@example.com>', // override default from
      subject: `💸 Your Withdrawal Request Has Been Processed`,
      template: './transfer-receipt', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        name: user.name,
        email: user.email,
        ...data,
        support_email: this.configService.get<string>('SUPPORT_EMAIL'),
        app: this.configService.get<string>('APP_NAME'),
        logo: this.configService.get<string>('APP_LOGO'),
        address: this.configService.get<string>('COMPANY_ADDRESS'),
        year: new Date().getFullYear(),
      },
    });
  }

  async withdrawalAccountNotification(data: {
    name: string;
    user_id: string;
    email: string;
    withdrawal_account: string;
    requested_date: string;
  }) {
    await this.mailerService.sendMail({
      to: this.configService.get<string>('CONTACT_EMAIL'),
      // from: '"Support Team" <support@example.com>', // override default from
      subject: `Withdrawal Request Notification`,
      template: './withdrawal-request-notification', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        ...data,
        support_email: this.configService.get<string>('SUPPORT_EMAIL'),
        app: this.configService.get<string>('APP_NAME'),
        logo: this.configService.get<string>('APP_LOGO'),
        address: this.configService.get<string>('COMPANY_ADDRESS'),
        year: new Date().getFullYear(),
      },
    });
  }

  /**
   * New signup notification
   * @param data
   * @returns
   */
  async newSignupNotification(data: {
    name: string;
    email: string;
    signupDate: string;
    userId: string;
    location: string;
    link: string;
  }) {
    try {
      return await this.mailerService.sendMail({
        to: this.configService.get<string>('CONTACT_EMAIL'),
        subject: `New User Sign-Up Notification`,
        template: './new-signup-notification', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          ...data,
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * kyc submitted email
   * @param user
   * @param data
   * @returns
   */
  async kycSubmitted(
    user: User | any,
    data: {
      business_name: string;
      business_id: string;
      user_id: string;
      email: string;
    },
  ) {
    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `KYC Application Successfully Submitted`,
        template: './kyc-submitted', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          ...data,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * kyc approval email
   * @param user
   * @returns
   */
  async kycApproved(user: User) {
    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `Your KYC has been approved`,
        template: './kyc-approved', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          name: user.name,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }

  /**
   * kyc rejected email
   * @param user
   * @returns
   */
  async kycRejected(user: User, data: { reason: string }) {
    try {
      return await this.mailerService.sendMail({
        to: user.email,
        subject: `Your KYC couldn't be approved`,
        template: './kyc-rejected', // `.hbs` extension is appended automatically
        context: {
          // ✏️ filling curly brackets with content
          name: user.name,
          ...data,
          // Others
          support_email: this.configService.get<string>('SUPPORT_EMAIL'),
          app: this.configService.get<string>('APP_NAME'),
          logo: this.configService.get<string>('APP_LOGO'),
          address: this.configService.get<string>('COMPANY_ADDRESS'),
          year: new Date().getFullYear(),
        },
      });
    } catch (error) {
      console.log(error);

      return error;
    }
  }
}
