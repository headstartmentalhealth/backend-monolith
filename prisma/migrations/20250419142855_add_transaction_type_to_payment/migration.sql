-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('WITHDRAWAL');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "transaction_type" "TransactionType",
ALTER COLUMN "purchase_type" DROP DEFAULT;
