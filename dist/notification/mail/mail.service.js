"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const generic_data_1 = require("../../generic/generic.data");
const mailer_1 = require("@nestjs-modules/mailer");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let MailService = class MailService {
    constructor(mailerService, configService) {
        this.mailerService = mailerService;
        this.configService = configService;
    }
    async emailVerification(user, data) {
        try {
            const { token, allowOtp = true } = data;
            const url = !allowOtp &&
                `${this.configService.get('BUSINESS_FRONTEND_URL')}/auth/confirm?token=${token}`;
            const otp = allowOtp && token;
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Welcome to ${this.configService.get('APP_NAME')}! Verify Your Email to Get Started 🚀`,
                template: allowOtp
                    ? './email-verification-otp'
                    : './email-verification',
                context: {
                    name: user.name,
                    url,
                    otp,
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async resendEmailVerification(user, token, allowOtp) {
        try {
            const url = !allowOtp &&
                `${this.configService.get('BUSINESS_FRONTEND_URL')}/auth/confirm?token=${token}`;
            const otp = allowOtp && token;
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Verify Your Email Address to Complete Your Registration`,
                template: allowOtp
                    ? './resend-email-verification-otp'
                    : './resend-email-verification',
                context: {
                    name: user.name,
                    url,
                    otp,
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async verifiedEmail(user) {
        try {
            const url = `${this.configService.get('BUSINESS_FRONTEND_URL')}/auth/signin`;
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Your Email Has Been Verified - Let's Get Started!`,
                template: './verified-email',
                context: {
                    name: user.name,
                    url,
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async loginRequest(user, otp) {
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Your Login OTP is Here!`,
                template: './login-request-email',
                context: {
                    name: user.name,
                    otp,
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async requestPasswordReset(user, token) {
        try {
            const url = `${this.configService.get('BUSINESS_FRONTEND_URL')}/auth/change-password?token=${token}`;
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Password Reset Request`,
                template: './password-reset',
                context: {
                    name: user.name,
                    url,
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async requestPasswordCreationLink(user, token) {
        try {
            const url = `${this.configService.get('BUSINESS_FRONTEND_URL')}/auth/set-password?token=${token}`;
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Here’s your new Doexcess password setup link`,
                template: './password-creation',
                context: {
                    name: user.name,
                    url,
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async updatedPassword(user) {
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Your Password Has Been Reset Successfully!`,
                template: './password-reset-done',
                context: {
                    name: user.name,
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async requestEmailUpdate(user, otp) {
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Confirm Your Email Update Request`,
                template: './request-email-update',
                context: {
                    name: user.name,
                    otp,
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async updatedEmail(user) {
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Your Account's Email Address Has Been Updated Successfully`,
                template: './updated-email',
                context: {
                    name: user.name,
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async inviteMemberEmail(email, business_name, role, expiry, token) {
        const url = `${this.configService.get('BUSINESS_FRONTEND_URL')}/invitation/join?token=${token}`;
        try {
            return await this.mailerService.sendMail({
                to: email,
                subject: `You're invited to join ${business_name} on ${this.configService.get('APP_NAME')}!`,
                template: './invite-member-email',
                context: {
                    business_name,
                    role,
                    expiry,
                    url,
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async acceptedInvitationEmail(user, business_name, joined_date, invitee_email) {
        const url = `${this.configService.get('BUSINESS_FRONTEND_URL')}/signin?redirect_url=/team`;
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Your invitee has accepted your invitation to join ${business_name}`,
                template: './accepted-invitation-email',
                context: {
                    name: user.name,
                    business_name,
                    url,
                    joined_date,
                    invitee_email,
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async reinviteMemberEmail(email, business_name, role, expiry, token) {
        const url = `${this.configService.get('BUSINESS_FRONTEND_URL')}/invitation/join?token=${token}`;
        try {
            return await this.mailerService.sendMail({
                to: email,
                subject: `Just a quick reminder - you're invited to join ${business_name}!`,
                template: './reinvite-member-email',
                context: {
                    business_name,
                    role,
                    expiry,
                    url,
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async welcomeCustomerEmail(user, token) {
        try {
            const set_password_url = `${this.configService.get('BUSINESS_FRONTEND_URL')}/auth/set-password?token=${token}`;
            const login_url = `${this.configService.get('BUSINESS_FRONTEND_URL')}/auth/signin`;
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Welcome to ${this.configService.get('APP_NAME')}! Let's get your account set up 🚀`,
                template: './welcome-customer',
                context: {
                    name: user.name,
                    set_password_url,
                    login_url,
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async subscriptionEmail(user, data) {
        const { business_name, subscription } = data;
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Your ${subscription.plan_name} subscription receipt`,
                template: './subscription',
                context: {
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
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async subscriptionNotificationEmail(user, data) {
        const { subscriber_name, subscription } = data;
        const business_subscription_page_link = `${this.configService.get('BUSINESS_FRONTEND_URL')}/auth/signin?redir_url=/payments/${subscription.id}/details`;
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `New Subscription: ${subscriber_name} has subscribed to ${subscription.plan_name}`,
                template: './subscription-notification-email',
                context: {
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
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async subscriptionRenewalEmail(user, data) {
        const { business_name, subscription } = data;
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Your ${subscription.plan_name} subscription has been renewed!`,
                template: './subscription-renewal',
                context: {
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
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async subscriptionRenewalNotificationEmail(user, data) {
        const { subscriber_name, subscription } = data;
        const business_subscription_page_link = `${this.configService.get('BUSINESS_FRONTEND_URL')}/subscription/${subscription.id}`;
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Subscription Renewed: ${subscriber_name} has renewed their ${subscription.plan_name} subscription`,
                template: './subscription-renewal-notification-email',
                context: {
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
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async paymentFailure(user, data) {
        const { subscription } = data;
        const subscription_renewal_link = `${this.configService.get('BUSINESS_FRONTEND_URL')}/subscription/${subscription.id}`;
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Payment failed - Renew your subscription`,
                template: './payment-failure',
                context: {
                    name: user.name,
                    plan_name: subscription.plan_name,
                    subscription_id: subscription.id,
                    grace_period_days: subscription.grace_period_days,
                    subscription_renewal_link,
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async subscriptionDeactivated(user, data) {
        const { subscription } = data;
        const subscription_reactivation_link = `${this.configService.get('BUSINESS_FRONTEND_URL')}/subscription/${subscription.id}`;
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Subscription Deactivated - Reactivate Now`,
                template: './subscription-deactivated',
                context: {
                    name: user.name,
                    plan_name: subscription.plan_name,
                    subscription_id: subscription.id,
                    subscription_reactivation_link,
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async subscriptionUpgradeEmail(user, data) {
        const { business_name, subscription } = data;
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Your subscription has been upgraded!`,
                template: './subscription-upgrade',
                context: {
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
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async subscriptionUpgradeNotificationEmail(user, data) {
        const { subscriber_name, subscription } = data;
        const business_subscription_page_link = `${this.configService.get('BUSINESS_FRONTEND_URL')}/subscription/${subscription.id}`;
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Subscription upgrade alert: ${subscriber_name}`,
                template: './subscription-upgrade-notification-email',
                context: {
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
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async customEmail(user, notification) {
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `${notification.title}`,
                template: './custom',
                context: {
                    body: notification.message,
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: notification.business.logo_url,
                    is_client_logo: true,
                    business_name: notification.business.business_name,
                    company_page: `${this.configService.get('FRONTEND_URL')}/${notification.business_id}`,
                    social_media_handles: notification.business.social_media_handles,
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async purchaseConfirmation(user, data) {
        const { business_name, gateway, payment_status, currency, total, discount_applied, sub_total, items, payment_date, payment_id, } = data;
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Your Purchase Was Successful!`,
                template: './purchase-confirmation',
                context: {
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
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async purchaseConfirmationNotificationEmail(user, data) {
        const { buyer_name, gateway, payment_status, currency, total, discount_applied, sub_total, items, payment_date, payment_id, } = data;
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `New Purchase Alert!`,
                template: './purchase-confirmation-notification-email',
                context: {
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
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async cartReminderEmail(user, data) {
        const { items } = data;
        const cart_link = `${this.configService.get('BUSINESS_FRONTEND_URL')}/cart`;
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Don't Miss Out! Your Cart is Waiting for You`,
                template: './cart-reminder',
                context: {
                    name: user.name,
                    items,
                    cart_link,
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async accountSuspensionEmail(user, data) {
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Account Suspension Notice for Your Business Account`,
                template: './account-suspension-email',
                context: {
                    name: user.name,
                    ...data,
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async accountRestorationEmail(user, data) {
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Your Account has been successfully restored`,
                template: './account-unsuspension-email',
                context: {
                    name: user.name,
                    ...data,
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async accountPasswordUpdateEmail(user, data) {
        const { role } = data;
        let link = '';
        switch (role) {
            case generic_data_1.Role.BUSINESS_ADMIN:
            case generic_data_1.Role.BUSINESS_SUPER_ADMIN:
                link = `${this.configService.get('BUSINESS_FRONTEND_URL')}/reset-password`;
            case generic_data_1.Role.OWNER_ADMIN:
            case generic_data_1.Role.OWNER_SUPER_ADMIN:
                link = `${this.configService.get('ADMIN_FRONTEND_URL')}/reset-password`;
            case generic_data_1.Role.USER:
                link = `${this.configService.get('BUSINESS_FRONTEND_URL')}/reset-password`;
        }
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Your Password Was Updated Successfully`,
                template: './updated-password',
                context: {
                    name: user.name,
                    link,
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async removeMemberFromOrganizationEmail(user, data) {
        const { business_name } = data;
        let link = '';
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `You've been removed from ${business_name} organization`,
                template: './remove-member-org-email',
                context: {
                    name: user.name,
                    ...data,
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async suspendMemberInOrganizationEmail(user, data) {
        const { business_name } = data;
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Your access to ${business_name} organization has been suspended`,
                template: './suspend-member-in-org-email',
                context: {
                    name: user.name,
                    ...data,
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async restoreMemberToOrganizationEmail(user, data) {
        const { business_name } = data;
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Your access to ${business_name} organization has been restored`,
                template: './restore-member-in-org-email',
                context: {
                    name: user.name,
                    ...data,
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async onboardCustomerEmailWithCredentials(customer, businessName, email, password, loginUrl, business_page) {
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
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async onboardCustomerNotification(owner, customerId, customerName, businessName) {
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
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async sendContactMessage(data) {
        const url = `mailto:${data.email}`;
        await this.mailerService.sendMail({
            to: this.configService.get('CONTACT_EMAIL'),
            subject: `Contact message from ${data.name}`,
            template: './contact-message',
            context: {
                ...data,
                app: this.configService.get('APP_NAME'),
                logo: this.configService.get('APP_LOGO'),
                address: this.configService.get('COMPANY_ADDRESS'),
                url,
                year: new Date().getFullYear(),
            },
        });
    }
    async transferPaymentReceipt(user, data) {
        await this.mailerService.sendMail({
            to: user.email,
            subject: `Your Withdrawal Request Has Been Processed`,
            template: './transfer-receipt',
            context: {
                name: user.name,
                email: user.email,
                ...data,
                support_email: this.configService.get('SUPPORT_EMAIL'),
                app: this.configService.get('APP_NAME'),
                logo: this.configService.get('APP_LOGO'),
                address: this.configService.get('COMPANY_ADDRESS'),
                year: new Date().getFullYear(),
            },
        });
    }
    async withdrawalAccountNotification(data) {
        await this.mailerService.sendMail({
            to: this.configService.get('CONTACT_EMAIL'),
            subject: `Withdrawal Request Notification`,
            template: './withdrawal-request-notification',
            context: {
                ...data,
                support_email: this.configService.get('SUPPORT_EMAIL'),
                app: this.configService.get('APP_NAME'),
                logo: this.configService.get('APP_LOGO'),
                address: this.configService.get('COMPANY_ADDRESS'),
                year: new Date().getFullYear(),
            },
        });
    }
    async newSignupNotification(data) {
        try {
            return await this.mailerService.sendMail({
                to: this.configService.get('CONTACT_EMAIL'),
                subject: `New User Sign-Up Notification`,
                template: './new-signup-notification',
                context: {
                    ...data,
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async kycSubmitted(user, data) {
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `KYC Application Successfully Submitted`,
                template: './kyc-submitted',
                context: {
                    ...data,
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async kycApproved(user) {
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Your KYC has been approved`,
                template: './kyc-approved',
                context: {
                    name: user.name,
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
    async kycRejected(user, data) {
        try {
            return await this.mailerService.sendMail({
                to: user.email,
                subject: `Your KYC couldn't be approved`,
                template: './kyc-rejected',
                context: {
                    name: user.name,
                    ...data,
                    support_email: this.configService.get('SUPPORT_EMAIL'),
                    app: this.configService.get('APP_NAME'),
                    logo: this.configService.get('APP_LOGO'),
                    address: this.configService.get('COMPANY_ADDRESS'),
                    year: new Date().getFullYear(),
                },
            });
        }
        catch (error) {
            console.log(error);
            return error;
        }
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_1.MailerService,
        config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map