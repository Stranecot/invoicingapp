# CI/CD Pipeline Flow Diagram

Visual representation of the complete CI/CD pipeline.

## Overview

```
Developer → Feature Branch → Pull Request → CI Pipeline → Merge → Deploy Pipeline → Production
                                    ↓                              ↓
                              Quality Gates                 Post-Deploy Checks
                                    ↓                              ↓
                              Pass/Fail                      Success/Rollback
```

## Detailed CI Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DEVELOPER WORKFLOW                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
                          ┌──────────────────────┐
                          │  Create Feature      │
                          │  Branch              │
                          │  (feature/xxx)       │
                          └──────────────────────┘
                                      ↓
                          ┌──────────────────────┐
                          │  Write Code          │
                          │  Write Tests         │
                          │  Commit Changes      │
                          └──────────────────────┘
                                      ↓
                          ┌──────────────────────┐
                          │  Push to GitHub      │
                          │  Open Pull Request   │
                          └──────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CI PIPELINE TRIGGERED                           │
│                          (.github/workflows/ci.yml)                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
                          ┌──────────────────────┐
                          │  JOB 1: Setup        │
                          │  ─────────────────   │
                          │  • Checkout code     │
                          │  • Setup Node.js     │
                          │  • npm ci            │
                          │  • Cache deps        │
                          │  • Cache Turbo       │
                          │  • Cache Next.js     │
                          └──────────────────────┘
                                      ↓
        ┌─────────────────────────────┴─────────────────────────────┐
        ↓                             ↓                             ↓
┌──────────────┐            ┌──────────────┐            ┌──────────────┐
│ JOB 2: Lint  │            │JOB 3: Type   │            │ JOB 4: Unit  │
│ ─────────────│            │    Check     │            │    Tests     │
│ • ESLint all │            │─────────────│            │──────────────│
│   workspaces │            │ • TypeScript │            │ • Vitest run │
│ • Report     │            │   validation │            │ • Coverage   │
│   issues     │            │ • Both apps  │            │ • Threshold  │
└──────────────┘            └──────────────┘            │   check ≥75% │
                                                        └──────────────┘
        │                             │                             │
        └─────────────────────────────┴─────────────────────────────┘
                                      ↓
                          ┌──────────────────────┐
                          │  JOB 5: Build Apps   │
                          │  ──────────────────  │
                          │  Matrix Strategy:    │
                          │  ┌────────────────┐  │
                          │  │ Admin Dash     │  │
                          │  │ (parallel)     │  │
                          │  └────────────────┘  │
                          │  ┌────────────────┐  │
                          │  │ Client Portal  │  │
                          │  │ (parallel)     │  │
                          │  └────────────────┘  │
                          │  • Prisma generate   │
                          │  • Next.js build     │
                          │  • Upload artifacts  │
                          └──────────────────────┘
                                      ↓
                          ┌──────────────────────┐
                          │  JOB 6: E2E Tests    │
                          │  ──────────────────  │
                          │  Matrix Strategy:    │
                          │  ┌────────────────┐  │
                          │  │ Chromium Shard│  │
                          │  │ 1, 2          │  │
                          │  └────────────────┘  │
                          │  ┌────────────────┐  │
                          │  │ Firefox Shard │  │
                          │  │ 1, 2          │  │
                          │  └────────────────┘  │
                          │  ┌────────────────┐  │
                          │  │ WebKit Shard  │  │
                          │  │ 1, 2          │  │
                          │  └────────────────┘  │
                          │  • Install browsers  │
                          │  • Run tests         │
                          │  • Upload reports    │
                          │  • Upload traces     │
                          └──────────────────────┘
                                      ↓
                          ┌──────────────────────┐
                          │  JOB 7: Test Report  │
                          │  ──────────────────  │
                          │  • Aggregate results │
                          │  • Generate summary  │
                          │  • Comment on PR     │
                          │  • Upload artifacts  │
                          └──────────────────────┘
                                      ↓
                          ┌──────────────────────┐
                          │  JOB 8: Quality Gate │
                          │  ──────────────────  │
                          │  Check all jobs:     │
                          │  ✓ Lint passed       │
                          │  ✓ TypeCheck passed  │
                          │  ✓ Unit tests passed │
                          │  ✓ Build passed      │
                          │  ✓ E2E tests passed  │
                          └──────────────────────┘
                                      ↓
                    ┌─────────────────┴─────────────────┐
                    ↓                                   ↓
            ┌──────────────┐                    ┌──────────────┐
            │  ✅ SUCCESS   │                    │  ❌ FAILURE   │
            │  ────────────│                    │  ────────────│
            │ Ready to     │                    │ Cannot merge │
            │ merge        │                    │ Fix issues   │
            └──────────────┘                    └──────────────┘
                    ↓                                   ↓
         ┌──────────────────┐              ┌──────────────────┐
         │ Merge to main    │              │ Review errors    │
         └──────────────────┘              │ Fix and push     │
                                          └──────────────────┘
