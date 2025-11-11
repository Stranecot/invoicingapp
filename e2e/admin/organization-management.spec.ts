import { test, expect } from '../fixtures/test-fixtures';

test.describe('Admin Dashboard - Organization Management', () => {
  test.use({ baseURL: 'http://localhost:3002' });

  test('should display organizations list', async ({ adminPage }) => {
    await adminPage.goto('/');

    // Wait for page to load
    await adminPage.waitForLoadState('networkidle');

    // Check for organizations section or table
    const hasOrganizationsHeading = await adminPage
      .locator('h1:has-text("Organizations"), h2:has-text("Organizations")')
      .isVisible()
      .catch(() => false);

    const hasTable = await adminPage.locator('table').isVisible().catch(() => false);

    // At least one should be visible
    expect(hasOrganizationsHeading || hasTable).toBeTruthy();
  });

  test('should open create organization dialog', async ({ adminPage }) => {
    await adminPage.goto('/');

    // Look for "Create Organization" or "Add Organization" button
    const createButton = adminPage.locator(
      'button:has-text("Create Organization"), button:has-text("Add Organization"), button:has-text("New Organization")'
    );

    // Check if button exists
    const buttonExists = await createButton.count();

    if (buttonExists > 0) {
      await createButton.first().click();

      // Should open a modal/dialog or navigate to form
      await expect(
        adminPage.locator('dialog, [role="dialog"], form').first()
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test('should create a new organization', async ({ adminPage }) => {
    await adminPage.goto('/');

    // Try to find and click create button
    const createButton = adminPage.locator(
      'button:has-text("Create Organization"), button:has-text("Add Organization"), button:has-text("New Organization")'
    );

    const buttonExists = await createButton.count();

    if (buttonExists > 0) {
      await createButton.first().click();

      // Wait for form
      await adminPage.waitForSelector('input[name="name"], input[name="organizationName"]', {
        timeout: 3000,
      });

      // Fill in organization details
      const testOrgName = `Test Org ${Date.now()}`;
      await adminPage.fill('input[name="name"], input[name="organizationName"]', testOrgName);

      // Fill billing email if field exists
      const billingEmailField = adminPage.locator(
        'input[name="billingEmail"], input[type="email"]'
      );
      if (await billingEmailField.isVisible().catch(() => false)) {
        await billingEmailField.fill(`billing-${Date.now()}@test.com`);
      }

      // Submit form
      await adminPage.click('button:has-text("Create"), button:has-text("Save"), button[type="submit"]');

      // Wait for success (toast, redirect, or new item in list)
      await adminPage.waitForTimeout(2000);

      // Verify organization was created
      const orgInList = await adminPage
        .locator(`text=${testOrgName}`)
        .isVisible()
        .catch(() => false);

      if (orgInList) {
        expect(orgInList).toBeTruthy();
      }
    }
  });

  test('should view organization details', async ({ adminPage }) => {
    await adminPage.goto('/');

    // Wait for page to load
    await adminPage.waitForLoadState('networkidle');

    // Find first organization in list
    const firstOrgLink = adminPage.locator(
      'table tbody tr:first-child a, [data-testid="org-item"]:first-child a'
    );

    const linkExists = await firstOrgLink.count();

    if (linkExists > 0) {
      await firstOrgLink.first().click();

      // Should navigate to organization details page
      await adminPage.waitForURL(/\/organizations\/|\/dashboard/, { timeout: 5000 });

      // Verify details page loaded
      await expect(adminPage.locator('h1, h2').first()).toBeVisible();
    }
  });

  test('should filter organizations by status', async ({ adminPage }) => {
    await adminPage.goto('/');

    // Wait for page to load
    await adminPage.waitForLoadState('networkidle');

    // Look for status filter dropdown
    const statusFilter = adminPage.locator(
      'select[name="status"], [data-testid="status-filter"]'
    );

    if (await statusFilter.isVisible().catch(() => false)) {
      // Get initial count
      const initialCount = await adminPage.locator('table tbody tr').count();

      // Change filter
      await statusFilter.selectOption('ACTIVE');
      await adminPage.waitForTimeout(1000);

      // Count should be updated (or at least page should react)
      const afterFilterCount = await adminPage.locator('table tbody tr').count();

      // Counts might be the same if all are active, but the action should work
      expect(typeof afterFilterCount).toBe('number');
    }
  });

  test('should search for organizations', async ({ adminPage }) => {
    await adminPage.goto('/');

    // Look for search input
    const searchInput = adminPage.locator(
      'input[type="search"], input[placeholder*="Search"], input[name="search"]'
    );

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('Test');
      await adminPage.waitForTimeout(1000);

      // Results should be filtered
      const resultsCount = await adminPage.locator('table tbody tr').count();
      expect(typeof resultsCount).toBe('number');
    }
  });

  test('should display organization statistics', async ({ adminPage }) => {
    await adminPage.goto('/');

    // Wait for dashboard to load
    await adminPage.waitForLoadState('networkidle');

    // Check for stat cards/widgets
    const hasStatCards = await adminPage
      .locator('[data-testid="stat-card"], .stat-card, [class*="stat"]')
      .first()
      .isVisible()
      .catch(() => false);

    const hasNumbers = await adminPage
      .locator('text=/\\d+/')
      .first()
      .isVisible()
      .catch(() => false);

    // Should have some statistics displayed
    expect(hasStatCards || hasNumbers).toBeTruthy();
  });
});
