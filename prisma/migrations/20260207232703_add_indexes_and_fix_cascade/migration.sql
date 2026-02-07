-- DropForeignKey
ALTER TABLE "baby_parents" DROP CONSTRAINT "baby_parents_babyId_fkey";

-- DropForeignKey
ALTER TABLE "baby_parents" DROP CONSTRAINT "baby_parents_parentId_fkey";

-- CreateIndex
CREATE INDEX "appointments_packagePurchaseId_idx" ON "appointments"("packagePurchaseId");

-- CreateIndex
CREATE INDEX "appointments_status_isEvaluated_idx" ON "appointments"("status", "isEvaluated");

-- CreateIndex
CREATE INDEX "babies_isActive_createdAt_idx" ON "babies"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "baby_card_purchases_purchaseDate_idx" ON "baby_card_purchases"("purchaseDate");

-- CreateIndex
CREATE INDEX "baby_card_purchases_createdById_idx" ON "baby_card_purchases"("createdById");

-- CreateIndex
CREATE INDEX "baby_card_reward_usages_usedAt_idx" ON "baby_card_reward_usages"("usedAt");

-- CreateIndex
CREATE INDEX "inventory_movements_createdAt_idx" ON "inventory_movements"("createdAt");

-- CreateIndex
CREATE INDEX "inventory_movements_productId_createdAt_idx" ON "inventory_movements"("productId", "createdAt");

-- CreateIndex
CREATE INDEX "package_purchases_packageId_idx" ON "package_purchases"("packageId");

-- CreateIndex
CREATE INDEX "package_purchases_isActive_paymentPlan_idx" ON "package_purchases"("isActive", "paymentPlan");

-- CreateIndex
CREATE INDEX "package_purchases_babyId_remainingSessions_idx" ON "package_purchases"("babyId", "remainingSessions");

-- CreateIndex
CREATE INDEX "package_purchases_parentId_remainingSessions_idx" ON "package_purchases"("parentId", "remainingSessions");

-- CreateIndex
CREATE INDEX "parents_status_createdAt_idx" ON "parents"("status", "createdAt");

-- CreateIndex
CREATE INDEX "parents_convertedAt_idx" ON "parents"("convertedAt");

-- CreateIndex
CREATE INDEX "session_products_sessionId_idx" ON "session_products"("sessionId");

-- CreateIndex
CREATE INDEX "staff_payments_paidAt_idx" ON "staff_payments"("paidAt");

-- CreateIndex
CREATE INDEX "staff_payments_includedInSalaryId_idx" ON "staff_payments"("includedInSalaryId");

-- CreateIndex
CREATE INDEX "staff_payments_staffId_deletedAt_type_idx" ON "staff_payments"("staffId", "deletedAt", "type");

-- CreateIndex
CREATE INDEX "transactions_type_voidedAt_isReversal_createdAt_idx" ON "transactions"("type", "voidedAt", "isReversal", "createdAt");

-- CreateIndex
CREATE INDEX "transactions_voidedAt_idx" ON "transactions"("voidedAt");

-- CreateIndex
CREATE INDEX "transactions_category_voidedAt_isReversal_referenceType_idx" ON "transactions"("category", "voidedAt", "isReversal", "referenceType");

-- AddForeignKey
ALTER TABLE "baby_parents" ADD CONSTRAINT "baby_parents_babyId_fkey" FOREIGN KEY ("babyId") REFERENCES "babies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baby_parents" ADD CONSTRAINT "baby_parents_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "parents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
