import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup runs once before all tests
 * Use this to:
 * - Set up test database
 * - Create test users
 * - Seed test data
 * - Verify services are running
 */
async function globalSetup(config: FullConfig) {
  console.log('\n🚀 Starting E2E test setup...\n');

  // Verify that dev servers are accessible
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('✓ Verifying client portal is running...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✓ Client portal is ready\n');

    console.log('✓ Verifying admin dashboard is running...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✓ Admin dashboard is ready\n');
  } catch (error) {
    console.error('❌ Failed to connect to dev servers');
    console.error('Make sure both apps are running:');
    console.error('  - Client Portal: http://localhost:3001');
    console.error('  - Admin Dashboard: http://localhost:3002');
    throw error;
  } finally {
    await page.close();
    await browser.close();
  }

  console.log('✅ E2E test setup complete!\n');
}

export default globalSetup;
