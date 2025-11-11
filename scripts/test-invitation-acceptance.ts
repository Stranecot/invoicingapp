/**
 * Test script for invitation acceptance endpoints
 *
 * This script tests the invitation acceptance flow without requiring Clerk authentication.
 * It verifies that the public endpoints work correctly for invited users before signup.
 *
 * Run this script with:
 * npx tsx scripts/test-invitation-acceptance.ts
 */

import { prisma, generateInvitationToken, generateInvitationExpiry } from '../src/packages/database/src';

const BASE_URL = 'http://localhost:3001';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function addResult(name: string, passed: boolean, message: string, details?: any) {
  results.push({ name, passed, message, details });
  const status = passed ? '✓' : '✗';
  console.log(`${status} ${name}: ${message}`);
  if (details) {
    console.log('  Details:', JSON.stringify(details, null, 2));
  }
}

async function testVerifyEndpointWithValidToken(token: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/invitations/accept/verify?token=${encodeURIComponent(token)}`);
    const data = await response.json();

    if (response.ok && data.valid === true && data.invitation) {
      addResult(
        'Verify endpoint with valid token',
        true,
        'Successfully verified valid invitation',
        data.invitation
      );
      return true;
    } else {
      addResult(
        'Verify endpoint with valid token',
        false,
        'Failed to verify valid invitation',
        data
      );
      return false;
    }
  } catch (error) {
    addResult(
      'Verify endpoint with valid token',
      false,
      'Request failed: ' + (error as Error).message
    );
    return false;
  }
}

async function testVerifyEndpointWithExpiredToken(token: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/invitations/accept/verify?token=${encodeURIComponent(token)}`);
    const data = await response.json();

    if (response.ok && data.valid === false && data.reason === 'expired') {
      addResult(
        'Verify endpoint with expired token',
        true,
        'Correctly identified expired invitation'
      );
      return true;
    } else {
      addResult(
        'Verify endpoint with expired token',
        false,
        'Did not correctly identify expired invitation',
        data
      );
      return false;
    }
  } catch (error) {
    addResult(
      'Verify endpoint with expired token',
      false,
      'Request failed: ' + (error as Error).message
    );
    return false;
  }
}

async function testVerifyEndpointWithInvalidToken() {
  try {
    const response = await fetch(`${BASE_URL}/api/invitations/accept/verify?token=invalid_token_123`);
    const data = await response.json();

    if (response.ok && data.valid === false && data.reason === 'not_found') {
      addResult(
        'Verify endpoint with invalid token',
        true,
        'Correctly identified invalid invitation'
      );
      return true;
    } else {
      addResult(
        'Verify endpoint with invalid token',
        false,
        'Did not correctly identify invalid invitation',
        data
      );
      return false;
    }
  } catch (error) {
    addResult(
      'Verify endpoint with invalid token',
      false,
      'Request failed: ' + (error as Error).message
    );
    return false;
  }
}

async function testAcceptEndpointWithValidToken(token: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/invitations/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    const data = await response.json();

    if (response.ok && data.success === true && data.redirectUrl) {
      addResult(
        'Accept endpoint with valid token',
        true,
        'Successfully accepted invitation',
        { redirectUrl: data.redirectUrl, organization: data.organization }
      );
      return true;
    } else {
      addResult(
        'Accept endpoint with valid token',
        false,
        'Failed to accept valid invitation',
        data
      );
      return false;
    }
  } catch (error) {
    addResult(
      'Accept endpoint with valid token',
      false,
      'Request failed: ' + (error as Error).message
    );
    return false;
  }
}

