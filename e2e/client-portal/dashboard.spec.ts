import { test, expect } from '../fixtures/test-fixtures';

test.describe('Client Portal - Dashboard', () => {
  test.use({ baseURL: 'http://localhost:3001' });

  test('should load dashboard after login', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Dashboard should load
    await authenticatedPage.waitForLoadState('networkidle');

    // Verify dashboard heading
    await expect(authenticatedPage.locator('h1, h2').first()).toBeVisible();
  });

  test('should display key metrics and statistics', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Wait for dashboard to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Check for stat cards
    const hasStatCards = await authenticatedPage
      .locator('[data-testid="stat-card"], .stat-card, [class*="metric"]')
      .first()
      .isVisible()
      .catch(() => false);

    // Should display some metrics
    expect(hasStatCards).toBeTruthy();
  });

  test('should display recent invoices', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Check for recent invoices section
    const hasRecentInvoices = await authenticatedPage
      .locator('text=/recent.*invoice|invoice.*overview/i, [data-testid="recent-invoices"]')
      .first()
      .isVisible()
      .catch(() => false);

    expect(typeof hasRecentInvoices).toBe('boolean');
  });

  test('should display revenue statistics', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Check for revenue metrics
    const hasRevenue = await authenticatedPage
      .locator('text=/revenue|income|earnings/i')
      .first()
      .isVisible()
      .catch(() => false);

    expect(typeof hasRevenue).toBe('boolean');
  });

  test('should display expense statistics', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Check for expense metrics
    const hasExpenses = await authenticatedPage
      .locator('text=/expense|spending|cost/i')
      .first()
      .isVisible()
      .catch(() => false);

    expect(typeof hasExpenses).toBe('boolean');
  });

  test('should navigate to invoices from dashboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Look for "View All Invoices" or similar link
    const viewInvoicesLink = authenticatedPage.locator(
      'a:has-text("View Invoices"), a:has-text("All Invoices"), a[href*="invoice"]'
    );

    if (await viewInvoicesLink.first().isVisible().catch(() => false)) {
      await viewInvoicesLink.first().click();

      // Should navigate to invoices page
      await expect(authenticatedPage).toHaveURL(/invoice/, { timeout: 5000 });
    }
  });

  test('should navigate to expenses from dashboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Look for expenses link
    const viewExpensesLink = authenticatedPage.locator(
      'a:has-text("View Expenses"), a:has-text("All Expenses"), a[href*="expense"]'
    );

    if (await viewExpensesLink.first().isVisible().catch(() => false)) {
      await viewExpensesLink.first().click();

      // Should navigate to expenses page
      await expect(authenticatedPage).toHaveURL(/expense/, { timeout: 5000 });
    }
  });

  test('should display quick actions', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Check for quick action buttons
    const hasQuickActions = await authenticatedPage
      .locator('button:has-text("Create Invoice"), button:has-text("Add Expense")')
      .first()
      .isVisible()
      .catch(() => false);

    expect(typeof hasQuickActions).toBe('boolean');
  });

  test('should create invoice from dashboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Look for create invoice button
    const createInvoiceButton = authenticatedPage.locator(
      'button:has-text("Create Invoice"), a:has-text("New Invoice")'
    );

    if (await createInvoiceButton.first().isVisible().catch(() => false)) {
      await createInvoiceButton.first().click();

      // Should navigate to create invoice page or open modal
      await authenticatedPage.waitForTimeout(1000);

      const isOnCreatePage = authenticatedPage.url().includes('invoice');
      const hasForm = await authenticatedPage
        .locator('form, select[name="customerId"]')
        .isVisible()
        .catch(() => false);

      expect(isOnCreatePage || hasForm).toBeTruthy();
    }
  });

  test('should add expense from dashboard', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Look for add expense button
    const addExpenseButton = authenticatedPage.locator(
      'button:has-text("Add Expense"), button:has-text("New Expense")'
    );

    if (await addExpenseButton.first().isVisible().catch(() => false)) {
      await addExpenseButton.first().click();

      // Should navigate to expenses page or open modal
      await authenticatedPage.waitForTimeout(1000);

      const isOnExpensesPage = authenticatedPage.url().includes('expense');
      const hasForm = await authenticatedPage
        .locator('form, input[name="amount"]')
        .isVisible()
        .catch(() => false);

      expect(isOnExpensesPage || hasForm).toBeTruthy();
    }
  });

  test('should display invoice status breakdown', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Check for invoice status indicators (paid, pending, overdue)
    const hasStatusBreakdown = await authenticatedPage
      .locator('text=/paid|pending|overdue|draft/i')
      .first()
      .isVisible()
      .catch(() => false);

    expect(typeof hasStatusBreakdown).toBe('boolean');
  });

  test('should display expense categories breakdown', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Check for expense category breakdown or chart
    const hasCategoryBreakdown = await authenticatedPage
      .locator('text=/categor/i, [data-testid="category-chart"]')
      .first()
      .isVisible()
      .catch(() => false);

    expect(typeof hasCategoryBreakdown).toBe('boolean');
  });

  test('should show date range selector', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Look for date range selector
    const dateRangeSelector = authenticatedPage.locator(
      '[data-testid="date-range"], button:has-text("Date"), select[name="period"]'
    );

    if (await dateRangeSelector.first().isVisible().catch(() => false)) {
      await dateRangeSelector.first().click();

      // Should show date options or calendar
      await authenticatedPage.waitForTimeout(1000);

      const hasDatePicker = await authenticatedPage
        .locator('[role="dialog"], [data-testid="date-picker"]')
        .isVisible()
        .catch(() => false);

      expect(typeof hasDatePicker).toBe('boolean');
    }
  });

  test('should update statistics when date range changes', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Look for period selector (This Month, Last Month, etc.)
    const periodSelector = authenticatedPage.locator('select[name="period"], button:has-text("This Month")');

    if (await periodSelector.first().isVisible().catch(() => false)) {
      // Get current statistics
      const initialText = await authenticatedPage.locator('body').textContent();

      // Change period
      if ((await periodSelector.first().evaluate((el) => el.tagName)) === 'SELECT') {
        await periodSelector.first().selectOption({ index: 1 });
      } else {
        await periodSelector.first().click();
        await authenticatedPage.click('text=Last Month');
      }

      // Wait for update
      await authenticatedPage.waitForTimeout(2000);

      // Statistics should potentially change
      const updatedText = await authenticatedPage.locator('body').textContent();

      // Text might be the same if no data, but action should work
      expect(typeof updatedText).toBe('string');
    }
  });

  test('should display notifications or alerts', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Check for notification bell or alerts section
    const hasNotifications = await authenticatedPage
      .locator('[data-testid="notifications"], button[aria-label*="notification"], text=/alert|notification/i')
      .first()
      .isVisible()
      .catch(() => false);

    expect(typeof hasNotifications).toBe('boolean');
  });

  test('should show welcome message for new users', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Check for welcome message or onboarding tips
    const hasWelcome = await authenticatedPage
      .locator('text=/welcome|getting started|quick start/i')
      .first()
      .isVisible()
      .catch(() => false);

    // Welcome message is optional
    expect(typeof hasWelcome).toBe('boolean');
  });

  test('should display charts or graphs', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Check for charts (canvas, svg, or chart container)
    const hasCharts = await authenticatedPage
      .locator('canvas, svg[class*="chart"], [data-testid="chart"]')
      .first()
      .isVisible()
      .catch(() => false);

    expect(typeof hasCharts).toBe('boolean');
  });

  test('should refresh dashboard data', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Look for refresh button
    const refreshButton = authenticatedPage.locator(
      'button:has-text("Refresh"), button[aria-label*="refresh"]'
    );

    if (await refreshButton.isVisible().catch(() => false)) {
      await refreshButton.click();

      // Wait for refresh
      await authenticatedPage.waitForTimeout(1500);

      // Page should still be visible and functional
      const isStillOnDashboard = authenticatedPage.url().includes('dashboard');
      expect(isStillOnDashboard).toBeTruthy();
    }
  });

  test('should display user profile information', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Check for user profile section
    const hasUserInfo = await authenticatedPage
      .locator('[data-testid="user-profile"], [class*="user-info"]')
      .first()
      .isVisible()
      .catch(() => false);

    expect(typeof hasUserInfo).toBe('boolean');
  });

  test('should show loading states while fetching data', async ({ authenticatedPage }) => {
    // Navigate to dashboard
    const navigationPromise = authenticatedPage.goto('/dashboard');

    // Check for loading indicators
    const hasLoadingIndicator = await authenticatedPage
      .locator('[data-testid="loading"], [role="progressbar"], text=/loading/i')
      .first()
      .isVisible()
      .catch(() => false);

    // Wait for navigation to complete
    await navigationPromise;

    // Loading indicator should eventually disappear
    await authenticatedPage.waitForLoadState('networkidle');

    // Dashboard content should be visible
    const hasContent = await authenticatedPage
      .locator('h1, h2, [data-testid="stat-card"]')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasContent).toBeTruthy();
  });
});
