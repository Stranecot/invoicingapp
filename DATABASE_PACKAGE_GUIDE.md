# Database Package Quick Reference Guide

## Overview

The `@invoice-app/database` package is a shared workspace package that provides the Prisma ORM schema, client, and database utilities for the entire Invoice App monorepo.

## Location

```
C:\Projects\ingenious\invoice-app\invoicingapp\src\packages\database\
```

## Common Commands

All commands should be run from the monorepo root unless specified otherwise.

### Prisma Client Generation

```bash
# Generate Prisma client after schema changes
cd C:\Projects\ingenious\invoice-app\invoicingapp
npm run db:generate --workspace=@invoice-app/database
```

### Database Migrations

```bash
# Create a new migration
cd C:\Projects\ingenious\invoice-app\invoicingapp\src\packages\database
npm run db:migrate -- --name your_migration_name

# Push schema changes (development only, skips migrations)
npm run db:push

# Deploy migrations (production)
npm run db:migrate:deploy
```

### Database Seeding

```bash
cd C:\Projects\ingenious\invoice-app\invoicingapp\src\packages\database

# Production seed
npm run db:seed

# Development seed
npm run db:seed:dev

# Demo seed
npm run db:seed:demo
```

### Prisma Studio

```bash
# Open Prisma Studio GUI
cd C:\Projects\ingenious\invoice-app\invoicingapp\src\packages\database
npm run db:studio
```

## Using in Your App

### 1. Add Dependency

In your app's `package.json`:

```json
{
  "dependencies": {
    "@invoice-app/database": "*"
  }
}
```

Then run `npm install` from the monorepo root.

### 2. Import and Use

```typescript
// Import Prisma client
import { prisma } from '@invoice-app/database';

// Import types
import { User, Role, Invoice, Customer } from '@invoice-app/database';

// Use in your code
async function getUsers() {
  const users = await prisma.user.findMany({
    where: { role: 'ADMIN' }
  });
  return users;
}
```

### 3. Common Patterns

**Query with Relations**:
```typescript
import { prisma } from '@invoice-app/database';

const invoice = await prisma.invoice.findUnique({
  where: { id: invoiceId },
  include: {
    customer: true,
    items: true,
    user: true
  }
});
```

**Create with Relations**:
```typescript
import { prisma } from '@invoice-app/database';

const newInvoice = await prisma.invoice.create({
  data: {
    invoiceNumber: 'INV-001',
    userId: user.id,
    customerId: customer.id,
    date: new Date(),
    dueDate: new Date(),
    subtotal: 100,
    tax: 10,
    total: 110,
    items: {
      create: [
        {
          description: 'Service',
          quantity: 1,
          unitPrice: 100,
          total: 100
        }
      ]
    }
  }
});
```

**Type-Safe Queries**:
```typescript
import { prisma, Role } from '@invoice-app/database';

// TypeScript knows about the Role enum
const admins = await prisma.user.findMany({
  where: { role: 'ADMIN' as Role }
});
```

## Schema Changes Workflow

1. **Edit the Schema**:
   ```bash
   # Edit the file
   C:\Projects\ingenious\invoice-app\invoicingapp\src\packages\database\prisma\schema.prisma
   ```

2. **Generate Client**:
   ```bash
   cd C:\Projects\ingenious\invoice-app\invoicingapp
   npm run db:generate --workspace=@invoice-app/database
   ```

3. **Create Migration**:
   ```bash
   cd C:\Projects\ingenious\invoice-app\invoicingapp\src\packages\database
   npm run db:migrate -- --name describe_your_change
   ```

4. **Build Apps**:
   ```bash
   cd C:\Projects\ingenious\invoice-app\invoicingapp
   npm run build
   ```

## Environment Configuration

Create a `.env` file in the monorepo root or in your app directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

For SQLite (development):
```env
DATABASE_URL="file:./dev.db"
```

## Troubleshooting

### Issue: "Cannot find module '@invoice-app/database'"

**Solution**: Run `npm install` from the monorepo root to link workspace packages.

```bash
cd C:\Projects\ingenious\invoice-app\invoicingapp
npm install
```

### Issue: "Type errors after schema changes"

**Solution**: Regenerate the Prisma client.

```bash
cd C:\Projects\ingenious\invoice-app\invoicingapp
npm run db:generate --workspace=@invoice-app/database
```

### Issue: "Migration failed"

**Solution**: Check the database connection and ensure DATABASE_URL is correct.

```bash
# Test database connection
cd C:\Projects\ingenious\invoice-app\invoicingapp\src\packages\database
npx prisma db pull
```

### Issue: "Prisma Client out of sync"

**Solution**: Regenerate after any schema changes.

```bash
cd C:\Projects\ingenious\invoice-app\invoicingapp
npm run db:generate --workspace=@invoice-app/database

# If still having issues, clear cache
rm -rf node_modules/.prisma
npm run db:generate --workspace=@invoice-app/database
```

## Build Pipeline Integration

### Turbo Configuration

The database package is configured in `turbo.json`:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["node_modules/.prisma/**"]
    },
    "db:generate": {
      "cache": false,
      "env": ["DATABASE_URL"]
    }
  }
}
```

### Build Order

When building the monorepo, Turbo ensures:
1. Database package builds first (generates Prisma client)
2. Apps that depend on database build next
3. All builds use the shared Prisma client

## Package Structure

```
src/packages/database/
├── .gitignore              # Ignores node_modules, .env, dev.db
├── package.json            # Package configuration and scripts
├── README.md               # Package documentation
├── tsconfig.json           # TypeScript configuration
├── src/
│   └── index.ts           # Main export (Prisma client singleton)
└── prisma/
    ├── schema.prisma      # Database schema
    ├── migrations/        # Migration history
    ├── dev.db            # SQLite database (development)
    ├── seed.ts           # Development seed
    ├── seed-production.ts # Production seed
    ├── seed-demo-data.ts  # Demo seed
    └── seed-safe.ts       # Idempotent seed
```

## Available Models

The schema includes the following models:

- **User** - Application users with roles (ADMIN, USER, ACCOUNTANT)
- **Company** - Company information (1:1 with User)
- **Customer** - Customer records
- **Invoice** - Invoice headers
- **InvoiceItem** - Invoice line items
- **Expense** - Expense tracking
- **ExpenseCategory** - Expense categories
- **Budget** - Budget limits per category
- **AccountantAssignment** - Accountant-to-customer assignments
- **Note** - Notes for various entities

## Best Practices

1. **Always regenerate after schema changes**: Run `db:generate` after editing `schema.prisma`
2. **Use migrations in production**: Never use `db:push` in production
3. **Seed appropriately**: Use production seeds for real environments, dev/demo for testing
4. **Type imports**: Import types from the package for consistency
5. **Singleton client**: Always use the exported `prisma` client, don't create new instances
6. **Environment variables**: Keep DATABASE_URL in `.env` files, never commit

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Turborepo Documentation](https://turbo.build/repo/docs)
