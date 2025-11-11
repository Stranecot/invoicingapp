# Invoice App - Comprehensive Refactoring & Multi-Tenant Architecture Plan

## Executive Summary

This document outlines a comprehensive refactoring plan to transform the current single-app invoice system into a secure, multi-tenant platform with:
- **Invitation-based access control** (no unauthorized logins)
- **Separate admin dashboard** for managing organizations, users, and invitations
- **Reorganized monorepo structure** with clear separation of concerns
- **Enhanced security** with proper tenant isolation

---

## Current State Analysis

### What Works Well
✅ Solid Clerk authentication foundation
✅ Well-structured RBAC (Admin/User/Accountant)
✅ Good data isolation patterns
✅ Production-ready database schema
✅ Proper middleware protection

### Critical Issues to Address
❌ **Anyone can sign up** - No invitation gating
❌ **No tenant/organization concept** - Users are isolated but not grouped
❌ **No invitation system** - Can't invite clients or accountants
❌ **Single app structure** - Admin and client features mixed together
❌ **No way to manage user access** before they sign up

---

## Proposed Architecture

### 1. New Codebase Structure

```
invoice-app/
├── src/
│   ├── apps/
│   │   ├── admin-dashboard/          # NEW: Admin management portal
│   │   │   ├── app/                  # Next.js 15 App Router
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   ├── public/
│   │   │   ├── package.json
│   │   │   ├── next.config.ts
│   │   │   └── tsconfig.json
│   │   │
│   │   └── client-portal/            # MOVED: Current invoice-app (renamed)
│   │       ├── app/
│   │       ├── components/
│   │       ├── lib/
│   │       ├── prisma/               # Shared database
│   │       ├── public/
│   │       ├── package.json
│   │       ├── next.config.ts
│   │       └── tsconfig.json
│   │
│   ├── packages/                     # NEW: Shared code
│   │   ├── database/                 # Shared Prisma schema & client
│   │   │   ├── prisma/
│   │   │   ├── src/
│   │   │   └── package.json
│   │   │
│   │   ├── auth/                     # Shared auth utilities
│   │   │   ├── src/
│   │   │   └── package.json
│   │   │
│   │   ├── ui/                       # Shared UI components
│   │   │   ├── src/
│   │   │   └── package.json
│   │   │
│   │   └── config/                   # Shared configs (ESLint, TS, etc.)
│   │       └── package.json
│   │
│   └── docs/                         # Documentation
│       └── architecture.md
│
├── package.json                      # Root workspace config
├── pnpm-workspace.yaml              # Monorepo config
├── turbo.json                        # Turborepo config
└── README.md
```

### 2. Database Schema Enhancements

#### New Models

```prisma
// Organization (Tenant) Model
model Organization {
  id                String   @id @default(uuid())
  name              String
  slug              String   @unique        // For subdomain routing
  logo              String?
  billingEmail      String
  status            OrgStatus @default(ACTIVE)  // ACTIVE | SUSPENDED | TRIAL
  plan              BillingPlan @default(FREE)  // FREE | PRO | ENTERPRISE
  maxUsers          Int      @default(5)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  users             User[]
  invitations       Invitation[]
  customers         Customer[]
  invoices          Invoice[]
  expenses          Expense[]
  settings          OrganizationSettings?

  @@index([slug])
  @@index([status])
}

// Invitation Model - THE KEY TO GATED ACCESS
model Invitation {
  id                String   @id @default(uuid())
  email             String
  role              Role     @default(USER)
  organizationId    String
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Invitation metadata
  invitedBy         String               // User ID who sent invite
  invitedAt         DateTime @default(now())
  expiresAt         DateTime             // 7 days default
  status            InvitationStatus @default(PENDING)  // PENDING | ACCEPTED | EXPIRED | REVOKED
  token             String   @unique     // Secure token for invite link

  // Optional: Restrict to specific customers (for Accountants)
  customerIds       String[]             // Array of customer IDs they can access

  // Acceptance tracking
  acceptedAt        DateTime?
  acceptedBy        String?              // Clerk user ID

  @@unique([email, organizationId])      // One pending invite per email per org
  @@index([token])
  @@index([status, expiresAt])
  @@index([organizationId, status])
}

// Enhanced User Model
model User {
  id                String   @id @default(uuid())
  clerkId           String   @unique
  email             String   @unique
  name              String?
  role              Role     @default(USER)

  // NEW: Multi-tenant support
  organizationId    String?              // Which org they belong to
  organization      Organization? @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // NEW: Invitation tracking
  invitationId      String?  @unique     // Link to accepted invitation

  // NEW: Access control
  isActive          Boolean  @default(true)  // Can be suspended
  lastLoginAt       DateTime?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Existing relations...
  company           Company?
  customers         Customer[]
  invoices          Invoice[]
  expenses          Expense[]

  @@index([organizationId, role])
  @@index([isActive])
}

// Organization Settings
model OrganizationSettings {
  id                String   @id @default(uuid())
  organizationId    String   @unique
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  // Branding
  primaryColor      String   @default("#3b82f6")
  logoUrl           String?

  // Access control
  allowSignup       Boolean  @default(false)  // Public signup vs invite-only
  requireApproval   Boolean  @default(true)   // Admin must approve signups

  // Billing
  invoicePrefix     String   @default("INV")
  taxRate           Float    @default(0)
  currency          String   @default("USD")

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// Enums
enum OrgStatus {
  ACTIVE
  SUSPENDED
  TRIAL
  CANCELLED
}

enum BillingPlan {
  FREE
  PRO
  ENTERPRISE
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  EXPIRED
  REVOKED
}
```

