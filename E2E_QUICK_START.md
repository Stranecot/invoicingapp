# E2E Testing Quick Start Guide

Get started with E2E testing in 5 minutes!

## Prerequisites

- Node.js 18+
- Both apps running (ports 3001 and 3002)
- Clerk test accounts configured

## Setup (One-time)

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Install Playwright browsers
npx playwright install

# 3. Configure test environment
cp .env.e2e.example .env.e2e
# Edit .env.e2e with your test credentials
```

## Running Tests

### Quick Commands

```bash
# Run all tests
npm run test:e2e

# Run with visible browser
npm run test:e2e:headed

# Interactive mode (recommended for development)
npm run test:e2e:ui

# Debug a specific test
npm run test:e2e:debug
```

### Run Specific Test Suites

```bash
# Admin tests only
npm run test:e2e:admin

# Client portal tests only
npm run test:e2e:client

# Security tests only
npm run test:e2e:security

# Mobile/responsive tests only
npm run test:e2e:responsive
```

### Run Specific Browser

```bash
# Chromium only
npm run test:e2e:chromium

# Firefox only
npm run test:e2e:firefox

# Mobile browsers
npm run test:e2e:mobile
```

## Test User Credentials

You need to create these test users in your Clerk dashboard (test mode):

1. **Admin User** (for admin dashboard tests)
   - Email: admin@test.com
   - Password: YourSecurePassword123!
   - Role: ADMIN

2. **Regular User** (for client portal tests)
   - Email: user@test.com
   - Password: YourSecurePassword123!
   - Role: USER

3. **Accountant User** (optional)
   - Email: accountant@test.com
   - Password: YourSecurePassword123!
   - Role: ACCOUNTANT

Update these in your `.env.e2e` file.

## Test Structure Overview

```
e2e/
├── admin/               # Admin dashboard tests (4 files)
├── client-portal/       # Client portal tests (7 files)
├── security/           # Security tests (1 file)
├── responsive/         # Mobile/tablet/desktop tests (2 files)
└── fixtures/           # Test helpers and utilities
```

## Viewing Test Reports

After tests run:

```bash
# View HTML report
npm run test:e2e:report
```

## Common Issues

### Tests failing with timeout?
- Make sure both apps are running (3001 and 3002)
- Increase timeout in playwright.config.ts

### Authentication not working?
- Verify test user credentials in .env.e2e
- Make sure users exist in Clerk test environment

### Element not found?
- Check if the UI has changed
- Update selectors in test files

## Writing Your First Test

1. Create a new file in `e2e/client-portal/my-test.spec.ts`

2. Write a basic test:

```typescript
import { test, expect } from '../fixtures/test-fixtures';

test.describe('My Feature', () => {
  test('should work correctly', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/my-page');
    await authenticatedPage.click('button:has-text("Click Me")');
    await expect(authenticatedPage.locator('h1')).toContainText('Success');
  });
});
```

3. Run your test:

```bash
npx playwright test e2e/client-portal/my-test.spec.ts --headed
```

## Need Help?

- Read the full guide: [E2E_TESTING.md](./E2E_TESTING.md)
- Playwright docs: https://playwright.dev/
- Use debug mode: `npm run test:e2e:debug`
- Check test traces in `test-results/` folder

## Test Statistics

- **Total Test Suites**: 14
- **Total Tests**: ~140+
- **Coverage Areas**:
  - Admin Dashboard (30+ tests)
  - Client Portal (70+ tests)
  - Security (15+ tests)
  - Responsive Design (25+ tests)

## CI/CD

Tests automatically run on:
- Push to main/develop branches
- Pull requests
- Manual workflow trigger

See `.github/workflows/e2e-tests.yml` for configuration.
