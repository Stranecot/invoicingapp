# Invoice App Monorepo

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

## Learn More

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [npm Workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
