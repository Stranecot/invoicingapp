-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('ORGANIZATION', 'PERSON');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "type" "CustomerType" NOT NULL DEFAULT 'ORGANIZATION';
