# CI/CD Setup Checklist

Use this checklist to ensure your CI/CD pipeline is properly configured.

## Pre-Setup

- [ ] Repository is created on GitHub
- [ ] Local development environment is working
- [ ] Tests are passing locally
- [ ] Vercel account is created
- [ ] Clerk account is created (for authentication)

## GitHub Configuration

### Repository Settings

- [ ] Enable GitHub Actions
  - Go to Settings → Actions → General
  - Select "Allow all actions and reusable workflows"
  - Save changes

- [ ] Enable Issues (for automated issue creation)
  - Go to Settings → General → Features
  - Check "Issues"

- [ ] Configure branch protection for `main`
  - Go to Settings → Branches
  - Click "Add rule"
  - Branch name pattern: `main`
  - Check "Require a pull request before merging"
  - Check "Require status checks to pass before merging"
  - Check "Require branches to be up to date before merging"
  - Add required status checks:
    - [ ] `CI Pipeline / Quality Gate`
    - [ ] `CI Pipeline / Lint`
    - [ ] `CI Pipeline / Type Check`
    - [ ] `CI Pipeline / Unit Tests`
    - [ ] `CI Pipeline / Build Apps`
    - [ ] `CI Pipeline / E2E Tests`
  - Check "Require conversation resolution before merging"
  - Check "Do not allow bypassing the above settings"
  - Save changes

### GitHub Secrets

#### Required Secrets

- [ ] `VERCEL_TOKEN`
  - Go to https://vercel.com/account/tokens
  - Click "Create Token"
  - Name: "GitHub Actions CI/CD"
  - Scope: Full access
  - Expiration: No expiration (or set reminder)
  - Copy token
  - Go to GitHub: Settings → Secrets and variables → Actions → New repository secret
  - Name: `VERCEL_TOKEN`, Value: (paste token)

- [ ] `VERCEL_ORG_ID`
  - Run `vercel whoami` in terminal
  - Or go to Vercel: Settings → General → Team ID
  - Add as secret in GitHub

- [ ] `VERCEL_PROJECT_ID_ADMIN`
  - Go to Vercel Dashboard
  - Open admin-dashboard project
  - Settings → General → Project ID
  - Copy and add as secret

- [ ] `VERCEL_PROJECT_ID_CLIENT`
  - Go to Vercel Dashboard
  - Open client-portal project
  - Settings → General → Project ID
  - Copy and add as secret

- [ ] `CLERK_SECRET_KEY`
  - Go to https://dashboard.clerk.com
  - Select your application
  - Go to API Keys
  - Copy "Secret Key"
  - Add as secret in GitHub

- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - Same location as above
  - Copy "Publishable Key"
  - Add as secret in GitHub

#### Optional Secrets (Recommended)

- [ ] `CODECOV_TOKEN`
  - Go to https://codecov.io
  - Sign in with GitHub
  - Add repository
  - Copy token from Settings → General
  - Add as secret in GitHub

- [ ] `TURBO_TOKEN` and `TURBO_TEAM`
  - Go to https://vercel.com/account/tokens
  - Create Turborepo token
  - Add both secrets in GitHub
  - Enables remote caching (faster builds)

- [ ] `SLACK_WEBHOOK_URL` (if using Slack)
  - Go to Slack: https://api.slack.com/apps
  - Create new app or select existing
  - Enable Incoming Webhooks
  - Create webhook for desired channel
  - Copy webhook URL
  - Add as secret in GitHub

- [ ] `DISCORD_WEBHOOK_URL` (if using Discord)
  - Go to Discord channel settings
  - Integrations → Webhooks
  - Create webhook
  - Copy webhook URL
  - Add as secret in GitHub

- [ ] `SNYK_TOKEN` (for security scanning)
  - Go to https://snyk.io
  - Sign in with GitHub
  - Account Settings → General → Auth Token
  - Click "Show" and copy token
  - Add as secret in GitHub

