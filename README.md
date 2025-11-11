# Invoice App Monorepo

[![CI Pipeline](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml)
[![Deploy](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/deploy.yml)
[![Scheduled Maintenance](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/scheduled.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/scheduled.yml)

This is a Turborepo-based monorepo for the Invoice App project.

## Project Structure

```
invoicingapp/
├── src/
│   ├── apps/
│   │   └── client-portal/     # Next.js client portal application
│   └── packages/              # Shared packages (future)
├── turbo.json                 # Turborepo configuration
├── package.json               # Root package.json with workspaces
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 11.6.2

### Installation

```bash
# Install all dependencies across the monorepo
npm install
```

### Development

```bash
# Run all apps in development mode
npm run dev

# Run a specific app
npm run dev --filter=@invoice-app/client-portal
```

### Building

```bash
# Build all apps
npm run build

# Build a specific app
npm run build --filter=@invoice-app/client-portal
```

### Testing

```bash
# Run unit tests
npm run test

# Run unit tests with coverage
npm run test:coverage

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run E2E tests in headed mode (see browser)
npm run test:e2e:headed

# Run E2E tests in UI mode
npm run test:e2e:ui

# Run E2E tests for specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Run E2E tests for specific app
npm run test:e2e:admin
npm run test:e2e:client
```

### Other Commands

```bash
# Lint all apps
npm run lint

# Start production server
npm run start

# Clean build artifacts
npm run clean
```

## Apps

### Client Portal (`src/apps/client-portal`)

The main Next.js application for the invoice management system. This includes:
- User authentication with Clerk
- Invoice management
- Client management
- Role-based access control (RBAC)
- Database integration with Prisma

## Turborepo Features

This monorepo uses Turborepo for:
- **Fast builds**: Caching and parallel execution
- **Task pipelines**: Defined in `turbo.json`
- **Remote caching**: Can be configured for team collaboration
- **Incremental builds**: Only rebuilds what changed

## Environment Variables

Each app maintains its own `.env` file. See the individual app README files for required environment variables.

For the client portal, copy `.env.example` to `.env` in `src/apps/client-portal/` and configure:
- Clerk authentication keys
- Database connection string
- Other app-specific variables

## Adding New Apps/Packages

1. Create a new directory under `src/apps/` or `src/packages/`
2. Initialize with `package.json` (use appropriate naming convention: `@invoice-app/package-name`)
3. npm workspaces will automatically discover it
4. Update `turbo.json` if needed for specific build configurations

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

- **CI Pipeline**: Runs on every pull request and push to main/develop
  - Linting with ESLint
  - Type checking with TypeScript
  - Unit tests with Vitest (75% coverage required)
  - E2E tests with Playwright
  - Build verification

- **Deployment Pipeline**: Automatically deploys to Vercel on push to main
  - Pre-deployment validation
  - Production builds
  - Vercel deployment
  - Post-deployment verification
  - Notifications (Slack/Discord)

- **Scheduled Maintenance**: Runs daily/weekly
  - Security audits (npm audit, Snyk)
  - Dependency updates
  - Health checks
  - Cache cleanup

For detailed CI/CD documentation, see [docs/CI-CD-PIPELINE.md](docs/CI-CD-PIPELINE.md).

### Required GitHub Secrets

To enable CI/CD, configure these secrets in your GitHub repository:

**Required**:
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID_ADMIN` - Admin dashboard project ID
- `VERCEL_PROJECT_ID_CLIENT` - Client portal project ID
- `CLERK_SECRET_KEY` - Clerk authentication secret
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key

**Optional**:
- `CODECOV_TOKEN` - Code coverage reporting
- `SNYK_TOKEN` - Security scanning
- `SLACK_WEBHOOK_URL` - Slack notifications
- `DISCORD_WEBHOOK_URL` - Discord notifications
- `TURBO_TOKEN` - Turborepo Remote Cache
- `TURBO_TEAM` - Turborepo team name

## Quality Standards

This project enforces the following quality standards:

- Code coverage must be ≥75% for all metrics (lines, branches, functions, statements)
- All linting rules must pass (ESLint)
- TypeScript must compile without errors
- All tests must pass before merging
- No critical or high severity security vulnerabilities

## Learn More

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [npm Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [CI/CD Pipeline Documentation](docs/CI-CD-PIPELINE.md)
