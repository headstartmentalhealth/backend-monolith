-- AlterTable
ALTER TABLE "business_information" ADD COLUMN     "is_suspended" BOOLEAN DEFAULT false,
ADD COLUMN     "suspended_at" TIMESTAMP(3),
ADD COLUMN     "suspended_by" VARCHAR(36);
