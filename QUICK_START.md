# Quick Start Guide - Monorepo

## Root Directory
```
C:\Projects\ingenious\invoice-app\invoicingapp\
```

## Common Commands

```bash
# Development
npm run dev              # Start all apps in dev mode
npm run dev --filter=@invoice-app/client-portal  # Start specific app

# Production Build
npm run build            # Build all apps
npm run start            # Start production server

# Quality Checks
npm run lint             # Lint all apps
npm run test             # Test all apps

# Maintenance
npm install              # Install/update dependencies
npm run clean            # Clean build artifacts
```

## Project Structure

```
invoicingapp/
├── src/
│   ├── apps/
│   │   └── client-portal/    ← Next.js app (formerly at root)
│   └── packages/             ← Shared packages (future)
├── turbo.json                ← Turborepo config
└── package.json              ← Root with workspaces
```

## Key Changes from Previous Setup

| Before | After |
|--------|-------|
| `invoice-app/` (root) | `src/apps/client-portal/` |
| No Turborepo | Turborepo v2.6.1 |
| Single package | npm workspaces |
| Direct `npm run dev` | `npm run dev` (runs via turbo) |

## Development Workflow

1. **Navigate to root:**
   ```bash
   cd C:\Projects\ingenious\invoice-app\invoicingapp
   ```

2. **Install dependencies (first time):**
   ```bash
   npm install
   ```

3. **Start development:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   ```
   http://localhost:3001
   ```

## Environment Variables

Location: `src/apps/client-portal/.env`

Required variables:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `DATABASE_URL`

## Verification

```bash
# Check setup
npx turbo --version        # Should show: 2.6.1
npm list --depth=0         # Should show: @invoice-app/client-portal

# Test (dry-run)
npx turbo run build --dry-run
```

## Documentation

- `README.md` - Full monorepo documentation
- `MONOREPO_SETUP.md` - Setup details and verification
- `VERIFICATION_COMMANDS.md` - All verification commands
- `src/apps/client-portal/README.md` - App-specific docs

## Support

- Turborepo docs: https://turbo.build/repo/docs
- npm workspaces: https://docs.npmjs.com/cli/using-npm/workspaces
- Next.js docs: https://nextjs.org/docs

## Status

Issue #1: Create monorepo with Turborepo - **COMPLETE** ✓
