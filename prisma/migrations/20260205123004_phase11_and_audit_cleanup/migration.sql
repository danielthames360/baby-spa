/*
  Warnings:

  - You are about to drop the `notification_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `system_config` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `waitlist` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('APPOINTMENT', 'MESVERSARY', 'REENGAGEMENT', 'LEAD', 'ADMIN');

-- CreateEnum
CREATE TYPE "PendingMessageCategory" AS ENUM ('APPOINTMENT_REMINDER', 'PAYMENT_REMINDER', 'MESVERSARY', 'REENGAGEMENT');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('PARENT', 'BABY', 'LEAD');

-- CreateEnum
CREATE TYPE "PendingMessageStatus" AS ENUM ('PENDING', 'SENT', 'SKIPPED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('SENT', 'DELIVERED', 'OPENED', 'BOUNCED', 'COMPLAINED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StaffNotificationType" ADD VALUE 'REENGAGEMENT_ALERT';
ALTER TYPE "StaffNotificationType" ADD VALUE 'LEAD_DUE_DATE';

-- DropForeignKey
ALTER TABLE "notification_logs" DROP CONSTRAINT "notification_logs_babyId_fkey";

-- DropForeignKey
ALTER TABLE "waitlist" DROP CONSTRAINT "waitlist_parentId_fkey";

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "paymentReminderSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reminderDaySent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "babies" ADD COLUMN     "lastMesversaryNotifiedMonth" INTEGER;

-- AlterTable
ALTER TABLE "event_participants" ADD COLUMN     "email" TEXT,
ADD COLUMN     "expectedDueDate" TIMESTAMP(3),
ADD COLUMN     "followUpAt" TIMESTAMP(3),
ADD COLUMN     "name" TEXT,
ADD COLUMN     "phone" TEXT;

-- AlterTable
ALTER TABLE "parents" ADD COLUMN     "emailBounceCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastMessageSentAt" TIMESTAMP(3),
ADD COLUMN     "lastReengagementAt" TIMESTAMP(3),
ADD COLUMN     "lastSessionAt" TIMESTAMP(3),
ADD COLUMN     "marketingOptIn" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "businessAddress" TEXT,
ADD COLUMN     "instagramHandle" TEXT,
ADD COLUMN     "maxSlotsPortal" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "maxSlotsStaff" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "dailySummaryEmail" TEXT,
ADD COLUMN     "receiveDailySummary" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "notification_logs";

-- DropTable
DROP TABLE "system_config";

-- DropTable
DROP TABLE "waitlist";

-- DropEnum
DROP TYPE "NotificationLogType";

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "TemplateCategory" NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "bodyVersion2" TEXT,
    "bodyVersion3" TEXT,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "config" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pending_messages" (
    "id" TEXT NOT NULL,
    "category" "PendingMessageCategory" NOT NULL,
    "templateKey" TEXT NOT NULL,
    "recipientType" "RecipientType" NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "status" "PendingMessageStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "sentById" TEXT,
    "skipReason" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pending_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "resendId" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "parentId" TEXT,
    "templateKey" TEXT NOT NULL,
    "category" "TemplateCategory" NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "complainedAt" TIMESTAMP(3),
    "bounceType" TEXT,
    "bounceReason" TEXT,
    "subject" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_templates_key_key" ON "message_templates"("key");

-- CreateIndex
CREATE INDEX "pending_messages_status_scheduledFor_idx" ON "pending_messages"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "pending_messages_category_status_idx" ON "pending_messages"("category", "status");

-- CreateIndex
CREATE UNIQUE INDEX "email_logs_resendId_key" ON "email_logs"("resendId");

-- CreateIndex
CREATE INDEX "email_logs_status_createdAt_idx" ON "email_logs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "email_logs_templateKey_createdAt_idx" ON "email_logs"("templateKey", "createdAt");

-- CreateIndex
CREATE INDEX "email_logs_parentId_idx" ON "email_logs"("parentId");

-- CreateIndex
CREATE INDEX "appointments_date_status_reminder24hSent_idx" ON "appointments"("date", "status", "reminder24hSent");

-- CreateIndex
CREATE INDEX "appointments_date_status_reminderDaySent_idx" ON "appointments"("date", "status", "reminderDaySent");

-- CreateIndex
CREATE INDEX "appointments_date_status_paymentReminderSent_idx" ON "appointments"("date", "status", "paymentReminderSent");

-- CreateIndex
CREATE INDEX "babies_birthDate_isActive_idx" ON "babies"("birthDate", "isActive");

-- CreateIndex
CREATE INDEX "babies_lastMesversaryNotifiedMonth_idx" ON "babies"("lastMesversaryNotifiedMonth");

-- CreateIndex
CREATE INDEX "baby_card_reward_usages_usedById_idx" ON "baby_card_reward_usages"("usedById");

-- CreateIndex
CREATE INDEX "baby_notes_userId_idx" ON "baby_notes"("userId");

-- CreateIndex
CREATE INDEX "cash_register_expenses_createdById_idx" ON "cash_register_expenses"("createdById");

-- CreateIndex
CREATE INDEX "event_participants_expectedDueDate_idx" ON "event_participants"("expectedDueDate");

-- CreateIndex
CREATE INDEX "inventory_movements_productId_idx" ON "inventory_movements"("productId");

-- CreateIndex
CREATE INDEX "parents_lastSessionAt_idx" ON "parents"("lastSessionAt");

-- CreateIndex
CREATE INDEX "parents_noShowCount_requiresPrepayment_idx" ON "parents"("noShowCount", "requiresPrepayment");

-- CreateIndex
CREATE INDEX "parents_status_idx" ON "parents"("status");

-- CreateIndex
CREATE INDEX "session_products_productId_idx" ON "session_products"("productId");

-- CreateIndex
CREATE INDEX "sessions_completedAt_idx" ON "sessions"("completedAt");

-- AddForeignKey
ALTER TABLE "pending_messages" ADD CONSTRAINT "pending_messages_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
