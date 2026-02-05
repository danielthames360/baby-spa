/*
  Warnings:

  - You are about to drop the `appointment_payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `package_payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `payment_details` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "TransactionCategory" AS ENUM ('SESSION', 'PACKAGE_SALE', 'PACKAGE_INSTALLMENT', 'SESSION_PRODUCTS', 'EVENT_PRODUCTS', 'BABY_CARD', 'EVENT_REGISTRATION', 'APPOINTMENT_ADVANCE', 'STAFF_PAYMENT', 'ADMIN_EXPENSE');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('PACKAGE', 'PRODUCT', 'EVENT_TICKET', 'BABY_CARD', 'INSTALLMENT', 'ADVANCE', 'DISCOUNT', 'OTHER');

-- DropForeignKey
ALTER TABLE "appointment_payments" DROP CONSTRAINT "appointment_payments_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "appointment_payments" DROP CONSTRAINT "appointment_payments_createdById_fkey";

-- DropForeignKey
ALTER TABLE "package_payments" DROP CONSTRAINT "package_payments_createdById_fkey";

-- DropForeignKey
ALTER TABLE "package_payments" DROP CONSTRAINT "package_payments_packagePurchaseId_fkey";

-- DropForeignKey
ALTER TABLE "payment_details" DROP CONSTRAINT "payment_details_createdById_fkey";

-- AlterTable
ALTER TABLE "event_product_usages" ADD COLUMN     "isChargeable" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "session_products" ADD COLUMN     "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "discountReason" TEXT;

-- DropTable
DROP TABLE "appointment_payments";

-- DropTable
DROP TABLE "package_payments";

-- DropTable
DROP TABLE "payment_details";

-- DropEnum
DROP TYPE "PaymentParentType";

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "category" "TransactionCategory" NOT NULL,
    "referenceType" TEXT NOT NULL,
    "referenceId" TEXT NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "discountTotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "paymentMethods" JSONB NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_items" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "itemType" "ItemType" NOT NULL,
    "referenceId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountReason" TEXT,
    "finalPrice" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "transactions_category_idx" ON "transactions"("category");

-- CreateIndex
CREATE INDEX "transactions_referenceType_referenceId_idx" ON "transactions"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "transactions_createdAt_idx" ON "transactions"("createdAt");

-- CreateIndex
CREATE INDEX "transaction_items_transactionId_idx" ON "transaction_items"("transactionId");

-- CreateIndex
CREATE INDEX "transaction_items_itemType_idx" ON "transaction_items"("itemType");

-- CreateIndex
CREATE INDEX "appointment_history_appointmentId_idx" ON "appointment_history"("appointmentId");

-- CreateIndex
CREATE INDEX "baby_card_purchases_babyId_status_idx" ON "baby_card_purchases"("babyId", "status");

-- CreateIndex
CREATE INDEX "baby_card_purchases_babyCardId_idx" ON "baby_card_purchases"("babyCardId");

-- CreateIndex
CREATE INDEX "baby_card_session_logs_babyCardPurchaseId_idx" ON "baby_card_session_logs"("babyCardPurchaseId");

-- CreateIndex
CREATE INDEX "baby_notes_babyId_idx" ON "baby_notes"("babyId");

-- CreateIndex
CREATE INDEX "event_product_usages_eventId_idx" ON "event_product_usages"("eventId");

-- CreateIndex
CREATE INDEX "event_product_usages_productId_idx" ON "event_product_usages"("productId");

-- CreateIndex
CREATE INDEX "events_date_status_idx" ON "events"("date", "status");

-- CreateIndex
CREATE INDEX "packages_categoryId_idx" ON "packages"("categoryId");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