```

## Deployment Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MERGE TO MAIN BRANCH                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT PIPELINE TRIGGERED                         │
│                       (.github/workflows/deploy.yml)                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
                          ┌──────────────────────┐
                          │ JOB 1: Pre-Deploy    │
                          │ ──────────────────   │
                          │ • Wait for CI pass   │
                          │ • Check if needed    │
                          │ • Skip if docs only  │
                          └──────────────────────┘
                                      ↓
                          ┌──────────────────────┐
                          │ JOB 2: Build         │
                          │ ──────────────────   │
                          │ Matrix Strategy:     │
                          │ ┌────────────────┐   │
                          │ │ Admin Dash     │   │
                          │ │ • Vercel build │   │
                          │ └────────────────┘   │
                          │ ┌────────────────┐   │
                          │ │ Client Portal  │   │
                          │ │ • Vercel build │   │
                          │ └────────────────┘   │
                          │ • Pull Vercel env    │
                          │ • Build for prod     │
                          │ • Upload artifacts   │
                          └──────────────────────┘
                                      ↓
                          ┌──────────────────────┐
                          │ JOB 3: Deploy        │
                          │ ──────────────────   │
                          │ Sequential:          │
                          │ 1. Admin Dashboard   │
                          │    └─> Deploy        │
                          │    └─> Save URL      │
                          │                      │
                          │ 2. Client Portal     │
                          │    └─> Deploy        │
                          │    └─> Save URL      │
                          └──────────────────────┘
                                      ↓
                          ┌──────────────────────┐
                          │ JOB 4: Verify        │
                          │ ──────────────────   │
                          │ • Wait 30s           │
                          │ • Health check Admin │
                          │ • Health check Client│
                          │ • Run smoke tests    │
                          └──────────────────────┘
                                      ↓
                    ┌─────────────────┴─────────────────┐
                    ↓                                   ↓
            ┌──────────────┐                    ┌──────────────┐
            │  ✅ SUCCESS   │                    │  ❌ FAILURE   │
            └──────────────┘                    └──────────────┘
                    ↓                                   ↓
         ┌──────────────────┐              ┌──────────────────┐
         │ JOB 5: Notify    │              │ JOB 6: Rollback  │
         │ ──────────────── │              │ ──────────────── │
         │ • Summary        │              │ • Create issue   │
         │ • Slack message  │              │ • Rollback guide │
         │ • Discord embed  │              │ • Alert team     │
         │ • Deployment URLs│              └──────────────────┘
         └──────────────────┘
                    ↓
         ┌──────────────────┐
         │ PRODUCTION LIVE  │
         │ ──────────────── │
         │ ✓ Admin Dash     │
         │ ✓ Client Portal  │
         └──────────────────┘
```

## Scheduled Maintenance Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SCHEDULED / MANUAL TRIGGER                            │
│                      (.github/workflows/scheduled.yml)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ↓
        ┌─────────────────────────────┴─────────────────────────────┐
        ↓                             ↓                             ↓
