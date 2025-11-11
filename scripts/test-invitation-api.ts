/**
 * Test script for Invitation CRUD API endpoints
 *
 * This script tests all invitation API endpoints:
 * - POST /api/invitations (Create)
 * - GET /api/invitations (List)
 * - GET /api/invitations/[id] (Read)
 * - PATCH /api/invitations/[id] (Update)
 * - DELETE /api/invitations/[id] (Cancel)
 * - POST /api/invitations/[id]/resend (Resend)
 *
 * Prerequisites:
 * - Server must be running (npm run dev)
 * - User must be authenticated as ADMIN
 * - User must belong to an organization
 *
 * Usage:
 *   npx tsx scripts/test-invitation-api.ts
 */

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/invitations`;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name: string) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`TEST: ${name}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

async function makeRequest(
  method: string,
  endpoint: string,
  body?: any,
  expectStatus: number = 200
): Promise<any> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, you would need actual authentication headers
        // This assumes the dev server has a session cookie
      },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = response.status === 204 ? null : await response.json();

    log(`${method} ${endpoint}`, 'blue');
    log(`Status: ${response.status}`, response.status === expectStatus ? 'green' : 'red');

    if (data) {
      log(`Response: ${JSON.stringify(data, null, 2)}`, 'yellow');
    }

    return { status: response.status, data };
  } catch (error) {
    log(`Error: ${error instanceof Error ? error.message : String(error)}`, 'red');
    throw error;
  }
}

async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  logTest(name);
  const startTime = Date.now();

  try {
    await testFn();
    const duration = Date.now() - startTime;
    results.push({ name, success: true, message: 'Passed', duration });
    log('✓ Test passed', 'green');
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, success: false, message, duration });
    log(`✗ Test failed: ${message}`, 'red');
  }
}

// Store created invitation ID for subsequent tests
let createdInvitationId: string | null = null;
const testEmail = `test-${Date.now()}@example.com`;

