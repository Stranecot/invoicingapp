import { FullConfig } from '@playwright/test';

/**
 * Global teardown runs once after all tests
 * Use this to:
 * - Clean up test database
 * - Remove test files
 * - Close database connections
 */
async function globalTeardown(config: FullConfig) {
  console.log('\n🧹 Cleaning up after E2E tests...\n');

  // Add any cleanup logic here
  // For example, you might want to:
  // - Reset the test database
  // - Remove uploaded test files
  // - Clear test cache

  console.log('✅ E2E test cleanup complete!\n');
}

export default globalTeardown;
