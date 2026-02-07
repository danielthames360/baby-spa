-- AlterEnum: Add TRANSACTION_VOIDED to ActivityType
ALTER TYPE "ActivityType" ADD VALUE 'TRANSACTION_VOIDED';

-- AlterTable: Add reversal/void fields to Transaction
ALTER TABLE "transactions" ADD COLUMN "isReversal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "transactions" ADD COLUMN "reversalOfId" TEXT;
ALTER TABLE "transactions" ADD COLUMN "voidedAt" TIMESTAMP(3);
ALTER TABLE "transactions" ADD COLUMN "voidedById" TEXT;
ALTER TABLE "transactions" ADD COLUMN "voidReason" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "transactions_reversalOfId_key" ON "transactions"("reversalOfId");
CREATE INDEX "transactions_isReversal_idx" ON "transactions"("isReversal");
CREATE INDEX "transactions_reversalOfId_idx" ON "transactions"("reversalOfId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
