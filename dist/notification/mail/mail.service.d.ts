import { Role } from '@/generic/generic.data';
import { PurchaseSchema } from '@/payment/payment.payload';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { User, PaymentMethod, PaymentStatus, SubscriptionPeriod, Notification, BusinessInformation } from '@prisma/client';
export declare class MailService {
    private mailerService;
    private configService;
    constructor(mailerService: MailerService, configService: ConfigService);
    emailVerification(user: User, data: {
        token: string;
        allowOtp?: boolean;
    }): Promise<any>;
    resendEmailVerification(user: User, token: string, allowOtp?: boolean): Promise<any>;
    verifiedEmail(user: User): Promise<any>;
    loginRequest(user: User, otp: string): Promise<any>;
    requestPasswordReset(user: User, token: string): Promise<any>;
    requestPasswordCreationLink(user: User, token: string): Promise<any>;
    updatedPassword(user: User): Promise<any>;
    requestEmailUpdate(user: User, otp: string): Promise<any>;
    updatedEmail(user: User): Promise<any>;
    inviteMemberEmail(email: string, business_name: string, role: string, expiry: string, token: string): Promise<any>;
    acceptedInvitationEmail(user: User, business_name: string, joined_date: string, invitee_email: string): Promise<any>;
    reinviteMemberEmail(email: string, business_name: string, role: string, expiry: string, token: string): Promise<any>;
    welcomeCustomerEmail(user: User, token: string): Promise<any>;
    subscriptionEmail(user: User, data: {
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
    }): Promise<any>;
    subscriptionNotificationEmail(user: User, data: {
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
    }): Promise<any>;
    subscriptionRenewalEmail(user: User, data: {
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
    }): Promise<any>;
    subscriptionRenewalNotificationEmail(user: User, data: {
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
    }): Promise<any>;
    paymentFailure(user: User, data: {
        subscription: {
            id: string;
            grace_period_days: number;
            plan_name: string;
        };
    }): Promise<any>;
    subscriptionDeactivated(user: User, data: {
        subscription: {
            id: string;
            plan_name: string;
        };
    }): Promise<any>;
    subscriptionUpgradeEmail(user: User, data: {
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
    }): Promise<any>;
    subscriptionUpgradeNotificationEmail(user: User, data: {
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
    }): Promise<any>;
    customEmail(user: User, notification: Notification & {
        business: BusinessInformation;
    }): Promise<any>;
    purchaseConfirmation(user: User, data: {
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
    }): Promise<any>;
    purchaseConfirmationNotificationEmail(user: User, data: {
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
    }): Promise<any>;
    cartReminderEmail(user: User, data: {
        items: PurchaseSchema[];
    }): Promise<any>;
    accountSuspensionEmail(user: User, data: {
        account_id: string;
        suspension_reason: string;
    }): Promise<any>;
    accountRestorationEmail(user: User, data: {
        account_id: string;
    }): Promise<any>;
    accountPasswordUpdateEmail(user: User, data: {
        role: Role;
    }): Promise<any>;
    removeMemberFromOrganizationEmail(user: User, data: {
        business_name: string;
        position: string;
    }): Promise<any>;
    suspendMemberInOrganizationEmail(user: User, data: {
        business_name: string;
        status: string;
    }): Promise<any>;
    restoreMemberToOrganizationEmail(user: User, data: {
        business_name: string;
    }): Promise<any>;
    onboardCustomerEmailWithCredentials(customer: User, businessName: string, email: string, password: string, loginUrl: string, business_page: string): Promise<any>;
    onboardCustomerNotification(owner: User, customerId: string, customerName: string, businessName: string): Promise<any>;
    sendContactMessage(data: {
        inquiry: string;
        description: string;
        name: string;
        organization: string;
        email: string;
        phone: string;
        message: string;
    }): Promise<void>;
    transferPaymentReceipt(user: User, data: {
        referenceID: string;
        date: string;
        amount: string;
        balance: string;
        previous_balance: string;
        payment_method: string;
    }): Promise<void>;
    withdrawalAccountNotification(data: {
        name: string;
        user_id: string;
        email: string;
        withdrawal_account: string;
        requested_date: string;
    }): Promise<void>;
    newSignupNotification(data: {
        name: string;
        email: string;
        signupDate: string;
        userId: string;
        location: string;
        link: string;
    }): Promise<any>;
    kycSubmitted(user: User | any, data: {
        business_name: string;
        business_id: string;
        user_id: string;
        email: string;
    }): Promise<any>;
    kycApproved(user: User): Promise<any>;
    kycRejected(user: User, data: {
        reason: string;
    }): Promise<any>;
}
