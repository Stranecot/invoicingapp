/**
 * Data Migration Script: Migrate Existing Users to Multi-Tenancy
 *
 * This script handles the migration of existing users that don't have an organizationId
 * by creating a default "Legacy Organization" and assigning all such users to it.
 *
 * Run this script AFTER the schema migration has been applied.
 *
 * Usage:
 *   npx tsx scripts/migrate-existing-users.ts
 *
 * What this script does:
 * 1. Checks for users without an organizationId (existing users before multi-tenancy)
 * 2. Creates a "Legacy Organization" if it doesn't exist
 * 3. Assigns all users without an organization to the Legacy Organization
 * 4. Sets default values for new fields (isActive: true, lastLoginAt: null)
 * 5. Reports on the migration results
 */

import { prisma } from '../src/index';

async function migrateExistingUsers() {
  console.log('=== User Multi-Tenancy Data Migration ===\n');

  try {
    // Step 1: Find users without an organization
    const usersWithoutOrg = await prisma.user.findMany({
      where: {
        organizationId: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log(`Found ${usersWithoutOrg.length} users without an organization.\n`);

    if (usersWithoutOrg.length === 0) {
      console.log('No migration needed. All users are already assigned to organizations.');
      return;
    }

    // Step 2: Create or find the "Legacy Organization"
    console.log('Creating/finding Legacy Organization...');

    let legacyOrg = await prisma.organization.findUnique({
      where: { slug: 'legacy-organization' },
    });

    if (!legacyOrg) {
      legacyOrg = await prisma.organization.create({
        data: {
          name: 'Legacy Organization',
          slug: 'legacy-organization',
          billingEmail: usersWithoutOrg[0]?.email || 'admin@legacy.local',
          status: 'ACTIVE',
          plan: 'FREE',
          maxUsers: Math.max(usersWithoutOrg.length, 10), // At least accommodate existing users
          settings: {
            create: {
              primaryColor: '#6B7280',
              invoicePrefix: 'LEGACY',
              taxRate: 0,
              currency: 'USD',
              allowSignup: false,
              requireApproval: true,
            },
          },
        },
      });
      console.log(`Created Legacy Organization with ID: ${legacyOrg.id}`);
    } else {
      console.log(`Found existing Legacy Organization with ID: ${legacyOrg.id}`);

      // Update maxUsers if needed to accommodate all legacy users
      if (legacyOrg.maxUsers < usersWithoutOrg.length) {
        await prisma.organization.update({
          where: { id: legacyOrg.id },
          data: { maxUsers: usersWithoutOrg.length },
        });
        console.log(`Updated Legacy Organization maxUsers to ${usersWithoutOrg.length}`);
      }
    }

    console.log('');

    // Step 3: Migrate each user
    console.log('Migrating users...');
    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithoutOrg) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            organizationId: legacyOrg.id,
            isActive: true, // Ensure isActive is set to true for existing users
            // lastLoginAt remains null for existing users (no data available)
          },
        });

        console.log(`  ✓ Migrated: ${user.email} (${user.role})`);
        successCount++;
      } catch (error) {
        console.error(`  ✗ Failed to migrate: ${user.email}`, error);
        errorCount++;
      }
    }

    console.log('');
    console.log('=== Migration Summary ===');
    console.log(`Total users processed: ${usersWithoutOrg.length}`);
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Failed: ${errorCount}`);
    console.log(`Legacy Organization ID: ${legacyOrg.id}`);
    console.log('');

    if (errorCount === 0) {
      console.log('Migration completed successfully!');
    } else {
      console.log('Migration completed with errors. Please review the failed users above.');
    }

  } catch (error) {
    console.error('Migration failed with error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateExistingUsers()
  .catch((error) => {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  });
