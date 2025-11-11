# End-to-End Testing with Playwright

This document provides comprehensive information about the E2E testing setup for the Invoice App using Playwright.

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Test Scenarios](#test-scenarios)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

The Invoice App uses Playwright for comprehensive end-to-end testing across:

- **Admin Dashboard** (http://localhost:3002)
- **Client Portal** (http://localhost:3001)

### Test Coverage

- **15+ E2E test scenarios** covering critical user flows
- **Multi-browser testing**: Chromium, Firefox, WebKit
- **Responsive design testing**: Mobile, Tablet, Desktop
- **Security testing**: Access control, XSS, SQL injection prevention
- **Authentication flows**: Login, signup, invitation acceptance

### Key Features

- Parallel test execution
- Visual regression testing ready
- Screenshots and videos on failure
- CI/CD integration with GitHub Actions
- Multiple viewport testing
- Comprehensive test fixtures and helpers

## Setup

### Prerequisites

- Node.js 18+ installed
- Both apps running (Admin Dashboard on 3002, Client Portal on 3001)
- Test user accounts configured in Clerk (test mode)
- PostgreSQL test database (optional, for full integration tests)

### Installation

1. **Install Playwright and dependencies**:

```bash
npm install
```

2. **Install Playwright browsers**:

```bash
npx playwright install
```

3. **Install system dependencies** (Linux only):

```bash
npx playwright install-deps
```

4. **Configure test environment**:

```bash
cp .env.e2e.example .env.e2e
```

Edit `.env.e2e` with your test credentials:

```env
# Test User Credentials
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=YourSecurePassword123!

TEST_USER_EMAIL=user@test.com
TEST_USER_PASSWORD=YourSecurePassword123!

# Application URLs
CLIENT_PORTAL_URL=http://localhost:3001
ADMIN_DASHBOARD_URL=http://localhost:3002
```

### Setting Up Test Users

Create test users in your Clerk dashboard (test mode):

1. **Admin User**: Role = ADMIN
   - Email: admin@test.com
   - Should have access to admin dashboard

2. **Regular User**: Role = USER
   - Email: user@test.com
   - Should have access to client portal

3. **Accountant User**: Role = ACCOUNTANT
   - Email: accountant@test.com
   - Should have access to client portal with accountant permissions

## Running Tests

### Basic Commands

```bash
# Run all tests
npm run test:e2e

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run tests in debug mode
npm run test:e2e:debug
```

### Browser-Specific Tests

```bash
# Run tests in Chromium only
npm run test:e2e:chromium

# Run tests in Firefox only
npm run test:e2e:firefox

# Run tests in WebKit only
npm run test:e2e:webkit

# Run mobile browser tests
npm run test:e2e:mobile
```

### Category-Specific Tests

```bash
# Run admin dashboard tests only
npm run test:e2e:admin

# Run client portal tests only
npm run test:e2e:client

# Run security tests only
npm run test:e2e:security

# Run responsive design tests only
npm run test:e2e:responsive
```

### Test Reports

```bash
# View HTML test report
npm run test:e2e:report

# Generate test codegen for new tests
npm run test:e2e:codegen
```

## Test Structure

```
e2e/
├── fixtures/
│   └── test-fixtures.ts          # Shared test fixtures and helpers
├── global-setup.ts                # Global setup (runs once before all tests)
├── global-teardown.ts             # Global teardown (runs once after all tests)
├── admin/
│   ├── admin-login.spec.ts       # Admin authentication tests
│   ├── organization-management.spec.ts
│   ├── invitation-management.spec.ts
│   └── user-management.spec.ts
├── client-portal/
│   ├── signup-login.spec.ts      # User authentication tests
│   ├── welcome-wizard.spec.ts    # Onboarding flow tests
│   ├── invitation-flow.spec.ts   # Invitation acceptance tests
│   ├── dashboard.spec.ts         # Dashboard functionality
│   ├── invoice-management.spec.ts
│   ├── customer-management.spec.ts
│   └── expense-management.spec.ts
├── security/
│   └── access-control.spec.ts    # Security and access control tests
└── responsive/
    ├── mobile-responsive.spec.ts # Mobile layout tests
    └── tablet-desktop.spec.ts    # Tablet and desktop layout tests
```

## Test Scenarios

### Admin Dashboard Tests (4 suites, ~30 tests)

#### 1. Admin Login (`admin-login.spec.ts`)
- Load admin dashboard login page
- Successfully log in as admin
- Show error for invalid credentials
- Persist authentication on page reload

#### 2. Organization Management (`organization-management.spec.ts`)
- Display organizations list
- Create new organization
- View organization details
- Filter organizations by status
- Search organizations
- Display organization statistics

#### 3. Invitation Management (`invitation-management.spec.ts`)
- Display invitations list
- Send new invitation
- Filter invitations by status
- Revoke invitation
- Resend invitation
- Copy invitation link
- Validate invitation form

#### 4. User Management (`user-management.spec.ts`)
- Display users list
- Filter users by role
- Filter users by organization
- Search for users
- View user details
- Update user role
- Deactivate user
- Display user statistics

### Client Portal Tests (7 suites, ~70+ tests)

#### 1. Sign Up and Login (`signup-login.spec.ts`)
- Load sign-up page
- Sign up new user
- Log in existing user
- Show error for invalid credentials
- Validate email format
- Navigate between sign-in and sign-up
- Handle forgot password flow
- Persist login across navigation
- Log out successfully

#### 2. Welcome Wizard (`welcome-wizard.spec.ts`)
- Redirect to welcome wizard for new users
- Display welcome wizard form
- Complete wizard with company info
- Validate required fields
- Skip wizard if already completed
- Save company logo during setup

#### 3. Invitation Flow (`invitation-flow.spec.ts`)
- Load accept invitation page with valid token
- Show error for missing token
- Show error for invalid token
- Redirect to sign-up for new user
- Accept invitation for authenticated user
- Prevent accepting expired invitation
- Handle already accepted invitation

#### 4. Dashboard (`dashboard.spec.ts`)
- Load dashboard after login
- Display key metrics and statistics
- Display recent invoices
- Display revenue statistics
- Display expense statistics
- Navigate to invoices from dashboard
- Quick actions (create invoice, add expense)
- Display invoice status breakdown
- Show date range selector
- Update statistics when date changes

#### 5. Invoice Management (`invoice-management.spec.ts`)
- Navigate to invoices page
- Display invoices list
- Create new invoice
- Filter invoices by status
- Search invoices
- View invoice details
- Edit invoice
- Delete draft invoice
- Preview invoice
- Download invoice as PDF
- Change invoice status
- Validate invoice form
- Calculate totals automatically

#### 6. Customer Management (`customer-management.spec.ts`)
- Navigate to customers page
- Display customers list
- Create new customer
- Search for customers
- View customer details
- Edit customer
- Delete customer
- Validate customer form
- Validate email format
- View customer invoices
- Sort customers table

#### 7. Expense Management (`expense-management.spec.ts`)
- Navigate to expenses page
- Display expenses list
- Create new expense
- Filter expenses by date range
- Filter expenses by category
- Search expenses
- View expense details
- Edit expense
- Delete expense
- Display expense statistics
- Manage expense categories
- Set budget limits
- Export expenses list

### Security Tests (1 suite, ~15 tests)

#### Access Control (`access-control.spec.ts`)
- Prevent unauthenticated access to admin dashboard
- Prevent unauthenticated access to client portal
- Prevent non-admin users from accessing admin dashboard
- Allow admin users to access admin dashboard
- Prevent users from accessing other organizations' data
- Prevent SQL injection in search fields
- Prevent XSS attacks in form inputs
- Enforce CSRF protection
- Expire sessions after logout
- Prevent unauthorized API access
- Validate file upload types
- Sanitize user-generated content
- Enforce rate limiting
- Protect sensitive data in URLs
- Handle invalid invitation tokens securely

### Responsive Design Tests (3 suites, ~25 tests)

#### Mobile Responsive (`mobile-responsive.spec.ts`)
- Display mobile navigation menu
- Open and close mobile navigation
- Display mobile-optimized lists
- Display mobile-optimized dashboard
- Handle mobile form inputs
- Display mobile bottom navigation
- Scroll correctly on mobile
- Hide desktop-only elements
- Make action buttons touch-friendly
- Handle mobile keyboard interactions
- Display mobile-optimized modals

#### Tablet & Desktop (`tablet-desktop.spec.ts`)
- Display tablet-optimized layout
- Display full desktop layout
- Display multi-column layouts
- Display full-width tables
- Show hover states on desktop
- Support keyboard navigation
- Display tooltips on hover
- Handle wide-screen layouts
- Show all table columns on desktop

#### Breakpoint Tests
- Adapt layout at 640px (sm)
- Adapt layout at 768px (md)
- Adapt layout at 1024px (lg)
- Adapt layout at 1280px (xl)

## Writing Tests

### Test Structure

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test.describe('Feature Name', () => {
  test('should do something', async ({ authenticatedPage }) => {
    // Navigate to page
    await authenticatedPage.goto('/path');

    // Interact with elements
    await authenticatedPage.click('button:has-text("Submit")');

    // Assert expectations
    await expect(authenticatedPage.locator('h1')).toBeVisible();
  });
});
```

### Using Test Fixtures

```typescript
// Use authenticated user page
test('test with auth', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
  // User is already logged in
});

// Use admin page
test('test admin', async ({ adminPage }) => {
  await adminPage.goto('http://localhost:3002');
  // Admin user is already logged in
});

// Use regular page (no auth)
test('test public', async ({ page }) => {
  await page.goto('/sign-in');
  // No authentication
});
```

### Helper Functions

```typescript
import { createTestCustomer, createTestInvoice } from '../fixtures/test-fixtures';

test('test with test data', async ({ authenticatedPage }) => {
  // Create test customer
  await createTestCustomer(authenticatedPage, {
    name: 'Test Customer',
    email: 'test@example.com',
  });

  // Create test invoice
  await createTestInvoice(authenticatedPage, {
    customerName: 'Test Customer',
    items: [
      { description: 'Service', quantity: 1, unitPrice: 100 }
    ],
  });
});
```

### Best Practices

1. **Use data-testid attributes** for reliable element selection:
```tsx
<button data-testid="submit-button">Submit</button>
```

```typescript
await page.click('[data-testid="submit-button"]');
```

2. **Wait for network idle** before assertions:
```typescript
await page.waitForLoadState('networkidle');
```

3. **Use explicit waits** when needed:
```typescript
await page.waitForSelector('h1', { timeout: 5000 });
```

4. **Handle optional elements** gracefully:
```typescript
const hasElement = await page.locator('button').isVisible().catch(() => false);
if (hasElement) {
  await page.click('button');
}
```

5. **Test both success and error cases**:
```typescript
test('should show error for invalid input', async ({ page }) => {
  await page.fill('input', 'invalid');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=/error/i')).toBeVisible();
});
```

## CI/CD Integration

### GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/e2e-tests.yml`) that:

- Runs tests on push to main/develop
- Runs tests on pull requests
- Tests across multiple browsers in parallel
- Uploads test reports and traces
- Comments on PRs with test results

### Running Tests in CI

Tests automatically run in CI with these characteristics:

- **Headless mode**: Browsers run without GUI
- **Parallel execution**: Tests run in shards for faster completion
- **Retry logic**: Failed tests retry 2 times
- **Artifact upload**: Reports and traces uploaded for debugging

### Environment Variables for CI

Set these secrets in GitHub repository settings:

```
TEST_DATABASE_URL
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
```

## Troubleshooting

### Common Issues

#### 1. "Browser not installed"

```bash
npx playwright install chromium firefox webkit
```

#### 2. "Timeout waiting for page"

Increase timeout in `playwright.config.ts`:

```typescript
use: {
  navigationTimeout: 60000,
}
```

#### 3. "Element not found"

Use explicit waits:

```typescript
await page.waitForSelector('button', { timeout: 10000 });
```

#### 4. "Authentication failing"

Verify test user credentials in `.env.e2e` match Clerk test users.

#### 5. "Tests fail locally but pass in CI"

Check for timing issues, increase waits:

```typescript
await page.waitForTimeout(2000);
```

### Debug Mode

Run tests in debug mode to step through:

```bash
npm run test:e2e:debug
```

### Viewing Traces

When tests fail, traces are saved in `test-results/`. Open them:

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

### Headed Mode

Run tests with visible browser:

```bash
npm run test:e2e:headed
```

### UI Mode

Interactive test runner:

```bash
npm run test:e2e:ui
```

## Test Maintenance

### Updating Tests

When features change:

1. Update relevant test files in `e2e/`
2. Update test fixtures if needed in `e2e/fixtures/`
3. Run tests locally to verify
4. Create PR with updated tests

### Adding New Tests

1. Create new test file in appropriate directory
2. Import fixtures: `import { test, expect } from '../fixtures/test-fixtures';`
3. Write test scenarios
4. Run and verify
5. Document in this README

### Test Data Management

- Use `TEST_USERS`, `TEST_CUSTOMER`, etc. from fixtures
- Create unique data using timestamps: `test-${Date.now()}@example.com`
- Clean up test data in `globalTeardown` if needed

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Clerk Testing Guide](https://clerk.com/docs/testing)
- [Next.js Testing](https://nextjs.org/docs/testing)

## Support

For issues with E2E tests:

1. Check this documentation
2. Review test logs and traces
3. Run in debug mode
4. Check GitHub issues
5. Contact the development team
