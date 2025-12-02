-- CreateEnum
CREATE TYPE "Action" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'INITATE_REGISTRATION', 'RESEND_VERIFICATION', 'LOGIN', 'RESET_PASSWORD', 'BUSINESS_ONBOARDING', 'WITHDRAWAL_ACCOUNT', 'CONTACT_INVITATION', 'SUBSCRIPTION_PLAN', 'SUBSCRIPTION_PLAN_PRICE', 'SUBSCRIPTION_PLAN_ROLE', 'MANAGE_COUPON', 'USE_COUPON', 'MANAGE_BILLING', 'CUSTOMER_REGISTRATION', 'SUBSCRIPTION_INITIATION', 'SUBSCRIPTION_PAYMENT', 'SUBSCRIPTION_RENEWAL_INITIATION', 'SUBSCRIPTION_UPGRADE_INITIATION', 'CUSTOM_EMAIL_NOTIFICATION', 'CUSTOM_WHATSAPP_NOTIFICATION', 'MANAGE_COURSE', 'MANAGE_COURSE_MODULE', 'MANAGE_MODULE_CONTENT', 'MANAGE_MULTIMEDIA', 'COURSE_PAYMENT_INITIATION', 'TICKET_PAYMENT_INITIATION', 'COURSE_PAYMENT_CONFIRMATION', 'TICKET_PAYMENT_CONFIRMATION', 'PRODUCT_PAYMENT_INITIATION', 'PRODUCT_PAYMENT_CONFIRMATION', 'OPERATE_CART', 'UPDATE_COURSE_PROGRESS', 'MANAGE_PRODUCT_CATEGORY', 'MANAGE_TICKET');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('google', 'facebook');

-- CreateEnum
CREATE TYPE "BusinessSize" AS ENUM ('small', 'medium', 'large');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('active', 'pending', 'expired');

-- CreateEnum
CREATE TYPE "SubscriptionPeriod" AS ENUM ('monthly', 'quarterly', 'semi_annually', 'yearly', 'free');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FLAT');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PAYSTACK');

-- CreateEnum
CREATE TYPE "PurchaseType" AS ENUM ('SUBSCRIPTION', 'COURSE', 'TICKET');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RefundType" AS ENUM ('REFUND', 'CHARGEBACK');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EMAIL', 'PUSH', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "PlatformType" AS ENUM ('Web_Push', 'Firebase');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MultimediaType" AS ENUM ('VIDEO', 'IMAGE', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "MultimediaProvider" AS ENUM ('CLOUDINARY', 'AWS_S3');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'DROPPED');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('COURSE', 'TICKET');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ONLINE', 'PHYSICAL', 'HYBRID');

-- CreateEnum
CREATE TYPE "TicketTierStatus" AS ENUM ('CLOSED', 'OPEN');

