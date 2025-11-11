# @invoice-app/database

Shared database package for the Invoice App monorepo. Contains the Prisma schema, client, and database utilities.

## Features

- Prisma ORM with PostgreSQL
- Centralized database schema
- Singleton Prisma client instance
- Database migrations
- Seed scripts for development and production

## Usage

Import the Prisma client in your app:

```typescript
import { prisma } from '@invoice-app/database';

// Use prisma client
const users = await prisma.user.findMany();
```

Import types:

```typescript
import { User, Invoice, Customer } from '@invoice-app/database';
```

## Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database (development)
- `npm run db:migrate` - Create and apply migrations
- `npm run db:migrate:deploy` - Deploy migrations (production)
- `npm run db:studio` - Open Prisma Studio GUI
- `npm run db:seed` - Seed database with production data
- `npm run db:seed:dev` - Seed database with development data
- `npm run db:seed:demo` - Seed database with demo data

## Environment Variables

Create a `.env` file in the root of the monorepo with:

```
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

## Development

After making changes to the Prisma schema:

1. Generate the client: `npm run db:generate`
2. Create a migration: `npm run db:migrate`
3. The changes will be available in all apps that use this package
