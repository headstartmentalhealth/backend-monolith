/*
  Warnings:

  - You are about to drop the column `isArchived` on the `chats` table. All the data in the column will be lost.
  - You are about to drop the column `lastMessage` on the `chats` table. All the data in the column will be lost.
  - Added the required column `last_message` to the `chats` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "chats" DROP COLUMN "isArchived",
DROP COLUMN "lastMessage",
ADD COLUMN     "is_archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_message" TEXT NOT NULL;
