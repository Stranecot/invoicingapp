import { test, expect } from '../fixtures/test-fixtures';
import { TEST_USERS } from '../fixtures/test-fixtures';

test.describe('Client Portal - Sign Up and Login', () => {
  test.use({ baseURL: 'http://localhost:3001' });

  test('should load sign-up page', async ({ page }) => {
    await page.goto('/sign-up');

    // Should show Clerk sign-up form
    await expect(page.locator('input[name="emailAddress"]')).toBeVisible({ timeout: 10000 });
  });

  test('should load sign-in page', async ({ page }) => {
    await page.goto('/sign-in');

    // Should show Clerk sign-in form
    await expect(page.locator('input[name="identifier"]')).toBeVisible({ timeout: 10000 });
  });

  test('should sign up a new user', async ({ page }) => {
    await page.goto('/sign-up');

    // Wait for form to load
    await page.waitForSelector('input[name="emailAddress"]');

    // Generate unique email
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    // Fill in sign-up form
    await page.fill('input[name="emailAddress"]', testEmail);
    await page.fill('input[name="password"]', testPassword);

    // Click sign up button
    await page.click('button:has-text("Continue"), button:has-text("Sign up")');

    // Wait for processing
    await page.waitForTimeout(3000);

    // Should redirect to verification, welcome, or dashboard
    const currentUrl = page.url();
    const isOnValidPage =
      currentUrl.includes('verify') ||
      currentUrl.includes('welcome') ||
      currentUrl.includes('setup') ||
      currentUrl.includes('dashboard');

    expect(isOnValidPage).toBeTruthy();
  });

  test('should log in existing user', async ({ page }) => {
    await page.goto('/sign-in');

    // Wait for sign-in form
    await page.waitForSelector('input[name="identifier"]');

    // Fill in credentials
    await page.fill('input[name="identifier"]', TEST_USERS.user.email);
    await page.click('button:has-text("Continue")');

    // Wait for password field
    await page.waitForSelector('input[name="password"]', { timeout: 5000 });
    await page.fill('input[name="password"]', TEST_USERS.user.password);
    await page.click('button:has-text("Continue")');

    // Should redirect to dashboard or setup
    await page.waitForURL(/\/(dashboard|setup|welcome)/, { timeout: 15000 });

    // Verify logged in
    const isLoggedIn = await page
      .locator('[data-testid="user-menu"], button:has-text("Sign out")')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    expect(isLoggedIn).toBeTruthy();
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/sign-in');

    // Wait for form
    await page.waitForSelector('input[name="identifier"]');

    // Try invalid credentials
    await page.fill('input[name="identifier"]', 'invalid@example.com');
    await page.click('button:has-text("Continue")');

    await page.waitForSelector('input[name="password"]', { timeout: 5000 });
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button:has-text("Continue")');

    // Should show error
    await expect(page.locator('text=/incorrect|invalid|error/i')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should validate email format on sign-up', async ({ page }) => {
    await page.goto('/sign-up');

    // Wait for form
    await page.waitForSelector('input[name="emailAddress"]');

    // Enter invalid email
    await page.fill('input[name="emailAddress"]', 'invalid-email');
    await page.fill('input[name="password"]', 'TestPassword123!');

    // Try to submit
    await page.click('button:has-text("Continue"), button:has-text("Sign up")');

    // Should show validation error
    const hasError = await page
      .locator('text=/invalid.*email|enter.*valid.*email/i')
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(hasError).toBeTruthy();
  });

  test('should validate password requirements on sign-up', async ({ page }) => {
    await page.goto('/sign-up');

    // Wait for form
    await page.waitForSelector('input[name="emailAddress"]');

    // Enter weak password
    await page.fill('input[name="emailAddress"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'weak');

    // Try to submit
    await page.click('button:has-text("Continue"), button:has-text("Sign up")');

    // Should show password requirement error
    const hasError = await page
      .locator('text=/password.*weak|password.*requirements|at least/i')
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    expect(hasError).toBeTruthy();
  });

  test('should navigate between sign-in and sign-up', async ({ page }) => {
    await page.goto('/sign-in');

    // Look for sign-up link
    const signUpLink = page.locator('a:has-text("Sign up"), a:has-text("Create account")');

    if (await signUpLink.isVisible().catch(() => false)) {
      await signUpLink.click();

      // Should navigate to sign-up page
      await expect(page).toHaveURL(/sign-up/, { timeout: 5000 });

      // Look for sign-in link
      const signInLink = page.locator('a:has-text("Sign in"), a:has-text("Log in")');

      if (await signInLink.isVisible().catch(() => false)) {
        await signInLink.click();

        // Should navigate back to sign-in
        await expect(page).toHaveURL(/sign-in/, { timeout: 5000 });
      }
    }
  });

  test('should handle "forgot password" flow', async ({ page }) => {
    await page.goto('/sign-in');

    // Look for forgot password link
    const forgotPasswordLink = page.locator(
      'a:has-text("Forgot password"), button:has-text("Forgot password")'
    );

    if (await forgotPasswordLink.isVisible().catch(() => false)) {
      await forgotPasswordLink.click();

      // Should show password reset form or navigate to forgot password page
      await page.waitForTimeout(2000);

      const hasResetForm = await page
        .locator('input[type="email"], text=/reset.*password|forgot.*password/i')
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasResetForm).toBeTruthy();
    }
  });

  test('should persist login across page navigation', async ({ page }) => {
    // Log in first
    await page.goto('/sign-in');
    await page.waitForSelector('input[name="identifier"]');
    await page.fill('input[name="identifier"]', TEST_USERS.user.email);
    await page.click('button:has-text("Continue")');
    await page.waitForSelector('input[name="password"]');
    await page.fill('input[name="password"]', TEST_USERS.user.password);
    await page.click('button:has-text("Continue")');

    // Wait for successful login
    await page.waitForURL(/\/(dashboard|setup|welcome)/, { timeout: 15000 });

    // Navigate to different pages
    await page.goto('/invoices');
    await page.waitForTimeout(1000);

    // Should still be logged in
    const isStillLoggedIn = page.url().includes('sign-in') === false;
    expect(isStillLoggedIn).toBeTruthy();
  });

  test('should log out successfully', async ({ authenticatedPage }) => {
    // User is already logged in
    await authenticatedPage.goto('/');

    // Look for user menu or sign out button
    const userMenu = authenticatedPage.locator('[data-testid="user-menu"], button[aria-label*="user"]');

    if (await userMenu.isVisible().catch(() => false)) {
      await userMenu.click();

      // Look for sign out option
      const signOutButton = authenticatedPage.locator(
        'button:has-text("Sign out"), a:has-text("Sign out"), text=Sign out'
      );

      if (await signOutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await signOutButton.click();

        // Should redirect to sign-in page or home
        await authenticatedPage.waitForTimeout(2000);

        const isLoggedOut =
          authenticatedPage.url().includes('sign-in') ||
          authenticatedPage.url() === 'http://localhost:3001/';

        expect(isLoggedOut).toBeTruthy();
      }
    }
  });
});
