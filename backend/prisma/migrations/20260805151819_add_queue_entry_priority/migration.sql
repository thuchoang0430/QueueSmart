-- CreateEnum
CREATE TYPE "QueueEntryPriority" AS ENUM ('NORMAL', 'PRIORITY');

-- AlterTable
ALTER TABLE "QueueEntry" ADD COLUMN     "priority" "QueueEntryPriority" NOT NULL DEFAULT 'NORMAL';

-- CreateIndex
CREATE INDEX "QueueEntry_queueId_status_idx" ON "QueueEntry"("queueId", "status");

-- CreateIndex
CREATE INDEX "QueueEntry_queueId_priority_joinTime_idx" ON "QueueEntry"("queueId", "priority", "joinTime");

-- CreateIndex
CREATE INDEX "QueueEntry_userId_status_idx" ON "QueueEntry"("userId", "status");
