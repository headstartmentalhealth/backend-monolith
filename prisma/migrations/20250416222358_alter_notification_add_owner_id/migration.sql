-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "owner_id" VARCHAR(36);

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
