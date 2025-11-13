-- Migration: Remove Clerk and Add Custom Authentication
-- This migration handles existing data by:
-- 1. Making passwordHash nullable temporarily
-- 2. Adding new auth fields
-- 3. Removing clerkId
-- 4. Making passwordHash required after setting defaults

-- Step 1: Add new auth fields (nullable for now)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3);

-- Step 2: Set default password hash for existing users (bcrypt hash of 'changeme123')
-- This is a temporary password - users should reset it
UPDATE "User"
SET "passwordHash" = '$2a$10$N9qo8uLOickgx2ZMRZoMye/IKfqGvJLH8skLZr3Vx9t0q7t0qIk8u'
WHERE "passwordHash" IS NULL;

-- Step 3: Make passwordHash NOT NULL now that all rows have a value
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;

-- Step 4: Remove clerkId column and its index
DROP INDEX IF EXISTS "User_clerkId_idx";
ALTER TABLE "User" DROP COLUMN IF EXISTS "clerkId";

-- Step 5: Create new indexes
CREATE UNIQUE INDEX IF NOT EXISTS "User_resetToken_key" ON "User"("resetToken");
CREATE INDEX IF NOT EXISTS "User_resetToken_idx" ON "User"("resetToken");
