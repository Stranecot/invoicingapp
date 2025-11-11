-- AlterTable
ALTER TABLE "User" ADD COLUMN "invitationId" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "User_invitationId_key" ON "User"("invitationId");

-- CreateIndex
CREATE INDEX "User_organizationId_role_idx" ON "User"("organizationId", "role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
