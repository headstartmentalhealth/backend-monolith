-- AlterEnum
ALTER TYPE "Action" ADD VALUE 'SUSPEND_UNSUSPEND_USER';

-- DropForeignKey
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_business_id_fkey";

-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "business_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "business_information"("id") ON DELETE SET NULL ON UPDATE CASCADE;
