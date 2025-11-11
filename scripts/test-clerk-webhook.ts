/**
 * Test script for Clerk webhook invitation-based signup enforcement
 *
 * This script tests the webhook with various scenarios:
 * 1. Valid invitation - should succeed
 * 2. No invitation - should reject and delete user
 * 3. Expired invitation - should reject and delete user
 * 4. Already used invitation - should reject
 * 5. Organization user limit - should reject
 *
 * Usage:
 *   npx tsx scripts/test-clerk-webhook.ts
 */

import { prisma, generateInvitationToken, generateInvitationExpiry } from '../src/packages/database/src';
import crypto from 'crypto';

interface WebhookPayload {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{
      id: string;
      email_address: string;
    }>;
    primary_email_address_id: string;
    first_name: string | null;
    last_name: string | null;
  };
}

// Generate Svix signature for testing
function generateSvixSignature(payload: string, secret: string, timestamp: string): string {
  const signedContent = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret.split('_')[1] || secret)
    .update(signedContent)
    .digest('base64');
  return `v1,${signature}`;
}

// Test helper to send webhook request
async function sendWebhookRequest(
  payload: WebhookPayload,
  webhookSecret: string
): Promise<{ status: number; body: string }> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = JSON.stringify(payload);
  const signature = generateSvixSignature(body, webhookSecret, timestamp);
  const id = crypto.randomUUID();

  const webhookUrl = 'http://localhost:3001/api/webhooks/clerk';

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'svix-id': id,
      'svix-timestamp': timestamp,
      'svix-signature': signature,
    },
    body: body,
  });

  return {
    status: response.status,
    body: await response.text(),
  };
}

// Create mock user.created webhook payload
function createUserCreatedPayload(email: string, clerkId?: string): WebhookPayload {
  const userId = clerkId || `user_${crypto.randomBytes(16).toString('hex')}`;
  const emailId = `email_${crypto.randomBytes(8).toString('hex')}`;

  return {
    type: 'user.created',
    data: {
      id: userId,
      email_addresses: [
        {
          id: emailId,
          email_address: email,
        },
      ],
      primary_email_address_id: emailId,
      first_name: 'Test',
      last_name: 'User',
    },
  };
}

