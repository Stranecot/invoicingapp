# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern invoicing application built with Next.js 15 App Router, TypeScript, Prisma ORM, and SQLite. It provides invoice management, customer management, PDF generation, and company settings configuration.

## Common Commands

### Development
```bash
npm run dev              # Start dev server with Turbopack at localhost:3000
npm run build            # Build for production with Turbopack
npm start                # Start production server
npm run lint             # Run ESLint
```

### Database Operations
```bash
npm run seed                    # Seed database with sample data
npx prisma migrate dev          # Create and apply migrations
npx prisma migrate dev --name <name>  # Create named migration
npx prisma studio              # Open Prisma Studio GUI at localhost:5555
npx prisma generate            # Regenerate Prisma Client after schema changes
```

**Important**: Always run `npx prisma generate` after modifying [prisma/schema.prisma](prisma/schema.prisma) to regenerate the Prisma Client types.

### Testing Single Features
Since there are no tests yet, test features manually:
```bash
npm run dev                    # Start dev server
# Navigate to specific page in browser (localhost:3000)
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15.5.6 with App Router
- **Language**: TypeScript 5 (strict mode)
- **Database**: SQLite with Prisma ORM 6.17.1
- **Styling**: Tailwind CSS 4
- **Forms**: React Hook Form 7.65.0 + Zod 4.1.12 validation
- **PDF**: jsPDF 3.0.3
- **Icons**: Lucide React
- **Dates**: date-fns 4.1.0

### Database Architecture

The application uses a single Prisma Client instance ([lib/prisma.ts](lib/prisma.ts)) with development-mode singleton pattern to prevent multiple instances during hot reloading.

**Models** (defined in [prisma/schema.prisma](prisma/schema.prisma)):
- `Company`: Single company configuration (name, email, address, taxRate, logo)
- `Customer`: Customer records with one-to-many relationship to invoices
- `Invoice`: Invoice headers with cascade delete to items, linked to customer
- `InvoiceItem`: Line items belonging to invoices

**Key Relationships**:
- Customer → Invoice (one-to-many, cascade delete)
- Invoice → InvoiceItem (one-to-many, cascade delete)

**Status Flow**: Invoices follow: `draft` → `sent` → `paid` (or `overdue`)

### App Router Structure

The app uses Next.js 15 App Router with file-based routing:

**Pages**:
- [app/page.tsx](app/page.tsx) - Dashboard with metrics and recent invoices
- [app/invoices/page.tsx](app/invoices/page.tsx) - Invoice list with status filtering
- [app/invoices/new/page.tsx](app/invoices/new/page.tsx) - Create invoice form
- [app/invoices/\[id\]/page.tsx](app/invoices/[id]/page.tsx) - Edit invoice
- [app/invoices/\[id\]/preview/page.tsx](app/invoices/[id]/preview/page.tsx) - Preview & PDF download
- [app/customers/page.tsx](app/customers/page.tsx) - Customer management
- [app/settings/page.tsx](app/settings/page.tsx) - Company settings

**API Routes** (all in [app/api/](app/api/)):
- `/api/company` - GET/PUT company settings
- `/api/customers` - GET (list) / POST (create)
- `/api/customers/[id]` - GET/PUT/DELETE single customer
- `/api/invoices` - GET (list) / POST (create)
- `/api/invoices/[id]` - GET/PUT/DELETE single invoice

All API routes use Prisma Client from [lib/prisma.ts](lib/prisma.ts) for database operations.

### Component Architecture

**Layout**:
- [app/layout.tsx](app/layout.tsx) - Root layout with Sidebar navigation

**Reusable UI** ([components/ui/](components/ui/)):
- Base components: Button, Card, Input, Textarea, Select, Modal
- These follow a consistent API pattern with className prop spreading

**Feature Components**:
- [components/invoice-form.tsx](components/invoice-form.tsx) - Main invoice form with React Hook Form
- [components/invoice-form-steps.tsx](components/invoice-form-steps.tsx) - Multi-step form wrapper
- [components/layout/sidebar.tsx](components/layout/sidebar.tsx) - Navigation sidebar

### Important Patterns

**Prisma Client Usage**:
Always import from the singleton:
```typescript
import { prisma } from '@/lib/prisma';
```

**API Route Pattern**:
- Use `NextRequest` and `NextResponse` from `next/server`
- Handle errors with try/catch and return appropriate status codes
- Use Prisma's cascade deletes (already configured in schema)

**Form Handling**:
- Use React Hook Form with Zod resolvers for validation
- Invoice forms calculate totals client-side before submission

**Path Aliases**:
Use `@/` prefix for imports (maps to project root via tsconfig.json):
```typescript
import { prisma } from '@/lib/prisma';
import Button from '@/components/ui/button';
```

## Sample Data

Pre-seeded data includes:
- 1 company: "Acme Corporation" with 10% tax rate
- 3 customers: John Smith, Jane Doe, Tech Solutions Inc.
- 4 invoices with statuses: sent, paid, overdue, draft

To reset sample data: Delete [prisma/dev.db](prisma/dev.db) and run `npx prisma migrate dev && npm run seed`

## Database Location

SQLite database file: [prisma/dev.db](prisma/dev.db)
Connection string in `.env`: `DATABASE_URL="file:./dev.db"`

## Key Development Notes

- **Next.js 15**: Uses latest App Router features, React 19, and Turbopack bundler
- **Strict TypeScript**: All code must pass strict type checking
- **Responsive Design**: Mobile-first with Tailwind breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- **No Authentication**: Currently a single-tenant app with no user auth
- **Invoice Numbers**: Auto-generated in format `INV-XXX` (handled in seed/API)
- **PDF Generation**: Uses jsPDF in browser (see preview page)
- **Calculations**: Tax applied to subtotal, total = subtotal + tax
- **WCAG Accessibility**: All text must meet WCAG 2.1 Level AA contrast ratio of 4.5:1 for normal text and 3:1 for large text (18pt+). This includes all invoice preview text, form labels, and interactive elements.

## Recent Updates

### October 19, 2025 - Mobile UI Consistency Update
**Status**: ✅ Completed and tested

**Changes Made**:
- Updated Dashboard page ([app/page.tsx](app/page.tsx)) to include Plus icon on "Create Invoice" button
- All "add new" buttons across the application now have consistent mobile-responsive design

**Button Pattern (All Pages)**:
```tsx
<Button>
  <Plus className="w-4 h-4 mr-2" />
  <span className="hidden sm:inline">Full Text</span>
  <span className="sm:hidden">New</span>
</Button>
```

**Pages Updated**:
- Dashboard: "Create Invoice" button now shows Plus icon
- Already consistent: Invoices, Customers, Expenses pages

**Mobile Display (< 640px)**: `[+] New`
**Desktop Display (≥ 640px)**: `[+] Create Invoice` / `[+] Add Customer` / `[+] Add Expense`

**Testing Results**:
- ✅ App running successfully on port 3003
- ✅ All routes compiled without errors
- ✅ Database connections working (all API endpoints responding 200)
- ✅ Pages tested: Dashboard (/), Invoices (/invoices), Expenses (/expenses)
- ✅ API routes tested: /api/invoices, /api/customers, /api/expenses (all categories, budgets, stats)
- ✅ Export functionality tested: /api/expenses/export responding correctly

**Known Issues**: None - all functionality working as expected

---

## Future Enhancements

Potential features mentioned in README:
- User authentication
- Email invoice sending
- Recurring invoices
- Multi-currency support
- Payment tracking
- Advanced reporting