-- CreateTable
CREATE TABLE "logs" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36),
    "action" "Action" NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "role_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role_group_id" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "role_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" TEXT,
    "phone" VARCHAR(20),
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "role_identity" VARCHAR(255),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "profile_picture" VARCHAR(2048),
    "address" VARCHAR(255),
    "bio" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "gender" "Gender",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "country" VARCHAR(255) DEFAULT 'Nigeria',
    "state" VARCHAR(255),
    "country_code" CHAR(2) DEFAULT 'NG',

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "session_token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36),
    "ip_address" VARCHAR(45) NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "last_attempt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_logins" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "provider" "Provider",
    "provider_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_logins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verifications" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "verification_token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "onboarding_status" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 1,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "business_id" VARCHAR(36) NOT NULL,

    CONSTRAINT "onboarding_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_information" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "business_name" VARCHAR(255) NOT NULL,
    "business_size" "BusinessSize" NOT NULL,
    "timeline" VARCHAR(100) NOT NULL DEFAULT 'Africa/Lagos',
    "logo_url" VARCHAR(2048),
    "industry" VARCHAR(255) NOT NULL,
    "working_hours" VARCHAR(255),
    "location" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "country" VARCHAR(255) DEFAULT 'Nigeria',
    "state" VARCHAR(255),
    "country_code" CHAR(2) DEFAULT 'NG',

    CONSTRAINT "business_information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_wallets" (
    "id" TEXT NOT NULL,
    "business_id" VARCHAR(36) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "previous_balance" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'NGN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "business_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_contacts" (
    "id" TEXT NOT NULL,
    "business_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36),
    "is_owner" BOOLEAN NOT NULL DEFAULT false,
    "joined_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "status" "MemberStatus" NOT NULL DEFAULT 'pending',
    "token" VARCHAR(255),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),

    CONSTRAINT "business_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "otp" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawal_accounts" (
    "id" TEXT NOT NULL,
    "business_id" VARCHAR(36) NOT NULL,
    "account_number" VARCHAR(255) NOT NULL,
    "account_type" VARCHAR(100) NOT NULL,
    "bank_name" VARCHAR(255) NOT NULL,
    "routing_number" VARCHAR(255),
    "country" VARCHAR(255) NOT NULL DEFAULT 'Nigeria',
    "country_code" CHAR(2) NOT NULL DEFAULT 'NG',
    "currency" VARCHAR(255) NOT NULL DEFAULT 'NGN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "withdrawal_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "cover_image" VARCHAR(2048),
    "business_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "creator_id" VARCHAR(255) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plan_prices" (
    "id" TEXT NOT NULL,
    "subscription_plan_id" VARCHAR(255) NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'NGN',
    "creator_id" VARCHAR(255) NOT NULL,
    "period" "SubscriptionPeriod" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "subscription_plan_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plan_roles" (
    "id" TEXT NOT NULL,
    "subscription_plan_id" VARCHAR(255) NOT NULL,
    "creator_id" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "role_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "selected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "subscription_plan_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "creator_id" VARCHAR(255) NOT NULL,
    "business_id" VARCHAR(255) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "usage_limit" INTEGER NOT NULL,
    "user_limit" INTEGER NOT NULL,
    "min_purchase" DOUBLE PRECISION NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "currency" CHAR(3) NOT NULL DEFAULT 'NGN',

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_usages" (
    "id" TEXT NOT NULL,
    "coupon_id" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "discount_applied" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "coupon_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_information" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "address" TEXT NOT NULL,
    "state" VARCHAR(255) NOT NULL,
    "apartment" VARCHAR(255),
    "postal_code" VARCHAR(11) NOT NULL,
    "city" VARCHAR(255) NOT NULL,
    "country" VARCHAR(255) NOT NULL DEFAULT 'Nigeria',
    "country_code" CHAR(2) NOT NULL DEFAULT 'NG',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "selected" BOOLEAN DEFAULT false,

    CONSTRAINT "billing_information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "plan_id" VARCHAR(36) NOT NULL,
    "plan_name_at_subscription" VARCHAR(255) NOT NULL,
    "plan_price_at_subscription" DECIMAL(10,2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "payment_method" "PaymentMethod" NOT NULL,
    "billing_interval" "SubscriptionPeriod" NOT NULL,
    "next_payment_date" TIMESTAMP(3),
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "currency" CHAR(3) NOT NULL DEFAULT 'NGN',
    "grace_end_date" TIMESTAMP(3) NOT NULL,
    "charge_auth_code" VARCHAR(255),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "purchase_type" "PurchaseType",
    "purchase_id" VARCHAR(36),
    "amount" DECIMAL(10,2) NOT NULL,
    "discount_applied" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "payment_status" "PaymentStatus" NOT NULL,
    "transaction_id" VARCHAR(255),
    "payment_method" "PaymentMethod",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "billing_at_payment" JSONB,
    "billing_id" VARCHAR(36),
    "interval" "SubscriptionPeriod",
    "currency" CHAR(3) NOT NULL DEFAULT 'NGN',
    "auto_renew" BOOLEAN DEFAULT false,
    "is_renewal" BOOLEAN DEFAULT false,
    "is_upgrade" BOOLEAN DEFAULT false,
    "metadata" JSONB,
    "purchase" JSONB,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" TEXT NOT NULL,
    "payment_id" VARCHAR(36) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" VARCHAR(255),
    "status" "RefundStatus" NOT NULL,
    "type" "RefundType" NOT NULL DEFAULT 'REFUND',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "refund_method" "PaymentMethod" NOT NULL,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_gateway_logs" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "payload" JSONB NOT NULL,
    "metadata" JSONB,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payment_gateway_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "is_scheduled" BOOLEAN NOT NULL DEFAULT false,
    "business_id" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "type" "NotificationType" NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_devices" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "device_type" TEXT NOT NULL,
    "push_token" TEXT NOT NULL,
    "platform" "PlatformType" NOT NULL DEFAULT 'Firebase',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notification_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_notifications" (
    "id" TEXT NOT NULL,
    "notification_id" VARCHAR(36) NOT NULL,
    "scheduled_time" TIMESTAMP(3) NOT NULL,
    "status" "NotificationStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "scheduled_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_recipients" (
    "id" TEXT NOT NULL,
    "scheduled_notification_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "device_id" VARCHAR(36),
    "received_at" TIMESTAMP(3) NOT NULL,
    "status" "NotificationStatus" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "notification_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "business_id" VARCHAR(36) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "keywords" TEXT,
    "metadata" JSONB,
    "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "creator_id" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "multimedia_id" VARCHAR(36) NOT NULL,
    "price" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" TEXT NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "position" INTEGER NOT NULL,
    "creator_id" VARCHAR(36) NOT NULL,
    "business_id" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_contents" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "module_id" VARCHAR(36) NOT NULL,
    "creator_id" VARCHAR(36) NOT NULL,
    "business_id" VARCHAR(36) NOT NULL,
    "multimedia_id" VARCHAR(36) NOT NULL,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "module_contents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "multimedia" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "creator_id" VARCHAR(50),
    "business_id" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "provider" "MultimediaProvider" NOT NULL,
    "type" "MultimediaType" NOT NULL,

    CONSTRAINT "multimedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrolled_courses" (
    "id" TEXT NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "completed_lessons" INTEGER NOT NULL DEFAULT 0,
    "course_id" VARCHAR(50) NOT NULL,
    "total_lessons" INTEGER NOT NULL DEFAULT 0,
    "user_id" VARCHAR(50) NOT NULL,

    CONSTRAINT "enrolled_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_course_progress" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "module_content_id" VARCHAR(36) NOT NULL,
    "completed_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_course_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "cart_id" VARCHAR(36) NOT NULL,
    "product_id" VARCHAR(36) NOT NULL,
    "product_type" "ProductType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price_at_time" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "course_id" VARCHAR(36),
    "ticket_tier_id" VARCHAR(36),

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "creator_id" VARCHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "business_id" VARCHAR(36) NOT NULL,
    "category_id" VARCHAR(36) NOT NULL,
    "creator_id" VARCHAR(36) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "keywords" TEXT,
    "metadata" JSONB,
    "type" "ProductType" NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "archived_at" TIMESTAMP(3),
    "price" DECIMAL(10,2),
    "currency" VARCHAR(3) DEFAULT 'NGN',
    "original_price" DECIMAL(10,2),
    "multimedia_id" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "product_id" VARCHAR(36) NOT NULL,
    "event_start_date" TIMESTAMP(3),
    "event_end_date" TIMESTAMP(3),
    "event_location" TEXT,
    "event_type" "EventType" NOT NULL,
    "auth_details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_tiers" (
    "id" TEXT NOT NULL,
    "ticket_id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "quantity" INTEGER,
    "remaining_quantity" INTEGER,
    "max_per_purchase" INTEGER,
    "default_view" BOOLEAN NOT NULL DEFAULT false,
    "status" "TicketTierStatus" NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "currency" VARCHAR(3) DEFAULT 'NGN',
    "amount" DECIMAL(10,2),
    "original_amount" DECIMAL(10,2),

    CONSTRAINT "ticket_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchased_tickets" (
    "id" TEXT NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "ticket_id" VARCHAR(36) NOT NULL,
    "ticket_tier_id" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "purchased_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_instant_notification_recipients" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_instant_notification_recipients_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "logs_user_id_idx" ON "logs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_groups_name_key" ON "role_groups"("name");

-- CreateIndex
CREATE INDEX "role_groups_name_idx" ON "role_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_role_id_key" ON "roles"("role_id");

-- CreateIndex
CREATE INDEX "roles_role_id_idx" ON "roles"("role_id");

-- CreateIndex
CREATE INDEX "roles_role_group_id_idx" ON "roles"("role_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_role_identity_idx" ON "users"("role_identity");

-- CreateIndex
CREATE UNIQUE INDEX "profile_user_id_key" ON "profile"("user_id");

-- CreateIndex
CREATE INDEX "profile_user_id_idx" ON "profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_resets_token_key" ON "password_resets"("token");

-- CreateIndex
CREATE INDEX "password_resets_user_id_idx" ON "password_resets"("user_id");

-- CreateIndex
CREATE INDEX "rate_limits_user_id_idx" ON "rate_limits"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "social_logins_provider_id_key" ON "social_logins"("provider_id");

-- CreateIndex
CREATE INDEX "social_logins_user_id_idx" ON "social_logins"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_user_id_key" ON "email_verifications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_verifications_verification_token_key" ON "email_verifications"("verification_token");

-- CreateIndex
CREATE INDEX "email_verifications_user_id_idx" ON "email_verifications"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_status_business_id_key" ON "onboarding_status"("business_id");

-- CreateIndex
CREATE INDEX "onboarding_status_user_id_idx" ON "onboarding_status"("user_id");

-- CreateIndex
CREATE INDEX "onboarding_status_business_id_idx" ON "onboarding_status"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_status_user_id_business_id_key" ON "onboarding_status"("user_id", "business_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_information_business_name_key" ON "business_information"("business_name");

-- CreateIndex
CREATE INDEX "business_information_user_id_idx" ON "business_information"("user_id");

-- CreateIndex
CREATE INDEX "business_information_business_name_idx" ON "business_information"("business_name");

-- CreateIndex
CREATE UNIQUE INDEX "business_wallets_business_id_key" ON "business_wallets"("business_id");

-- CreateIndex
CREATE INDEX "business_wallets_business_id_idx" ON "business_wallets"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "business_contacts_token_key" ON "business_contacts"("token");

-- CreateIndex
CREATE INDEX "business_contacts_business_id_idx" ON "business_contacts"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "otps_user_id_key" ON "otps"("user_id");

-- CreateIndex
CREATE INDEX "otps_user_id_idx" ON "otps"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "withdrawal_accounts_business_id_key" ON "withdrawal_accounts"("business_id");

-- CreateIndex
CREATE INDEX "withdrawal_accounts_business_id_idx" ON "withdrawal_accounts"("business_id");

-- CreateIndex
CREATE INDEX "subscription_plans_name_idx" ON "subscription_plans"("name");

-- CreateIndex
CREATE INDEX "subscription_plans_business_id_idx" ON "subscription_plans"("business_id");

-- CreateIndex
CREATE INDEX "subscription_plans_creator_id_idx" ON "subscription_plans"("creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_name_business_id_key" ON "subscription_plans"("name", "business_id");

-- CreateIndex
CREATE INDEX "subscription_plan_prices_subscription_plan_id_idx" ON "subscription_plan_prices"("subscription_plan_id");

-- CreateIndex
CREATE INDEX "subscription_plan_prices_creator_id_idx" ON "subscription_plan_prices"("creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_prices_period_subscription_plan_id_key" ON "subscription_plan_prices"("period", "subscription_plan_id");

-- CreateIndex
CREATE INDEX "subscription_plan_roles_subscription_plan_id_idx" ON "subscription_plan_roles"("subscription_plan_id");

-- CreateIndex
CREATE INDEX "subscription_plan_roles_creator_id_idx" ON "subscription_plan_roles"("creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plan_roles_title_role_id_key" ON "subscription_plan_roles"("title", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_creator_id_idx" ON "coupons"("creator_id");

-- CreateIndex
CREATE INDEX "coupons_business_id_idx" ON "coupons"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_business_id_key" ON "coupons"("code", "business_id");

-- CreateIndex
CREATE INDEX "coupon_usages_coupon_id_idx" ON "coupon_usages"("coupon_id");

-- CreateIndex
CREATE INDEX "coupon_usages_user_id_idx" ON "coupon_usages"("user_id");

-- CreateIndex
CREATE INDEX "billing_information_user_id_idx" ON "billing_information"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_plan_id_idx" ON "subscriptions"("plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transaction_id_key" ON "payments"("transaction_id");

-- CreateIndex
CREATE INDEX "payments_user_id_idx" ON "payments"("user_id");

-- CreateIndex
CREATE INDEX "payments_purchase_type_idx" ON "payments"("purchase_type");

-- CreateIndex
CREATE INDEX "payments_purchase_id_idx" ON "payments"("purchase_id");

-- CreateIndex
CREATE INDEX "payments_payment_status_idx" ON "payments"("payment_status");

-- CreateIndex
CREATE INDEX "refunds_payment_id_idx" ON "refunds"("payment_id");

-- CreateIndex
CREATE INDEX "refunds_status_idx" ON "refunds"("status");

-- CreateIndex
CREATE INDEX "payment_gateway_logs_payment_id_idx" ON "payment_gateway_logs"("payment_id");

-- CreateIndex
CREATE INDEX "payment_gateway_logs_event_type_idx" ON "payment_gateway_logs"("event_type");

-- CreateIndex
CREATE INDEX "notifications_business_id_idx" ON "notifications"("business_id");

-- CreateIndex
CREATE INDEX "notification_devices_user_id_idx" ON "notification_devices"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_notifications_notification_id_key" ON "scheduled_notifications"("notification_id");

-- CreateIndex
CREATE INDEX "scheduled_notifications_notification_id_idx" ON "scheduled_notifications"("notification_id");

-- CreateIndex
CREATE INDEX "notification_recipients_scheduled_notification_id_user_id_d_idx" ON "notification_recipients"("scheduled_notification_id", "user_id", "device_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_multimedia_id_key" ON "courses"("multimedia_id");

-- CreateIndex
CREATE INDEX "courses_business_id_idx" ON "courses"("business_id");

-- CreateIndex
CREATE INDEX "courses_creator_id_idx" ON "courses"("creator_id");

-- CreateIndex
CREATE INDEX "courses_status_idx" ON "courses"("status");

-- CreateIndex
CREATE INDEX "modules_course_id_idx" ON "modules"("course_id");

-- CreateIndex
CREATE INDEX "modules_business_id_idx" ON "modules"("business_id");

-- CreateIndex
CREATE INDEX "modules_creator_id_idx" ON "modules"("creator_id");

-- CreateIndex
CREATE INDEX "module_contents_module_id_idx" ON "module_contents"("module_id");

-- CreateIndex
CREATE INDEX "module_contents_business_id_idx" ON "module_contents"("business_id");

-- CreateIndex
CREATE INDEX "module_contents_creator_id_idx" ON "module_contents"("creator_id");

-- CreateIndex
CREATE INDEX "module_contents_multimedia_id_idx" ON "module_contents"("multimedia_id");

-- CreateIndex
CREATE INDEX "multimedia_creator_id_idx" ON "multimedia"("creator_id");

-- CreateIndex
CREATE INDEX "multimedia_business_id_idx" ON "multimedia"("business_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrolled_courses_user_id_course_id_key" ON "enrolled_courses"("user_id", "course_id");

-- CreateIndex
CREATE INDEX "user_course_progress_course_id_idx" ON "user_course_progress"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_course_progress_user_id_module_content_id_key" ON "user_course_progress"("user_id", "module_content_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_user_id_key" ON "cart"("user_id");

-- CreateIndex
CREATE INDEX "cart_user_id_idx" ON "cart"("user_id");

-- CreateIndex
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items"("cart_id");

-- CreateIndex
CREATE INDEX "cart_items_product_id_idx" ON "cart_items"("product_id");

-- CreateIndex
CREATE INDEX "cart_items_course_id_idx" ON "cart_items"("course_id");

-- CreateIndex
CREATE INDEX "cart_items_ticket_tier_id_idx" ON "cart_items"("ticket_tier_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_product_id_key" ON "cart_items"("cart_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_categories_name_key" ON "product_categories"("name");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_business_id_idx" ON "products"("business_id");

-- CreateIndex
CREATE INDEX "products_creator_id_idx" ON "products"("creator_id");

-- CreateIndex
CREATE INDEX "products_multimedia_id_idx" ON "products"("multimedia_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_product_id_key" ON "tickets"("product_id");

-- CreateIndex
CREATE INDEX "tickets_product_id_idx" ON "tickets"("product_id");

-- CreateIndex
CREATE INDEX "ticket_tiers_ticket_id_idx" ON "ticket_tiers"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_tiers_ticket_id_name_key" ON "ticket_tiers"("ticket_id", "name");

-- CreateIndex
CREATE INDEX "purchased_tickets_user_id_idx" ON "purchased_tickets"("user_id");

-- CreateIndex
CREATE INDEX "purchased_tickets_ticket_id_idx" ON "purchased_tickets"("ticket_id");

-- CreateIndex
CREATE INDEX "purchased_tickets_ticket_tier_id_idx" ON "purchased_tickets"("ticket_tier_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchased_tickets_user_id_ticket_tier_id_key" ON "purchased_tickets"("user_id", "ticket_tier_id");

-- CreateIndex
CREATE INDEX "_instant_notification_recipients_B_index" ON "_instant_notification_recipients"("B");

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_role_group_id_fkey" FOREIGN KEY ("role_group_id") REFERENCES "role_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_identity_fkey" FOREIGN KEY ("role_identity") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rate_limits" ADD CONSTRAINT "rate_limits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_logins" ADD CONSTRAINT "social_logins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_status" ADD CONSTRAINT "onboarding_status_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business_information"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "onboarding_status" ADD CONSTRAINT "onboarding_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_information" ADD CONSTRAINT "business_information_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_wallets" ADD CONSTRAINT "business_wallets_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business_information"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_contacts" ADD CONSTRAINT "business_contacts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business_information"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_contacts" ADD CONSTRAINT "business_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawal_accounts" ADD CONSTRAINT "withdrawal_accounts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business_information"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business_information"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plan_prices" ADD CONSTRAINT "subscription_plan_prices_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plan_prices" ADD CONSTRAINT "subscription_plan_prices_subscription_plan_id_fkey" FOREIGN KEY ("subscription_plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plan_roles" ADD CONSTRAINT "subscription_plan_roles_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plan_roles" ADD CONSTRAINT "subscription_plan_roles_subscription_plan_id_fkey" FOREIGN KEY ("subscription_plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business_information"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_information" ADD CONSTRAINT "billing_information_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_billing_id_fkey" FOREIGN KEY ("billing_id") REFERENCES "billing_information"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "subscription_fk" FOREIGN KEY ("purchase_id") REFERENCES "subscription_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_gateway_logs" ADD CONSTRAINT "payment_gateway_logs_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business_information"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_devices" ADD CONSTRAINT "notification_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_notifications" ADD CONSTRAINT "scheduled_notifications_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "notification_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_scheduled_notification_id_fkey" FOREIGN KEY ("scheduled_notification_id") REFERENCES "scheduled_notifications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_recipients" ADD CONSTRAINT "notification_recipients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business_information"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business_information"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modules" ADD CONSTRAINT "modules_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_contents" ADD CONSTRAINT "module_contents_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business_information"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_contents" ADD CONSTRAINT "module_contents_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_contents" ADD CONSTRAINT "module_contents_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_contents" ADD CONSTRAINT "module_contents_multimedia_id_fkey" FOREIGN KEY ("multimedia_id") REFERENCES "multimedia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multimedia" ADD CONSTRAINT "multimedia_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business_information"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multimedia" ADD CONSTRAINT "multimedia_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrolled_courses" ADD CONSTRAINT "enrolled_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrolled_courses" ADD CONSTRAINT "enrolled_courses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_course_progress" ADD CONSTRAINT "user_course_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_course_progress" ADD CONSTRAINT "user_course_progress_module_content_id_fkey" FOREIGN KEY ("module_content_id") REFERENCES "module_contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_course_progress" ADD CONSTRAINT "user_course_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_ticket_tier_id_fkey" FOREIGN KEY ("ticket_tier_id") REFERENCES "ticket_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business_information"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_multimedia_id_fkey" FOREIGN KEY ("multimedia_id") REFERENCES "multimedia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_tiers" ADD CONSTRAINT "ticket_tiers_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchased_tickets" ADD CONSTRAINT "purchased_tickets_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchased_tickets" ADD CONSTRAINT "purchased_tickets_ticket_tier_id_fkey" FOREIGN KEY ("ticket_tier_id") REFERENCES "ticket_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchased_tickets" ADD CONSTRAINT "purchased_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_instant_notification_recipients" ADD CONSTRAINT "_instant_notification_recipients_A_fkey" FOREIGN KEY ("A") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_instant_notification_recipients" ADD CONSTRAINT "_instant_notification_recipients_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
