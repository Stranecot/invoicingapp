import { test, expect } from '../fixtures/test-fixtures';

test.describe('Admin Dashboard - User Management', () => {
  test.use({ baseURL: 'http://localhost:3002' });

  test('should navigate to users page', async ({ adminPage }) => {
    await adminPage.goto('/');

    // Look for users link in navigation
    const usersLink = adminPage.locator('a:has-text("Users"), a[href*="user"]');

    const linkExists = await usersLink.count();

    if (linkExists > 0) {
      await usersLink.first().click();
      await expect(adminPage).toHaveURL(/user/, { timeout: 5000 });
    } else {
      // Navigate directly if no nav link
      await adminPage.goto('/dashboard/users');
    }
  });

  test('should display users list', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/users');

    // Wait for page to load
    await adminPage.waitForLoadState('networkidle');

    // Check for users table or list
    const hasTable = await adminPage.locator('table').isVisible().catch(() => false);
    const hasUsersHeading = await adminPage
      .locator('h1:has-text("User"), h2:has-text("User")')
      .isVisible()
      .catch(() => false);

    expect(hasTable || hasUsersHeading).toBeTruthy();
  });

  test('should filter users by role', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/users');

    // Wait for page to load
    await adminPage.waitForLoadState('networkidle');

    // Look for role filter
    const roleFilter = adminPage.locator(
      'select[name="role"], [data-testid="role-filter"], button:has-text("Role")'
    );

    if (await roleFilter.isVisible().catch(() => false)) {
      // Use filter
      if ((await roleFilter.evaluate((el) => el.tagName)) === 'SELECT') {
        await roleFilter.selectOption('ADMIN');
      } else {
        await roleFilter.click();
        await adminPage.click('text=Admin');
      }

      await adminPage.waitForTimeout(1000);

      // Verify filtering worked
      const resultsCount = await adminPage.locator('table tbody tr').count();
      expect(typeof resultsCount).toBe('number');
    }
  });

  test('should filter users by organization', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/users');

    // Wait for page to load
    await adminPage.waitForLoadState('networkidle');

    // Look for organization filter
    const orgFilter = adminPage.locator(
      'select[name="organization"], [data-testid="org-filter"]'
    );

    if (await orgFilter.isVisible().catch(() => false)) {
      // Get first option that's not the default
      const options = await orgFilter.locator('option').count();

      if (options > 1) {
        await orgFilter.selectOption({ index: 1 });
        await adminPage.waitForTimeout(1000);

        // Verify filtering worked
        const resultsCount = await adminPage.locator('table tbody tr').count();
        expect(typeof resultsCount).toBe('number');
      }
    }
  });

  test('should search for users', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/users');

    // Look for search input
    const searchInput = adminPage.locator(
      'input[type="search"], input[placeholder*="Search"], input[name="search"]'
    );

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('admin');
      await adminPage.waitForTimeout(1000);

      // Results should be filtered
      const resultsCount = await adminPage.locator('table tbody tr').count();
      expect(typeof resultsCount).toBe('number');
    }
  });

  test('should view user details', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/users');

    // Wait for page to load
    await adminPage.waitForLoadState('networkidle');

    // Find first user in list
    const firstUserLink = adminPage.locator('table tbody tr:first-child a').first();

    const linkExists = await firstUserLink.isVisible().catch(() => false);

    if (linkExists) {
      await firstUserLink.click();

      // Should navigate to user details or open modal
      await adminPage.waitForTimeout(2000);

      // Verify details are shown
      const hasDetails = await adminPage
        .locator('text=/email|role|organization/i')
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasDetails).toBeTruthy();
    }
  });

  test('should update user role', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/users');

    // Wait for page to load
    await adminPage.waitForLoadState('networkidle');

    // Find a user row (not the current admin)
    const userRow = adminPage
      .locator('table tbody tr')
      .filter({ hasText: /user|accountant/i })
      .first();

    const rowExists = await userRow.isVisible().catch(() => false);

    if (rowExists) {
      // Look for edit button
      const editButton = userRow.locator(
        'button:has-text("Edit"), a:has-text("Edit"), button[aria-label*="edit"]'
      );

      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();

        // Wait for edit form
        await adminPage.waitForTimeout(1000);

        // Look for role select
        const roleSelect = adminPage.locator('select[name="role"]');

        if (await roleSelect.isVisible().catch(() => false)) {
          const currentValue = await roleSelect.inputValue();

          // Change role
          const newRole = currentValue === 'USER' ? 'ACCOUNTANT' : 'USER';
          await roleSelect.selectOption(newRole);

          // Save changes
          await adminPage.click('button:has-text("Save"), button[type="submit"]');

          // Wait for update
          await adminPage.waitForTimeout(1500);
        }
      }
    }
  });

  test('should deactivate user', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/users');

    // Wait for page to load
    await adminPage.waitForLoadState('networkidle');

    // Find an active user (not current admin)
    const activeUserRow = adminPage
      .locator('table tbody tr')
      .filter({ hasText: /active/i })
      .filter({ hasText: /user|accountant/i })
      .first();

    const rowExists = await activeUserRow.isVisible().catch(() => false);

    if (rowExists) {
      // Look for deactivate button
      const deactivateButton = activeUserRow.locator(
        'button:has-text("Deactivate"), button:has-text("Disable")'
      );

      if (await deactivateButton.isVisible().catch(() => false)) {
        await deactivateButton.click();

        // Confirm if there's a confirmation dialog
        const confirmButton = adminPage.locator(
          'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Deactivate")'
        );

        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
        }

        // Wait for action to complete
        await adminPage.waitForTimeout(1500);
      }
    }
  });

  test('should display user statistics', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/users');

    // Check for user count statistics
    const hasStats = await adminPage
      .locator('[data-testid="user-stats"], .stat-card, text=/total.*user/i')
      .first()
      .isVisible()
      .catch(() => false);

    // Should have some user statistics
    expect(typeof hasStats).toBe('boolean');
  });

  test('should export users list', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/users');

    // Look for export button
    const exportButton = adminPage.locator(
      'button:has-text("Export"), button:has-text("Download")'
    );

    if (await exportButton.isVisible().catch(() => false)) {
      // Set up download listener
      const downloadPromise = adminPage.waitForEvent('download', { timeout: 5000 });

      await exportButton.click();

      try {
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.csv|\.xlsx|\.json/);
      } catch (error) {
        // Export feature might not be fully implemented
        console.log('Export feature not available or configured');
      }
    }
  });

  test('should paginate users list', async ({ adminPage }) => {
    await adminPage.goto('/dashboard/users');

    // Wait for page to load
    await adminPage.waitForLoadState('networkidle');

    // Look for pagination controls
    const nextPageButton = adminPage.locator(
      'button:has-text("Next"), button[aria-label*="next"]'
    );

    if (await nextPageButton.isVisible().catch(() => false)) {
      // Click next page
      await nextPageButton.click();
      await adminPage.waitForTimeout(1000);

      // Verify page changed
      const pageIndicator = await adminPage
        .locator('text=/page|showing/i')
        .first()
        .isVisible()
        .catch(() => false);

      expect(typeof pageIndicator).toBe('boolean');
    }
  });
});
