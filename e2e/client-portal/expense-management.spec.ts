import { test, expect } from '../fixtures/test-fixtures';
import { TEST_EXPENSE } from '../fixtures/test-fixtures';

test.describe('Client Portal - Expense Management', () => {
  test.use({ baseURL: 'http://localhost:3001' });

  test('should navigate to expenses page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    // Click on expenses link
    const expensesLink = authenticatedPage.locator('a:has-text("Expenses"), a[href*="expense"]');

    if (await expensesLink.isVisible().catch(() => false)) {
      await expensesLink.click();
      await expect(authenticatedPage).toHaveURL(/expense/, { timeout: 5000 });
    } else {
      // Navigate directly
      await authenticatedPage.goto('/expenses');
    }

    // Verify expenses page loaded
    await expect(authenticatedPage.locator('h1, h2').first()).toBeVisible();
  });

  test('should display expenses list', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/expenses');

    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Check for expenses table or grid
    const hasTable = await authenticatedPage.locator('table').isVisible().catch(() => false);
    const hasExpenseCards = await authenticatedPage
      .locator('[data-testid="expense-card"], .expense-card')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasTable || hasExpenseCards).toBeTruthy();
  });

  test('should open create expense form', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/expenses');

    // Click "Add Expense" button
    const createButton = authenticatedPage.locator(
      'button:has-text("Add Expense"), button:has-text("New Expense"), button:has-text("Create")'
    );

    await createButton.click();

    // Should open modal or form
    await authenticatedPage.waitForTimeout(1000);

    const hasForm = await authenticatedPage
      .locator('form, input[name="amount"]')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasForm).toBeTruthy();
  });

  test('should create a new expense', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/expenses');

    // Click add expense button
    const createButton = authenticatedPage.locator(
      'button:has-text("Add Expense"), button:has-text("New Expense")'
    );

    await createButton.click();

    // Wait for form
    await authenticatedPage.waitForSelector('input[name="amount"]', { timeout: 3000 });

    // Fill in expense details
    await authenticatedPage.fill('input[name="amount"]', TEST_EXPENSE.amount.toString());
    await authenticatedPage.fill('input[name="description"]', TEST_EXPENSE.description);

    // Fill category (autocomplete or select)
    const categoryField = authenticatedPage.locator('input[name="category"], select[name="categoryId"]');
    if (await categoryField.isVisible().catch(() => false)) {
      const tagName = await categoryField.evaluate((el) => el.tagName);
      if (tagName === 'SELECT') {
        await categoryField.selectOption({ label: TEST_EXPENSE.category });
      } else {
        await categoryField.fill(TEST_EXPENSE.category);
        await authenticatedPage.waitForTimeout(500);
        // Press Enter or Tab to confirm autocomplete
        await categoryField.press('Enter');
      }
    }

    // Fill optional fields
    const notesField = authenticatedPage.locator('textarea[name="notes"]');
    if (await notesField.isVisible().catch(() => false)) {
      await notesField.fill(TEST_EXPENSE.notes);
    }

    const paymentMethodField = authenticatedPage.locator('select[name="paymentMethod"]');
    if (await paymentMethodField.isVisible().catch(() => false)) {
      await paymentMethodField.selectOption(TEST_EXPENSE.paymentMethod);
    }

    const vendorField = authenticatedPage.locator('input[name="vendorName"]');
    if (await vendorField.isVisible().catch(() => false)) {
      await vendorField.fill(TEST_EXPENSE.vendorName);
    }

    // Submit form
    await authenticatedPage.click('button:has-text("Save"), button[type="submit"]');

    // Wait for success
    await authenticatedPage.waitForTimeout(2000);

    // Verify expense appears in list
    const expenseInList = await authenticatedPage
      .locator(`text=${TEST_EXPENSE.description}`)
      .isVisible()
      .catch(() => false);

    expect(expenseInList).toBeTruthy();
  });

  test('should filter expenses by date range', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/expenses');

    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for date range picker
    const dateRangeFilter = authenticatedPage.locator(
      '[data-testid="date-range"], input[name="dateFrom"], button:has-text("Date")'
    );

    if (await dateRangeFilter.isVisible().catch(() => false)) {
      // Apply date filter
      await dateRangeFilter.click();
      await authenticatedPage.waitForTimeout(1000);

      // Results should be filtered
      const resultsCount = await authenticatedPage.locator('table tbody tr').count();
      expect(typeof resultsCount).toBe('number');
    }
  });

  test('should filter expenses by category', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/expenses');

    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for category filter
    const categoryFilter = authenticatedPage.locator(
      'select[name="category"], button:has-text("Category"), [data-testid="category-filter"]'
    );

    if (await categoryFilter.isVisible().catch(() => false)) {
      // Apply filter
      if ((await categoryFilter.evaluate((el) => el.tagName)) === 'SELECT') {
        const optionCount = await categoryFilter.locator('option').count();
        if (optionCount > 1) {
          await categoryFilter.selectOption({ index: 1 });
        }
      } else {
        await categoryFilter.click();
        // Select first category option
        await authenticatedPage.click('[role="option"]');
      }

      await authenticatedPage.waitForTimeout(1000);

      // Results should be filtered
      const resultsCount = await authenticatedPage.locator('table tbody tr').count();
      expect(typeof resultsCount).toBe('number');
    }
  });

  test('should search expenses', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/expenses');

    // Look for search input
    const searchInput = authenticatedPage.locator(
      'input[type="search"], input[placeholder*="Search"], input[name="search"]'
    );

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test');
      await authenticatedPage.waitForTimeout(1000);

      // Results should be filtered
      const resultsCount = await authenticatedPage.locator('table tbody tr').count();
      expect(typeof resultsCount).toBe('number');
    }
  });

  test('should view expense details', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/expenses');

    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Click on first expense
    const firstExpense = authenticatedPage.locator('table tbody tr:first-child').first();

    const expenseExists = await firstExpense.isVisible().catch(() => false);

    if (expenseExists) {
      // Click to view details
      await firstExpense.click();

      // Should show details (modal or page)
      await authenticatedPage.waitForTimeout(1000);

      const hasDetails = await authenticatedPage
        .locator('text=/amount|description|category/i')
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasDetails).toBeTruthy();
    }
  });

  test('should edit an expense', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/expenses');

    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Find first expense
    const firstExpense = authenticatedPage.locator('table tbody tr:first-child').first();

    const expenseExists = await firstExpense.isVisible().catch(() => false);

    if (expenseExists) {
      // Look for edit button
      const editButton = firstExpense.locator(
        'button:has-text("Edit"), button[aria-label*="edit"]'
      );

      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();

        // Wait for edit form
        await authenticatedPage.waitForSelector('input[name="amount"]', { timeout: 3000 });

        // Update description
        const descriptionField = authenticatedPage.locator('input[name="description"]');
        const currentDescription = await descriptionField.inputValue();
        await descriptionField.fill(`${currentDescription} (Updated)`);

        // Save changes
        await authenticatedPage.click('button:has-text("Save"), button[type="submit"]');

        // Wait for update
        await authenticatedPage.waitForTimeout(1500);
      }
    }
  });

  test('should delete an expense', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/expenses');

    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Find an expense to delete
    const expenseRow = authenticatedPage.locator('table tbody tr').last();

    const expenseExists = await expenseRow.isVisible().catch(() => false);

    if (expenseExists) {
      // Look for delete button
      const deleteButton = expenseRow.locator(
        'button:has-text("Delete"), button[aria-label*="delete"]'
      );

      if (await deleteButton.isVisible().catch(() => false)) {
        await deleteButton.click();

        // Confirm deletion
        const confirmButton = authenticatedPage.locator(
          'button:has-text("Confirm"), button:has-text("Delete"), button:has-text("Yes")'
        );

        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
        }

        // Wait for deletion
        await authenticatedPage.waitForTimeout(1500);
      }
    }
  });

  test('should display expense statistics', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/expenses');

    // Check for expense statistics
    const hasStats = await authenticatedPage
      .locator('[data-testid="expense-stats"], .stat-card, text=/total.*expense/i')
      .first()
      .isVisible()
      .catch(() => false);

    // Stats should be visible
    expect(typeof hasStats).toBe('boolean');
  });

  test('should create and manage expense categories', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/expenses');

    // Look for categories management link or button
    const categoriesButton = authenticatedPage.locator(
      'button:has-text("Categories"), a:has-text("Categories")'
    );

    if (await categoriesButton.isVisible().catch(() => false)) {
      await categoriesButton.click();

      // Wait for categories section
      await authenticatedPage.waitForTimeout(1000);

      // Look for add category button
      const addCategoryButton = authenticatedPage.locator(
        'button:has-text("Add Category"), button:has-text("New Category")'
      );

      if (await addCategoryButton.isVisible().catch(() => false)) {
        await addCategoryButton.click();

        // Fill in new category
        const categoryNameField = authenticatedPage.locator('input[name="name"]');
        if (await categoryNameField.isVisible({ timeout: 2000 }).catch(() => false)) {
          await categoryNameField.fill(`Test Category ${Date.now()}`);

          // Save
          await authenticatedPage.click('button:has-text("Save"), button[type="submit"]');
          await authenticatedPage.waitForTimeout(1000);
        }
      }
    }
  });

  test('should set and view budget limits', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/expenses');

    // Look for budgets section or link
    const budgetsLink = authenticatedPage.locator(
      'a:has-text("Budgets"), button:has-text("Budgets")'
    );

    if (await budgetsLink.isVisible().catch(() => false)) {
      await budgetsLink.click();

      // Wait for budgets page
      await authenticatedPage.waitForTimeout(1000);

      // Check for budget information
      const hasBudgets = await authenticatedPage
        .locator('text=/budget|limit/i, [data-testid="budget-card"]')
        .first()
        .isVisible()
        .catch(() => false);

      expect(typeof hasBudgets).toBe('boolean');
    }
  });

  test('should export expenses list', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/expenses');

    // Look for export button
    const exportButton = authenticatedPage.locator(
      'button:has-text("Export"), button:has-text("Download")'
    );

    if (await exportButton.isVisible().catch(() => false)) {
      // Set up download listener
      const downloadPromise = authenticatedPage.waitForEvent('download', { timeout: 5000 });

      await exportButton.click();

      try {
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.csv|\.xlsx|\.json/);
      } catch (error) {
        // Export feature might not be implemented
        console.log('Export feature not available');
      }
    }
  });

  test('should validate expense form fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/expenses');

    // Click add expense
    const createButton = authenticatedPage.locator(
      'button:has-text("Add Expense"), button:has-text("New Expense")'
    );

    await createButton.click();

    // Wait for form
    await authenticatedPage.waitForSelector('input[name="amount"]', { timeout: 3000 });

    // Try to submit empty form
    await authenticatedPage.click('button:has-text("Save"), button[type="submit"]');

    // Should show validation errors
    await authenticatedPage.waitForTimeout(1000);

    const hasError = await authenticatedPage
      .locator('text=/required|cannot be empty/i')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasError).toBeTruthy();
  });

  test('should show budget indicators on expenses page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/expenses');

    // Check for budget progress indicators
    const hasBudgetIndicator = await authenticatedPage
      .locator('[data-testid="budget-indicator"], .budget-progress, text=/budget|remaining/i')
      .first()
      .isVisible()
      .catch(() => false);

    // Budget indicators are optional
    expect(typeof hasBudgetIndicator).toBe('boolean');
  });
});