### 3. Authentication Flow - NEW INVITATION-BASED SYSTEM

#### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    INVITATION-BASED ACCESS                   │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│ Admin/Owner  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ 1. Creates Invitation in Admin Dashboard                 │
│    - Enter email: john@example.com                       │
│    - Select role: ACCOUNTANT                             │
│    - Select customers (if accountant)                    │
│    - Click "Send Invite"                                 │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ 2. System Creates Invitation Record                      │
│    - Generate unique token                               │
│    - Set expiration (7 days)                             │
│    - Store in database: PENDING                          │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ 3. Email Sent to Invitee                                 │
│    Subject: "You're invited to join Acme Corp"          │
│    Link: https://app.invoiceapp.com/accept/[token]      │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ 4. Invitee Clicks Link                                   │
│    - Lands on /accept/[token] page                       │
│    - Shows: "You're invited by Acme Corp as Accountant" │
│    - Button: "Sign Up to Accept"                         │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ 5. Sign Up with Clerk                                    │
│    - Must use SAME EMAIL as invitation                   │
│    - Create password / OAuth                             │
│    - Clerk creates user                                  │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ 6. Webhook: user.created                                 │
│    - Check if invitation exists for email                │
│    - If YES: Create user with org + role from invite     │
│    - If NO: REJECT (or create pending approval)          │
│    - Mark invitation as ACCEPTED                         │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│ 7. Redirect to Appropriate App                           │
│    - ADMIN: → admin-dashboard                            │
│    - USER/ACCOUNTANT: → client-portal                    │
└──────────────────────────────────────────────────────────┘
```

#### Security Checks

```typescript
// lib/auth/invitation.ts

export async function validateInvitation(email: string, clerkId: string) {
  const invitation = await prisma.invitation.findFirst({
    where: {
      email,
      status: 'PENDING',
      expiresAt: { gt: new Date() }
    },
    include: { organization: true }
  });

  if (!invitation) {
    // NO INVITATION = NO ACCESS
    throw new Error('No valid invitation found. Please contact your administrator.');
  }

  // Create user with invitation details
  const user = await prisma.user.create({
    data: {
      clerkId,
      email,
      role: invitation.role,
      organizationId: invitation.organizationId,
      invitationId: invitation.id,
      isActive: true
    }
  });

  // Mark invitation as accepted
  await prisma.invitation.update({
    where: { id: invitation.id },
    data: {
      status: 'ACCEPTED',
      acceptedAt: new Date(),
      acceptedBy: clerkId
    }
  });

  return { user, organization: invitation.organization };
}
```

---

## Admin Dashboard Features

### Landing Page: `/admin`

```
┌────────────────────────────────────────────────────────┐
│  📊 Dashboard                                          │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Active Organizations: 12      Pending Invites: 5     │
│  Total Users: 48               Active Sessions: 23    │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Organizations│  │   Users      │  │ Invitations │ │
│  │     12       │  │      48      │  │      5      │ │
│  └──────────────┘  └──────────────┘  └─────────────┘ │
│                                                         │
│  Recent Activity                                       │
│  ────────────────────────────────────────────────────  │
│  🔵 John Doe accepted invitation (5 min ago)          │
│  🟢 New organization created: Acme Corp               │
│  🟡 Sarah invited jane@example.com as Accountant      │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Organizations Page: `/admin/organizations`

