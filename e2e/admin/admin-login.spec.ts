import { test, expect } from '../fixtures/test-fixtures';
import { TEST_USERS } from '../fixtures/test-fixtures';

test.describe('Admin Dashboard - Login', () => {
  const adminDashboardUrl = process.env.ADMIN_DASHBOARD_URL || 'http://localhost:3002';

  test('should load admin dashboard login page', async ({ page }) => {
    await page.goto(adminDashboardUrl);

    // Should redirect to sign-in if not authenticated
    await expect(page).toHaveURL(/sign-in/, { timeout: 10000 });

    // Check for Clerk sign-in form
    await expect(page.locator('input[name="identifier"]')).toBeVisible();
  });

  test('should successfully log in as admin', async ({ page }) => {
    await page.goto(adminDashboardUrl);

    // Wait for sign-in page
    await page.waitForURL(/sign-in/, { timeout: 10000 });

    // Fill in credentials
    await page.fill('input[name="identifier"]', TEST_USERS.admin.email);
    await page.click('button:has-text("Continue")');

    // Wait for password field
    await page.waitForSelector('input[name="password"]', { timeout: 5000 });
    await page.fill('input[name="password"]', TEST_USERS.admin.password);
    await page.click('button:has-text("Continue")');

    // Should redirect to admin dashboard
    await page.waitForURL(/localhost:3002/, { timeout: 15000 });

    // Verify admin dashboard is loaded
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto(`${adminDashboardUrl}/sign-in`);

    // Wait for sign-in form
    await page.waitForSelector('input[name="identifier"]');

    // Try to login with invalid credentials
    await page.fill('input[name="identifier"]', 'invalid@test.com');
    await page.click('button:has-text("Continue")');

    await page.waitForSelector('input[name="password"]', { timeout: 5000 });
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button:has-text("Continue")');

    // Should show error message
    await expect(page.locator('text=/incorrect|invalid|error/i')).toBeVisible({ timeout: 5000 });
  });

  test('should persist authentication on page reload', async ({ adminPage }) => {
    // adminPage is already authenticated
    const currentUrl = adminPage.url();

    // Reload the page
    await adminPage.reload();

    // Should remain on the same page (not redirect to login)
    await expect(adminPage).toHaveURL(currentUrl);
  });
});
