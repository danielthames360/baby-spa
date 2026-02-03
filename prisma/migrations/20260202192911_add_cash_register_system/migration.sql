/*
  Warnings:

  - You are about to drop the column `date` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `products` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `staff_payments` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `staff_payments` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `staff_payments` table. All the data in the column will be lost.
  - You are about to drop the column `period` on the `staff_payments` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `staff_payments` table. All the data in the column will be lost.
  - Added the required column `createdById` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `notification_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `createdById` to the `staff_payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `staff_payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `grossAmount` to the `staff_payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `netAmount` to the `staff_payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `staffId` to the `staff_payments` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `staff_payments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "StaffPaymentType" AS ENUM ('SALARY', 'COMMISSION', 'BONUS', 'BENEFIT', 'SETTLEMENT', 'ADVANCE', 'DEDUCTION', 'ADVANCE_RETURN');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "PayFrequency" AS ENUM ('DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('RENT', 'UTILITIES', 'SUPPLIES', 'MAINTENANCE', 'MARKETING', 'TAXES', 'INSURANCE', 'EQUIPMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('BABY', 'PARENT');

-- CreateEnum
CREATE TYPE "ParentStatus" AS ENUM ('LEAD', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('BABIES', 'PARENTS');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParticipantStatus" AS ENUM ('REGISTERED', 'CONFIRMED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('COURTESY', 'FIXED');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('SERVICE', 'PRODUCT', 'EVENT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BabyCardStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'REPLACED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentParentType" AS ENUM ('SESSION', 'BABY_CARD', 'EVENT_PARTICIPANT', 'APPOINTMENT', 'PACKAGE_INSTALLMENT', 'STAFF_PAYMENT', 'EXPENSE');

-- CreateEnum
CREATE TYPE "NotificationLogType" AS ENUM ('MESVERSARY', 'BIRTHDAY', 'APPOINTMENT_24H', 'PATTERN_REMINDER', 'INACTIVE_CLIENT');

-- CreateEnum
CREATE TYPE "StaffNotificationType" AS ENUM ('NEW_APPOINTMENT', 'CANCELLED_APPOINTMENT', 'RESCHEDULED_APPOINTMENT', 'CASH_REGISTER_DIFFERENCE');

-- CreateEnum
CREATE TYPE "CashRegisterStatus" AS ENUM ('OPEN', 'CLOSED', 'APPROVED', 'FORCE_CLOSED');

-- CreateEnum
CREATE TYPE "CashExpenseCategory" AS ENUM ('SUPPLIES', 'FOOD', 'TRANSPORT', 'BANK_DEPOSIT', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('SESSION_COMPLETED', 'DISCOUNT_APPLIED', 'APPOINTMENT_CREATED', 'APPOINTMENT_CREATED_PORTAL', 'APPOINTMENT_CANCELLED', 'APPOINTMENT_CANCELLED_PORTAL', 'APPOINTMENT_RESCHEDULED', 'APPOINTMENT_RESCHEDULED_PORTAL', 'BABY_CARD_SOLD', 'BABY_CARD_REWARD_DELIVERED', 'INSTALLMENT_PAID', 'CASH_REGISTER_OPENED', 'CASH_REGISTER_CLOSED', 'CASH_REGISTER_EXPENSE_ADDED', 'CASH_REGISTER_FORCE_CLOSED', 'CASH_REGISTER_REVIEWED', 'EVENT_REGISTRATION', 'BABY_CREATED', 'PACKAGE_ASSIGNED', 'CLIENT_UPDATED', 'EVALUATION_SAVED', 'STAFF_PAYMENT_REGISTERED', 'EXPENSE_REGISTERED');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('PACKAGE', 'PRODUCT');

-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'PENDING_PAYMENT';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'OWNER';

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_babyId_fkey";

-- DropForeignKey
ALTER TABLE "package_purchases" DROP CONSTRAINT "package_purchases_babyId_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_babyId_fkey";

-- DropForeignKey
ALTER TABLE "staff_payments" DROP CONSTRAINT "staff_payments_userId_fkey";

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "isPendingPayment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "pendingSchedulePreferences" TEXT,
ALTER COLUMN "babyId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "date",
DROP COLUMN "notes",
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "expenseDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "reference" TEXT,
DROP COLUMN "category",
ADD COLUMN     "category" "ExpenseCategory" NOT NULL;

-- AlterTable
ALTER TABLE "notification_logs" DROP COLUMN "type",
ADD COLUMN     "type" "NotificationLogType" NOT NULL;

-- AlterTable
ALTER TABLE "package_purchases" ADD COLUMN     "installmentAmount" DECIMAL(10,2),
ADD COLUMN     "installments" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "installmentsPayOnSessions" TEXT,
ADD COLUMN     "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "paymentPlan" TEXT NOT NULL DEFAULT 'SINGLE',
ADD COLUMN     "schedulePreferences" TEXT,
ADD COLUMN     "totalPrice" DECIMAL(10,2),
ALTER COLUMN "babyId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "packages" DROP COLUMN "category",
ADD COLUMN     "allowInstallments" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "installmentsCount" INTEGER,
ADD COLUMN     "installmentsPayOnSessions" TEXT,
ADD COLUMN     "installmentsTotalPrice" DECIMAL(10,2),
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "serviceType" "ServiceType" NOT NULL DEFAULT 'BABY';

-- AlterTable
ALTER TABLE "parents" ADD COLUMN     "convertedAt" TIMESTAMP(3),
ADD COLUMN     "leadNotes" TEXT,
ADD COLUMN     "leadSource" TEXT,
ADD COLUMN     "pregnancyWeeks" INTEGER,
ADD COLUMN     "status" "ParentStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "products" DROP COLUMN "category",
ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "sessions" ALTER COLUMN "babyId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "staff_payments" DROP COLUMN "amount",
DROP COLUMN "date",
DROP COLUMN "notes",
DROP COLUMN "period",
DROP COLUMN "userId",
ADD COLUMN     "advanceDeducted" DECIMAL(10,2),
ADD COLUMN     "createdById" TEXT NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "grossAmount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "includedInSalaryId" TEXT,
ADD COLUMN     "movementDate" TIMESTAMP(3),
ADD COLUMN     "netAmount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "periodEnd" TIMESTAMP(3),
ADD COLUMN     "periodMonth" INTEGER,
ADD COLUMN     "periodStart" TIMESTAMP(3),
ADD COLUMN     "periodYear" INTEGER,
ADD COLUMN     "staffId" TEXT NOT NULL,
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
DROP COLUMN "type",
ADD COLUMN     "type" "StaffPaymentType" NOT NULL;

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN     "notificationExpirationDays" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "notificationPollingInterval" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "paymentQrImage" TEXT,
ADD COLUMN     "whatsappCountryCode" TEXT DEFAULT '+591',
ALTER COLUMN "whatsappMessage" SET DEFAULT 'Hola, adjunto mi comprobante de pago para la cita del {fecha} a las {hora}. Bebé: {bebe}';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "payFrequency" "PayFrequency" NOT NULL DEFAULT 'MONTHLY';

-- DropEnum
DROP TYPE "NotificationType";

-- DropEnum
DROP TYPE "PaymentType";

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CategoryType" NOT NULL,
    "color" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_payments" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "paymentType" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "appointment_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_payments" (
    "id" TEXT NOT NULL,
    "packagePurchaseId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "package_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_advance_balances" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "currentBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_advance_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "StaffNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "readById" TEXT,
    "forRole" "UserRole" NOT NULL DEFAULT 'RECEPTION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "EventType" NOT NULL,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "maxParticipants" INTEGER NOT NULL DEFAULT 10,
    "blockedTherapists" INTEGER NOT NULL DEFAULT 0,
    "minAgeMonths" INTEGER,
    "maxAgeMonths" INTEGER,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "internalNotes" TEXT,
    "externalNotes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_participants" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "babyId" TEXT,
    "parentId" TEXT,
    "status" "ParticipantStatus" NOT NULL DEFAULT 'REGISTERED',
    "discountType" "DiscountType",
    "discountAmount" DECIMAL(10,2),
    "discountReason" TEXT,
    "amountDue" DECIMAL(10,2) NOT NULL,
    "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paymentMethod" "PaymentMethod",
    "paymentReference" TEXT,
    "paidAt" TIMESTAMP(3),
    "attended" BOOLEAN,
    "attendedAt" TIMESTAMP(3),
    "notes" TEXT,
    "registeredById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_product_usages" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_product_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baby_cards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "totalSessions" INTEGER NOT NULL,
    "firstSessionDiscount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "baby_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baby_card_special_prices" (
    "id" TEXT NOT NULL,
    "babyCardId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "specialPrice" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "baby_card_special_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baby_card_rewards" (
    "id" TEXT NOT NULL,
    "babyCardId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "rewardType" "RewardType" NOT NULL,
    "packageId" TEXT,
    "productId" TEXT,
    "customName" TEXT,
    "customDescription" TEXT,
    "displayName" TEXT NOT NULL,
    "displayIcon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "baby_card_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baby_card_purchases" (
    "id" TEXT NOT NULL,
    "babyCardId" TEXT NOT NULL,
    "babyId" TEXT NOT NULL,
    "pricePaid" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod",
    "paymentReference" TEXT,
    "completedSessions" INTEGER NOT NULL DEFAULT 0,
    "status" "BabyCardStatus" NOT NULL DEFAULT 'ACTIVE',
    "firstSessionDiscountUsed" BOOLEAN NOT NULL DEFAULT false,
    "firstSessionDiscountAmount" DECIMAL(10,2),
    "firstSessionDiscountAppliedTo" TEXT,
    "firstSessionDiscountDate" TIMESTAMP(3),
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedDate" TIMESTAMP(3),
    "replacedDate" TIMESTAMP(3),
    "replacedByPurchaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "baby_card_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baby_card_session_logs" (
    "id" TEXT NOT NULL,
    "babyCardPurchaseId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "baby_card_session_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baby_card_reward_usages" (
    "id" TEXT NOT NULL,
    "babyCardPurchaseId" TEXT NOT NULL,
    "babyCardRewardId" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedById" TEXT NOT NULL,
    "appointmentId" TEXT,
    "eventParticipantId" TEXT,
    "productSaleId" TEXT,
    "notes" TEXT,

    CONSTRAINT "baby_card_reward_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_details" (
    "id" TEXT NOT NULL,
    "parentType" "PaymentParentType" NOT NULL,
    "parentId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "payment_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "performedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_registers" (
    "id" TEXT NOT NULL,
    "openedById" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "initialFund" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "closedAt" TIMESTAMP(3),
    "declaredAmount" DECIMAL(10,2),
    "expectedAmount" DECIMAL(10,2),
    "difference" DECIMAL(10,2),
    "closingNotes" TEXT,
    "status" "CashRegisterStatus" NOT NULL DEFAULT 'OPEN',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "forcedCloseById" TEXT,
    "forcedCloseNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_registers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_register_expenses" (
    "id" TEXT NOT NULL,
    "cashRegisterId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "category" "CashExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_register_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_type_key" ON "categories"("name", "type");

-- CreateIndex
CREATE INDEX "package_payments_packagePurchaseId_idx" ON "package_payments"("packagePurchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_advance_balances_staffId_key" ON "staff_advance_balances"("staffId");

-- CreateIndex
CREATE INDEX "notifications_isRead_forRole_idx" ON "notifications"("isRead", "forRole");

-- CreateIndex
CREATE INDEX "notifications_expiresAt_idx" ON "notifications"("expiresAt");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "event_participants_eventId_status_idx" ON "event_participants"("eventId", "status");

-- CreateIndex
CREATE INDEX "event_participants_babyId_status_idx" ON "event_participants"("babyId", "status");

-- CreateIndex
CREATE INDEX "event_participants_parentId_status_idx" ON "event_participants"("parentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "event_participants_eventId_babyId_key" ON "event_participants"("eventId", "babyId");

-- CreateIndex
CREATE UNIQUE INDEX "event_participants_eventId_parentId_key" ON "event_participants"("eventId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "baby_card_special_prices_babyCardId_packageId_key" ON "baby_card_special_prices"("babyCardId", "packageId");

-- CreateIndex
CREATE UNIQUE INDEX "baby_card_rewards_babyCardId_sessionNumber_key" ON "baby_card_rewards"("babyCardId", "sessionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "baby_card_session_logs_sessionId_key" ON "baby_card_session_logs"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "baby_card_reward_usages_babyCardPurchaseId_babyCardRewardId_key" ON "baby_card_reward_usages"("babyCardPurchaseId", "babyCardRewardId");

-- CreateIndex
CREATE INDEX "payment_details_parentType_parentId_idx" ON "payment_details"("parentType", "parentId");

-- CreateIndex
CREATE INDEX "activities_createdAt_idx" ON "activities"("createdAt");

-- CreateIndex
CREATE INDEX "activities_type_createdAt_idx" ON "activities"("type", "createdAt");

-- CreateIndex
CREATE INDEX "activities_performedById_createdAt_idx" ON "activities"("performedById", "createdAt");

-- CreateIndex
CREATE INDEX "cash_registers_openedById_openedAt_idx" ON "cash_registers"("openedById", "openedAt");

-- CreateIndex
CREATE INDEX "cash_registers_status_idx" ON "cash_registers"("status");

-- CreateIndex
CREATE INDEX "cash_registers_openedAt_idx" ON "cash_registers"("openedAt");

-- CreateIndex
CREATE INDEX "cash_register_expenses_cashRegisterId_idx" ON "cash_register_expenses"("cashRegisterId");

-- CreateIndex
CREATE INDEX "cash_register_expenses_createdAt_idx" ON "cash_register_expenses"("createdAt");

-- CreateIndex
CREATE INDEX "appointments_date_status_idx" ON "appointments"("date", "status");

-- CreateIndex
CREATE INDEX "appointments_babyId_status_idx" ON "appointments"("babyId", "status");

-- CreateIndex
CREATE INDEX "appointments_therapistId_date_status_idx" ON "appointments"("therapistId", "date", "status");

-- CreateIndex
CREATE INDEX "appointments_parentId_date_status_idx" ON "appointments"("parentId", "date", "status");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_isPendingPayment_idx" ON "appointments"("isPendingPayment");

-- CreateIndex
CREATE INDEX "baby_parents_babyId_isPrimary_idx" ON "baby_parents"("babyId", "isPrimary");

-- CreateIndex
CREATE INDEX "baby_parents_parentId_isPrimary_idx" ON "baby_parents"("parentId", "isPrimary");

-- CreateIndex
CREATE INDEX "expenses_expenseDate_idx" ON "expenses"("expenseDate");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "expenses_deletedAt_idx" ON "expenses"("deletedAt");

-- CreateIndex
CREATE INDEX "package_purchases_babyId_isActive_idx" ON "package_purchases"("babyId", "isActive");

-- CreateIndex
CREATE INDEX "package_purchases_parentId_isActive_idx" ON "package_purchases"("parentId", "isActive");

-- CreateIndex
CREATE INDEX "sessions_therapistId_status_idx" ON "sessions"("therapistId", "status");

-- CreateIndex
CREATE INDEX "sessions_babyId_status_idx" ON "sessions"("babyId", "status");

-- CreateIndex
CREATE INDEX "sessions_packagePurchaseId_status_idx" ON "sessions"("packagePurchaseId", "status");

-- CreateIndex
CREATE INDEX "sessions_status_idx" ON "sessions"("status");

-- CreateIndex
CREATE INDEX "staff_payments_staffId_idx" ON "staff_payments"("staffId");

-- CreateIndex
CREATE INDEX "staff_payments_status_idx" ON "staff_payments"("status");

-- CreateIndex
CREATE INDEX "staff_payments_periodStart_periodEnd_idx" ON "staff_payments"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "staff_payments_type_idx" ON "staff_payments"("type");

-- CreateIndex
CREATE INDEX "staff_payments_deletedAt_idx" ON "staff_payments"("deletedAt");

-- AddForeignKey
ALTER TABLE "packages" ADD CONSTRAINT "packages_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_purchases" ADD CONSTRAINT "package_purchases_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "babies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_purchases" ADD CONSTRAINT "package_purchases_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "babies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_payments" ADD CONSTRAINT "appointment_payments_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_payments" ADD CONSTRAINT "appointment_payments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "babies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_payments" ADD CONSTRAINT "package_payments_packagePurchaseId_fkey" FOREIGN KEY ("packagePurchaseId") REFERENCES "package_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_payments" ADD CONSTRAINT "package_payments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_payments" ADD CONSTRAINT "staff_payments_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_payments" ADD CONSTRAINT "staff_payments_includedInSalaryId_fkey" FOREIGN KEY ("includedInSalaryId") REFERENCES "staff_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_payments" ADD CONSTRAINT "staff_payments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_payments" ADD CONSTRAINT "staff_payments_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_advance_balances" ADD CONSTRAINT "staff_advance_balances_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_readById_fkey" FOREIGN KEY ("readById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "babies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_registeredById_fkey" FOREIGN KEY ("registeredById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_product_usages" ADD CONSTRAINT "event_product_usages_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_product_usages" ADD CONSTRAINT "event_product_usages_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baby_card_special_prices" ADD CONSTRAINT "baby_card_special_prices_babyCardId_fkey" FOREIGN KEY ("babyCardId") REFERENCES "baby_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baby_card_special_prices" ADD CONSTRAINT "baby_card_special_prices_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baby_card_rewards" ADD CONSTRAINT "baby_card_rewards_babyCardId_fkey" FOREIGN KEY ("babyCardId") REFERENCES "baby_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baby_card_rewards" ADD CONSTRAINT "baby_card_rewards_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baby_card_rewards" ADD CONSTRAINT "baby_card_rewards_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baby_card_purchases" ADD CONSTRAINT "baby_card_purchases_babyCardId_fkey" FOREIGN KEY ("babyCardId") REFERENCES "baby_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baby_card_purchases" ADD CONSTRAINT "baby_card_purchases_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "babies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baby_card_purchases" ADD CONSTRAINT "baby_card_purchases_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baby_card_session_logs" ADD CONSTRAINT "baby_card_session_logs_babyCardPurchaseId_fkey" FOREIGN KEY ("babyCardPurchaseId") REFERENCES "baby_card_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baby_card_session_logs" ADD CONSTRAINT "baby_card_session_logs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baby_card_reward_usages" ADD CONSTRAINT "baby_card_reward_usages_babyCardPurchaseId_fkey" FOREIGN KEY ("babyCardPurchaseId") REFERENCES "baby_card_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baby_card_reward_usages" ADD CONSTRAINT "baby_card_reward_usages_babyCardRewardId_fkey" FOREIGN KEY ("babyCardRewardId") REFERENCES "baby_card_rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baby_card_reward_usages" ADD CONSTRAINT "baby_card_reward_usages_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_details" ADD CONSTRAINT "payment_details_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_registers" ADD CONSTRAINT "cash_registers_forcedCloseById_fkey" FOREIGN KEY ("forcedCloseById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_register_expenses" ADD CONSTRAINT "cash_register_expenses_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "cash_registers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_register_expenses" ADD CONSTRAINT "cash_register_expenses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