```
┌────────────────────────────────────────────────────────┐
│  🏢 Organizations                     [+ New Org]      │
├────────────────────────────────────────────────────────┤
│                                                         │
│  🔍 [Search organizations...]          Filter: [All ▾]│
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Acme Corporation                                 │ │
│  │ 12 users · PRO plan · Active                     │ │
│  │ owner@acme.com                                   │ │
│  │ [View] [Edit] [Suspend]                          │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Beta Tech Ltd                                    │ │
│  │ 5 users · FREE plan · Trial                      │ │
│  │ admin@betatech.io                                │ │
│  │ [View] [Edit] [Upgrade]                          │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Organization Detail: `/admin/organizations/[id]`

```
┌────────────────────────────────────────────────────────┐
│  ← Back to Organizations                               │
├────────────────────────────────────────────────────────┤
│  🏢 Acme Corporation                                   │
│  PRO Plan · Active since Jan 15, 2025                  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  [Overview] [Users] [Invitations] [Billing] [Settings]│
│                                                         │
│  ──────────── USERS TAB ────────────                   │
│                                                         │
│  Users (12/20)                     [+ Invite User]     │
│                                                         │
│  ┌────────────────────────────────────────────┐       │
│  │ 👤 John Doe          ADMIN    ⚫ Active    │       │
│  │    john@acme.com     Last login: 2h ago   │       │
│  │    [Edit Role] [Deactivate]               │       │
│  └────────────────────────────────────────────┘       │
│                                                         │
│  ┌────────────────────────────────────────────┐       │
│  │ 👤 Sarah Smith       USER     ⚫ Active    │       │
│  │    sarah@acme.com    Last login: 1d ago   │       │
│  │    [Edit Role] [Deactivate]               │       │
│  └────────────────────────────────────────────┘       │
│                                                         │
│  ┌────────────────────────────────────────────┐       │
│  │ 👤 Mike Johnson      ACCOUNTANT ⚫ Active  │       │
│  │    mike@acme.com     Last login: 3h ago   │       │
│  │    Assigned to: 5 customers               │       │
│  │    [Edit Role] [Manage Access] [Deactivate]│       │
│  └────────────────────────────────────────────┘       │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Invitations Page: `/admin/invitations`

