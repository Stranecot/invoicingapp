# Invoice App - Modern Invoicing Solution

A modern, responsive, mobile-first invoice management application built with Next.js 14, TypeScript, Tailwind CSS, and Prisma.

## Features

### Core Functionality
- **Dashboard**: Overview with key metrics and recent invoices
- **Invoice Management**: Create, edit, delete, and view invoices
- **Customer Management**: Manage customer information
- **PDF Generation**: Download professional invoice PDFs
- **Company Settings**: Configure company information and tax rates

### Technical Features
- 🎨 Modern, clean UI with Tailwind CSS
- 📱 Responsive mobile-first design
- 🚀 Built with Next.js 14 App Router
- 💾 SQLite database with Prisma ORM
- 📄 PDF invoice generation with jsPDF
- 🔄 Real-time data updates
- ✨ Smooth animations and transitions

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite
- **ORM**: Prisma
- **PDF**: jsPDF
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation & Setup

1. Install dependencies:
```bash
npm install
```

2. The database is already initialized with migrations and sample data. If you need to reset:
```bash
npx prisma migrate dev
npm run seed
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
invoice-app/
├── app/
│   ├── api/              # API routes
│   │   ├── company/      # Company settings API
│   │   ├── customers/    # Customer management API
│   │   └── invoices/     # Invoice management API
│   ├── customers/        # Customer pages
│   ├── invoices/         # Invoice pages
│   │   ├── new/          # Create invoice
│   │   └── [id]/         # Edit/preview invoice
│   ├── settings/         # Settings page
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Dashboard
├── components/
│   ├── layout/           # Layout components
│   ├── ui/               # Reusable UI components
│   └── invoice-form.tsx  # Invoice form component
├── lib/
│   └── prisma.ts         # Prisma client
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeding
└── README.md
```

## Database Schema

### Models
- **Company**: Company information and settings
- **Customer**: Customer details
- **Invoice**: Invoice header information
- **InvoiceItem**: Individual line items for invoices

## Pages & Features

### Dashboard (/)
- Total invoices count
- Total paid amount
- Pending amount
- Recent invoices table

### Invoices (/invoices)
- List all invoices
- Filter by status (all, draft, sent, paid, overdue)
- Create, edit, delete invoices
- Preview and download PDF

### Customers (/customers)
- List all customers
- Add, edit, delete customers
- View customer information

### Settings (/settings)
- Update company information
- Configure tax rate

## Sample Data

The application comes with pre-seeded sample data:
- 1 company profile (Acme Corporation)
- 3 sample customers
- 4 sample invoices with different statuses

## API Routes

### Company
- `GET /api/company` - Get company information
- `PUT /api/company` - Update company information

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/[id]` - Get customer by ID
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer

### Invoices
- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/[id]` - Get invoice by ID
- `PUT /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data
- `npx prisma studio` - Open Prisma Studio (database GUI)

## Responsive Design

The application is fully responsive with breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

## Future Enhancements

Potential features to add:
- User authentication
- Email invoice sending
- Recurring invoices
- Multi-currency support
- Payment tracking
- Advanced reporting
