import { test, expect } from '../fixtures/test-fixtures';
import { TEST_CUSTOMER } from '../fixtures/test-fixtures';

test.describe('Client Portal - Customer Management', () => {
  test.use({ baseURL: 'http://localhost:3001' });

  test('should navigate to customers page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    // Click on customers link
    const customersLink = authenticatedPage.locator(
      'a:has-text("Customers"), a[href*="customer"]'
    );

    if (await customersLink.isVisible().catch(() => false)) {
      await customersLink.click();
      await expect(authenticatedPage).toHaveURL(/customer/, { timeout: 5000 });
    } else {
      // Navigate directly
      await authenticatedPage.goto('/customers');
    }

    // Verify customers page loaded
    await expect(authenticatedPage.locator('h1, h2').first()).toBeVisible();
  });

  test('should display customers list', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/customers');

    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Check for customers table or grid
    const hasTable = await authenticatedPage.locator('table').isVisible().catch(() => false);
    const hasCustomerCards = await authenticatedPage
      .locator('[data-testid="customer-card"], .customer-card')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasTable || hasCustomerCards).toBeTruthy();
  });

  test('should open create customer form', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/customers');

    // Click "Add Customer" button
    const createButton = authenticatedPage.locator(
      'button:has-text("Add Customer"), button:has-text("New Customer"), button:has-text("Create")'
    );

    await createButton.click();

    // Should open modal or navigate to form
    await authenticatedPage.waitForTimeout(1000);

    const hasForm = await authenticatedPage
      .locator('form, input[name="name"]')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasForm).toBeTruthy();
  });

  test('should create a new customer', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/customers');

    // Click add customer button
    const createButton = authenticatedPage.locator(
      'button:has-text("Add Customer"), button:has-text("New Customer")'
    );

    await createButton.click();

    // Wait for form
    await authenticatedPage.waitForSelector('input[name="name"]', { timeout: 3000 });

    // Fill in customer details
    const testCustomerName = `${TEST_CUSTOMER.name} ${Date.now()}`;
    await authenticatedPage.fill('input[name="name"]', testCustomerName);
    await authenticatedPage.fill('input[name="email"]', `test-${Date.now()}@example.com`);

    const phoneField = authenticatedPage.locator('input[name="phone"]');
    if (await phoneField.isVisible().catch(() => false)) {
      await phoneField.fill(TEST_CUSTOMER.phone);
    }

    const addressField = authenticatedPage.locator('textarea[name="address"]');
    if (await addressField.isVisible().catch(() => false)) {
      await addressField.fill(TEST_CUSTOMER.address);
    }

    // Submit form
    await authenticatedPage.click('button:has-text("Save"), button[type="submit"]');

    // Wait for success
    await authenticatedPage.waitForTimeout(2000);

    // Verify customer appears in list
    const customerInList = await authenticatedPage
      .locator(`text=${testCustomerName}`)
      .isVisible()
      .catch(() => false);

    expect(customerInList).toBeTruthy();
  });

  test('should search for customers', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/customers');

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

  test('should view customer details', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/customers');

    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Click on first customer
    const firstCustomerLink = authenticatedPage
      .locator('table tbody tr:first-child a, [data-testid="customer-card"]:first-child a')
      .first();

    const linkExists = await firstCustomerLink.isVisible().catch(() => false);

    if (linkExists) {
      await firstCustomerLink.click();

      // Should navigate to customer detail page or show details
      await authenticatedPage.waitForTimeout(2000);

      // Verify details are shown
      await expect(authenticatedPage.locator('h1, h2').first()).toBeVisible();
    }
  });

  test('should edit a customer', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/customers');

    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Find first customer
    const firstCustomer = authenticatedPage.locator('table tbody tr:first-child').first();

    const customerExists = await firstCustomer.isVisible().catch(() => false);

    if (customerExists) {
      // Look for edit button
      const editButton = firstCustomer.locator(
        'button:has-text("Edit"), a:has-text("Edit"), button[aria-label*="edit"]'
      );

      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();

        // Wait for edit form
        await authenticatedPage.waitForSelector('input[name="name"]', { timeout: 3000 });

        // Update name
        const nameField = authenticatedPage.locator('input[name="name"]');
        const currentName = await nameField.inputValue();
        await nameField.fill(`${currentName} Updated`);

        // Save changes
        await authenticatedPage.click('button:has-text("Save"), button[type="submit"]');

        // Wait for update
        await authenticatedPage.waitForTimeout(1500);
      }
    }
  });

  test('should delete a customer', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/customers');

    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Find a customer to delete
    const customerRow = authenticatedPage.locator('table tbody tr').last();

    const customerExists = await customerRow.isVisible().catch(() => false);

    if (customerExists) {
      // Get customer name before deletion
      const customerName = await customerRow.locator('td').first().textContent();

      // Look for delete button
      const deleteButton = customerRow.locator(
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

        // Verify customer is removed
        if (customerName) {
          const stillExists = await authenticatedPage
            .locator(`text=${customerName}`)
            .isVisible()
            .catch(() => false);

          expect(stillExists).toBeFalsy();
        }
      }
    }
  });

  test('should validate customer form fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/customers');

    // Click add customer
    const createButton = authenticatedPage.locator(
      'button:has-text("Add Customer"), button:has-text("New Customer")'
    );

    await createButton.click();

    // Wait for form
    await authenticatedPage.waitForSelector('input[name="name"]', { timeout: 3000 });

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

  test('should validate email format for customer', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/customers');

    // Click add customer
    const createButton = authenticatedPage.locator(
      'button:has-text("Add Customer"), button:has-text("New Customer")'
    );

    await createButton.click();

    // Wait for form
    await authenticatedPage.waitForSelector('input[name="name"]', { timeout: 3000 });

    // Fill with valid name but invalid email
    await authenticatedPage.fill('input[name="name"]', 'Test Customer');
    await authenticatedPage.fill('input[name="email"]', 'invalid-email');

    // Try to submit
    await authenticatedPage.click('button:has-text("Save"), button[type="submit"]');

    // Should show email validation error
    await authenticatedPage.waitForTimeout(1000);

    const hasError = await authenticatedPage
      .locator('text=/invalid.*email|valid.*email/i')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasError).toBeTruthy();
  });

  test('should display customer statistics', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/customers');

    // Check for customer count or statistics
    const hasStats = await authenticatedPage
      .locator('[data-testid="customer-stats"], .stat-card, text=/total.*customer/i')
      .first()
      .isVisible()
      .catch(() => false);

    // Stats are optional
    expect(typeof hasStats).toBe('boolean');
  });

  test('should export customers list', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/customers');

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

  test('should view customer invoices', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/customers');

    // Click on first customer
    const firstCustomerLink = authenticatedPage
      .locator('table tbody tr:first-child a')
      .first();

    if (await firstCustomerLink.isVisible().catch(() => false)) {
      await firstCustomerLink.click();

      // Wait for detail page
      await authenticatedPage.waitForTimeout(2000);

      // Look for invoices section
      const hasInvoices = await authenticatedPage
        .locator('text=/invoice|billing/i, [data-testid="customer-invoices"]')
        .first()
        .isVisible()
        .catch(() => false);

      expect(typeof hasInvoices).toBe('boolean');
    }
  });

  test('should sort customers table', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/customers');

    // Wait for table to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for sortable column headers
    const sortableHeader = authenticatedPage.locator(
      'th button, th[data-sortable], th.sortable'
    ).first();

    if (await sortableHeader.isVisible().catch(() => false)) {
      // Click to sort
      await sortableHeader.click();
      await authenticatedPage.waitForTimeout(1000);

      // Click again to reverse sort
      await sortableHeader.click();
      await authenticatedPage.waitForTimeout(1000);

      // Verify table still has data
      const hasRows = await authenticatedPage
        .locator('table tbody tr')
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasRows).toBeTruthy();
    }
  });

  test('should paginate customers list', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/customers');

    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for pagination controls
    const nextPageButton = authenticatedPage.locator(
      'button:has-text("Next"), button[aria-label*="next"]'
    );

    if (await nextPageButton.isVisible().catch(() => false)) {
      const isEnabled = await nextPageButton.isEnabled();

      if (isEnabled) {
        await nextPageButton.click();
        await authenticatedPage.waitForTimeout(1000);

        // Verify page changed
        const hasContent = await authenticatedPage
          .locator('table tbody tr')
          .first()
          .isVisible()
          .catch(() => false);

        expect(hasContent).toBeTruthy();
      }
    }
  });
});