async function testAcceptEndpointWithExpiredToken(token: string) {
  try {
    const response = await fetch(`${BASE_URL}/api/invitations/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    const data = await response.json();

    if (response.status === 400 && data.reason === 'expired') {
      addResult(
        'Accept endpoint with expired token',
        true,
        'Correctly rejected expired invitation'
      );
      return true;
    } else {
      addResult(
        'Accept endpoint with expired token',
        false,
        'Did not correctly reject expired invitation',
        data
      );
      return false;
    }
  } catch (error) {
    addResult(
      'Accept endpoint with expired token',
      false,
      'Request failed: ' + (error as Error).message
    );
    return false;
  }
}

async function testRateLimiting() {
  try {
    // Make 6 requests quickly to trigger rate limit
    const promises = [];
    for (let i = 0; i < 6; i++) {
      promises.push(
        fetch(`${BASE_URL}/api/invitations/accept/verify?token=test_token_${i}`)
      );
    }

    const responses = await Promise.all(promises);
    const lastResponse = responses[5];

    if (lastResponse.status === 429) {
      addResult(
        'Rate limiting',
        true,
        'Rate limiting working correctly (6th request blocked)'
      );
      return true;
    } else {
      addResult(
        'Rate limiting',
        false,
        'Rate limiting not working (6th request should be blocked)',
        { status: lastResponse.status }
      );
      return false;
    }
  } catch (error) {
    addResult(
      'Rate limiting',
      false,
      'Request failed: ' + (error as Error).message
    );
    return false;
  }
}

async function main() {
  console.log('Starting invitation acceptance tests...\n');

  try {
    // Step 1: Create a test organization
    console.log('Step 1: Creating test organization...');
    const organization = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        slug: `test-org-${Date.now()}`,
        billingEmail: 'admin@test.com',
        status: 'ACTIVE',
        plan: 'FREE',
        maxUsers: 10,
      },
    });
    console.log('✓ Organization created:', organization.id);

    // Step 2: Create a valid invitation
    console.log('\nStep 2: Creating valid test invitation...');
    const validToken = generateInvitationToken();
    const validInvitation = await prisma.invitation.create({
      data: {
        email: 'test.user@example.com',
        token: validToken,
        role: 'USER',
        organizationId: organization.id,
        invitedBy: 'admin-user-id',
        expiresAt: generateInvitationExpiry(7),
        status: 'PENDING',
        customerIds: [],
      },
    });
    console.log('✓ Valid invitation created');

    // Step 3: Create an expired invitation
    console.log('\nStep 3: Creating expired test invitation...');
    const expiredToken = generateInvitationToken();
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday
    const expiredInvitation = await prisma.invitation.create({
      data: {
        email: 'expired.user@example.com',
        token: expiredToken,
        role: 'USER',
        organizationId: organization.id,
        invitedBy: 'admin-user-id',
        expiresAt: expiredDate,
        status: 'PENDING',
        customerIds: [],
      },
    });
    console.log('✓ Expired invitation created');

    // Step 4: Test verify endpoint with valid token
    console.log('\nStep 4: Testing verify endpoint...');
    await testVerifyEndpointWithValidToken(validToken);
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay

    // Step 5: Test verify endpoint with expired token
    await testVerifyEndpointWithExpiredToken(expiredToken);
    await new Promise(resolve => setTimeout(resolve, 100));

    // Step 6: Test verify endpoint with invalid token
    await testVerifyEndpointWithInvalidToken();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Step 7: Test accept endpoint with valid token
    console.log('\nStep 5: Testing accept endpoint...');
    await testAcceptEndpointWithValidToken(validToken);
    await new Promise(resolve => setTimeout(resolve, 100));

    // Step 8: Test accept endpoint with expired token
    await testAcceptEndpointWithExpiredToken(expiredToken);
    await new Promise(resolve => setTimeout(resolve, 100));

    // Step 9: Test rate limiting (wait a bit to reset previous calls)
    console.log('\nStep 6: Testing rate limiting...');
    await new Promise(resolve => setTimeout(resolve, 61000)); // Wait for rate limit to reset
    await testRateLimiting();

    // Clean up test data
    console.log('\nCleaning up test data...');
    await prisma.invitation.deleteMany({
      where: {
        organizationId: organization.id,
      },
    });
    await prisma.organization.delete({
      where: { id: organization.id },
    });
    console.log('✓ Test data cleaned up');

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    console.log(`Total tests: ${results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

    if (failed > 0) {
      console.log('\nFailed tests:');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`  - ${r.name}: ${r.message}`);
      });
    }

    console.log('\n' + '='.repeat(60));

    process.exit(failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
