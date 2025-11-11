# GitHub Actions Workflow Quick Guide

Quick reference for common CI/CD tasks and workflows.

## Quick Actions

### Trigger Manual Deployment

1. Go to Actions tab
2. Click "Deploy to Vercel"
3. Click "Run workflow"
4. Select branch and environment
5. Click "Run workflow"

### Trigger Manual Security Audit

1. Go to Actions tab
2. Click "Scheduled Maintenance"
3. Click "Run workflow"
4. Select task: "security-audit"
5. Click "Run workflow"

### Re-run Failed Workflow

1. Open the failed workflow run
2. Click "Re-run failed jobs" or "Re-run all jobs"
3. Wait for completion

## Workflow Status Badges

Add these to your README.md (replace YOUR_USERNAME and YOUR_REPO):

```markdown
[![CI Pipeline](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml)
[![Deploy](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/deploy.yml)
[![Scheduled Maintenance](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/scheduled.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/scheduled.yml)
```

## Common Tasks

### Update a Secret

1. Go to Settings → Secrets and variables → Actions
2. Find the secret to update
3. Click "Update"
4. Enter new value
5. Click "Update secret"

### Add Required Check to Branch Protection

1. Go to Settings → Branches
2. Click "Edit" on branch protection rule for main
3. Under "Require status checks to pass before merging":
   - Check "Require branches to be up to date before merging"
   - Search and select required checks:
     - `CI Pipeline / Quality Gate`
     - `CI Pipeline / Lint`
     - `CI Pipeline / Type Check`
     - `CI Pipeline / Unit Tests`
     - `CI Pipeline / Build Apps`
     - `CI Pipeline / E2E Tests`
4. Click "Save changes"

### View Workflow Costs

1. Go to Settings → Billing and plans
2. Click "Actions and packages"
3. View minutes used and remaining

### Download Workflow Artifacts

1. Open workflow run
2. Scroll to "Artifacts" section at bottom
3. Click artifact name to download
4. Extract and review contents

## Debugging Workflows

### Enable Debug Logging

Add these secrets to your repository:

```
ACTIONS_STEP_DEBUG = true
ACTIONS_RUNNER_DEBUG = true
```

Then re-run the workflow to see detailed debug logs.

### View Raw Logs

1. Open workflow run
2. Click on failed job
3. Click "..." menu at top right
4. Click "View raw logs"
5. Download or view in browser

### Test Workflow Locally with Act

```bash
# Install act
brew install act  # macOS
choco install act-cli  # Windows

# Run a workflow
act pull_request -W .github/workflows/ci.yml

# Run specific job
act pull_request -j lint -W .github/workflows/ci.yml

# Run with secrets
act pull_request --secret-file .env.secrets -W .github/workflows/ci.yml

# Dry run to see what would happen
act pull_request -n -W .github/workflows/ci.yml
```

## Workflow Triggers

### CI Pipeline (`ci.yml`)

**Automatic Triggers**:
- Push to `main` or `develop`
- Pull request to `main` or `develop`

**Manual Trigger**:
```bash
# Via GitHub CLI
gh workflow run ci.yml

# Via web UI
Actions → CI Pipeline → Run workflow
```

### Deploy Pipeline (`deploy.yml`)

**Automatic Triggers**:
- Push to `main` (production deployment)

**Manual Trigger**:
```bash
# Production deployment
gh workflow run deploy.yml -f environment=production

# Via web UI
Actions → Deploy to Vercel → Run workflow → Select environment
```

### Scheduled Maintenance (`scheduled.yml`)

**Automatic Triggers**:
- Daily at 2 AM UTC (security audit)
- Weekly Monday at 3 AM UTC (dependency updates)

**Manual Trigger**:
```bash
# Run security audit
gh workflow run scheduled.yml -f task=security-audit

# Run all tasks
gh workflow run scheduled.yml -f task=all

# Via web UI
Actions → Scheduled Maintenance → Run workflow → Select task
```

## Workflow Outputs

### CI Pipeline

**Artifacts**:
- `coverage-report` - HTML coverage report (30 days)
- `build-admin-dashboard` - Admin build artifacts (7 days)
- `build-client-portal` - Client build artifacts (7 days)
- `playwright-report-*` - E2E test reports (30 days)
- `playwright-traces-*` - E2E test traces on failure (7 days)

**Summary**:
- Test coverage percentages
- Test results across browsers
- Link to full CI run

**PR Comment**:
- Coverage summary with pass/fail status
- E2E test status
- Link to full workflow run

### Deploy Pipeline

**Artifacts**:
- `deployment-url-admin-dashboard` - Deployment URL (30 days)
- `deployment-url-client-portal` - Deployment URL (30 days)

**Summary**:
- Deployment status (success/failed)
- Deployment URLs for both apps
- Verification results

**Notifications**:
- Slack message with deployment status
- Discord embed with deployment details

### Scheduled Maintenance

**Artifacts**:
- `security-audit-results` - Audit reports (90 days)
- `outdated-dependencies` - Outdated package report (30 days)

**Issues Created**:
- Security vulnerabilities found
- Dependencies with updates
- Database backup reminders (monthly)
- Cache usage warnings (>80%)
- Production health check failures

## Monitoring

### Check Recent Workflow Runs

