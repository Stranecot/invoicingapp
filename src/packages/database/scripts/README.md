# Database Scripts

This directory contains utility scripts for database management and migrations.

## Available Scripts

### User Management

#### `check-users.ts`
**Purpose**: Check the current state of users in the database

**Usage**:
```bash
npx tsx scripts/check-users.ts
```

**What it does**:
- Lists all users with their details
- Shows organization assignments
- Identifies users needing migration
- Displays activity status and login history

**When to use**:
- After migrations to verify changes
- To audit user assignments
- To identify inactive users
- For debugging user-related issues

---

#### `migrate-existing-users.ts`
**Purpose**: Migrate existing users to multi-tenancy structure

**Usage**:
```bash
npx tsx scripts/migrate-existing-users.ts
```

**What it does**:
- Finds users without an organizationId
- Creates a "Legacy Organization" if needed
- Assigns all legacy users to the organization
- Sets default values for new fields (isActive: true)
- Provides detailed migration report

**When to use**:
- After applying the multi-tenancy schema migration
- When you have existing users without organizations
- During initial multi-tenancy setup

**Safety**:
- Safe to run multiple times (idempotent)
- Creates organization only if it doesn't exist
- Skips already-migrated users
- Provides detailed success/error reporting

---

#### `verify-schema.ts`
**Purpose**: Comprehensive testing of User model schema changes

**Usage**:
```bash
npx tsx scripts/verify-schema.ts
```

**What it does**:
- Tests all new User model fields
- Verifies indexes are working
- Checks unique constraints
- Tests field updates and queries
- Validates multi-tenancy features

**Tests performed**:
1. Query users with new fields
2. Filter by isActive
3. Use composite index [organizationId, role]
4. Check invitationId unique constraint
5. Update lastLoginAt
6. Toggle isActive status

**When to use**:
- After schema migrations
- Before deploying to production
- For regression testing
- When debugging schema issues

## Script Dependencies

All scripts require:
- Prisma Client
- TypeScript/tsx runtime
- Database connection (configured in .env)

## Common Workflows

### After Schema Migration
```bash
# 1. Check current state
npx tsx scripts/check-users.ts

# 2. Run verification tests
npx tsx scripts/verify-schema.ts

# 3. If users need migration
npx tsx scripts/migrate-existing-users.ts

# 4. Verify migration success
npx tsx scripts/check-users.ts
```

### Regular Maintenance
```bash
# Check user status
npx tsx scripts/check-users.ts

# Verify schema integrity
npx tsx scripts/verify-schema.ts
```

## Error Handling

All scripts include:
- Comprehensive error handling
- Detailed error messages
- Proper database connection cleanup
- Non-zero exit codes on failure

## Development

To add a new script:

1. Create a `.ts` file in this directory
2. Import Prisma client: `import { prisma } from '../src/index'`
3. Implement your logic
4. Handle errors and cleanup connections
5. Document it in this README

Example template:
```typescript
import { prisma } from '../src/index';

async function myScript() {
  try {
    // Your logic here
    console.log('Success!');
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

myScript().catch(console.error);
```

## Notes

- All scripts use `npx tsx` for TypeScript execution
- Database connection details come from `.env` file
- Scripts are safe for production (read-only except where noted)
- Always test in staging before running on production
