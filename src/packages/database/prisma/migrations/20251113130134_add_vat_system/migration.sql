-- CreateEnum
CREATE TYPE "VatRateType" AS ENUM ('STANDARD', 'REDUCED', 'SUPER_REDUCED', 'ZERO', 'PARKING');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "isBusiness" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "vatNumber" TEXT,
ADD COLUMN     "vatNumberValidated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vatRuleApplicable" TEXT,
ADD COLUMN     "vatValidationDate" TIMESTAMP(3),
ADD COLUMN     "viesValidationStatus" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'BGN',
ADD COLUMN     "customerCountryId" TEXT,
ADD COLUMN     "customerVatNumber" TEXT,
ADD COLUMN     "isExport" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isMixedVatRates" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isReverseCharge" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresEcSalesList" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requiresExportDocs" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vatBreakdown" TEXT,
ADD COLUMN     "vatNote" TEXT,
ADD COLUMN     "vatRule" TEXT,
ADD COLUMN     "vatScenario" TEXT;

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "lineSubtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lineTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "vatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "vatCategoryId" TEXT,
ADD COLUMN     "vatRateApplied" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'BGN',
ADD COLUMN     "isEuBased" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "standardVatRate" DOUBLE PRECISION,
ADD COLUMN     "vatNumber" TEXT;

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "alpha3" TEXT NOT NULL,
    "numericCode" TEXT,
    "nameEn" TEXT NOT NULL,
    "nameLocal" TEXT,
    "isEuMember" BOOLEAN NOT NULL DEFAULT false,
    "isEeaMember" BOOLEAN NOT NULL DEFAULT false,
    "standardVatRate" DOUBLE PRECISION,
    "currencyCode" TEXT,
    "region" TEXT,
    "subRegion" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VatCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameBg" TEXT,
    "description" TEXT,
    "annexIiiCategory" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VatCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CountryVatRate" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "vatCategoryId" TEXT NOT NULL,
    "vatRate" DOUBLE PRECISION NOT NULL,
    "rateType" "VatRateType" NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountryVatRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_alpha3_key" ON "Country"("alpha3");

-- CreateIndex
CREATE INDEX "Country_isEuMember_idx" ON "Country"("isEuMember");

-- CreateIndex
CREATE INDEX "Country_nameEn_idx" ON "Country"("nameEn");

-- CreateIndex
CREATE INDEX "Country_active_idx" ON "Country"("active");

-- CreateIndex
CREATE UNIQUE INDEX "VatCategory_code_key" ON "VatCategory"("code");

-- CreateIndex
CREATE INDEX "VatCategory_code_idx" ON "VatCategory"("code");

-- CreateIndex
CREATE INDEX "CountryVatRate_countryId_vatCategoryId_idx" ON "CountryVatRate"("countryId", "vatCategoryId");

-- CreateIndex
CREATE INDEX "CountryVatRate_effectiveFrom_effectiveUntil_idx" ON "CountryVatRate"("effectiveFrom", "effectiveUntil");

-- CreateIndex
CREATE INDEX "Customer_vatNumber_idx" ON "Customer"("vatNumber");

-- CreateIndex
CREATE INDEX "Invoice_vatRule_idx" ON "Invoice"("vatRule");

-- CreateIndex
CREATE INDEX "Invoice_isReverseCharge_idx" ON "Invoice"("isReverseCharge");

-- CreateIndex
CREATE INDEX "Invoice_isExport_idx" ON "Invoice"("isExport");

-- CreateIndex
CREATE INDEX "InvoiceItem_vatCategoryId_idx" ON "InvoiceItem"("vatCategoryId");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_country_fkey" FOREIGN KEY ("country") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_country_fkey" FOREIGN KEY ("country") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_vatCategoryId_fkey" FOREIGN KEY ("vatCategoryId") REFERENCES "VatCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountryVatRate" ADD CONSTRAINT "CountryVatRate_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CountryVatRate" ADD CONSTRAINT "CountryVatRate_vatCategoryId_fkey" FOREIGN KEY ("vatCategoryId") REFERENCES "VatCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
