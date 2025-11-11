# Multi-Tenancy User Model Migration Guide

## Overview

This guide documents the migration to support multi-tenancy in the User model (Issue #6). The changes enable user management across organizations with invitation tracking, activity status, and login history.

## Schema Changes

### New Fields Added to User Model

1. **invitationId** (String?, unique, nullable)
   - Links to the accepted invitation
   - Unique constraint ensures one invitation per user
   - Nullable for users created without invitations

2. **isActive** (Boolean, default: true)
   - Controls user suspension/activation
   - Default value: `true`
   - Used for temporarily disabling user access

3. **lastLoginAt** (DateTime?, nullable)
   - Tracks the user's most recent login
   - Nullable for users who haven't logged in yet
   - Useful for security audits and inactive user management

### New Indexes

1. **Composite Index: [organizationId, role]**
   - Optimizes queries filtering users by organization and role
   - Common query pattern for role-based access control within organizations

2. **Index: [isActive]**
   - Speeds up queries filtering active/inactive users
   - Important for login and access control checks

## Migration Files

### Schema Migration
- **File**: `prisma/migrations/20251111140000_update_user_for_multi_tenancy/migration.sql`
- **What it does**: Adds new columns and indexes to the User table
- **Safe for production**: Yes (adds nullable fields with defaults)

### Data Migration Script
- **File**: `scripts/migrate-existing-users.ts`
- **What it does**:
  - Creates a "Legacy Organization" for existing users
  - Assigns all users without an organization to the legacy org
  - Sets default values for new fields
- **When to run**: After schema migration, if you have existing users without organizations

## Migration Instructions

### 1. Apply Schema Migration

The schema migration has already been applied to the database using:

```bash
cd src/packages/database
npx prisma migrate deploy
```

This is safe for production as:
- All new fields are nullable or have defaults
- No data is deleted or modified
- Existing users continue to work

### 2. Verify Migration

Check that the migration was applied successfully:

```bash
npx tsx scripts/check-users.ts
```

This will show all users and indicate if any need organization assignment.

### 3. Run Data Migration (If Needed)

If you have existing users without an organization:

```bash
npx tsx scripts/migrate-existing-users.ts
```

This script will:
- Create a "Legacy Organization" (slug: `legacy-organization`)
- Assign all users without an organization to it
- Set `isActive: true` for all migrated users
- Leave `lastLoginAt` as `null` (no historical data available)

### 4. Verify Results

After data migration, verify all users have been assigned:

```bash
npx tsx scripts/check-users.ts
```

All users should now have an `organizationId`.

## Testing

A comprehensive test suite verifies all schema changes:

```bash
npx tsx scripts/verify-schema.ts
```

Tests include:
- Querying new fields
- Filtering by `isActive`
- Using composite index `[organizationId, role]`
- Unique constraint on `invitationId`
- Updating `lastLoginAt`
- Toggling `isActive` status

## Seed Data Updates

The seed file (`prisma/seed.ts`) has been updated to include:
- `isActive: true` for all test users
- Various `lastLoginAt` values to demonstrate the feature
- Example data for testing user activity tracking

To reseed the database with test data (development only):

```bash
npx prisma migrate reset --force  # Destructive: Drops all data!
```

## API Integration

### User Creation with Invitation

When a user accepts an invitation:

```typescript
await prisma.user.create({
  data: {
    clerkId: clerkUser.id,
    email: clerkUser.emailAddresses[0].emailAddress,
    name: clerkUser.fullName,
    role: invitation.role,
    organizationId: invitation.organizationId,
    invitationId: invitation.id,  // Link to accepted invitation
    isActive: true,
    lastLoginAt: new Date(),  // First login
  },
});
```

### Update Last Login

Update the login timestamp on each authentication:

```typescript
await prisma.user.update({
  where: { clerkId: user.clerkId },
  data: { lastLoginAt: new Date() },
});
```

### Suspend/Activate User

Control user access with `isActive`:

```typescript
// Suspend user
await prisma.user.update({
  where: { id: userId },
  data: { isActive: false },
});

// Reactivate user
await prisma.user.update({
  where: { id: userId },
  data: { isActive: true },
});
```

### Query Active Users in Organization

Leverage the composite index for efficient queries:

```typescript
const activeOrgUsers = await prisma.user.findMany({
  where: {
    organizationId: orgId,
    role: 'USER',
    isActive: true,
  },
});
```

## Backward Compatibility

The migration is fully backward compatible:

1. **Nullable organizationId**: Existing users can temporarily have `null` organizationId
2. **Default values**: New fields have sensible defaults (`isActive: true`)
3. **Optional fields**: `invitationId` and `lastLoginAt` are optional
4. **Data migration is optional**: The app works even if users aren't immediately assigned to organizations

## Production Considerations

### Before Deploying

1. Review the migration SQL to understand database changes
2. Ensure you have a database backup
3. Test the migration in a staging environment
4. Plan for user assignment strategy (legacy org vs. manual assignment)

### After Deploying

1. Run `scripts/check-users.ts` to identify users needing migration
2. Decide on organization assignment strategy:
   - Option A: Use `scripts/migrate-existing-users.ts` to create a legacy organization
   - Option B: Manually assign users to appropriate organizations
3. Monitor `isActive` status for security and access control
4. Set up tracking for `lastLoginAt` in your authentication flow

## Rollback Plan

If you need to rollback the migration:

```bash
# This will revert to the previous migration
npx prisma migrate resolve --rolled-back 20251111140000_update_user_for_multi_tenancy
```

Note: This only marks the migration as rolled back. You'll need to manually remove the columns if they were already added.

## Support

If you encounter issues:

1. Check the migration was applied: `npx prisma migrate status`
2. Verify schema matches: `npx prisma validate`
3. Check for users needing migration: `npx tsx scripts/check-users.ts`
4. Run verification tests: `npx tsx scripts/verify-schema.ts`

## Related Issues

- Issue #4: Organization model implementation
- Issue #5: Invitation model implementation
- Issue #6: User model multi-tenancy updates (this migration)
