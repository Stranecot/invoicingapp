# CI/CD Pipeline Documentation

This document provides comprehensive information about the CI/CD pipeline setup for the Invoice App monorepo.

## Table of Contents

- [Overview](#overview)
- [Workflows](#workflows)
  - [CI Pipeline](#ci-pipeline)
  - [Deployment Pipeline](#deployment-pipeline)
  - [Scheduled Maintenance](#scheduled-maintenance)
- [Setup Instructions](#setup-instructions)
- [Required Secrets](#required-secrets)
- [Running Workflows Locally](#running-workflows-locally)
- [Debugging Failed Workflows](#debugging-failed-workflows)
- [Quality Gates](#quality-gates)
- [Best Practices](#best-practices)

## Overview

The CI/CD pipeline is built using GitHub Actions and consists of three main workflows:

1. **CI Pipeline** (`ci.yml`) - Automated testing, linting, and quality checks
2. **Deployment Pipeline** (`deploy.yml`) - Automated deployment to Vercel
3. **Scheduled Maintenance** (`scheduled.yml`) - Security audits and dependency management

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Pull Request                         │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    CI Pipeline (ci.yml)                  │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌─────────┐ │
│  │  Setup  │→ │   Lint   │→ │ TypeCheck │→ │  Build  │ │
│  └─────────┘  └──────────┘  └───────────┘  └─────────┘ │
│       ↓              ↓              ↓             ↓      │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐              │
│  │  Unit   │  │   E2E    │  │  Quality  │              │
│  │  Tests  │  │  Tests   │  │   Gate    │              │
│  └─────────┘  └──────────┘  └───────────┘              │
└─────────────────────────────────────────────────────────┘
                           ↓
                    ✅ All checks pass
                           ↓
┌─────────────────────────────────────────────────────────┐
│                 Merge to main branch                     │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Deployment Pipeline (deploy.yml)            │
│  ┌──────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐  │
│  │ Pre-check│→ │  Build  │→ │ Deploy  │→ │  Verify  │  │
│  └──────────┘  └─────────┘  └─────────┘  └──────────┘  │
│                                     ↓                    │
│                              ┌──────────┐               │
│                              │  Notify  │               │
│                              └──────────┘               │
└─────────────────────────────────────────────────────────┘
```

## Workflows

### CI Pipeline

**File**: `.github/workflows/ci.yml`

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual dispatch

**Jobs**:

1. **Setup** - Install dependencies and cache
   - Caches npm dependencies
   - Caches Turbo build artifacts
   - Caches Next.js builds

2. **Lint** - Code quality checks
   - Runs ESLint across all workspaces
   - Enforces code style standards

3. **TypeCheck** - TypeScript validation
   - Runs `tsc --noEmit` on all TypeScript projects
   - Ensures type safety

4. **Unit Tests** - Run Vitest tests
   - Executes all unit tests
   - Generates code coverage reports
   - Uploads coverage to Codecov (if configured)
   - Enforces 75% coverage threshold

5. **Build** - Build applications
   - Builds both admin-dashboard and client-portal
   - Runs in parallel using matrix strategy
   - Uploads build artifacts

6. **E2E Tests** - Run Playwright tests
   - Tests across Chromium, Firefox, and WebKit
   - Runs in parallel with sharding (2 shards per browser)
   - Uploads test reports and traces on failure

7. **Test Report** - Aggregate results
   - Combines coverage and E2E reports
   - Posts summary on pull requests
   - Creates GitHub step summary

8. **Quality Gate** - Final validation
   - Ensures all previous jobs passed
   - Updates commit status
   - Blocks merge if any check fails

**Optimizations**:
- Parallel job execution
- Dependency and build caching
- Test sharding for faster E2E tests
- Conditional execution based on changed files

### Deployment Pipeline

**File**: `.github/workflows/deploy.yml`

**Triggers**:
- Push to `main` branch
- Manual dispatch with environment selection

**Jobs**:

1. **Pre-Deploy** - Validation
   - Checks if CI pipeline passed
   - Verifies deployment is necessary
   - Skips if only documentation changed

2. **Build** - Production builds
   - Pulls Vercel environment configuration
   - Builds both applications
   - Uploads build artifacts

3. **Deploy** - Deploy to Vercel
   - Deploys admin-dashboard
   - Deploys client-portal
   - Sequential deployment to avoid conflicts

4. **Verify** - Post-deployment checks
   - Health checks for both applications
   - Smoke tests on production URLs
   - Validates deployment success

5. **Notify** - Send notifications
   - Creates deployment summary
   - Sends Slack notification (if configured)
   - Sends Discord notification (if configured)

6. **Rollback** - Failure handling
   - Triggered on deployment failure
   - Creates GitHub issue for investigation
   - Provides rollback instructions

**Environment Variables**:
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID_ADMIN` - Admin dashboard project ID
- `VERCEL_PROJECT_ID_CLIENT` - Client portal project ID

### Scheduled Maintenance

**File**: `.github/workflows/scheduled.yml`

**Triggers**:
- Daily at 2 AM UTC (security audit)
- Weekly on Monday at 3 AM UTC (dependency updates)
- Manual dispatch with task selection

**Jobs**:

1. **Security Audit**
   - Runs `npm audit` to check for vulnerabilities
   - Runs Snyk scan (if configured)
   - Creates GitHub issues for critical vulnerabilities
   - Uploads audit reports

2. **Dependency Update**
   - Checks for outdated dependencies
   - Creates issues for available updates
   - Provides update recommendations

3. **Database Backup Reminder**
   - Creates monthly reminder issues
   - Prompts for backup verification
   - Includes backup checklist

4. **Cache Cleanup**
   - Monitors cache usage
   - Alerts when approaching 80% of limit
   - GitHub auto-removes unused caches after 7 days

5. **Health Check**
   - Pings production URLs
   - Verifies applications are responding
   - Creates alerts on failure

6. **Report**
   - Generates maintenance summary
   - Notifies on critical failures

## Setup Instructions

### 1. Initial Setup

1. **Fork or clone the repository**

2. **Enable GitHub Actions**
   - Go to repository Settings → Actions → General
   - Enable "Allow all actions and reusable workflows"

3. **Configure branch protection** (recommended)
   - Settings → Branches → Add rule for `main`
   - Check "Require status checks to pass before merging"
   - Select required checks:
     - `CI Pipeline / Lint`
     - `CI Pipeline / Type Check`
     - `CI Pipeline / Unit Tests`
     - `CI Pipeline / Build Apps`
     - `CI Pipeline / E2E Tests`
     - `CI Pipeline / Quality Gate`

### 2. Configure Secrets

Navigate to Settings → Secrets and variables → Actions

#### Required Secrets

| Secret | Description | How to Get |
|--------|-------------|------------|
| `VERCEL_TOKEN` | Vercel API token | [Vercel Dashboard](https://vercel.com/account/tokens) → Create Token |
| `VERCEL_ORG_ID` | Vercel organization ID | Run `vercel whoami` or check team settings |
| `VERCEL_PROJECT_ID_ADMIN` | Admin dashboard project ID | Project Settings → General → Project ID |
| `VERCEL_PROJECT_ID_CLIENT` | Client portal project ID | Project Settings → General → Project ID |
| `CLERK_SECRET_KEY` | Clerk authentication key | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | Clerk Dashboard → API Keys |

#### Optional Secrets

| Secret | Description | Required For |
|--------|-------------|--------------|
| `CODECOV_TOKEN` | Codecov upload token | Coverage reporting |
| `SNYK_TOKEN` | Snyk API token | Security scanning |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook | Slack notifications |
| `DISCORD_WEBHOOK_URL` | Discord webhook URL | Discord notifications |
| `TURBO_TOKEN` | Turborepo Remote Cache token | Remote caching |
| `TURBO_TEAM` | Turborepo team name | Remote caching |
| `TEST_DATABASE_URL` | Test database URL | E2E tests (if using external DB) |
| `PRODUCTION_ADMIN_URL` | Production admin URL | Health checks |
| `PRODUCTION_CLIENT_URL` | Production client URL | Health checks |

### 3. Vercel Setup

1. **Create Vercel Projects**
   ```bash
   # Navigate to each app directory
   cd src/apps/admin-dashboard
   vercel link

   cd ../client-portal
   vercel link
   ```

2. **Configure Environment Variables in Vercel**
   - Go to each project in Vercel Dashboard
   - Settings → Environment Variables
   - Add all required environment variables for production

3. **Get Project IDs**
   ```bash
   # In each app directory
   vercel project ls
   ```

### 4. Database Setup

For production deployments, configure a production database:

1. **PostgreSQL** (recommended for production)
   - Set up database on Vercel Postgres, Supabase, or Railway
   - Add `DATABASE_URL` to Vercel environment variables
   - Update Prisma schema if needed

2. **SQLite** (development only)
   - Default configuration
   - Not recommended for production

### 5. Test the Pipeline

1. **Create a test branch**
   ```bash
   git checkout -b test/ci-pipeline
   ```

2. **Make a small change**
   ```bash
   echo "# CI/CD Test" >> README.md
   git add README.md
   git commit -m "test: CI/CD pipeline"
   git push origin test/ci-pipeline
   ```

3. **Create a pull request**
   - Watch the CI pipeline run
   - Verify all checks pass

4. **Merge to main**
   - Watch the deployment pipeline run
   - Verify successful deployment

## Running Workflows Locally

### Prerequisites

```bash
# Install act for running GitHub Actions locally
# macOS
brew install act

# Windows
choco install act-cli

# Linux
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

### Run CI Pipeline

```bash
# Run entire CI pipeline
act pull_request -W .github/workflows/ci.yml

# Run specific job
act pull_request -j lint -W .github/workflows/ci.yml

# Run with secrets
act pull_request --secret-file .env.secrets -W .github/workflows/ci.yml
```

### Simulate Deployment

```bash
# Note: Actual deployment requires Vercel secrets
act push --secret-file .env.secrets -W .github/workflows/deploy.yml
```

### Run Tests Locally

```bash
# Unit tests
npm run test

# Unit tests with coverage
npm run test:coverage

# E2E tests
npm run test:e2e

# Specific browser
npm run test:e2e:chromium

# Linting
npm run lint

# Type checking
npx tsc --noEmit --project src/apps/admin-dashboard/tsconfig.json
npx tsc --noEmit --project src/apps/client-portal/tsconfig.json

# Build
npm run build
```

## Debugging Failed Workflows

### 1. Check Workflow Logs

1. Go to Actions tab in GitHub
2. Click on the failed workflow run
3. Click on the failed job
4. Expand the failed step to see detailed logs

### 2. Common Issues and Solutions

#### Lint Failures

```bash
# Run locally to see issues
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

#### Type Check Failures

```bash
# Check admin dashboard
cd src/apps/admin-dashboard
npx tsc --noEmit

# Check client portal
cd src/apps/client-portal
npx tsc --noEmit
```

#### Test Failures

```bash
# Run tests with verbose output
npm run test -- --reporter=verbose

# Run specific test file
npm run test -- path/to/test.test.ts

# Run E2E tests in headed mode to see what's happening
npm run test:e2e:headed

# Debug specific E2E test
npm run test:e2e:debug -- path/to/test.spec.ts
```

#### Build Failures

```bash
# Build locally to see detailed errors
cd src/apps/admin-dashboard
npm run build

# Clear Next.js cache and rebuild
rm -rf .next
npm run build
```

#### Deployment Failures

1. **Vercel Token Issues**
   - Regenerate token in Vercel Dashboard
   - Update `VERCEL_TOKEN` secret
   - Ensure token has correct permissions

2. **Environment Variables Missing**
   - Check Vercel project settings
   - Ensure all required env vars are set
   - Verify variable names match exactly

3. **Build Time Exceeded**
   - Check build logs for slow processes
   - Optimize dependencies
   - Consider upgrading Vercel plan

### 3. Re-run Failed Jobs

- Click "Re-run failed jobs" in the workflow UI
- Or click "Re-run all jobs" to run everything again

### 4. Enable Debug Logging

Add these secrets to your repository for verbose logging:

- `ACTIONS_STEP_DEBUG` = `true`
- `ACTIONS_RUNNER_DEBUG` = `true`

### 5. Download Artifacts

Failed jobs often upload helpful artifacts:

1. Scroll to bottom of workflow run page
2. Download artifacts under "Artifacts" section:
   - Test reports
   - Coverage reports
   - Playwright traces
   - Build logs

### 6. Test in a Branch

Create a test branch to experiment with fixes:

```bash
git checkout -b fix/ci-issue
# Make changes
git commit -m "fix: CI configuration"
git push origin fix/ci-issue
# Open PR to test
```

## Quality Gates

The following quality gates must pass before merging:

### Code Quality

- ✅ ESLint passes with no errors
- ✅ TypeScript compiles with no errors
- ✅ All code follows style guidelines

### Testing

- ✅ All unit tests pass
- ✅ Code coverage ≥ 75% for lines, branches, functions, and statements
- ✅ All E2E tests pass across browsers

### Build

- ✅ Both applications build successfully
- ✅ No build warnings or errors
- ✅ Prisma client generates successfully

### Security

- ✅ No critical or high severity vulnerabilities
- ✅ All dependencies pass security audit

## Best Practices

### 1. Branch Strategy

```
main (protected)
├── develop (integration)
│   ├── feature/new-feature
│   ├── fix/bug-fix
│   └── refactor/code-improvement
```

- Never commit directly to `main`
- Create feature branches from `develop`
- Merge to `develop` for integration testing
- Merge to `main` for production deployment

### 2. Commit Messages

Follow conventional commits:

```
feat: add new invoice filter
fix: resolve calculation error
test: add unit tests for invoice service
docs: update CI/CD documentation
chore: update dependencies
refactor: improve invoice form logic
```

### 3. Pull Request Guidelines

- Keep PRs focused and small
- Include description of changes
- Link related issues
- Wait for CI checks to pass
- Request reviews from team members
- Resolve all review comments

### 4. Testing Strategy

- Write unit tests for business logic
- Write E2E tests for critical user flows
- Aim for >75% code coverage
- Test edge cases and error conditions
- Keep tests maintainable and readable

### 5. Deployment Strategy

- Deploy to production only from `main`
- Use Vercel preview deployments for PRs
- Test preview deployments before merging
- Monitor production after deployment
- Have rollback plan ready

### 6. Monitoring

- Check CI/CD runs daily
- Review security audit results weekly
- Update dependencies monthly
- Monitor production health checks
- Address issues promptly

### 7. Documentation

- Update docs when changing workflows
- Document new secrets or configuration
- Keep this guide up to date
- Add comments for complex workflow logic
- Share knowledge with team

## Troubleshooting Guide

### Pipeline is Slow

**Symptoms**: CI takes >20 minutes to complete

**Solutions**:
1. Enable Turbo Remote Cache:
   - Add `TURBO_TOKEN` and `TURBO_TEAM` secrets
   - Speeds up builds significantly

2. Optimize caching:
   - Ensure cache keys are correct
   - Check cache hit rates in logs

3. Reduce test time:
   - Increase E2E test sharding
   - Run fewer browsers for quick feedback
   - Use test.skip for flaky tests temporarily

### Flaky E2E Tests

**Symptoms**: Tests pass sometimes, fail other times

**Solutions**:
1. Increase timeouts:
   ```typescript
   test.setTimeout(60000); // 60 seconds
   ```

2. Add explicit waits:
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

3. Use better selectors:
   - Use data-testid attributes
   - Avoid CSS selectors that might change

4. Check for race conditions:
   - Ensure proper async/await usage
   - Wait for elements before interacting

### Out of Memory

**Symptoms**: Build fails with "JavaScript heap out of memory"

**Solutions**:
1. Increase Node memory:
   ```yaml
   - name: Build
     run: NODE_OPTIONS="--max-old-space-size=4096" npm run build
   ```

2. Optimize dependencies:
   - Remove unused packages
   - Use lighter alternatives

3. Clear caches:
   - Delete `.next` and `node_modules`
   - Rebuild from scratch

### Vercel Deployment Fails

**Symptoms**: Deploy job fails at Vercel step

**Solutions**:
1. Check Vercel logs:
   - Open project in Vercel Dashboard
   - Check deployment logs
   - Look for specific errors

2. Verify environment variables:
   - Ensure all required vars are set
   - Check variable values are correct
   - No extra spaces or quotes

3. Test build locally:
   ```bash
   vercel build
   ```

4. Check Vercel limits:
   - Ensure not hitting plan limits
   - Check build time limits
   - Verify team permissions

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Documentation](https://vercel.com/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)

## Support

If you encounter issues not covered in this guide:

1. Check existing GitHub issues
2. Create a new issue with:
   - Workflow run link
   - Error messages
   - Steps to reproduce
   - Expected vs actual behavior
3. Tag with `ci/cd` label

## Maintenance

This pipeline requires periodic maintenance:

- **Weekly**: Review security audit results
- **Monthly**: Update dependencies
- **Quarterly**: Review and optimize workflows
- **Annually**: Audit secrets and access

Last updated: 2025-11-11
