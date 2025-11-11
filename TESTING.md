# Testing Guide

This document describes the testing infrastructure and best practices for the Invoice App monorepo.

## Table of Contents

- [Overview](#overview)
- [Test Infrastructure](#test-infrastructure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Coverage](#test-coverage)
- [Continuous Integration](#continuous-integration)

## Overview

The Invoice App uses **Vitest** as its testing framework. Vitest is a fast, modern test runner that works seamlessly with TypeScript and provides excellent developer experience.

### Key Features

- Fast test execution with smart parallelization
- Hot module replacement (HMR) during test development
- TypeScript support out of the box
- Coverage reporting with v8
- Mock utilities for external dependencies

## Test Infrastructure

### Framework and Tools

- **Vitest**: Main test runner
- **@vitest/ui**: Interactive UI for running tests
- **@vitest/coverage-v8**: Code coverage reporting
- **Mocks**: Custom mocks for Prisma, Clerk, and Resend

### Configuration

The main configuration is in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 75,
        statements: 75,
      },
    },
  },
});
```

### Test Structure

```
invoicingapp/
├── test/
│   ├── setup.ts                    # Global test setup
│   └── mocks/
│       ├── index.ts                # Mock exports
│       ├── prisma.ts               # Prisma client mocks
│       ├── clerk.ts                # Clerk auth mocks
│       └── resend.ts               # Resend email mocks
├── src/
│   ├── packages/
│   │   ├── auth/
│   │   │   └── src/
│   │   │       ├── permissions.ts
│   │   │       ├── permissions.test.ts
│   │   │       ├── server.ts
│   │   │       ├── server.test.ts
│   │   │       ├── resource-access.ts
│   │   │       └── resource-access.test.ts
│   │   └── email/
│   │       └── src/
│   │           ├── index.ts
│   │           └── index.test.ts
│   └── apps/
│       └── admin-dashboard/
│           └── app/
│               └── api/
│                   └── admin/
│                       └── invitations/
│                           ├── route.ts
│                           └── route.test.ts
└── vitest.config.ts
```

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with UI (interactive browser interface)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Package-Specific Tests

```bash
# Test only the auth package
cd src/packages/auth
npm test

# Test only the email package
cd src/packages/email
npm test

# Test only the admin dashboard
cd src/apps/admin-dashboard
npm test
```

### Filtering Tests

```bash
# Run tests matching a pattern
vitest run permissions

# Run a specific test file
vitest run src/packages/auth/src/permissions.test.ts

# Run tests in watch mode for a specific file
vitest src/packages/auth/src/server.test.ts
```

## Writing Tests

### Test File Naming

- Place test files next to the source file they test
- Use `.test.ts` suffix (e.g., `permissions.test.ts`)
- Mirror the source file name (e.g., `permissions.ts` → `permissions.test.ts`)

### Test Structure

Use the Arrange-Act-Assert (AAA) pattern:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Reset mocks and state before each test
  });

  describe('Function or Method', () => {
    it('should do something when condition is met', () => {
      // Arrange: Set up test data and mocks
      const input = { /* ... */ };

      // Act: Execute the function
      const result = someFunction(input);

      // Assert: Verify the result
      expect(result).toBe(expectedValue);
    });

    it('should handle error cases gracefully', () => {
      // Test error scenarios
      expect(() => someFunction(invalidInput)).toThrow('Error message');
    });
  });
});
```

### Using Mocks

#### Prisma Mock

```typescript
import { createMockPrismaClient, mockTestData, resetPrismaMocks } from '../../../test/mocks/prisma';

const mockPrisma = createMockPrismaClient();

vi.mock('@invoice-app/database', () => ({
  prisma: mockPrisma,
  Role: { ADMIN: 'ADMIN', USER: 'USER', ACCOUNTANT: 'ACCOUNTANT' },
}));

// In your test
mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
```

#### Clerk Auth Mock

```typescript
import { mockAuth, setupClerkMocks, resetClerkMocks } from '../../../test/mocks/clerk';

vi.mock('@clerk/nextjs/server', () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));

// In your test
setupClerkMocks({ userId: 'clerk-admin-123' });
```

#### Resend Email Mock

```typescript
import { MockResend, setupResendMock, resetResendMock } from '../../../test/mocks/resend';

const mockResend = new MockResend();

vi.mock('resend', () => ({
  Resend: vi.fn(() => mockResend),
}));

// In your test
setupResendMock(mockResend, { shouldSucceed: true });
```

