/*
  Warnings:

  - You are about to drop the column `paymentId` on the `package_purchases` table. All the data in the column will be lost.
  - You are about to drop the `payments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "package_purchases" DROP CONSTRAINT "package_purchases_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_sessionId_fkey";

-- DropIndex
DROP INDEX "package_purchases_paymentId_key";

-- AlterTable
ALTER TABLE "package_purchases" DROP COLUMN "paymentId";

-- DropTable
DROP TABLE "payments";
