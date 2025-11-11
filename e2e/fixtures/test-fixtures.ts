import { test as base, Page } from '@playwright/test';

/**
 * Test user credentials for E2E tests
 * These should be created in your test database or use Clerk test mode
 */
export const TEST_USERS = {
  admin: {
    email: 'admin@test.com',
    password: 'TestPassword123!',
    name: 'Admin User',
    role: 'ADMIN',
  },
  user: {
    email: 'user@test.com',
    password: 'TestPassword123!',
    name: 'Regular User',
    role: 'USER',
  },
  accountant: {
    email: 'accountant@test.com',
    password: 'TestPassword123!',
    name: 'Accountant User',
    role: 'ACCOUNTANT',
  },
  newUser: {
    email: 'newuser@test.com',
    password: 'TestPassword123!',
    name: 'New User',
  },
};

export const TEST_ORGANIZATION = {
  name: 'Test Organization',
  slug: 'test-org',
  billingEmail: 'billing@test.com',
};

export const TEST_CUSTOMER = {
  name: 'Test Customer',
  email: 'customer@test.com',
  phone: '+1234567890',
  address: '123 Test Street, Test City, TC 12345',
};

export const TEST_EXPENSE = {
  amount: 100.50,
  description: 'Test Expense',
  category: 'Office Supplies',
  notes: 'Test notes for expense',
  paymentMethod: 'Credit Card',
  vendorName: 'Test Vendor',
};

export const TEST_INVOICE = {
  items: [
    {
      description: 'Consulting Services',
      quantity: 10,
      unitPrice: 150,
    },
    {
      description: 'Development Work',
      quantity: 20,
      unitPrice: 200,
    },
  ],
  notes: 'Thank you for your business!',
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
};

/**
 * Extended test fixtures with authentication helpers
 */
type TestFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  accountantPage: Page;
};

export const test = base.extend<TestFixtures>({
  /**
   * Authenticated page for a regular user
   */
  authenticatedPage: async ({ page }, use) => {
    await loginAsUser(page, TEST_USERS.user);
    await use(page);
  },

  /**
   * Authenticated page for an admin user
   */
  adminPage: async ({ page }, use) => {
    await loginAsAdmin(page, TEST_USERS.admin);
    await use(page);
  },

  /**
   * Authenticated page for an accountant user
   */
  accountantPage: async ({ page }, use) => {
    await loginAsUser(page, TEST_USERS.accountant);
    await use(page);
  },
});

/**
 * Helper function to log in as a regular user (client portal)
 */
export async function loginAsUser(page: Page, credentials: { email: string; password: string }) {
  const clientPortalUrl = process.env.CLIENT_PORTAL_URL || 'http://localhost:3001';

  // Navigate to sign-in page
  await page.goto(`${clientPortalUrl}/sign-in`);

  // Wait for Clerk sign-in form to load
  await page.waitForSelector('input[name="identifier"]', { timeout: 10000 });

  // Fill in credentials
  await page.fill('input[name="identifier"]', credentials.email);
  await page.click('button:has-text("Continue")');

  // Wait for password field and fill it
  await page.waitForSelector('input[name="password"]', { timeout: 5000 });
  await page.fill('input[name="password"]', credentials.password);
  await page.click('button:has-text("Continue")');

  // Wait for successful login - redirect to dashboard or setup
  await page.waitForURL(/\/(dashboard|setup)/, { timeout: 10000 });
}

/**
 * Helper function to log in as an admin (admin dashboard)
 */
export async function loginAsAdmin(page: Page, credentials: { email: string; password: string }) {
  const adminDashboardUrl = process.env.ADMIN_DASHBOARD_URL || 'http://localhost:3002';

  // Navigate to admin dashboard
  await page.goto(adminDashboardUrl);

  // Wait for Clerk sign-in form or redirect
  const currentUrl = page.url();

  if (currentUrl.includes('sign-in')) {
    // Wait for Clerk sign-in form to load
    await page.waitForSelector('input[name="identifier"]', { timeout: 10000 });

    // Fill in credentials
    await page.fill('input[name="identifier"]', credentials.email);
    await page.click('button:has-text("Continue")');

    // Wait for password field and fill it
    await page.waitForSelector('input[name="password"]', { timeout: 5000 });
    await page.fill('input[name="password"]', credentials.password);
    await page.click('button:has-text("Continue")');

    // Wait for successful login - redirect to admin dashboard
    await page.waitForURL(/localhost:3002/, { timeout: 10000 });
  }
}

/**
 * Helper function to sign up a new user
 */
export async function signUpNewUser(
  page: Page,
  userInfo: { email: string; password: string; name: string }
) {
  const clientPortalUrl = process.env.CLIENT_PORTAL_URL || 'http://localhost:3001';

  // Navigate to sign-up page
  await page.goto(`${clientPortalUrl}/sign-up`);

  // Wait for Clerk sign-up form to load
  await page.waitForSelector('input[name="emailAddress"]', { timeout: 10000 });

  // Fill in user information
  await page.fill('input[name="emailAddress"]', userInfo.email);
  await page.fill('input[name="password"]', userInfo.password);

  // Click continue/sign up button
  await page.click('button:has-text("Continue")');

  // Wait for verification or redirect
  await page.waitForTimeout(2000);
}

