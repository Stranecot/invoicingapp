-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "country" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "country" TEXT;

-- CreateIndex
CREATE INDEX "Customer_country_idx" ON "Customer"("country");

-- CreateIndex
CREATE INDEX "Organization_country_idx" ON "Organization"("country");