```
┌────────────────────────────────────────────────────────┐
│  ✉️ Invitations                      [+ Send Invite]   │
├────────────────────────────────────────────────────────┤
│                                                         │
│  [Pending (5)] [Accepted (12)] [Expired (2)]          │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ jane@example.com                    ACCOUNTANT   │ │
│  │ Invited by: john@acme.com                        │ │
│  │ Sent: 2 days ago · Expires in 5 days            │ │
│  │ Status: 🟡 Pending                               │ │
│  │ [Resend] [Revoke] [Copy Link]                   │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ bob@client.com                      USER         │ │
│  │ Invited by: sarah@acme.com                       │ │
│  │ Sent: 1 day ago · Expires in 6 days             │ │
│  │ Status: 🟡 Pending                               │ │
│  │ [Resend] [Revoke] [Copy Link]                   │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### Send Invitation Modal

```
┌────────────────────────────────────────────┐
│  Send Invitation                      [✕]  │
├────────────────────────────────────────────┤
│                                             │
│  Organization                               │
│  [Acme Corporation        ▾]               │
│                                             │
│  Email Address *                            │
│  [john.doe@example.com         ]           │
│                                             │
│  Role *                                     │
│  ⚪ Business Owner (Full access)           │
│  ⚪ Accountant (View assigned customers)   │
│  🔵 Client (View own invoices only)        │
│                                             │
│  ──── Accountant Settings ────             │
│  Assign to Customers (optional)            │
│  ☑ ABC Manufacturing                       │
│  ☑ XYZ Retail                              │
│  ☐ Smith & Co                              │
│                                             │
│  Personal Message (optional)               │
│  ┌─────────────────────────────────────┐  │
│  │ Welcome! Looking forward to...      │  │
│  └─────────────────────────────────────┘  │
│                                             │
│  Expiration                                 │
│  [7 days ▾]                                │
│                                             │
│         [Cancel]  [Send Invitation]        │
└────────────────────────────────────────────┘
```

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal**: Set up monorepo structure and enhance database schema

#### Tasks:
1. **Create monorepo structure**
   - Set up `src/apps/` and `src/packages/`
   - Configure pnpm workspace or npm workspaces
   - Add Turborepo for build orchestration

2. **Extract shared packages**
   - Create `@invoice-app/database` package
   - Create `@invoice-app/auth` package
   - Create `@invoice-app/ui` package (shared Tailwind components)

3. **Database schema migration**
   - Add `Organization` model
   - Add `Invitation` model
   - Add `OrganizationSettings` model
   - Update `User` model with `organizationId` and `invitationId`
   - Write migration scripts
   - Update seed files

4. **Rename current app**
   - Move `invoicingapp/invoice-app/` → `src/apps/client-portal/`
   - Update imports to use shared packages
   - Test that everything still works

**Deliverables**:
- ✅ Working monorepo with Turborepo
- ✅ Shared `@invoice-app/database` package
- ✅ Enhanced database schema
- ✅ All existing features work in new structure

---

### Phase 2: Invitation System Backend (Week 2-3)
**Goal**: Build invitation creation, validation, and acceptance logic

#### Tasks:
1. **Invitation API endpoints**
   ```
   POST   /api/admin/invitations          # Create invitation
   GET    /api/admin/invitations          # List invitations
   GET    /api/admin/invitations/[id]     # Get single invitation
   DELETE /api/admin/invitations/[id]     # Revoke invitation
   POST   /api/admin/invitations/[id]/resend  # Resend email
   ```

2. **Invitation acceptance endpoints**
   ```
   GET    /api/invitations/validate/[token]  # Validate token
   POST   /api/invitations/accept/[token]    # Accept invitation
   ```

3. **Enhanced Clerk webhook**
   - Update `user.created` handler to check for invitation
   - Reject signup if no invitation exists
   - Link user to organization from invitation
   - Set role from invitation
   - Mark invitation as accepted

4. **Email service setup**
   - Choose provider (Resend, SendGrid, etc.)
   - Create email templates
   - Implement invitation email sender
   - Add email logging/tracking

5. **Invitation utilities**
   - Token generation (crypto.randomBytes)
   - Expiration checking
   - Permission validation

**Deliverables**:
- ✅ Full invitation CRUD API
- ✅ Working email sending
- ✅ Gated signup via webhooks
- ✅ Unit tests for invitation logic

---

### Phase 3: Admin Dashboard App (Week 3-5)
**Goal**: Build the admin dashboard Next.js app

#### Tasks:
1. **Create admin-dashboard app**
   ```bash
   cd src/apps/
   npx create-next-app@latest admin-dashboard
   ```
   - Use Next.js 15, TypeScript, Tailwind, App Router
   - Install dependencies: `@invoice-app/database`, `@invoice-app/auth`, `@invoice-app/ui`

2. **Admin authentication**
   - Clerk setup for admin app
   - Middleware to require ADMIN role
   - Redirect non-admins to client portal

3. **Dashboard pages**
   - `/admin` - Overview dashboard
   - `/admin/organizations` - List organizations
   - `/admin/organizations/[id]` - Organization detail
   - `/admin/users` - Global user management
   - `/admin/invitations` - Invitation management
   - `/admin/settings` - System settings

4. **UI components**
   - Sidebar navigation
   - Data tables with sorting/filtering
   - Modal dialogs
   - Form components
   - Stats cards
   - Activity feed

5. **State management**
   - React Query for data fetching
   - Optimistic updates
   - Real-time updates (optional: Pusher/Ably)

**Deliverables**:
- ✅ Functional admin dashboard
- ✅ Organization CRUD
- ✅ User management
- ✅ Invitation management UI

---

### Phase 4: Client Portal Updates (Week 5-6)
**Goal**: Update client portal to work with organizations

#### Tasks:
1. **Organization context**
   - Add organization provider
   - Filter all data by `organizationId`
   - Update all API routes

2. **Onboarding flow**
   - `/accept/[token]` - Invitation acceptance page
   - `/welcome` - First-time setup wizard
   - Redirect logic based on invitation status

3. **Multi-tenant isolation**
   - Update all Prisma queries to include `organizationId`
   - Add organization switcher (for super admins)
   - Test data isolation thoroughly

4. **Enhanced RBAC**
   - Update permission helpers
   - Add organization-level permissions
   - UI conditional rendering based on role

**Deliverables**:
- ✅ Client portal works with organizations
- ✅ Invitation acceptance flow
- ✅ Proper tenant isolation

---

### Phase 5: Security & Testing (Week 6-7)
**Goal**: Ensure system is secure and well-tested

#### Tasks:
1. **Security audit**
   - Review all API endpoints for auth checks
   - Test tenant isolation (can user A access user B's data?)
   - SQL injection prevention
   - XSS prevention
   - CSRF tokens

2. **Testing**
   - Unit tests for invitation logic
   - Integration tests for signup flow
   - E2E tests with Playwright
   - Load testing (optional)

3. **Documentation**
   - API documentation
   - Deployment guide
   - Admin user guide
   - Developer setup guide

**Deliverables**:
- ✅ Comprehensive test coverage
- ✅ Security audit report
- ✅ Documentation

---

### Phase 6: Deployment (Week 7-8)
**Goal**: Deploy both apps to production

#### Tasks:
1. **Infrastructure setup**
   - Vercel project for admin-dashboard
   - Vercel project for client-portal
   - Shared database (already on Neon)
   - Shared Clerk app (or separate for better isolation)

2. **Environment variables**
   - Configure all env vars in Vercel
   - Set up preview deployments
   - Configure domains

3. **CI/CD**
   - GitHub Actions for tests
   - Automatic preview deployments
   - Production deployment workflow

4. **Monitoring**
   - Sentry for error tracking
   - Vercel Analytics
   - Database monitoring

**Deliverables**:
- ✅ Both apps deployed to production
- ✅ CI/CD pipeline working
- ✅ Monitoring in place

---

## User Stories for GitHub

### Epic 1: Monorepo Setup
**As a developer**, I want a well-organized monorepo structure so that we can share code between apps and maintain consistency.

**Stories**:
1. **Setup monorepo structure**
   - **Title**: Create monorepo with Turborepo
   - **Description**: Set up `src/apps/` and `src/packages/` structure with Turborepo for build orchestration
   - **Acceptance Criteria**:
     - [ ] Turborepo configured with pipeline
     - [ ] `pnpm workspace` or npm workspaces set up
     - [ ] `turbo.json` configured for builds
     - [ ] Root `package.json` has workspace scripts
   - **Estimate**: 3 story points

2. **Extract database package**
   - **Title**: Create shared @invoice-app/database package
   - **Description**: Extract Prisma schema and client into shared package
   - **Acceptance Criteria**:
     - [ ] Package created at `src/packages/database`
     - [ ] Prisma schema and client exported
     - [ ] Migrations work from package
     - [ ] Both apps can import from package
   - **Estimate**: 5 story points

3. **Extract auth package**
   - **Title**: Create shared @invoice-app/auth package
   - **Description**: Extract authentication utilities into shared package
   - **Acceptance Criteria**:
     - [ ] Package created at `src/packages/auth`
     - [ ] Clerk helpers, permission checks exported
     - [ ] Type definitions included
     - [ ] Both apps use shared auth
   - **Estimate**: 3 story points

---

### Epic 2: Database Schema for Multi-Tenancy

**As a system architect**, I want an enhanced database schema that supports organizations and invitations.

**Stories**:
4. **Add Organization model**
   - **Title**: Create Organization database model
   - **Description**: Add Organization model with billing, status, and settings
   - **Acceptance Criteria**:
     - [ ] `Organization` model in schema
     - [ ] Migration created and tested
     - [ ] Seed data includes sample organizations
     - [ ] Relations to User, Invoice, Customer work
   - **Estimate**: 5 story points

5. **Add Invitation model**
   - **Title**: Create Invitation database model
   - **Description**: Add Invitation model for tracking pending/accepted invites
   - **Acceptance Criteria**:
     - [ ] `Invitation` model in schema
     - [ ] Includes token, status, expiration
     - [ ] Relations to Organization and User
     - [ ] Indexes on token and status
   - **Estimate**: 5 story points

6. **Update User model for multi-tenancy**
   - **Title**: Add organizationId to User model
   - **Description**: Link users to organizations
   - **Acceptance Criteria**:
     - [ ] `organizationId` field added
     - [ ] `invitationId` field added
     - [ ] `isActive` field for suspension
     - [ ] Migration preserves existing data
   - **Estimate**: 3 story points

---

### Epic 3: Invitation System Backend

**As an admin**, I want to invite users to my organization so that I can control who has access.

**Stories**:
7. **Create invitation API**
   - **Title**: Build invitation CRUD endpoints
   - **Description**: Create API routes for managing invitations
   - **Acceptance Criteria**:
     - [ ] POST /api/admin/invitations creates invitation
     - [ ] GET /api/admin/invitations lists all invitations
     - [ ] DELETE /api/admin/invitations/[id] revokes invitation
     - [ ] Proper RBAC (admin only)
   - **Estimate**: 8 story points

8. **Implement invitation email**
   - **Title**: Send invitation emails
   - **Description**: Set up email service and send invitation emails
   - **Acceptance Criteria**:
     - [ ] Email service configured (Resend/SendGrid)
     - [ ] Email template created
     - [ ] Invitation link includes token
     - [ ] Emails sent on invitation creation
   - **Estimate**: 5 story points

9. **Update Clerk webhook for gated access**
   - **Title**: Enforce invitation-based signup
   - **Description**: Modify user.created webhook to require valid invitation
   - **Acceptance Criteria**:
     - [ ] Webhook checks for invitation by email
     - [ ] Rejects signup if no invitation
     - [ ] Creates user with org and role from invitation
     - [ ] Marks invitation as accepted
   - **Estimate**: 8 story points

10. **Build invitation acceptance flow**
    - **Title**: Create invitation acceptance endpoints
    - **Description**: Allow users to validate and accept invitations
    - **Acceptance Criteria**:
      - [ ] GET /api/invitations/validate/[token] validates token
      - [ ] POST /api/invitations/accept/[token] accepts invitation
      - [ ] Handles expired invitations
      - [ ] Handles already-accepted invitations
    - **Estimate**: 5 story points

---

### Epic 4: Admin Dashboard App

**As a super admin**, I want a dedicated admin dashboard to manage organizations and users.

**Stories**:
11. **Create admin-dashboard Next.js app**
    - **Title**: Scaffold admin dashboard app
    - **Description**: Create new Next.js app in monorepo
    - **Acceptance Criteria**:
      - [ ] App created at `src/apps/admin-dashboard`
      - [ ] Tailwind CSS configured
      - [ ] Shared packages imported
      - [ ] Dev server runs
    - **Estimate**: 3 story points

12. **Build admin authentication**
    - **Title**: Secure admin dashboard
    - **Description**: Require ADMIN role to access dashboard
    - **Acceptance Criteria**:
      - [ ] Clerk configured for admin app
      - [ ] Middleware requires ADMIN role
      - [ ] Non-admins redirected to client portal
      - [ ] Logout works correctly
    - **Estimate**: 5 story points

13. **Build dashboard overview page**
    - **Title**: Create /admin dashboard page
    - **Description**: Show system-wide stats and activity
    - **Acceptance Criteria**:
      - [ ] Stats: org count, user count, pending invites
      - [ ] Recent activity feed
      - [ ] Quick action buttons
      - [ ] Responsive design
    - **Estimate**: 8 story points

14. **Build organizations management**
    - **Title**: Create organization CRUD pages
    - **Description**: List, create, edit, suspend organizations
    - **Acceptance Criteria**:
      - [ ] /admin/organizations lists all orgs
      - [ ] /admin/organizations/[id] shows detail
      - [ ] Can create new organization
      - [ ] Can edit organization settings
      - [ ] Can suspend/activate organizations
    - **Estimate**: 13 story points

15. **Build user management**
    - **Title**: Create user management pages
    - **Description**: View and manage all users
    - **Acceptance Criteria**:
      - [ ] /admin/users lists all users
      - [ ] Can filter by organization
      - [ ] Can change user role
      - [ ] Can deactivate users
      - [ ] Shows last login time
    - **Estimate**: 8 story points

16. **Build invitation management UI**
    - **Title**: Create invitation management pages
    - **Description**: Send, view, and manage invitations
    - **Acceptance Criteria**:
      - [ ] /admin/invitations shows all invitations
      - [ ] Filter by status (pending/accepted/expired)
      - [ ] Modal to send new invitation
      - [ ] Can resend invitation
      - [ ] Can revoke invitation
      - [ ] Copy invitation link to clipboard
    - **Estimate**: 13 story points

---

### Epic 5: Client Portal Updates

**As a client**, I want to accept an invitation and access only my organization's data.

**Stories**:
17. **Build invitation acceptance page**
    - **Title**: Create /accept/[token] page
    - **Description**: Allow users to accept invitations
    - **Acceptance Criteria**:
      - [ ] Page validates token on load
      - [ ] Shows organization name and role
      - [ ] "Sign Up to Accept" button
      - [ ] Handles expired invitations gracefully
      - [ ] Shows error if invitation already accepted
    - **Estimate**: 8 story points

18. **Add organization filtering**
    - **Title**: Filter all data by organizationId
    - **Description**: Update all API routes to include organizationId
    - **Acceptance Criteria**:
      - [ ] All invoice queries include organizationId
      - [ ] All customer queries include organizationId
      - [ ] All expense queries include organizationId
      - [ ] Tests verify data isolation
    - **Estimate**: 13 story points

19. **Create welcome wizard**
    - **Title**: Build first-time user onboarding
    - **Description**: Guide new users through setup
    - **Acceptance Criteria**:
      - [ ] /welcome page for new users
      - [ ] Step 1: Complete profile
      - [ ] Step 2: Set up company (if owner)
      - [ ] Step 3: Tour of features
      - [ ] Redirect to dashboard on completion
    - **Estimate**: 8 story points

20. **Update RBAC for organizations**
    - **Title**: Enhance permission system
    - **Description**: Add organization-level permission checks
    - **Acceptance Criteria**:
      - [ ] Permission helpers check organizationId
      - [ ] UI hides features based on role
      - [ ] API enforces organization boundaries
      - [ ] Super admins can switch organizations
    - **Estimate**: 8 story points

---

### Epic 6: Security & Testing

**As a security engineer**, I want the system to be secure and well-tested.

**Stories**:
21. **Conduct security audit**
    - **Title**: Audit system for security vulnerabilities
    - **Description**: Review all endpoints and data access
    - **Acceptance Criteria**:
      - [ ] All API routes have auth checks
      - [ ] Tenant isolation verified
      - [ ] CSRF protection in place
      - [ ] XSS prevention verified
      - [ ] SQL injection prevention verified
    - **Estimate**: 8 story points

22. **Write unit tests**
    - **Title**: Add unit tests for core logic
    - **Description**: Test invitation, auth, and permission logic
    - **Acceptance Criteria**:
      - [ ] Invitation creation/validation tests
      - [ ] Permission helper tests
      - [ ] Webhook handler tests
      - [ ] 80%+ code coverage
    - **Estimate**: 13 story points

23. **Write E2E tests**
    - **Title**: Add end-to-end tests with Playwright
    - **Description**: Test full user journeys
    - **Acceptance Criteria**:
      - [ ] Test: Admin invites user
      - [ ] Test: User accepts invitation
      - [ ] Test: User logs in and sees correct data
      - [ ] Test: Data isolation between orgs
    - **Estimate**: 13 story points

---

### Epic 7: Deployment

**As a DevOps engineer**, I want both apps deployed to production.

**Stories**:
24. **Set up Vercel projects**
    - **Title**: Create Vercel projects for both apps
    - **Description**: Configure deployment for admin and client apps
    - **Acceptance Criteria**:
      - [ ] Admin dashboard deployed to Vercel
      - [ ] Client portal deployed to Vercel
      - [ ] Environment variables configured
      - [ ] Custom domains set up
    - **Estimate**: 5 story points

25. **Set up CI/CD pipeline**
    - **Title**: Configure GitHub Actions
    - **Description**: Automate testing and deployment
    - **Acceptance Criteria**:
      - [ ] Tests run on pull requests
      - [ ] Preview deployments on PR
      - [ ] Production deployment on merge to main
      - [ ] Build caching for faster deploys
    - **Estimate**: 5 story points

26. **Set up monitoring**
    - **Title**: Configure error tracking and monitoring
    - **Description**: Add Sentry and analytics
    - **Acceptance Criteria**:
      - [ ] Sentry configured for both apps
      - [ ] Vercel Analytics enabled
      - [ ] Database monitoring set up
      - [ ] Alert thresholds configured
    - **Estimate**: 3 story points

---

## UI/UX Considerations

### Design System
- **Color Palette**:
  - Primary: Blue (#3b82f6)
  - Success: Green (#10b981)
  - Warning: Yellow (#f59e0b)
  - Danger: Red (#ef4444)
  - Neutral: Gray scale

- **Typography**:
  - Headings: Inter font
  - Body: Inter font
  - Monospace: JetBrains Mono

- **Components**:
  - Use shadcn/ui for consistency
  - Tailwind CSS for styling
  - Radix UI primitives

### User Flows

#### Admin Flow: Inviting a User
1. Admin logs into admin dashboard
2. Navigates to organization detail page
3. Clicks "Invite User" button
4. Fills out invitation form (email, role, optional customers)
5. Clicks "Send Invitation"
6. Sees success toast notification
7. Email is sent to invitee
8. Invitation appears in pending list

#### User Flow: Accepting Invitation
1. User receives email
2. Clicks invitation link
3. Lands on `/accept/[token]` page
4. Sees invitation details (organization, role)
5. Clicks "Sign Up to Accept"
6. Redirected to Clerk sign-up
7. Must use the same email as invitation
8. Completes sign-up
9. Webhook processes signup
10. User is created with org and role
11. Redirected to welcome wizard
12. Completes onboarding
13. Lands on appropriate dashboard

#### User Flow: Attempting Unauthorized Signup
1. User goes directly to sign-up page
2. Completes Clerk sign-up
3. Webhook checks for invitation
4. No invitation found
5. User creation rejected
6. Error message shown: "Please use an invitation link"
7. User account not created in database
8. Clerk account exists but can't access app

### Responsive Design
- **Mobile**: Stack cards vertically, collapsible sidebar
- **Tablet**: 2-column layouts, persistent sidebar
- **Desktop**: 3-column layouts, full sidebar

### Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader support
- Color contrast compliance (WCAG AA)

---

## Potential Problems & Solutions

### Problem 1: User signs up without invitation
**Impact**: Unauthorized access
**Solution**:
- Webhook rejects user creation if no invitation
- Show clear error message
- Optionally: Allow "pending approval" status
- Admin can manually approve or reject

### Problem 2: Invitation email goes to spam
**Impact**: Users can't accept invitations
**Solution**:
- Use reputable email service (Resend)
- Set up SPF, DKIM, DMARC records
- Include "Add to contacts" prompt
- Admin can resend or copy invite link to send manually

### Problem 3: User clicks expired invitation link
**Impact**: Poor user experience
**Solution**:
- Show friendly error message
- Provide "Request New Invitation" button
- Admin notified to resend
- Option to extend expiration

### Problem 4: User has invitations from multiple organizations
**Impact**: Confusion about which org to join
**Solution**:
- Each invitation has unique token
- Show organization name prominently
- Allow user to accept multiple invitations
- Organization switcher in UI

### Problem 5: Data migration for existing users
**Impact**: Existing users lose access
**Solution**:
- Write migration script
- Create default organization
- Move all existing users to default org
- Send invitations for new orgs
- Communicate changes to users

### Problem 6: Clerk rate limiting on webhooks
**Impact**: User signups fail
**Solution**:
- Implement webhook retry logic
- Use Clerk's webhook verification
- Add queue system (BullMQ/Redis)
- Monitor webhook failures
- Fallback: Manual sync endpoint

### Problem 7: Monorepo deployment complexity
**Impact**: Slower deployments, build errors
**Solution**:
- Use Turborepo for build caching
- Deploy apps independently
- Shared packages built first
- Vercel monorepo support
- Clear deployment documentation

### Problem 8: Database connection pooling
**Impact**: Too many connections from two apps
**Solution**:
- Use Prisma's connection pooling
- Configure appropriate pool size
- Use Neon's serverless driver
- Monitor connection usage
- Scale database plan if needed

### Problem 9: Inconsistent UI between apps
**Impact**: Poor user experience
**Solution**:
- Shared UI component library
- Shared Tailwind config
- Design system documentation
- Storybook for components
- Regular design reviews

### Problem 10: Testing multi-tenant isolation
**Impact**: Data leaks between organizations
**Solution**:
- Comprehensive E2E tests
- Test user A can't see user B's data
- SQL query logging in tests
- Manual penetration testing
- Regular security audits

---

## Success Metrics

### Security Metrics
- ✅ Zero unauthorized signups in production
- ✅ 100% of API endpoints have auth checks
- ✅ Zero data leaks between organizations
- ✅ All invitations properly validated

### Performance Metrics
- ✅ Admin dashboard loads in < 2 seconds
- ✅ Invitation emails sent in < 5 seconds
- ✅ Database queries < 100ms average
- ✅ 99.9% uptime

### User Experience Metrics
- ✅ Invitation acceptance rate > 90%
- ✅ User onboarding completion rate > 80%
- ✅ Average time to accept invitation < 24 hours
- ✅ User satisfaction score > 4.5/5

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Create GitHub project** named "IngenApp"
3. **Create GitHub issues** from user stories above
4. **Prioritize tasks** in project board
5. **Assign story points** and estimates
6. **Start with Phase 1** (Foundation)
7. **Weekly standups** to track progress
8. **Demo at end of each phase**

---

## Questions for Clarification

Before starting implementation, please confirm:

1. **Billing**: Will there be actual billing/subscriptions, or is the plan enum just for future use?
2. **Email Service**: Preference for Resend, SendGrid, or another service?
3. **Domains**: Do you have domains ready for admin.yourdomain.com and app.yourdomain.com?
4. **Existing Users**: How should we handle existing users in the database?
5. **Monorepo Tool**: Preference for pnpm workspaces, npm workspaces, or Yarn workspaces?
6. **Testing**: Required code coverage percentage?
7. **Timeline**: Is the 7-8 week timeline acceptable, or do we need to prioritize differently?

---

**Document Version**: 1.0
**Last Updated**: 2025-11-11
**Status**: Ready for Review
