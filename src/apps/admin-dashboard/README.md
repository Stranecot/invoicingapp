# Admin Dashboard

Administrative dashboard for the Invoice App platform. This application allows super administrators to manage organizations, users, and invitations across the entire platform.

## Features

- **Dashboard Overview**: View system-wide statistics and recent activity
- **Organizations Management**: Create, view, and manage organizations
- **Users Management**: View and manage users across all organizations
- **Invitations**: Send, track, and manage user invitations
- **Settings**: Configure system-wide settings

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Authentication**: Clerk
- **UI Components**: Custom Shadcn-style components
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 11.6.2

### Installation

From the monorepo root:

```bash
npm install
```

### Development

Run the development server on port 3002:

```bash
npm run dev
```

Or from the monorepo root:

```bash
turbo run dev --filter=@invoice-app/admin-dashboard
```

Open [http://localhost:3002](http://localhost:3002) in your browser.

### Build

```bash
npm run build
```

### Production

```bash
npm run start
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `DATABASE_URL` - Database connection string
- `RESEND_API_KEY` - Resend API key for email service
- `APP_URL` - Application URL (http://localhost:3002 for development)

See `.env.example` for all available configuration options.

## Project Structure

```
admin-dashboard/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Dashboard routes (with layout)
│   │   ├── layout.tsx          # Dashboard layout with sidebar
│   │   ├── page.tsx            # Dashboard home
│   │   ├── organizations/      # Organizations management
│   │   ├── users/              # Users management
│   │   ├── invitations/        # Invitations management
│   │   └── settings/           # Settings
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing/home page
│   └── globals.css             # Global styles
├── components/
│   ├── ui/                     # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   └── select.tsx
│   ├── layout/                 # Layout components
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── mobile-nav.tsx
│   │   └── nav-items.tsx
│   └── providers/              # Context providers
├── lib/
│   └── utils.ts                # Utility functions
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── .env.example
```

## Shared Packages

This app uses shared packages from the monorepo:

- `@invoice-app/database` - Prisma database client and schemas
- `@invoice-app/auth` - Authentication utilities and hooks
- `@invoice-app/email` - Email service for sending invitations

## Routes

- `/` - Landing page
- `/dashboard` - Dashboard home with statistics
- `/dashboard/organizations` - Organizations management
- `/dashboard/users` - Users management
- `/dashboard/invitations` - Invitations management
- `/dashboard/settings` - System settings

## Development Notes

- The app runs on port **3002** (client-portal uses 3001)
- Uses Turbopack for faster builds and HMR
- TypeScript strict mode enabled
- Responsive design with mobile navigation
- Dark mode sidebar with blue accent colors

## Contributing

This is part of the Invoice App monorepo. See the main README for contribution guidelines.

## License

Private - Invoice App Platform
