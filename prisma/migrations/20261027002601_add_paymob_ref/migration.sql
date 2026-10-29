/*
  Warnings:

  - A unique constraint covering the columns `[paymobIntentionId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[paymobOrderId]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "paymobIntentionId" TEXT,
ADD COLUMN     "paymobOrderId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymobIntentionId_key" ON "Payment"("paymobIntentionId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_paymobOrderId_key" ON "Payment"("paymobOrderId");
