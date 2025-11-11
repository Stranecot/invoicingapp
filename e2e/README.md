# E2E Tests Directory

This directory contains all end-to-end tests for the Invoice App using Playwright.

## Directory Structure

```
e2e/
├── admin/                          # Admin Dashboard tests (4 files)
│   ├── admin-login.spec.ts
│   ├── invitation-management.spec.ts
│   ├── organization-management.spec.ts
│   └── user-management.spec.ts
│
├── client-portal/                  # Client Portal tests (7 files)
│   ├── customer-management.spec.ts
│   ├── dashboard.spec.ts
│   ├── expense-management.spec.ts
│   ├── invitation-flow.spec.ts
│   ├── invoice-management.spec.ts
│   ├── signup-login.spec.ts
│   └── welcome-wizard.spec.ts
│
├── responsive/                     # Responsive design tests (2 files)
│   ├── mobile-responsive.spec.ts
│   └── tablet-desktop.spec.ts
│
├── security/                       # Security tests (1 file)
│   └── access-control.spec.ts
│
├── fixtures/                       # Shared test utilities
│   └── test-fixtures.ts
│
├── global-setup.ts                # Runs once before all tests
├── global-teardown.ts             # Runs once after all tests
└── README.md                      # This file
```

## Quick Start

```bash
# Run all tests
npm run test:e2e

# Run specific category
npm run test:e2e:admin
npm run test:e2e:client
npm run test:e2e:security
npm run test:e2e:responsive

# Run in UI mode (interactive)
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug
```

## Test Files Overview

### Admin Dashboard Tests (~30 tests)

| File | Purpose | Test Count |
|------|---------|------------|
| `admin-login.spec.ts` | Admin authentication | 4 |
| `organization-management.spec.ts` | Organization CRUD | 7 |
| `invitation-management.spec.ts` | Invitation workflow | 9 |
| `user-management.spec.ts` | User administration | 10 |

### Client Portal Tests (~70 tests)

| File | Purpose | Test Count |
|------|---------|------------|
| `signup-login.spec.ts` | User authentication | 10 |
| `welcome-wizard.spec.ts` | Onboarding flow | 10 |
| `invitation-flow.spec.ts` | Invitation acceptance | 9 |
| `dashboard.spec.ts` | Dashboard features | 17 |
| `invoice-management.spec.ts` | Invoice CRUD | 13 |
| `customer-management.spec.ts` | Customer CRUD | 14 |
| `expense-management.spec.ts` | Expense tracking | 15 |

### Security Tests (~15 tests)

| File | Purpose | Test Count |
|------|---------|------------|
| `access-control.spec.ts` | Security & RBAC | 15 |

### Responsive Design Tests (~25 tests)

| File | Purpose | Test Count |
|------|---------|------------|
| `mobile-responsive.spec.ts` | Mobile layouts | 12 |
| `tablet-desktop.spec.ts` | Tablet & desktop layouts | 13 |

## Fixtures and Helpers

### test-fixtures.ts

Provides:

- **Test Data**:
  - `TEST_USERS` - Pre-configured test users
  - `TEST_ORGANIZATION` - Test organization data
  - `TEST_CUSTOMER` - Test customer data
  - `TEST_EXPENSE` - Test expense data
  - `TEST_INVOICE` - Test invoice data

- **Test Fixtures**:
  - `authenticatedPage` - User authenticated page
  - `adminPage` - Admin authenticated page
  - `accountantPage` - Accountant authenticated page

- **Helper Functions**:
  - `loginAsUser()` - Log in as regular user
  - `loginAsAdmin()` - Log in as admin
  - `signUpNewUser()` - Create new user account
  - `acceptInvitation()` - Accept invitation token
  - `completeWelcomeWizard()` - Complete onboarding
  - `createTestCustomer()` - Create test customer
  - `createTestInvoice()` - Create test invoice
  - `createTestExpense()` - Create test expense
  - `waitForToast()` - Wait for notification
  - `isMobileViewport()` - Check if mobile view

## Writing Tests

### Basic Template

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test.describe('Feature Name', () => {
  test('should do something', async ({ authenticatedPage }) => {
    // 1. Navigate
    await authenticatedPage.goto('/page');

    // 2. Interact
    await authenticatedPage.click('button');

    // 3. Assert
    await expect(authenticatedPage.locator('h1')).toBeVisible();
  });
});
```

### Using Fixtures

```typescript
// Authenticated user
test('user test', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
});

// Admin user
test('admin test', async ({ adminPage }) => {
  await adminPage.goto('http://localhost:3002');
});

// Unauthenticated
test('public test', async ({ page }) => {
  await page.goto('/sign-in');
});
```

### Using Helpers

```typescript
import { createTestCustomer } from '../fixtures/test-fixtures';

test('create invoice', async ({ authenticatedPage }) => {
  // First create a customer
  await createTestCustomer(authenticatedPage, {
    name: 'Test Customer',
    email: 'test@example.com'
  });

  // Then create invoice...
});
```

## Running Specific Tests

```bash
# Run single file
npx playwright test e2e/admin/admin-login.spec.ts

# Run single test
npx playwright test e2e/admin/admin-login.spec.ts -g "should log in"

# Run in specific browser
npx playwright test --project=chromium

# Run with headed browser
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

## Test Execution Order

1. **Global Setup** (`global-setup.ts`) - Runs once before all tests
   - Verifies dev servers are running
   - Checks service availability

2. **Individual Tests** - Run in parallel or serial
   - Each test is isolated
   - Fresh browser context per test

3. **Global Teardown** (`global-teardown.ts`) - Runs once after all tests
   - Cleanup operations
   - Close connections

## Best Practices

1. **Use Test Fixtures**: Leverage `authenticatedPage`, `adminPage` for pre-authenticated tests

2. **Use Helper Functions**: Don't repeat test data creation logic

3. **Wait for Load States**: Use `waitForLoadState('networkidle')` before assertions

4. **Handle Optional Elements**: Use `.catch(() => false)` for elements that might not exist

5. **Use data-testid**: Prefer `data-testid` attributes for reliable selectors

6. **Test Error Cases**: Don't just test happy paths

7. **Keep Tests Independent**: Each test should work in isolation

## Debugging

### View Test Report

```bash
npm run test:e2e:report
```

### View Traces

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

### Run in UI Mode

```bash
npm run test:e2e:ui
```

### Use Debug Mode

```bash
npm run test:e2e:debug
```

## Common Issues

### Element not found
- Use explicit waits: `await page.waitForSelector()`
- Check if element is in different viewport size

### Authentication failing
- Verify test credentials in `.env.e2e`
- Check Clerk test mode is enabled

### Timeout errors
- Increase timeout in test or config
- Check if dev servers are running

### Flaky tests
- Add `waitForLoadState('networkidle')`
- Use explicit waits instead of fixed timeouts

## Documentation

- Full guide: [E2E_TESTING.md](../E2E_TESTING.md)
- Quick start: [E2E_QUICK_START.md](../E2E_QUICK_START.md)
- Test summary: [E2E_TEST_SUMMARY.md](../E2E_TEST_SUMMARY.md)
- Playwright docs: https://playwright.dev/
