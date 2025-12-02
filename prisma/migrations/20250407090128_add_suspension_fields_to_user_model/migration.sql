/*
  Warnings:

  - You are about to drop the column `is_suspended` on the `business_information` table. All the data in the column will be lost.
  - You are about to drop the column `suspended_at` on the `business_information` table. All the data in the column will be lost.
  - You are about to drop the column `suspended_by` on the `business_information` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "business_information" DROP COLUMN "is_suspended",
DROP COLUMN "suspended_at",
DROP COLUMN "suspended_by";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_suspended" BOOLEAN DEFAULT false,
ADD COLUMN     "suspended_at" TIMESTAMP(3),
ADD COLUMN     "suspended_by" VARCHAR(36);