#### Optional Secrets (Production Monitoring)

- [ ] `PRODUCTION_ADMIN_URL`
  - Your production admin dashboard URL
  - Example: `https://admin.yourdomain.com`
  - Used for health checks

- [ ] `PRODUCTION_CLIENT_URL`
  - Your production client portal URL
  - Example: `https://app.yourdomain.com`
  - Used for health checks

- [ ] `TEST_DATABASE_URL` (if using external test database)
  - Connection string for test database
  - Example: `postgresql://user:pass@host:5432/testdb`

## Vercel Configuration

### Admin Dashboard Project

- [ ] Create Vercel project
  ```bash
  cd src/apps/admin-dashboard
  vercel link
  ```

- [ ] Configure environment variables in Vercel
  - Go to Vercel Dashboard → Project → Settings → Environment Variables
  - Add for Production, Preview, and Development:
    - [ ] `DATABASE_URL`
    - [ ] `CLERK_SECRET_KEY`
    - [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
    - [ ] `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
    - [ ] `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
    - [ ] Any other app-specific variables

- [ ] Configure build settings
  - Settings → General
  - Framework Preset: `Next.js`
  - Build Command: `npm run build` (or leave default)
  - Output Directory: `.next` (or leave default)
  - Install Command: `npm ci` (or leave default)

- [ ] Configure custom domain (optional)
  - Settings → Domains
  - Add custom domain
  - Configure DNS

### Client Portal Project

- [ ] Create Vercel project
  ```bash
  cd src/apps/client-portal
  vercel link
  ```

- [ ] Configure environment variables (same as above)

- [ ] Configure build settings (same as above)

- [ ] Configure custom domain (optional)

## Database Configuration

### Development Database

- [ ] SQLite database is working locally
  ```bash
  cd src/packages/database
  npx prisma migrate dev
  npx prisma generate
  ```

### Production Database

- [ ] Choose database provider
  - [ ] Vercel Postgres, OR
  - [ ] Supabase, OR
  - [ ] Railway, OR
  - [ ] PlanetScale, OR
  - [ ] Other PostgreSQL provider

- [ ] Create production database

- [ ] Add `DATABASE_URL` to Vercel environment variables

- [ ] Run migrations
  ```bash
  npx prisma migrate deploy
  ```

- [ ] Set up database backups
  - Check provider's backup settings
  - Configure retention period
  - Test restoration process

## Workflow Files

- [ ] CI workflow exists (`.github/workflows/ci.yml`)
- [ ] Deploy workflow exists (`.github/workflows/deploy.yml`)
- [ ] Scheduled workflow exists (`.github/workflows/scheduled.yml`)
- [ ] E2E tests workflow exists (`.github/workflows/e2e-tests.yml`)

## Testing the Setup

### Test CI Pipeline

- [ ] Create test branch
  ```bash
  git checkout -b test/ci-setup
  ```

- [ ] Make a small change
  ```bash
  echo "# CI/CD Test" >> README.md
  git add README.md
  git commit -m "test: CI/CD pipeline setup"
  git push origin test/ci-setup
  ```

- [ ] Create pull request

- [ ] Verify all CI checks run:
  - [ ] Setup completes
  - [ ] Lint passes
  - [ ] Type check passes
  - [ ] Unit tests pass with coverage
  - [ ] Build succeeds
  - [ ] E2E tests pass
  - [ ] Test report is generated
  - [ ] Quality gate passes

- [ ] Check PR comment for test results

- [ ] Verify artifacts are uploaded:
  - [ ] Coverage report
  - [ ] Build artifacts
  - [ ] Playwright reports

### Test Deployment Pipeline

- [ ] Merge test PR to main

- [ ] Verify deploy workflow runs:
  - [ ] Pre-deploy checks pass
  - [ ] Build completes
  - [ ] Deploy to Vercel succeeds
  - [ ] Verification passes
  - [ ] Notifications sent (if configured)

- [ ] Check deployed applications:
  - [ ] Admin dashboard is accessible
  - [ ] Client portal is accessible
  - [ ] Both apps are functional
  - [ ] Database connection works
  - [ ] Authentication works

### Test Scheduled Maintenance

- [ ] Trigger manual run
  - Go to Actions → Scheduled Maintenance
  - Click "Run workflow"
  - Select task: "security-audit"
  - Click "Run workflow"

- [ ] Verify security audit runs:
  - [ ] npm audit completes
  - [ ] Snyk scan runs (if configured)
  - [ ] Audit results are uploaded
  - [ ] Issue created if vulnerabilities found (optional)

- [ ] Trigger dependency update check
  - Select task: "dependency-update"
  - Run workflow
  - Check for outdated packages report

## Documentation

- [ ] README.md updated with:
  - [ ] CI/CD badges
  - [ ] Testing commands
  - [ ] CI/CD overview
  - [ ] Required secrets list
  - [ ] Quality standards

- [ ] CI/CD documentation exists (`docs/CI-CD-PIPELINE.md`)

- [ ] Workflow guide exists (`.github/WORKFLOW-GUIDE.md`)

- [ ] This checklist exists (`.github/SETUP-CHECKLIST.md`)

## Team Setup

- [ ] Share documentation with team

- [ ] Grant repository access to team members
  - Settings → Collaborators and teams
  - Add team members with appropriate permissions

- [ ] Configure notification preferences
  - Each team member: Settings → Notifications
  - Configure preferences for workflow failures

- [ ] Set up Slack/Discord notifications (if using)
  - Test notifications work
  - Ensure right channels/people are notified

- [ ] Schedule team walkthrough of CI/CD pipeline

## Monitoring and Maintenance

- [ ] Set calendar reminder for monthly security review

- [ ] Set calendar reminder for quarterly dependency updates

- [ ] Set calendar reminder for annual secret rotation

- [ ] Bookmark important URLs:
  - [ ] GitHub Actions page
  - [ ] Vercel Dashboard
  - [ ] Codecov dashboard (if using)
  - [ ] Snyk dashboard (if using)

- [ ] Subscribe to GitHub Status (https://www.githubstatus.com/)

- [ ] Subscribe to Vercel Status (https://www.vercel-status.com/)

## Troubleshooting

If something doesn't work:

- [ ] Check all secrets are correctly named (exact match)
- [ ] Verify secrets have no extra spaces or quotes
- [ ] Ensure Vercel projects are linked correctly
- [ ] Verify GitHub Actions are enabled
- [ ] Check branch protection rules are not too strict
- [ ] Review workflow logs for specific errors
- [ ] Consult [docs/CI-CD-PIPELINE.md](../docs/CI-CD-PIPELINE.md) debugging section

## Final Verification

- [ ] All required secrets are configured
- [ ] All optional secrets (that you want) are configured
- [ ] Branch protection is enabled on main
- [ ] CI pipeline runs successfully
- [ ] Deployment pipeline runs successfully
- [ ] Scheduled maintenance runs successfully
- [ ] Applications are deployed and accessible
- [ ] Database is configured and working
- [ ] Authentication is working
- [ ] Team has access and documentation
- [ ] Notifications are working (if configured)
- [ ] No errors in any workflow runs

## Post-Setup

- [ ] Create GitHub issue to track any configuration improvements
- [ ] Document any custom changes or deviations from this checklist
- [ ] Share experience with team
- [ ] Update this checklist if needed
- [ ] Celebrate! 🎉 Your CI/CD pipeline is ready!

---

## Checklist Status

**Started**: _______________

**Completed**: _______________

**Completed By**: _______________

**Notes**:
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________
_____________________________________________________________________________

## Next Steps After Setup

1. Start using feature branches and pull requests
2. Monitor workflow runs for first few weeks
3. Optimize based on performance metrics
4. Add more quality checks as needed
5. Expand test coverage
6. Configure additional integrations
