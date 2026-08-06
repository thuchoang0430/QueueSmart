/*
  Warnings:

  - You are about to drop the column `status` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `Notification` table. All the data in the column will be lost.
  - Added the required column `type` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "HistoryOutcome" AS ENUM ('SERVED', 'LEFT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('JOINED', 'ALMOST_UP', 'SERVED');

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "status",
DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "read" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "type" "NotificationType" NOT NULL;

-- DropEnum
DROP TYPE "NotificationStatus";

-- CreateTable
CREATE TABLE "History" (
    "id" SERIAL NOT NULL,
    "serviceId" INTEGER NOT NULL,
    "serviceName" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "waitMinutes" INTEGER NOT NULL,
    "outcome" "HistoryOutcome" NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "History_userId_endedAt_idx" ON "History"("userId", "endedAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserCredential"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
