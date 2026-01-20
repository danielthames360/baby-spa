/*
  Warnings:

  - You are about to drop the column `documentId` on the `parents` table. All the data in the column will be lost.
  - You are about to drop the column `documentType` on the `parents` table. All the data in the column will be lost.
  - Added the required column `parentPhone` to the `registration_links` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "parents_documentId_key";

-- AlterTable
ALTER TABLE "appointments" ALTER COLUMN "startTime" SET DATA TYPE TEXT,
ALTER COLUMN "endTime" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "business_hours" ALTER COLUMN "morningOpen" SET DATA TYPE TEXT,
ALTER COLUMN "morningClose" SET DATA TYPE TEXT,
ALTER COLUMN "afternoonOpen" SET DATA TYPE TEXT,
ALTER COLUMN "afternoonClose" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "parents" DROP COLUMN "documentId",
DROP COLUMN "documentType",
ALTER COLUMN "phone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "registration_links" ADD COLUMN     "parentName" TEXT,
ADD COLUMN     "parentPhone" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "waitlist" ALTER COLUMN "desiredTime" SET DATA TYPE TEXT;