┌──────────────┐            ┌──────────────┐            ┌──────────────┐
│Security Audit│            │  Dependency  │            │   Health     │
│──────────────│            │   Updates    │            │   Check      │
│• npm audit   │            │──────────────│            │──────────────│
│• Snyk scan   │            │• Check       │            │• Ping Admin  │
│• Upload      │            │  outdated    │            │• Ping Client │
│  results     │            │• Create      │            │• Create      │
│• Create      │            │  issue       │            │  alert       │
│  issue if    │            └──────────────┘            └──────────────┘
│  vulnerable  │
└──────────────┘
        │                             │                             │
        └─────────────────────────────┴─────────────────────────────┘
                                      ↓
        ┌─────────────────────────────┴─────────────────────────────┐
        ↓                                                           ↓
┌──────────────┐                                          ┌──────────────┐
│Cache Cleanup │                                          │ DB Backup    │
│──────────────│                                          │   Reminder   │
│• Check usage │                                          │──────────────│
│• Alert if    │                                          │• Monthly     │
│  >80%        │                                          │  issue       │
└──────────────┘                                          └──────────────┘
        │                                                           │
        └─────────────────────────────┬─────────────────────────────┘
                                      ↓
                          ┌──────────────────────┐
                          │ JOB: Report          │
                          │ ──────────────────   │
                          │ • Aggregate results  │
                          │ • Create summary     │
                          │ • Notify if critical │
                          └──────────────────────┘
```

## Parallel Execution Visualization

### CI Pipeline Parallelization

```
Time →
  0s  ├── Setup (2-3 min)
  3m  ├── Lint (1-2 min)        ┐
      ├── TypeCheck (1-2 min)    ├── Parallel
      └── Unit Tests (2-3 min)  ┘
  6m  ├── Build Admin (3-5 min)   ┐
      └── Build Client (3-5 min)  ├── Parallel
 11m  ├── E2E Chromium 1/2        │
      ├── E2E Chromium 2/2        │
      ├── E2E Firefox 1/2         ├── Parallel (6 jobs)
      ├── E2E Firefox 2/2         │
      ├── E2E WebKit 1/2          │
      └── E2E WebKit 2/2         ┘
 16m  ├── Test Report (1 min)
 17m  └── Quality Gate (1 min)

Total: ~17 minutes (with caching: ~10 minutes)
```

### Deployment Pipeline Parallelization

```
Time →
  0s  ├── Pre-Deploy (1 min)
  1m  ├── Build Admin (3-5 min)   ┐
      └── Build Client (3-5 min)  ├── Parallel
  6m  ├── Deploy Admin (2-3 min)  Sequential ┐
  9m  ├── Deploy Client (2-3 min)            │
 12m  └── Verify (1-2 min)                   │
 14m  └── Notify (1 min)

Total: ~14 minutes
```

## Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                       CACHING LAYERS                         │
└─────────────────────────────────────────────────────────────┘

Layer 1: npm Dependencies
┌────────────────────────────────────────┐
│ Cache Key: node-modules-${{ hashFiles  │
│            ('**/package-lock.json') }} │
│ Restore Time: ~30s                     │
│ Miss Time: ~2-3 min                    │
└────────────────────────────────────────┘
                 ↓
Layer 2: Turborepo Cache
┌────────────────────────────────────────┐
│ Cache Key: turbo-${{ runner.os }}-    │
│            ${{ github.sha }}           │
│ Restore Time: ~10s                     │
│ Miss Time: Full build time             │
└────────────────────────────────────────┘
                 ↓
Layer 3: Next.js Build Cache
┌────────────────────────────────────────┐
│ Cache Key: nextjs-${{ runner.os }}-   │
│            ${{ github.sha }}           │
│ Restore Time: ~10s                     │
│ Miss Time: Full build time             │
└────────────────────────────────────────┘
                 ↓
Layer 4: Playwright Browsers
┌────────────────────────────────────────┐
│ Cache: Built into GitHub Actions       │
│ Restore Time: ~5s                      │
│ Miss Time: ~1-2 min                    │
└────────────────────────────────────────┘

Total Cache Savings: 5-10x faster builds
```