async function runTests() {
  console.log('==========================================');
  console.log('Clerk Webhook Security Test Suite');
  console.log('==========================================\n');

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret || webhookSecret === 'whsec_your_webhook_secret_here') {
    console.error('ERROR: CLERK_WEBHOOK_SECRET not configured');
    console.error('Please set a test webhook secret in .env file');
    process.exit(1);
  }

  // Setup: Create test organization
  console.log('Setting up test organization...');
  const testOrg = await prisma.organization.create({
    data: {
      name: 'Test Organization',
      slug: `test-org-${Date.now()}`,
      billingEmail: 'billing@test.com',
      status: 'ACTIVE',
      maxUsers: 2, // Low limit for testing
    },
  });
  console.log('Created organization:', testOrg.id, '\n');

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Valid invitation - should succeed
  console.log('TEST 1: Valid invitation signup');
  console.log('-----------------------------------');
  try {
    const validEmail = `valid-${Date.now()}@test.com`;
    const invitation1 = await prisma.invitation.create({
      data: {
        email: validEmail,
        role: 'USER',
        organizationId: testOrg.id,
        invitedBy: 'admin-user-id',
        token: generateInvitationToken(),
        expiresAt: generateInvitationExpiry(7),
        status: 'PENDING',
        customerIds: [],
      },
    });

    const payload = createUserCreatedPayload(validEmail);
    const result = await sendWebhookRequest(payload, webhookSecret);

    if (result.status === 200) {
      // Verify user was created
      const user = await prisma.user.findUnique({
        where: { clerkId: payload.data.id },
      });

      // Verify invitation was accepted
      const updatedInvitation = await prisma.invitation.findUnique({
        where: { id: invitation1.id },
      });

      if (user && updatedInvitation?.status === 'ACCEPTED') {
        console.log('PASS: User created successfully');
        console.log('  - User ID:', user.id);
        console.log('  - Organization:', user.organizationId);
        console.log('  - Role:', user.role);
        console.log('  - Invitation accepted at:', updatedInvitation.acceptedAt);
        testsPassed++;
      } else {
        console.log('FAIL: User or invitation not properly updated');
        testsFailed++;
      }
    } else {
      console.log('FAIL: Expected 200, got', result.status);
      console.log('  Response:', result.body);
      testsFailed++;
    }
  } catch (error) {
    console.log('FAIL: Error during test:', error);
    testsFailed++;
  }
  console.log('');

  // Test 2: No invitation - should reject
  console.log('TEST 2: No invitation (unauthorized signup)');
  console.log('-----------------------------------');
  try {
    const unauthorizedEmail = `unauthorized-${Date.now()}@test.com`;
    const payload = createUserCreatedPayload(unauthorizedEmail);

    const result = await sendWebhookRequest(payload, webhookSecret);

    if (result.status === 403) {
      // Verify user was NOT created
      const user = await prisma.user.findUnique({
        where: { clerkId: payload.data.id },
      });

      if (!user) {
        console.log('PASS: Unauthorized signup rejected');
        console.log('  - Status: 403 Forbidden');
        console.log('  - User not created in database');
        testsPassed++;
      } else {
        console.log('FAIL: User was created despite no invitation');
        testsFailed++;
      }
    } else {
      console.log('FAIL: Expected 403, got', result.status);
      console.log('  Response:', result.body);
      testsFailed++;
    }
  } catch (error) {
    console.log('FAIL: Error during test:', error);
    testsFailed++;
  }
  console.log('');

  // Test 3: Expired invitation - should reject
  console.log('TEST 3: Expired invitation');
  console.log('-----------------------------------');
  try {
    const expiredEmail = `expired-${Date.now()}@test.com`;
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

    const invitation2 = await prisma.invitation.create({
      data: {
        email: expiredEmail,
        role: 'USER',
        organizationId: testOrg.id,
        invitedBy: 'admin-user-id',
        token: generateInvitationToken(),
        expiresAt: expiredDate,
        status: 'PENDING',
        customerIds: [],
      },
    });

    const payload = createUserCreatedPayload(expiredEmail);
    const result = await sendWebhookRequest(payload, webhookSecret);

    if (result.status === 403) {
      // Verify invitation was marked as expired
      const updatedInvitation = await prisma.invitation.findUnique({
        where: { id: invitation2.id },
      });

      if (updatedInvitation?.status === 'EXPIRED') {
        console.log('PASS: Expired invitation rejected');
        console.log('  - Status: 403 Forbidden');
        console.log('  - Invitation marked as EXPIRED');
        testsPassed++;
      } else {
        console.log('FAIL: Invitation status not updated to EXPIRED');
        testsFailed++;
      }
    } else {
      console.log('FAIL: Expected 403, got', result.status);
      console.log('  Response:', result.body);
      testsFailed++;
    }
  } catch (error) {
    console.log('FAIL: Error during test:', error);
    testsFailed++;
  }
  console.log('');

  // Test 4: Organization user limit
  console.log('TEST 4: Organization user limit enforcement');
  console.log('-----------------------------------');
  try {
    // Create another user to reach the limit
    const limitEmail1 = `limit1-${Date.now()}@test.com`;
    const invitation3 = await prisma.invitation.create({
      data: {
        email: limitEmail1,
        role: 'USER',
        organizationId: testOrg.id,
        invitedBy: 'admin-user-id',
        token: generateInvitationToken(),
        expiresAt: generateInvitationExpiry(7),
        status: 'PENDING',
        customerIds: [],
      },
    });

    const payload1 = createUserCreatedPayload(limitEmail1);
    await sendWebhookRequest(payload1, webhookSecret);

    // Now try to add one more (should exceed limit of 2)
    const limitEmail2 = `limit2-${Date.now()}@test.com`;
    const invitation4 = await prisma.invitation.create({
      data: {
        email: limitEmail2,
        role: 'USER',
        organizationId: testOrg.id,
        invitedBy: 'admin-user-id',
        token: generateInvitationToken(),
        expiresAt: generateInvitationExpiry(7),
        status: 'PENDING',
        customerIds: [],
      },
    });

    const payload2 = createUserCreatedPayload(limitEmail2);
    const result = await sendWebhookRequest(payload2, webhookSecret);

    if (result.status === 403) {
      console.log('PASS: User limit enforced');
      console.log('  - Status: 403 Forbidden');
      console.log('  - Organization max users:', testOrg.maxUsers);
      testsPassed++;
    } else {
      console.log('FAIL: Expected 403, got', result.status);
      console.log('  Response:', result.body);
      testsFailed++;
    }
  } catch (error) {
    console.log('FAIL: Error during test:', error);
    testsFailed++;
  }
  console.log('');

  // Test 5: Already accepted invitation - should reject
  console.log('TEST 5: Already accepted invitation (reuse attempt)');
  console.log('-----------------------------------');
  try {
    const reusedEmail = `reuse-${Date.now()}@test.com`;
    const invitation5 = await prisma.invitation.create({
      data: {
        email: reusedEmail,
        role: 'USER',
        organizationId: testOrg.id,
        invitedBy: 'admin-user-id',
        token: generateInvitationToken(),
        expiresAt: generateInvitationExpiry(7),
        status: 'ACCEPTED', // Already accepted
        acceptedAt: new Date(),
        customerIds: [],
      },
    });

    const payload = createUserCreatedPayload(reusedEmail);
    const result = await sendWebhookRequest(payload, webhookSecret);

    if (result.status === 403) {
      console.log('PASS: Reused invitation rejected');
      console.log('  - Status: 403 Forbidden');
      console.log('  - Invitation already accepted');
      testsPassed++;
    } else {
      console.log('FAIL: Expected 403, got', result.status);
      console.log('  Response:', result.body);
      testsFailed++;
    }
  } catch (error) {
    console.log('FAIL: Error during test:', error);
    testsFailed++;
  }
  console.log('');

  // Cleanup
  console.log('Cleaning up test data...');
  await prisma.user.deleteMany({
    where: { organizationId: testOrg.id },
  });
  await prisma.invitation.deleteMany({
    where: { organizationId: testOrg.id },
  });
  await prisma.organization.delete({
    where: { id: testOrg.id },
  });
  console.log('Cleanup complete\n');

  // Summary
  console.log('==========================================');
  console.log('Test Results Summary');
  console.log('==========================================');
  console.log(`Total Tests: ${testsPassed + testsFailed}`);
  console.log(`Passed: ${testsPassed}`);
  console.log(`Failed: ${testsFailed}`);
  console.log('==========================================\n');

  if (testsFailed > 0) {
    console.log('Some tests failed. Please review the output above.');
    process.exit(1);
  } else {
    console.log('All tests passed! Invitation-based signup is enforced correctly.');
    process.exit(0);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