/**
 * Helper function to accept an invitation
 */
export async function acceptInvitation(page: Page, token: string) {
  const clientPortalUrl = process.env.CLIENT_PORTAL_URL || 'http://localhost:3001';

  // Navigate to accept invitation page with token
  await page.goto(`${clientPortalUrl}/accept-invitation?token=${token}`);

  // Wait for page to load
  await page.waitForLoadState('networkidle');
}

/**
 * Helper function to complete welcome wizard
 */
export async function completeWelcomeWizard(page: Page, companyInfo: {
  name: string;
  email: string;
  phone?: string;
  address?: string;
}) {
  // Wait for welcome/setup page
  await page.waitForURL(/\/(welcome|setup)/, { timeout: 10000 });

  // Fill in company information
  await page.fill('input[name="name"]', companyInfo.name);
  await page.fill('input[name="email"]', companyInfo.email);

  if (companyInfo.phone) {
    await page.fill('input[name="phone"]', companyInfo.phone);
  }

  if (companyInfo.address) {
    await page.fill('textarea[name="address"]', companyInfo.address);
  }

  // Submit the form
  await page.click('button:has-text("Complete Setup")');

  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Helper function to create a test customer
 */
export async function createTestCustomer(
  page: Page,
  customer: { name: string; email: string; phone?: string; address?: string }
) {
  // Navigate to customers page
  await page.goto('/customers');

  // Click "Add Customer" button
  await page.click('button:has-text("Add Customer")');

  // Wait for form to appear
  await page.waitForSelector('input[name="name"]');

  // Fill in customer details
  await page.fill('input[name="name"]', customer.name);
  await page.fill('input[name="email"]', customer.email);

  if (customer.phone) {
    await page.fill('input[name="phone"]', customer.phone);
  }

  if (customer.address) {
    await page.fill('textarea[name="address"]', customer.address);
  }

  // Submit form
  await page.click('button:has-text("Save")');

  // Wait for success
  await page.waitForTimeout(1000);
}

/**
 * Helper function to create a test invoice
 */
export async function createTestInvoice(
  page: Page,
  invoice: {
    customerName: string;
    items: Array<{ description: string; quantity: number; unitPrice: number }>;
    notes?: string;
    dueDate?: string;
  }
) {
  // Navigate to invoices page
  await page.goto('/invoices/new');

  // Wait for form to load
  await page.waitForSelector('select[name="customerId"]');

  // Select customer
  await page.selectOption('select[name="customerId"]', { label: invoice.customerName });

  // Set due date if provided
  if (invoice.dueDate) {
    await page.fill('input[name="dueDate"]', invoice.dueDate);
  }

  // Add invoice items
  for (let i = 0; i < invoice.items.length; i++) {
    const item = invoice.items[i];

    if (i > 0) {
      // Click "Add Item" button for additional items
      await page.click('button:has-text("Add Item")');
    }

    // Fill in item details
    await page.fill(`input[name="items.${i}.description"]`, item.description);
    await page.fill(`input[name="items.${i}.quantity"]`, item.quantity.toString());
    await page.fill(`input[name="items.${i}.unitPrice"]`, item.unitPrice.toString());
  }

  // Add notes if provided
  if (invoice.notes) {
    await page.fill('textarea[name="notes"]', invoice.notes);
  }

  // Submit form
  await page.click('button:has-text("Create Invoice")');

  // Wait for redirect to invoice list or detail page
  await page.waitForURL(/\/invoices/, { timeout: 10000 });
}

/**
 * Helper function to create a test expense
 */
export async function createTestExpense(
  page: Page,
  expense: {
    amount: number;
    description: string;
    category: string;
    notes?: string;
    paymentMethod?: string;
    vendorName?: string;
  }
) {
  // Navigate to expenses page
  await page.goto('/expenses');

  // Click "Add Expense" button
  await page.click('button:has-text("Add Expense")');

  // Wait for form to appear
  await page.waitForSelector('input[name="amount"]');

  // Fill in expense details
  await page.fill('input[name="amount"]', expense.amount.toString());
  await page.fill('input[name="description"]', expense.description);

  // Select or type category
  await page.fill('input[name="category"]', expense.category);

  if (expense.notes) {
    await page.fill('textarea[name="notes"]', expense.notes);
  }

  if (expense.paymentMethod) {
    await page.selectOption('select[name="paymentMethod"]', expense.paymentMethod);
  }

  if (expense.vendorName) {
    await page.fill('input[name="vendorName"]', expense.vendorName);
  }

  // Submit form
  await page.click('button:has-text("Save")');

  // Wait for success
  await page.waitForTimeout(1000);
}

/**
 * Helper to wait for toast/notification message
 */
export async function waitForToast(page: Page, message?: string) {
  if (message) {
    await page.waitForSelector(`text=${message}`, { timeout: 5000 });
  } else {
    // Wait for any toast notification
    await page.waitForSelector('[role="status"], [role="alert"]', { timeout: 5000 });
  }
}

/**
 * Helper to check if user is on mobile viewport
 */
export function isMobileViewport(page: Page): boolean {
  const viewport = page.viewportSize();
  return viewport ? viewport.width < 640 : false;
}

export { expect } from '@playwright/test';
