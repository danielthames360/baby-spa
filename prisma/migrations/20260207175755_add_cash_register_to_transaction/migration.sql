-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "cashRegisterId" TEXT;

-- CreateIndex
CREATE INDEX "transactions_cashRegisterId_idx" ON "transactions"("cashRegisterId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "cash_registers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