### Testing Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Clear Naming**: Use descriptive test names that explain what is being tested
3. **Mock External Dependencies**: Mock databases, APIs, and external services
4. **Test Edge Cases**: Include tests for error conditions and boundary cases
5. **Keep Tests Simple**: Each test should verify one specific behavior
6. **Use beforeEach**: Reset mocks and state before each test

### Example Test Patterns

#### Testing Permissions

```typescript
describe('roleHasPermission', () => {
  it('should return true when ADMIN has permission', () => {
    expect(roleHasPermission('ADMIN', Permission.USER_DELETE)).toBe(true);
  });

  it('should return false when USER does not have permission', () => {
    expect(roleHasPermission('USER', Permission.USER_DELETE)).toBe(false);
  });
});
```

#### Testing Async Functions

```typescript
describe('getCurrentUser', () => {
  it('should return user when authenticated', async () => {
    setupClerkMocks({ userId: 'clerk-admin-123' });
    mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);

    const user = await getCurrentUser();

    expect(user).toEqual(mockTestData.adminUser);
  });

  it('should throw error when not authenticated', async () => {
    setupClerkMocks({ userId: null });

    await expect(getCurrentUser()).rejects.toThrow('Unauthorized');
  });
});
```

#### Testing API Routes

```typescript
describe('POST /api/admin/invitations', () => {
  it('should create invitation successfully', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockTestData.adminUser);
    mockPrisma.organization.findUnique.mockResolvedValue(mockTestData.organization);
    mockPrisma.invitation.create.mockResolvedValue(mockTestData.invitation);

    const request = new NextRequest('http://localhost:3000/api/admin/invitations', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', role: 'USER' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.email).toBe('test@example.com');
  });
});
```

## Test Coverage

### Coverage Goals

The project aims for the following coverage targets:

- **Auth Package**: 80%+ coverage
- **Email Package**: 80%+ coverage
- **API Routes**: 70%+ coverage
- **Utilities**: 90%+ coverage
- **Overall**: 75%+ coverage

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html  # macOS
start coverage/index.html  # Windows
```

### Coverage Reports

Coverage reports are generated in multiple formats:

- **Terminal**: Summary in the console
- **JSON**: `coverage/coverage-final.json`
- **HTML**: Interactive report in `coverage/index.html`

### Excluded from Coverage

The following are excluded from coverage metrics:

- Node modules
- Build outputs
- Configuration files
- Type definition files
- Test files

## Test Categories

### Unit Tests

Located alongside source files (`.test.ts` files):

- **Auth Package Tests**: Permission checking, role validation, resource access
- **Email Package Tests**: Email sending, template rendering, error handling
- **API Route Tests**: Request validation, authentication, business logic

### Current Test Files

1. **src/packages/auth/src/permissions.test.ts**
   - Role-based permission checking
   - Permission scope validation
   - Permission building utilities

2. **src/packages/auth/src/server.test.ts**
   - User authentication
   - Role verification
   - Organization membership
   - Access control filters

3. **src/packages/auth/src/resource-access.test.ts**
   - Resource-level access control
   - Organization-scoped access
   - Multi-tenant security

4. **src/packages/email/src/index.test.ts**
   - Email client initialization
   - Email sending with Resend
   - Template rendering
   - Email validation

5. **src/apps/admin-dashboard/app/api/admin/invitations/route.test.ts**
   - Invitation listing with filters
   - Invitation creation
   - Validation and error handling
   - Authorization checks

## Continuous Integration

### Running Tests in CI

Add to your CI pipeline:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: npm test

- name: Check Coverage
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

### Pre-commit Hooks

Consider adding a pre-commit hook to run tests:

```bash
# .husky/pre-commit
npm test
```

## Troubleshooting

### Common Issues

1. **Mock not working**
   - Ensure mocks are defined before imports
   - Check that vi.mock() is called at the top level
   - Reset mocks in beforeEach()

2. **Async test timing out**
   - Increase timeout: `{ timeout: 10000 }`
   - Ensure all promises are awaited
   - Check for infinite loops

3. **Coverage not accurate**
   - Run `npm run test:coverage` to regenerate
   - Check excluded paths in vitest.config.ts
   - Ensure all test files use .test.ts suffix

### Debug Mode

Run tests with debugging:

```bash
# Node inspector
node --inspect-brk ./node_modules/vitest/vitest.mjs run

# Verbose output
vitest run --reporter=verbose
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Mock Service Worker](https://mswjs.io/) - For API mocking (future consideration)

## Contributing

When adding new features:

1. Write tests alongside your code
2. Ensure tests pass locally before committing
3. Maintain or improve coverage metrics
4. Follow the established testing patterns
5. Update this guide if adding new testing utilities
