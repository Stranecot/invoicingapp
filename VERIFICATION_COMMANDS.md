# Monorepo Verification Commands

## Quick Verification

Run these commands from the root directory: `C:\Projects\ingenious\invoice-app\invoicingapp\`

### 1. Check Turborepo Version
```bash
npx turbo --version
```
Expected: `2.6.1`

### 2. Verify Workspaces
```bash
npm list --depth=0
```
Expected output should show:
- `invoice-app-monorepo@0.1.0`
- `@invoice-app/client-portal@0.1.0` -> `.\src\apps\client-portal`
- `turbo@2.6.1`

### 3. Test Build Pipeline (Dry Run)
```bash
npx turbo run build --dry-run
```
Expected: Shows `@invoice-app/client-portal#build` task configuration

### 4. Test Dev Pipeline (Dry Run)
```bash
npx turbo run dev --dry-run
```
Expected: Shows `@invoice-app/client-portal#dev` task configuration

### 5. Test Lint Pipeline (Dry Run)
```bash
npx turbo run lint --dry-run
```
Expected: Shows `@invoice-app/client-portal#lint` task configuration

## Full Build Test

To actually build the application (not just dry-run):

```bash
# Make sure you're in the root directory
cd C:\Projects\ingenious\invoice-app\invoicingapp

# Run the build
npm run build
```

This will:
1. Execute the Turborepo build pipeline
2. Build the client-portal Next.js app
3. Cache the build outputs in `.turbo/`
4. Output to `src/apps/client-portal/.next/`

## Development Server Test

To start the development server:

```bash
# Make sure you're in the root directory
cd C:\Projects\ingenious\invoice-app\invoicingapp

# Start dev server
npm run dev
```

This will:
1. Start the Next.js dev server with Turbopack
2. Run on port 3001 (http://localhost:3001)
3. Enable hot module reloading

To stop: Press `Ctrl+C`

## Specific App Commands

Run commands for a specific app only:

```bash
# Build only client-portal
npm run build --filter=@invoice-app/client-portal

# Dev only client-portal
npm run dev --filter=@invoice-app/client-portal

# Lint only client-portal
npm run lint --filter=@invoice-app/client-portal
```

## Directory Structure Check

Verify the directory structure:

```bash
# Check root structure
ls -la

# Check src structure
ls -la src/

# Check apps structure
ls -la src/apps/

# Check client-portal exists
ls -la src/apps/client-portal/
```

Expected directories:
- `src/apps/client-portal/` - The Next.js app
- `src/packages/` - Empty, ready for shared packages
- `.turbo/` - Turborepo cache
- `node_modules/` - Dependencies

## Environment Check

Verify environment files are preserved:

```bash
# Check if .env exists in client-portal
ls -la src/apps/client-portal/.env*
```

Expected files:
- `src/apps/client-portal/.env`
- `src/apps/client-portal/.env.example`

## Troubleshooting

If commands fail, check:

1. **Are you in the root directory?**
   ```bash
   pwd
   # Should show: /c/Projects/ingenious/invoice-app/invoicingapp
   ```

2. **Are dependencies installed?**
   ```bash
   npm install
   ```

3. **Is Turborepo installed?**
   ```bash
   npm list turbo
   # Should show: turbo@2.6.1
   ```

4. **Check package.json exists at root**
   ```bash
   cat package.json
   # Should show workspaces configuration
   ```

## Success Indicators

Your monorepo is working correctly if:

- [x] `npx turbo --version` shows `2.6.1`
- [x] `npm list --depth=0` shows `@invoice-app/client-portal`
- [x] All dry-run commands execute without errors
- [x] `npm run dev` starts the dev server on port 3001
- [x] Directory structure matches the expected layout
- [x] `.env` files are preserved in client-portal

## Next Steps

Once verification is complete:

1. Test the actual application by running `npm run dev`
2. Visit http://localhost:3001 in your browser
3. Verify all functionality works as before
4. Consider adding shared packages under `src/packages/`
5. Add more apps under `src/apps/` as needed

## Notes

- The working directory path is: `C:\Projects\ingenious\invoice-app\invoicingapp\`
- This is a Windows environment, so paths use backslashes in some outputs
- The git repository is at: https://github.com/Stranecot/invoicingapp.git
- Package manager: npm v11.6.2
- Node.js: >= 18.0.0 required