```bash
# List recent runs
gh run list --limit 10

# Check specific workflow
gh run list --workflow=ci.yml --limit 5

# View run details
gh run view <run-id>

# Watch current run
gh run watch
```

### View Workflow Status

```bash
# Check status of all workflows
gh run list --json status,conclusion,name,createdAt

# Check failed runs in last 7 days
gh run list --json status,conclusion,name,createdAt \
  | jq '.[] | select(.conclusion=="failure") | select(.createdAt > (now - 604800 | strftime("%Y-%m-%dT%H:%M:%SZ")))'
```

## Emergency Procedures

### Stop Running Workflow

```bash
# Cancel specific run
gh run cancel <run-id>

# Cancel all runs for a workflow
gh run list --workflow=ci.yml --json databaseId -q '.[].databaseId' | xargs -I {} gh run cancel {}
```

### Disable Workflow

1. Go to Actions tab
2. Click on workflow name
3. Click "..." menu
4. Click "Disable workflow"

Or via file:
```yaml
# Add to workflow file
on:
  workflow_dispatch:  # Only manual trigger
  # Comment out automatic triggers
```

### Rollback Deployment

```bash
# Via Vercel CLI
npm install -g vercel
vercel login
vercel ls  # List deployments
vercel rollback <deployment-url> --token=$VERCEL_TOKEN

# Via Vercel Dashboard
# 1. Open project
# 2. Go to Deployments tab
# 3. Find previous successful deployment
# 4. Click "..." → "Promote to Production"
```

### Skip CI Checks (Emergency Only)

Add `[skip ci]` or `[ci skip]` to commit message:

```bash
git commit -m "Emergency fix [skip ci]"
```

**Warning**: Only use in emergencies. This bypasses all checks.

## Performance Optimization

### Enable Turborepo Remote Cache

1. Sign up at https://vercel.com/account/tokens
2. Generate Turborepo token
3. Add secrets:
   ```
   TURBO_TOKEN = your_token
   TURBO_TEAM = your_team_name
   ```
4. Workflows will automatically use remote cache

### Reduce E2E Test Time

Edit `.github/workflows/ci.yml`:

```yaml
# Increase sharding
matrix:
  browser: [chromium, firefox, webkit]
  shard: [1, 2, 3, 4]  # More shards = faster
```

Or run fewer browsers:

```yaml
# Only Chromium for faster feedback
matrix:
  browser: [chromium]
  shard: [1, 2]
```

### Cache Hit Rate

Check cache effectiveness in logs:

```
Post Setup Node.js
Cache restored successfully
Cache restored from key: node-modules-Linux-...
```

If cache miss is common, check:
- Cache key includes package-lock.json hash
- Dependencies aren't changing too frequently
- Cache size within limits (10GB)

## Best Practices

### ✅ Do

- Wait for CI to pass before merging
- Review test results and coverage
- Keep workflows under 60 minutes
- Use matrix strategy for parallel execution
- Cache dependencies and build artifacts
- Set appropriate artifact retention
- Monitor workflow costs
- Update secrets regularly
- Document workflow changes

### ❌ Don't

- Commit directly to main
- Merge with failing checks
- Skip CI checks (except emergencies)
- Store secrets in code
- Ignore security warnings
- Run heavy jobs unnecessarily
- Keep artifacts forever
- Disable workflows without reason
- Make changes without testing

## Useful Commands

### GitHub CLI

```bash
# Install GitHub CLI
brew install gh  # macOS
choco install gh  # Windows
winget install GitHub.cli  # Windows

# Login
gh auth login

# List workflows
gh workflow list

# View workflow
gh workflow view ci.yml

# Enable/disable workflow
gh workflow enable ci.yml
gh workflow disable ci.yml

# View logs
gh run view <run-id> --log

# Download artifacts
gh run download <run-id>
```

### Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# List projects
vercel projects ls

# List deployments
vercel ls

# View deployment logs
vercel logs <deployment-url>

# Inspect deployment
vercel inspect <deployment-url>
```

## Common Error Messages

### "Error: Resource not accessible by integration"

**Cause**: Workflow lacks required permissions

**Fix**: Add to workflow file:
```yaml
permissions:
  contents: read
  pull-requests: write
  issues: write
```

### "Error: Unable to resolve action"

**Cause**: Action reference is incorrect or deprecated

**Fix**: Check action exists and version is valid:
```yaml
# Use specific version
uses: actions/checkout@v4  # ✅
uses: actions/checkout@v99  # ❌
```

### "Error: Process completed with exit code 1"

**Cause**: Command failed (build, test, lint, etc.)

**Fix**:
1. Check logs for specific error
2. Run command locally
3. Fix the issue
4. Push changes

### "Error: Coverage threshold not met"

**Cause**: Code coverage below 75%

**Fix**: Add more tests or adjust threshold in `vitest.config.ts`

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub CLI Manual](https://cli.github.com/manual/)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Full CI/CD Documentation](../docs/CI-CD-PIPELINE.md)

## Getting Help

If you need help with workflows:

1. Check this guide
2. Check [full documentation](../docs/CI-CD-PIPELINE.md)
3. Review workflow logs
4. Search existing issues
5. Create new issue with:
   - Workflow run URL
   - Error message
   - Steps to reproduce
   - What you've tried
