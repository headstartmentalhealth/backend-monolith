-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "lastMessage" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "unread" JSONB NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "deletedDate" TIMESTAMP(3),
    "initiator_id" TEXT NOT NULL,
    "chat_buddy_id" TEXT NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "file" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "deletedDate" TIMESTAMP(3),
    "chat_id" TEXT NOT NULL,
    "initiator_id" TEXT NOT NULL,
    "chat_buddy_id" TEXT NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chat_initiator_id_chat_buddy_id_key" ON "Chat"("initiator_id", "chat_buddy_id");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_initiator_id_fkey" FOREIGN KEY ("initiator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_chat_buddy_id_fkey" FOREIGN KEY ("chat_buddy_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "Chat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_initiator_id_fkey" FOREIGN KEY ("initiator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_chat_buddy_id_fkey" FOREIGN KEY ("chat_buddy_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