## Artifact Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      ARTIFACT LIFECYCLE                      │
└─────────────────────────────────────────────────────────────┘

CI Pipeline Artifacts:
  • coverage-report (30 days)
  • build-admin-dashboard (7 days)
  • build-client-portal (7 days)
  • playwright-report-* (30 days)
  • playwright-traces-* (7 days, only on failure)

Deploy Pipeline Artifacts:
  • deployment-url-admin (30 days)
  • deployment-url-client (30 days)

Scheduled Maintenance Artifacts:
  • security-audit-results (90 days)
  • outdated-dependencies (30 days)

Cleanup:
  GitHub auto-deletes after retention period
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        ERROR HANDLING                        │
└─────────────────────────────────────────────────────────────┘

                    ┌─────────────┐
                    │ Job Failure │
                    └─────────────┘
                          ↓
        ┌─────────────────┴─────────────────┐
        ↓                                   ↓
┌──────────────┐                    ┌──────────────┐
│ CI Pipeline  │                    │  Deployment  │
└──────────────┘                    └──────────────┘
        ↓                                   ↓
┌──────────────┐                    ┌──────────────┐
│ • Upload logs│                    │• Create issue│
│ • Upload     │                    │• Rollback    │
│   traces     │                    │  guide       │
│ • Comment on │                    │• Alert team  │
│   PR         │                    │• Notify      │
│ • Block merge│                    │  Slack/      │
└──────────────┘                    │  Discord     │
                                    └──────────────┘
```

## Quality Gate Decision Tree

```
                    ┌─────────────┐
                    │Quality Gate │
                    └─────────────┘
                          ↓
                    All checks passed?
                          ↓
            ┌─────────────┴─────────────┐
            ↓                           ↓
          YES                          NO
            ↓                           ↓
    ┌──────────────┐          ┌──────────────┐
    │ ✅ Set status │          │ ❌ Set status │
    │   to success │          │   to failure │
    └──────────────┘          └──────────────┘
            ↓                           ↓
    ┌──────────────┐          ┌──────────────┐
    │ Allow merge  │          │ Block merge  │
    └──────────────┘          └──────────────┘
            ↓                           ↓
    ┌──────────────┐          ┌──────────────┐
    │ Trigger      │          │ Notify       │
    │ deployment   │          │ developer    │
    └──────────────┘          └──────────────┘
```

## Time to Feedback

```
Developer Action → Feedback Time

┌─────────────────────────────────────────────────────┐
│ Push commit           →  CI starts (~10s)            │
│ Lint/TypeCheck done   →  ~5 minutes                 │
│ Unit tests done       →  ~6 minutes                 │
│ E2E tests done        →  ~16 minutes                │
│ PR comment posted     →  ~17 minutes                │
│ Merge to main         →  Deployment starts (~1m)    │
│ Deployment complete   →  ~15 minutes after merge    │
│ Total: Code → Production  ~32 minutes               │
└─────────────────────────────────────────────────────┘

With caching and optimizations:
  Code → Production: ~20-25 minutes
```

## Summary

This pipeline provides:
- ✅ Fast feedback (<20 minutes)
- ✅ Parallel execution
- ✅ Comprehensive testing
- ✅ Automated deployment
- ✅ Quality gates
- ✅ Error handling
- ✅ Monitoring
- ✅ Maintenance automation

For detailed documentation, see:
- [CI/CD Pipeline Documentation](../docs/CI-CD-PIPELINE.md)
- [Workflow Quick Guide](WORKFLOW-GUIDE.md)
- [Setup Checklist](SETUP-CHECKLIST.md)