async function main() {
  log('\n🚀 Starting Invitation API Tests', 'cyan');
  log(`Base URL: ${API_BASE}\n`, 'blue');

  // Test 1: Create invitation
  await runTest('1. Create Invitation (POST /api/invitations)', async () => {
    const response = await makeRequest(
      'POST',
      '',
      {
        email: testEmail,
        role: 'USER',
      },
      201
    );

    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }

    if (!response.data.id) {
      throw new Error('Response missing invitation ID');
    }

    if (response.data.email !== testEmail) {
      throw new Error(`Expected email ${testEmail}, got ${response.data.email}`);
    }

    if (response.data.role !== 'USER') {
      throw new Error(`Expected role USER, got ${response.data.role}`);
    }

    if (response.data.status !== 'PENDING') {
      throw new Error(`Expected status PENDING, got ${response.data.status}`);
    }

    if (response.data.token) {
      throw new Error('Response should not include sensitive token');
    }

    createdInvitationId = response.data.id;
    log(`Created invitation ID: ${createdInvitationId}`, 'green');
  });

  // Test 2: Create duplicate invitation (should fail)
  await runTest('2. Create Duplicate Invitation (Should Fail)', async () => {
    const response = await makeRequest(
      'POST',
      '',
      {
        email: testEmail,
        role: 'USER',
      },
      409
    );

    if (response.status !== 409) {
      throw new Error(`Expected status 409 (conflict), got ${response.status}`);
    }
  });

  // Test 3: List invitations
  await runTest('3. List Invitations (GET /api/invitations)', async () => {
    const response = await makeRequest('GET', '', undefined, 200);

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    if (!response.data.data || !Array.isArray(response.data.data)) {
      throw new Error('Response missing data array');
    }

    if (!response.data.pagination) {
      throw new Error('Response missing pagination info');
    }

    const found = response.data.data.find((inv: any) => inv.id === createdInvitationId);
    if (!found) {
      throw new Error('Created invitation not found in list');
    }

    log(`Found ${response.data.data.length} invitations`, 'green');
  });

  // Test 4: List with filters
  await runTest('4. List Invitations with Filters', async () => {
    const response = await makeRequest(
      'GET',
      `?status=PENDING&email=${testEmail}&limit=10`,
      undefined,
      200
    );

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const found = response.data.data.find((inv: any) => inv.email === testEmail);
    if (!found) {
      throw new Error('Filtered invitation not found');
    }

    log(`Filter working correctly`, 'green');
  });

  // Test 5: Get single invitation
  if (createdInvitationId) {
    await runTest('5. Get Single Invitation (GET /api/invitations/[id])', async () => {
      const response = await makeRequest('GET', `/${createdInvitationId}`, undefined, 200);

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (response.data.id !== createdInvitationId) {
        throw new Error('Wrong invitation returned');
      }

      if (!response.data.inviter) {
        throw new Error('Response missing inviter details');
      }

      if (!response.data.organization) {
        throw new Error('Response missing organization details');
      }

      log('Invitation details retrieved successfully', 'green');
    });
  }

  // Test 6: Update invitation
  if (createdInvitationId) {
    await runTest('6. Update Invitation (PATCH /api/invitations/[id])', async () => {
      const response = await makeRequest(
        'PATCH',
        `/${createdInvitationId}`,
        {
          role: 'ACCOUNTANT',
        },
        200
      );

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (response.data.role !== 'ACCOUNTANT') {
        throw new Error(`Expected role ACCOUNTANT, got ${response.data.role}`);
      }

      log('Invitation role updated successfully', 'green');
    });
  }

  // Test 7: Resend invitation
  if (createdInvitationId) {
    await runTest('7. Resend Invitation (POST /api/invitations/[id]/resend)', async () => {
      const response = await makeRequest(
        'POST',
        `/${createdInvitationId}/resend`,
        {},
        200
      );

      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }

      if (!response.data.message) {
        throw new Error('Response missing success message');
      }

      if (!response.data.invitation) {
        throw new Error('Response missing invitation data');
      }

      log('Invitation resent successfully', 'green');
    });
  }

  // Test 8: Cancel invitation
  if (createdInvitationId) {
    await runTest('8. Cancel Invitation (DELETE /api/invitations/[id])', async () => {
      const response = await makeRequest('DELETE', `/${createdInvitationId}`, undefined, 204);

      if (response.status !== 204) {
        throw new Error(`Expected status 204, got ${response.status}`);
      }

      log('Invitation cancelled successfully', 'green');
    });
  }

  // Test 9: Verify cancelled invitation cannot be updated
  if (createdInvitationId) {
    await runTest('9. Update Cancelled Invitation (Should Fail)', async () => {
      const response = await makeRequest(
        'PATCH',
        `/${createdInvitationId}`,
        {
          role: 'ADMIN',
        },
        400
      );

      if (response.status !== 400) {
        throw new Error(`Expected status 400, got ${response.status}`);
      }

      log('Correctly prevented updating cancelled invitation', 'green');
    });
  }

  // Test 10: Validation errors
  await runTest('10. Invalid Email Format (Should Fail)', async () => {
    const response = await makeRequest(
      'POST',
      '',
      {
        email: 'invalid-email',
        role: 'USER',
      },
      400
    );

    if (response.status !== 400) {
      throw new Error(`Expected status 400, got ${response.status}`);
    }

    log('Email validation working correctly', 'green');
  });

  await runTest('11. Invalid Role (Should Fail)', async () => {
    const response = await makeRequest(
      'POST',
      '',
      {
        email: 'test@example.com',
        role: 'INVALID_ROLE',
      },
      400
    );

    if (response.status !== 400) {
      throw new Error(`Expected status 400, got ${response.status}`);
    }

    log('Role validation working correctly', 'green');
  });

  // Print summary
  log('\n' + '='.repeat(60), 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const total = results.length;

  results.forEach((result) => {
    const icon = result.success ? '✓' : '✗';
    const color = result.success ? 'green' : 'red';
    log(`${icon} ${result.name} (${result.duration}ms)`, color);
    if (!result.success) {
      log(`  Error: ${result.message}`, 'red');
    }
  });

  log(`\nTotal: ${total} | Passed: ${passed} | Failed: ${failed}`, 'cyan');
  log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`, 'cyan');

  // Exit with error code if any tests failed
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
main().catch((error) => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
