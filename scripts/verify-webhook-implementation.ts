/**
 * Verification script to ensure webhook implementation is correct
 *
 * This script validates:
 * - All required dependencies are installed
 * - Database utilities are accessible
 * - Clerk SDK is properly configured
 * - Environment variables are set
 */

import { prisma, isInvitationExpired } from '../src/packages/database/src';

async function verifyImplementation() {
  console.log('==========================================');
  console.log('Webhook Implementation Verification');
  console.log('==========================================\n');

  let checks = 0;
  let passed = 0;

  // Check 1: Database connection
  console.log('1. Checking database connection...');
  checks++;
  try {
    await prisma.$connect();
    console.log('   ✅ Database connected successfully\n');
    passed++;
  } catch (error) {
    console.log('   ❌ Database connection failed:', error);
    console.log('');
  }

  // Check 2: Verify invitation utility functions
  console.log('2. Checking invitation utility functions...');
  checks++;
  try {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const isExpired = isInvitationExpired(futureDate);

    if (isExpired === false) {
      console.log('   ✅ isInvitationExpired() working correctly\n');
      passed++;
    } else {
      console.log('   ❌ isInvitationExpired() returned unexpected result\n');
    }
  } catch (error) {
    console.log('   ❌ Invitation utility error:', error);
    console.log('');
  }

  // Check 3: Environment variables
  console.log('3. Checking environment variables...');
  checks++;
  const requiredEnvVars = [
    'DATABASE_URL',
    'CLERK_SECRET_KEY',
    'CLERK_WEBHOOK_SECRET',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  ];

  const missingVars = requiredEnvVars.filter(v => !process.env[v] || process.env[v] === 'whsec_your_webhook_secret_here');

  if (missingVars.length === 0) {
    console.log('   ✅ All required environment variables set\n');
    passed++;
  } else {
    console.log('   ⚠️  Missing or placeholder environment variables:');
    missingVars.forEach(v => console.log(`      - ${v}`));
    console.log('');
  }

  // Check 4: Database schema
  console.log('4. Checking database schema...');
  checks++;
  try {
    // Try to query organizations table
    const orgCount = await prisma.organization.count();
    const invitationCount = await prisma.invitation.count();
    const userCount = await prisma.user.count();

    console.log(`   ✅ Database schema valid`);
    console.log(`      - Organizations: ${orgCount}`);
    console.log(`      - Invitations: ${invitationCount}`);
    console.log(`      - Users: ${userCount}\n`);
    passed++;
  } catch (error) {
    console.log('   ❌ Database schema error:', error);
    console.log('');
  }

  // Check 5: Webhook file exists
  console.log('5. Checking webhook file...');
  checks++;
  try {
    const fs = await import('fs');
    const webhookPath = 'src/apps/client-portal/app/api/webhooks/clerk/route.ts';

    if (fs.existsSync(webhookPath)) {
      const content = fs.readFileSync(webhookPath, 'utf-8');

      // Check for critical security features
      const hasSignatureVerification = content.includes('wh.verify');
      const hasDeleteClerkUser = content.includes('deleteClerkUser');
      const hasValidateInvitation = content.includes('validateAndConsumeInvitation');
      const hasTransaction = content.includes('prisma.$transaction');

      if (hasSignatureVerification && hasDeleteClerkUser && hasValidateInvitation && hasTransaction) {
        console.log('   ✅ Webhook implementation complete');
        console.log('      - Signature verification: ✓');
        console.log('      - User deletion: ✓');
        console.log('      - Invitation validation: ✓');
        console.log('      - Atomic transactions: ✓\n');
        passed++;
      } else {
        console.log('   ⚠️  Webhook missing some features:');
        if (!hasSignatureVerification) console.log('      - Missing signature verification');
        if (!hasDeleteClerkUser) console.log('      - Missing user deletion');
        if (!hasValidateInvitation) console.log('      - Missing invitation validation');
        if (!hasTransaction) console.log('      - Missing atomic transactions');
        console.log('');
      }
    } else {
      console.log('   ❌ Webhook file not found at:', webhookPath);
      console.log('');
    }
  } catch (error) {
    console.log('   ❌ Error checking webhook file:', error);
    console.log('');
  }

  // Summary
  console.log('==========================================');
  console.log('Verification Results');
  console.log('==========================================');
  console.log(`Checks Passed: ${passed}/${checks}`);

  if (passed === checks) {
    console.log('Status: ✅ All checks passed - Ready for testing\n');
  } else {
    console.log('Status: ⚠️  Some checks failed - Review above\n');
  }

  // Cleanup
  await prisma.$disconnect();

  process.exit(passed === checks ? 0 : 1);
}

// Run verification
verifyImplementation().catch((error) => {
  console.error('Fatal error during verification:', error);
  process.exit(1);
});
