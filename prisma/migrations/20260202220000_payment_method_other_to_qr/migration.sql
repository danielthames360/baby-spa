-- Migration: Change PaymentMethod enum from OTHER to QR
-- This migration:
-- 1. Creates a new PaymentMethod enum with QR instead of OTHER
-- 2. Converts all columns to the new type (OTHER values become QR)
-- 3. Drops the old enum

-- Step 1: Create the new enum type with QR
CREATE TYPE "PaymentMethod_new" AS ENUM ('CASH', 'QR', 'CARD', 'TRANSFER');

-- Step 2: Update all columns to use the new type
-- For each table, we cast through text, replacing OTHER with QR

ALTER TABLE "payments"
  ALTER COLUMN "method" TYPE "PaymentMethod_new"
  USING (CASE WHEN "method"::text = 'OTHER' THEN 'QR' ELSE "method"::text END)::"PaymentMethod_new";

ALTER TABLE "appointment_payments"
  ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new"
  USING (CASE WHEN "paymentMethod"::text = 'OTHER' THEN 'QR' ELSE "paymentMethod"::text END)::"PaymentMethod_new";

ALTER TABLE "payment_details"
  ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new"
  USING (CASE WHEN "paymentMethod"::text = 'OTHER' THEN 'QR' ELSE "paymentMethod"::text END)::"PaymentMethod_new";

ALTER TABLE "package_payments"
  ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new"
  USING (CASE WHEN "paymentMethod"::text = 'OTHER' THEN 'QR' ELSE "paymentMethod"::text END)::"PaymentMethod_new";

ALTER TABLE "event_participants"
  ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new"
  USING (CASE WHEN "paymentMethod"::text = 'OTHER' THEN 'QR' ELSE "paymentMethod"::text END)::"PaymentMethod_new";

ALTER TABLE "baby_card_purchases"
  ALTER COLUMN "paymentMethod" TYPE "PaymentMethod_new"
  USING (CASE WHEN "paymentMethod"::text = 'OTHER' THEN 'QR' ELSE "paymentMethod"::text END)::"PaymentMethod_new";

-- Step 3: Drop the old enum and rename the new one
DROP TYPE "PaymentMethod";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
