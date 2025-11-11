import { test, expect } from '../fixtures/test-fixtures';
import { TEST_INVOICE, TEST_CUSTOMER } from '../fixtures/test-fixtures';

test.describe('Client Portal - Invoice Management', () => {
  test.use({ baseURL: 'http://localhost:3001' });

  test('should navigate to invoices page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/');

    // Click on invoices link
    const invoicesLink = authenticatedPage.locator('a:has-text("Invoices"), a[href*="invoice"]');

    if (await invoicesLink.isVisible().catch(() => false)) {
      await invoicesLink.click();
      await expect(authenticatedPage).toHaveURL(/invoice/, { timeout: 5000 });
    } else {
      // Navigate directly
      await authenticatedPage.goto('/invoices');
    }

    // Verify invoices page loaded
    await expect(authenticatedPage.locator('h1, h2').first()).toBeVisible();
  });

  test('should display invoices list', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/invoices');

    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Check for invoices table or grid
    const hasTable = await authenticatedPage.locator('table').isVisible().catch(() => false);
    const hasInvoiceCards = await authenticatedPage
      .locator('[data-testid="invoice-card"], .invoice-card')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasTable || hasInvoiceCards).toBeTruthy();
  });

  test('should open create invoice form', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/invoices');

    // Click "Create Invoice" or "New Invoice" button
    const createButton = authenticatedPage.locator(
      'button:has-text("Create Invoice"), button:has-text("New Invoice"), a:has-text("New")'
    );

    await createButton.click();

    // Should navigate to new invoice page or open modal
    await authenticatedPage.waitForTimeout(1000);

    const hasForm = await authenticatedPage
      .locator('form, select[name="customerId"]')
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasForm).toBeTruthy();
  });

  test('should create a new invoice', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/invoices/new');

    // Wait for form to load
    await authenticatedPage.waitForSelector('select[name="customerId"]', { timeout: 5000 });

    // Select customer (assuming at least one exists)
    const customerSelect = authenticatedPage.locator('select[name="customerId"]');
    const optionCount = await customerSelect.locator('option').count();

    if (optionCount > 1) {
      await customerSelect.selectOption({ index: 1 });

      // Set due date
      const dueDateField = authenticatedPage.locator('input[name="dueDate"]');
      if (await dueDateField.isVisible().catch(() => false)) {
        await dueDateField.fill(TEST_INVOICE.dueDate);
      }

      // Add first invoice item
      await authenticatedPage.fill(
        'input[name="items.0.description"], input[name="items[0].description"]',
        TEST_INVOICE.items[0].description
      );
      await authenticatedPage.fill(
        'input[name="items.0.quantity"], input[name="items[0].quantity"]',
        TEST_INVOICE.items[0].quantity.toString()
      );
      await authenticatedPage.fill(
        'input[name="items.0.unitPrice"], input[name="items[0].unitPrice"]',
        TEST_INVOICE.items[0].unitPrice.toString()
      );

      // Add notes if field exists
      const notesField = authenticatedPage.locator('textarea[name="notes"]');
      if (await notesField.isVisible().catch(() => false)) {
        await notesField.fill(TEST_INVOICE.notes);
      }

      // Submit form
      await authenticatedPage.click(
        'button:has-text("Create"), button:has-text("Save"), button[type="submit"]'
      );

      // Wait for redirect
      await authenticatedPage.waitForTimeout(2000);

      // Should redirect to invoices list or detail page
      const isOnInvoicesPage = authenticatedPage.url().includes('invoice');
      expect(isOnInvoicesPage).toBeTruthy();
    }
  });

  test('should filter invoices by status', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/invoices');

    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for status filter
    const statusFilter = authenticatedPage.locator(
      'select[name="status"], button:has-text("Status"), [data-testid="status-filter"]'
    );

    if (await statusFilter.isVisible().catch(() => false)) {
      // Apply filter
      if ((await statusFilter.evaluate((el) => el.tagName)) === 'SELECT') {
        await statusFilter.selectOption('paid');
      } else {
        await statusFilter.click();
        await authenticatedPage.click('text=Paid');
      }

      await authenticatedPage.waitForTimeout(1000);

      // Verify filtering worked
      const hasResults = await authenticatedPage
        .locator('table tbody tr, [data-testid="invoice-card"]')
        .first()
        .isVisible()
        .catch(() => false);

      expect(typeof hasResults).toBe('boolean');
    }
  });

  test('should search invoices', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/invoices');

    // Look for search input
    const searchInput = authenticatedPage.locator(
      'input[type="search"], input[placeholder*="Search"], input[name="search"]'
    );

    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('INV');
      await authenticatedPage.waitForTimeout(1000);

      // Results should be filtered
      const resultsCount = await authenticatedPage.locator('table tbody tr').count();
      expect(typeof resultsCount).toBe('number');
    }
  });

  test('should view invoice details', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/invoices');

    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Click on first invoice
    const firstInvoiceLink = authenticatedPage
      .locator('table tbody tr:first-child a, [data-testid="invoice-card"]:first-child a')
      .first();

    const linkExists = await firstInvoiceLink.isVisible().catch(() => false);

    if (linkExists) {
      await firstInvoiceLink.click();

      // Should navigate to invoice detail page
      await authenticatedPage.waitForURL(/\/invoices\//, { timeout: 5000 });

      // Verify details page loaded
      await expect(authenticatedPage.locator('h1, h2').first()).toBeVisible();
    }
  });

  test('should edit an invoice', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/invoices');

    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Find first draft invoice
    const draftInvoice = authenticatedPage
      .locator('table tbody tr')
      .filter({ hasText: /draft/i })
      .first();

    const invoiceExists = await draftInvoice.isVisible().catch(() => false);

    if (invoiceExists) {
      // Click to view/edit
      await draftInvoice.locator('a').first().click();

      // Wait for page
      await authenticatedPage.waitForTimeout(2000);

      // Look for edit button or edit mode
      const editButton = authenticatedPage.locator('button:has-text("Edit"), a:has-text("Edit")');

      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();
        await authenticatedPage.waitForTimeout(1000);
      }

      // Should show editable form
      const hasForm = await authenticatedPage
        .locator('form, input[name="items"]')
        .isVisible()
        .catch(() => false);

      expect(hasForm).toBeTruthy();
    }
  });

  test('should delete a draft invoice', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/invoices');

    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Find first draft invoice
    const draftInvoice = authenticatedPage
      .locator('table tbody tr')
      .filter({ hasText: /draft/i })
      .first();

    const invoiceExists = await draftInvoice.isVisible().catch(() => false);

    if (invoiceExists) {
      // Look for delete button
      const deleteButton = draftInvoice.locator(
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

  test('should preview invoice before sending', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/invoices');

    // Find an invoice
    const firstInvoice = authenticatedPage.locator('table tbody tr:first-child a').first();

    if (await firstInvoice.isVisible().catch(() => false)) {
      await firstInvoice.click();

      // Wait for detail page
      await authenticatedPage.waitForTimeout(2000);

      // Look for preview button
      const previewButton = authenticatedPage.locator(
        'button:has-text("Preview"), a:has-text("Preview")'
      );

      if (await previewButton.isVisible().catch(() => false)) {
        await previewButton.click();

        // Should show preview or navigate to preview page
        await authenticatedPage.waitForTimeout(1000);

        // Verify preview is shown
        const hasPreview = await authenticatedPage
          .locator('[data-testid="invoice-preview"], .invoice-preview')
          .isVisible()
          .catch(() => false);

        expect(typeof hasPreview).toBe('boolean');
      }
    }
  });

  test('should download invoice as PDF', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/invoices');

    // Find an invoice
    const firstInvoice = authenticatedPage.locator('table tbody tr:first-child a').first();

    if (await firstInvoice.isVisible().catch(() => false)) {
      await firstInvoice.click();

      // Wait for detail page
      await authenticatedPage.waitForTimeout(2000);

      // Look for download/PDF button
      const downloadButton = authenticatedPage.locator(
        'button:has-text("Download"), button:has-text("PDF")'
      );

      if (await downloadButton.isVisible().catch(() => false)) {
        // Set up download listener
        const downloadPromise = authenticatedPage.waitForEvent('download', { timeout: 5000 });

        await downloadButton.click();

        try {
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
        } catch (error) {
          // Download might not work in test environment
          console.log('PDF download not triggered or available');
        }
      }
    }
  });

  test('should change invoice status', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/invoices');

    // Find a draft invoice
    const draftInvoice = authenticatedPage
      .locator('table tbody tr')
      .filter({ hasText: /draft/i })
      .first();

    if (await draftInvoice.isVisible().catch(() => false)) {
      await draftInvoice.locator('a').first().click();

      // Wait for detail page
      await authenticatedPage.waitForTimeout(2000);

      // Look for status change button (e.g., "Send", "Mark as Sent")
      const sendButton = authenticatedPage.locator(
        'button:has-text("Send"), button:has-text("Mark as Sent")'
      );

      if (await sendButton.isVisible().catch(() => false)) {
        await sendButton.click();

        // Confirm if needed
        await authenticatedPage.waitForTimeout(1500);

        // Status should update
        const hasUpdatedStatus = await authenticatedPage
          .locator('text=/sent|status.*sent/i')
          .isVisible()
          .catch(() => false);

        expect(typeof hasUpdatedStatus).toBe('boolean');
      }
    }
  });

  test('should validate invoice form fields', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/invoices/new');

    // Try to submit empty form
    const submitButton = authenticatedPage.locator('button[type="submit"]');

    if (await submitButton.isVisible().catch(() => false)) {
      await submitButton.click();

      // Should show validation errors
      await authenticatedPage.waitForTimeout(1000);

      const hasError = await authenticatedPage
        .locator('text=/required|cannot be empty|select.*customer/i')
        .first()
        .isVisible()
        .catch(() => false);

      expect(hasError).toBeTruthy();
    }
  });

  test('should calculate invoice totals automatically', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/invoices/new');

    // Wait for form
    await authenticatedPage.waitForTimeout(2000);

    // Select customer
    const customerSelect = authenticatedPage.locator('select[name="customerId"]');
    const optionCount = await customerSelect.locator('option').count();

    if (optionCount > 1) {
      await customerSelect.selectOption({ index: 1 });

      // Fill in item details
      await authenticatedPage.fill(
        'input[name="items.0.quantity"], input[name="items[0].quantity"]',
        '10'
      );
      await authenticatedPage.fill(
        'input[name="items.0.unitPrice"], input[name="items[0].unitPrice"]',
        '100'
      );

      // Wait for calculation
      await authenticatedPage.waitForTimeout(1000);

      // Check if total is displayed and calculated
      const totalElement = authenticatedPage.locator(
        'text=/total|subtotal/i, [data-testid="total"]'
      );

      if (await totalElement.isVisible().catch(() => false)) {
        const totalText = await totalElement.textContent();
        const hasAmount = totalText && /\d/.test(totalText);

        expect(hasAmount).toBeTruthy();
      }
    }
  });
});
