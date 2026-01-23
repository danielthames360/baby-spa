/*
  Warnings:

  - You are about to drop the column `namePortuguese` on the `packages` table. All the data in the column will be lost.
  - You are about to drop the column `namePortuguese` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "isEvaluated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "packagePurchaseId" TEXT,
ADD COLUMN     "selectedPackageId" TEXT,
ADD COLUMN     "therapistId" TEXT;

-- AlterTable
ALTER TABLE "evaluations" ADD COLUMN     "hydrotherapy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "massage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "motorStimulation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otherActivities" TEXT,
ADD COLUMN     "relaxation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sensoryStimulation" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "packages" DROP COLUMN "namePortuguese",
ADD COLUMN     "advancePaymentAmount" DECIMAL(10,2),
ADD COLUMN     "category" TEXT,
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "requiresAdvancePayment" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "namePortuguese",
ADD COLUMN     "isChargeableByDefault" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "defaultPackageId" TEXT,
    "paymentQrImageUrl" TEXT,
    "whatsappNumber" TEXT,
    "whatsappMessage" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_selectedPackageId_fkey" FOREIGN KEY ("selectedPackageId") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_packagePurchaseId_fkey" FOREIGN KEY ("packagePurchaseId") REFERENCES "package_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_therapistId_fkey" FOREIGN KEY ("therapistId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
