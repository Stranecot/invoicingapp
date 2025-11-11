# Implementation Prompts for Invoice App Refactoring

This document contains ready-to-use prompts for implementing each GitHub issue. Copy and paste these prompts to trigger implementation.

---

## Epic 1: Monorepo Setup

### Issue #1: Create monorepo with Turborepo
```
Please implement Issue #1: Create monorepo with Turborepo.

Set up the monorepo structure with:
- Install and configure Turborepo
- Create turbo.json with build pipeline
- Set up pnpm workspace (or npm workspaces)
- Create src/apps/ and src/packages/ directory structure
- Configure root package.json with workspace scripts
- Ensure turbo build and turbo dev work correctly

Follow the acceptance criteria and implementation steps in Issue #1.
```

### Issue #2: Create shared @invoice-app/database package
```
Please implement Issue #2: Create shared @invoice-app/database package.

Extract the Prisma schema and client into a shared package:
- Create src/packages/database/ directory
- Set up package.json with name @invoice-app/database
- Move prisma/ folder from the current app to this package
- Create src/index.ts that exports the Prisma client
- Add build scripts for Prisma generation
- Update imports in the existing app to use this package
- Test that migrations work from the package

Follow the acceptance criteria and implementation steps in Issue #2.
```

### Issue #3: Create shared @invoice-app/auth package
```
Please implement Issue #3: Create shared @invoice-app/auth package.

Extract authentication utilities into a shared package:
- Create src/packages/auth/ directory
- Set up package.json with name @invoice-app/auth
- Move lib/auth.ts utilities to this package
- Export all auth functions: getCurrentUser, requireAdmin, requireAccountantOrAdmin, canAccessCustomer, etc.
- Export TypeScript types for User, Role
- Update imports in the existing app
- Test that authentication still works

Follow the acceptance criteria and implementation steps in Issue #3.
```

---

## Epic 2: Database Schema for Multi-Tenancy

### Issue #4: Add Organization model for multi-tenancy
```
Please implement Issue #4: Add Organization model for multi-tenancy.

Add the Organization model to support multi-tenant architecture:
- Add Organization model to schema.prisma with all required fields
- Create enums: OrgStatus (ACTIVE, SUSPENDED, TRIAL, CANCELLED) and BillingPlan (FREE, PRO, ENTERPRISE)
- Create OrganizationSettings model
- Add relations to User, Customer, Invoice, Expense models
- Add indexes on slug and status
- Create migration: prisma migrate dev --name add-organization-model
- Update seed files with sample organization
- Test the migration

Follow the acceptance criteria and implementation steps in Issue #4.
```

### Issue #5: Add Invitation model for gated access
```
Please implement Issue #5: Add Invitation model for gated access.

Add the Invitation model to track user invitations:
- Add Invitation model to schema.prisma with all required fields
- Create InvitationStatus enum: PENDING, ACCEPTED, EXPIRED, REVOKED
- Add unique constraints on [email, organizationId] and token
- Add indexes on token, [status, expiresAt], [organizationId, status]
- Add relation to Organization model
- Create migration: prisma migrate dev --name add-invitation-model
- Update seed files with sample invitation
- Create helper function to generate secure tokens using crypto.randomBytes
- Test the migration

Follow the acceptance criteria and implementation steps in Issue #5.
```

### Issue #6: Update User model for multi-tenancy
```
Please implement Issue #6: Update User model for multi-tenancy.

Update the User model to support organizations:
- Add organizationId field (nullable) with relation to Organization
- Add invitationId field (nullable, unique)
- Add isActive boolean field (default true)
- Add lastLoginAt timestamp field
- Add indexes on [organizationId, role] and isActive
- Create migration: prisma migrate dev --name update-user-for-multi-tenancy
- Write data migration script for existing users (create default org, assign all users to it)
- Test that existing users still work after migration

Follow the acceptance criteria and implementation steps in Issue #6.
```

---

## Epic 3: Invitation System Backend

### Issue #7: Build invitation CRUD API endpoints
```
Please implement Issue #7: Build invitation CRUD API endpoints.

Create all CRUD endpoints for managing invitations:
- Create POST /api/admin/invitations (create invitation with secure token)
- Create GET /api/admin/invitations (list with filters)
- Create GET /api/admin/invitations/[id] (get single invitation)
- Create DELETE /api/admin/invitations/[id] (revoke invitation)
- Create POST /api/admin/invitations/[id]/resend (resend invitation email)
- Add requireAdmin() checks to all endpoints
- Use Zod for input validation
- Generate secure tokens with crypto.randomBytes(32).toString('hex')
- Set default expiration to 7 days
- Add proper error handling

Follow the acceptance criteria and implementation steps in Issue #7.
```

### Issue #8: Set up email service and send invitation emails
```
Please implement Issue #8: Set up email service and send invitation emails.

Set up email service and create invitation email templates:
- Choose and install email provider (Resend recommended)
- Add environment variables: RESEND_API_KEY, EMAIL_FROM, APP_URL
- Create lib/email.ts with sendInvitationEmail function
- Create HTML email template for invitations (responsive, professional)
- Include organization name, role, invitation link, expiration date
- Integrate with POST /api/admin/invitations to send email on creation
- Integrate with resend endpoint
- Add email sending logging
- Test email sending in development

Follow the acceptance criteria and implementation steps in Issue #8.
```

### Issue #9: Update Clerk webhook to enforce invitation-based signup
```
Please implement Issue #9: Update Clerk webhook to enforce invitation-based signup.

THIS IS CRITICAL SECURITY. Update the webhook to require valid invitations:
- Update app/api/webhooks/clerk/route.ts
- In user.created handler, check for valid invitation by email
- Invitation must be PENDING status and not expired
- If no valid invitation exists, REJECT signup (return 403, do NOT create user)
- If valid invitation, create user with organizationId and role from invitation
- Mark invitation as ACCEPTED with acceptedAt and acceptedBy
- Create Company if role is USER
- Create AccountantAssignments if role is ACCOUNTANT with customerIds
- Add comprehensive logging
- Test all edge cases: valid invitation, no invitation, expired invitation, already accepted

Follow the acceptance criteria and implementation steps in Issue #9.
```

### Issue #10: Create invitation acceptance endpoints
```
Please implement Issue #10: Create invitation acceptance endpoints.

Create public endpoints for validating invitations:
- Create GET /api/invitations/validate/[token] endpoint
- Validate token exists and is valid
- Check invitation status is PENDING
- Check invitation is not expired
- Return invitation details: email, role, organizationName, organizationLogo, expiresAt
- Handle edge cases: invalid token (404), expired (400), already accepted (400), revoked (400)
- Do NOT expose sensitive data in responses
- No authentication required (public endpoint)
- Add proper error messages for each case

Follow the acceptance criteria and implementation steps in Issue #10.
```

---

## Epic 4: Admin Dashboard App

### Issue #11: Scaffold admin dashboard Next.js app
```
Please implement Issue #11: Scaffold admin dashboard Next.js app.

Create a new Next.js app for the admin dashboard:
- Create directory src/apps/admin-dashboard/
- Initialize Next.js 15 with TypeScript, Tailwind, App Router
- Configure package.json with name @invoice-app/admin-dashboard
- Set dev server to port 3001
- Add dependencies: @invoice-app/database, @invoice-app/auth, @invoice-app/ui
- Configure Tailwind to use shared config
- Create basic layout with sidebar navigation
- Create homepage at app/page.tsx
- Create .env.local with required environment variables
- Test that pnpm dev works

Follow the acceptance criteria and implementation steps in Issue #11.
```

### Issue #12: Implement admin authentication and RBAC
```
Please implement Issue #12: Implement admin authentication and RBAC.

Secure the admin dashboard to require ADMIN role:
- Install @clerk/nextjs
- Add Clerk environment variables to .env.local
- Create middleware.ts that requires authentication
- Check user role from database using getCurrentUser()
- Redirect non-ADMIN users to client portal URL
- Create sign-in page at app/sign-in/[[...sign-in]]/page.tsx
- Add ClerkProvider to layout
- Create UserButton component for header
- Test: admins can access, non-admins are redirected

Follow the acceptance criteria and implementation steps in Issue #12.
```

### Issue #13: Build overview dashboard page
```
Please implement Issue #13: Build overview dashboard page.

Create the main dashboard overview page:
- Create app/page.tsx (or app/admin/page.tsx)
- Fetch stats: total organizations, total users, pending invitations
- Create StatsCard component to display metrics with icons
- Add charts: user growth (line chart), organizations by plan (pie chart), invitations by status (bar chart)
- Create ActivityFeed component showing last 10 events
- Add quick action buttons: "Create Organization", "Send Invitation"
- Make responsive (mobile, tablet, desktop)
- Add loading states with skeletons
- Add error handling
- Style with Tailwind using shadcn/ui components

Follow the acceptance criteria and implementation steps in Issue #13.
```

### Issue #14: Build organization management pages
```
Please implement Issue #14: Build organization management pages.

Create full CRUD pages for organization management:
- Create app/organizations/page.tsx to list all organizations
- Create app/organizations/[id]/page.tsx for organization detail with tabs: Overview, Users, Invitations, Settings
- Create CreateOrgModal component with form
- Add search bar to filter organizations by name
- Add status filter dropdown (ACTIVE, SUSPENDED, TRIAL, CANCELLED)
- Add pagination if more than 50 orgs
- Show user count, plan, status for each org
- Create API routes: POST /api/admin/organizations, PUT /api/admin/organizations/[id], DELETE /api/admin/organizations/[id]
- Add suspend/activate functionality
- Style with Tailwind

Follow the acceptance criteria and implementation steps in Issue #14.
```

### Issue #15: Build user management pages
```
Please implement Issue #15: Build user management pages.

Create user management pages:
- Create app/users/page.tsx to list all users
- Show: name, email, role, organization, status (active/inactive), last login
- Add filters: by organization, by role, by status
- Add search by name or email
- Create ChangeRoleModal component to change user role
- Add deactivate/activate user functionality
- Create API routes: PUT /api/admin/users/[id]/role, PUT /api/admin/users/[id]/status
- Add pagination if more than 100 users
- Add sorting: by name, email, created date, last login
- Create RoleBadge and StatusBadge components
- Style with Tailwind

Follow the acceptance criteria and implementation steps in Issue #15.
```

### Issue #16: Build invitation management UI
```
Please implement Issue #16: Build invitation management UI.

Create invitation management pages:
- Create app/invitations/page.tsx to list all invitations
- Add tabs: Pending, Accepted, Expired, Revoked
- Create SendInviteModal component with form including:
  - Organization selector
  - Email input
  - Role selector (radio buttons)
  - Customer assignment (multi-select, shown only if ACCOUNTANT selected)
  - Optional personal message textarea
  - Expiration selector (7, 14, 30 days)
- Show for each invitation: email, role, organization, invited by, sent date, expires date, status
- Add actions dropdown: Resend email, Revoke invitation, Copy link to clipboard
- Add search by email
- Add filter by organization
- Create InvitationTable, InvitationStatusBadge, InvitationActions components
- Add toast notifications for success/error
- Style with Tailwind

Follow the acceptance criteria and implementation steps in Issue #16.
```

---

## Epic 5: Client Portal Updates

### Issue #17: Create invitation acceptance page
```
Please implement Issue #17: Create invitation acceptance page.

Create the invitation acceptance page for users:
- Create app/accept/[token]/page.tsx
- Validate token on page load by calling GET /api/invitations/validate/[token]
- Show organization logo and name prominently
- Show the role the user will have
- Show expiration date
- Add "Sign Up to Accept" button that redirects to Clerk sign-up
- Pre-fill email in sign-up form
- Store token in cookie/session for webhook to read
- Handle edge cases with friendly error messages:
  - Invalid token: Show "This invitation link is invalid"
  - Expired: Show "This invitation has expired" with contact info
  - Already accepted: Show "This invitation has already been used"
- Add loading state while validating
- Make responsive and visually appealing
- Use welcoming, professional tone

Follow the acceptance criteria and implementation steps in Issue #17.
```

### Issue #18: Add organization filtering to all data queries
```
Please implement Issue #18: Add organization filtering to all data queries.

THIS IS CRITICAL SECURITY. Add organizationId filtering to all queries:
- Update lib/auth.ts getUserAccessFilter() to include organizationId check
- Update ALL API routes to filter by organizationId:
  - app/api/invoices/route.ts and all invoice endpoints
  - app/api/customers/route.ts and all customer endpoints
  - app/api/expenses/route.ts and all expense endpoints
  - app/api/budgets/route.ts and all budget endpoints
  - app/api/notes/route.ts and all note endpoints
- Add organizationId to all create operations
- Update Customer, Invoice, Expense models to include organizationId if missing
- Add composite indexes on (organizationId, userId) where applicable
- Write comprehensive tests to verify isolation
- Test that user A cannot see user B's data (different orgs)
- Test that accountants can only see assigned customers in their org
- Test that admins can see all data

Follow the acceptance criteria and implementation steps in Issue #18.
```

### Issue #19: Create welcome wizard for new users
```
Please implement Issue #19: Create welcome wizard for new users.

Create onboarding wizard for new users:
- Add onboardingCompleted (boolean) and onboardingStep (int) fields to User model
- Create migration
- Create app/welcome/page.tsx
- Redirect to dashboard if user.onboardingCompleted is true
- Create WelcomeWizard component with multi-step flow:
  - Step 1: Profile completion (name, avatar upload)
  - Step 2: Company setup (if USER role) - name, address, phone, logo, tax rate
  - Step 3: Quick tour of features with links to key pages
- Show progress indicator (Step X of 3)
- Allow skipping steps
- Save progress on each step
- Create API route: PUT /api/user/onboarding
- Final step redirects to dashboard
- Mark user as onboarded
- Add middleware redirect: if !onboardingCompleted -> /welcome
- Make delightful with animations
- Style with Tailwind

Follow the acceptance criteria and implementation steps in Issue #19.
```

### Issue #20: Enhance RBAC for organization-level permissions
```
Please implement Issue #20: Enhance RBAC for organization-level permissions.

Enhance permission system for organization-level checks:
- Create lib/contexts/OrganizationContext.tsx with provider and useOrganization hook
- Update lib/hooks/useAuth.ts to include organization checks:
  - useCanEdit() should check organizationId matches
  - useCanDelete() should check organizationId matches
  - useCanView() should check organizationId matches
- Update permission helpers in @invoice-app/auth package
- Add organization switcher component for super admins (optional)
- Update all UI components to use new permission checks
- Wrap app in OrganizationProvider
- Write tests for permission checks
- Test permission matrix: USER/ADMIN/ACCOUNTANT in own org vs other org

Follow the acceptance criteria and implementation steps in Issue #20.
```

---

## Epic 6: Security & Testing

### Issue #21: Conduct comprehensive security audit
```
Please implement Issue #21: Conduct comprehensive security audit.

Perform comprehensive security audit:
- Review ALL API endpoints for authentication checks
- Review ALL API endpoints for authorization checks (role + org)
- Test tenant isolation: verify user A cannot access user B's data
- Verify SQL injection prevention (Prisma parameterized queries)
- Verify XSS prevention (React auto-escaping + CSP headers)
- Add CSRF protection (Next.js + SameSite cookies)
- Implement rate limiting on sensitive endpoints (using Upstash Ratelimit)
- Configure security headers in next.config.ts:
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin
  - Content-Security-Policy
- Verify no secrets in git history
- Check invitation tokens are cryptographically secure
- Test with OWASP ZAP or Burp Suite
- Create security audit report with findings and remediation
- Fix all critical and high severity issues

Follow the acceptance criteria and implementation steps in Issue #21.
```

### Issue #22: Write comprehensive unit tests
```
Please implement Issue #22: Write comprehensive unit tests.

Write unit tests for core business logic:
- Install Vitest and testing libraries
- Create vitest.config.ts
- Write tests for invitation logic:
  - tests/lib/invitation.test.ts (creation, validation, expiration)
- Write tests for auth utilities:
  - tests/lib/auth.test.ts (getCurrentUser, requireAdmin, permission checks)
- Write tests for permission helpers:
  - tests/lib/permissions.test.ts (canAccessCustomer, getUserAccessFilter)
- Write tests for API routes:
  - tests/api/invitations.test.ts
  - tests/api/organizations.test.ts
- Write tests for webhook handler:
  - tests/webhooks/clerk.test.ts
- Mock external services (Clerk, email, database)
- Aim for 80%+ code coverage on critical paths
- Add test scripts to package.json
- Set up code coverage reporting

Follow the acceptance criteria and implementation steps in Issue #22.
```

### Issue #23: Write end-to-end tests with Playwright
```
Please implement Issue #23: Write end-to-end tests with Playwright.

Write E2E tests for complete user journeys:
- Install Playwright and configure playwright.config.ts
- Create e2e/invitation-flow.spec.ts:
  - Test: Admin sends invitation → User accepts → User signs up → User onboards → User uses system
- Create e2e/data-isolation.spec.ts:
  - Test: User A creates invoice → User B (different org) cannot see it
  - Test: Accountant can only see assigned customers
- Create e2e/rbac.spec.ts:
  - Test: Non-admin cannot access admin dashboard
  - Test: User without invitation cannot sign up
- Create e2e/admin-dashboard.spec.ts:
  - Test: Admin can create organization, invite users, manage settings
- Configure test database (separate from dev)
- Add seed data for E2E tests
- Add test scripts to package.json
- Configure to run in CI
- Generate HTML report with screenshots/videos on failure

Follow the acceptance criteria and implementation steps in Issue #23.
```

---

## Epic 7: Deployment

### Issue #24: Set up Vercel projects for both apps
```
Please implement Issue #24: Set up Vercel projects for both apps.

Deploy both apps to Vercel:
- Install Vercel CLI
- Deploy admin-dashboard to Vercel:
  - Project name: invoiceapp-admin
  - Root directory: src/apps/admin-dashboard
  - Build command: cd ../.. && pnpm turbo build --filter=@invoice-app/admin-dashboard
- Deploy client-portal to Vercel:
  - Project name: invoiceapp-client
  - Root directory: src/apps/client-portal
  - Build command: cd ../.. && pnpm turbo build --filter=@invoice-app/client-portal
- Configure environment variables in Vercel dashboard for both projects:
  - DATABASE_URL, DIRECT_URL
  - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
  - RESEND_API_KEY, EMAIL_FROM
  - NEXT_PUBLIC_API_URL, NEXT_PUBLIC_ADMIN_URL
- Set up custom domains (optional): admin.yourdomain.com and app.yourdomain.com
- Update Clerk settings with production URLs
- Update webhook URL to production
- Test both deployments thoroughly

Follow the acceptance criteria and implementation steps in Issue #24.
```

### Issue #25: Configure CI/CD pipeline with GitHub Actions
```
Please implement Issue #25: Configure CI/CD pipeline with GitHub Actions.

Set up automated CI/CD:
- Create .github/workflows/ci.yml:
  - Run linting and type-checking
  - Run unit tests
  - Run E2E tests with Playwright
  - Build both apps
  - Use matrix strategy for parallel builds
  - Cache pnpm dependencies and Turborepo builds
- Create .github/workflows/deploy-preview.yml:
  - Deploy preview on pull requests
  - Use Vercel GitHub integration
- Create .github/workflows/deploy-production.yml:
  - Deploy to production on merge to main
- Add GitHub secrets: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, TEST_DATABASE_URL
- Configure branch protection rules:
  - Require CI to pass before merge
  - Require code reviews
- Add workspace scripts to root package.json: lint, type-check, test, test:e2e
- Test CI pipeline with a test PR

Follow the acceptance criteria and implementation steps in Issue #25.
```

### Issue #26: Set up monitoring and error tracking
```
Please implement Issue #26: Set up monitoring and error tracking.

Set up monitoring and error tracking:
- Install @sentry/nextjs in both apps
- Create sentry.client.config.ts and sentry.server.config.ts
- Configure Sentry with DSN from environment variables
- Filter out sensitive data (auth headers, cookies)
- Update next.config.ts with withSentryConfig
- Install @vercel/analytics and add to layout
- Set up database monitoring:
  - Enable Neon monitoring
  - Configure Prisma to log slow queries
- Create health check endpoint: GET /api/health
- Configure alerts:
  - Sentry: Alert on new errors
  - Vercel: Alert on failed builds
  - Database: Alert on slow queries
- Set up uptime monitoring (UptimeRobot or similar)
- Add environment variables: NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN
- Test error tracking by triggering a test error
- Verify dashboards and alerts work

Follow the acceptance criteria and implementation steps in Issue #26.
```

---

## Dependency Groups & Parallel Execution

### Phase 1: Foundation (Can run in parallel after dependencies met)

**Group 1.1 - Must run FIRST (sequential)**
```
Issue #1: Create monorepo with Turborepo
```
⏱️ Wait for #1 to complete before proceeding

**Group 1.2 - Can run in PARALLEL after #1**
```
Issue #2: Create shared @invoice-app/database package
```
⏱️ Wait for #2 to complete before proceeding

**Group 1.3 - Must run AFTER #2 (sequential)**
```
Issue #3: Create shared @invoice-app/auth package (depends on #2)
Issue #4: Add Organization model (depends on #2)
```
⏱️ Wait for #3 and #4 to complete before proceeding

**Group 1.4 - Must run AFTER #4 (sequential)**
```
Issue #5: Add Invitation model (depends on #4)
```
⏱️ Wait for #5 to complete before proceeding

**Group 1.5 - Must run AFTER #4 and #5 (sequential)**
```
Issue #6: Update User model (depends on #4, #5)
```

---

### Phase 2: Invitation Backend (Can run in parallel after dependencies met)

**Group 2.1 - Can run in PARALLEL after #3, #5, #6**
```
Issue #7: Build invitation CRUD API (depends on #3, #5)
Issue #10: Create invitation acceptance endpoints (depends on #5)
Issue #9: Update Clerk webhook (depends on #5, #6) ⚠️ CRITICAL
```
⏱️ Wait for #7 to complete before proceeding to #8

**Group 2.2 - Must run AFTER #7 (sequential)**
```
Issue #8: Set up email service (depends on #7)
```

---

### Phase 3: Admin Dashboard (Can run in parallel after dependencies met)

**Group 3.1 - Must run FIRST after #1, #2, #3**
```
Issue #11: Scaffold admin dashboard (depends on #1, #2, #3)
```
⏱️ Wait for #11 to complete before proceeding

**Group 3.2 - Must run AFTER #11**
```
Issue #12: Implement admin authentication (depends on #11, #3)
```
⏱️ Wait for #12 to complete before proceeding

**Group 3.3 - Can run in PARALLEL after #12**
```
Issue #13: Build overview dashboard (depends on #12, #4, #5)
Issue #14: Build organization management (depends on #12, #4)
Issue #15: Build user management (depends on #12, #6)
Issue #16: Build invitation management UI (depends on #7, #8, #12)
```

---

### Phase 4: Client Portal Updates (Can run in parallel after dependencies met)

**Group 4.1 - Can run in PARALLEL after their dependencies**
```
Issue #17: Create invitation acceptance page (depends on #10)
Issue #18: Add organization filtering ⚠️ CRITICAL (depends on #6, #4)
```
⏱️ Wait for #17 and #18 to complete before proceeding

**Group 4.2 - Must run AFTER #17 and #18**
```
Issue #19: Create welcome wizard (depends on #17)
Issue #20: Enhance RBAC (depends on #18)
```

---

### Phase 5: Security & Testing (Must run AFTER all features complete)

**Group 5.1 - Can run in PARALLEL after ALL previous issues**
```
Issue #21: Security audit (depends on all previous)
Issue #22: Unit tests (depends on all core functionality)
```
⏱️ Wait for #22 to complete before proceeding to #23

**Group 5.2 - Must run AFTER #22**
```
Issue #23: E2E tests (depends on all features, #22)
```

---

### Phase 6: Deployment (Must run AFTER testing complete)

**Group 6.1 - Must run FIRST after all testing**
```
Issue #24: Set up Vercel projects (depends on all features complete)
```
⏱️ Wait for #24 to complete before proceeding

**Group 6.2 - Can run in PARALLEL after #24**
```
Issue #25: Configure CI/CD (depends on #22, #23, #24)
Issue #26: Set up monitoring (depends on #24)
```

---

## Maximum Parallelization Strategy

If you have multiple developers or want to maximize parallelization:

### Round 1: Start Here (1 issue)
- Issue #1 (Monorepo setup)

### Round 2: After Round 1 (1 issue)
- Issue #2 (Database package)

### Round 3: After Round 2 (2 issues in parallel)
- Issue #3 (Auth package)
- Issue #4 (Organization model)

### Round 4: After Round 3 (1 issue)
- Issue #5 (Invitation model)

### Round 5: After Round 4 (1 issue)
- Issue #6 (User model update)

### Round 6: After Round 5 (3 issues in parallel) ⚡
- Issue #7 (Invitation CRUD API)
- Issue #9 (Webhook enforcement) ⚠️ CRITICAL
- Issue #10 (Invitation acceptance endpoints)

### Round 7: After #7 completes (1 issue)
- Issue #8 (Email service)

### Round 8: After Round 5 (1 issue)
- Issue #11 (Scaffold admin dashboard)

### Round 9: After Round 8 (1 issue)
- Issue #12 (Admin authentication)

### Round 10: After Round 9 (4 issues in parallel) ⚡⚡
- Issue #13 (Dashboard overview)
- Issue #14 (Organization management)
- Issue #15 (User management)
- Issue #16 (Invitation management UI)

### Round 11: After Round 6 (2 issues in parallel) ⚡
- Issue #17 (Invitation acceptance page)
- Issue #18 (Organization filtering) ⚠️ CRITICAL

### Round 12: After Round 11 (2 issues in parallel) ⚡
- Issue #19 (Welcome wizard)
- Issue #20 (Enhanced RBAC)

### Round 13: After ALL previous (2 issues in parallel) ⚡
- Issue #21 (Security audit)
- Issue #22 (Unit tests)

### Round 14: After Round 13 (1 issue)
- Issue #23 (E2E tests)

### Round 15: After Round 14 (1 issue)
- Issue #24 (Vercel deployment)

### Round 16: After Round 15 (2 issues in parallel) ⚡
- Issue #25 (CI/CD pipeline)
- Issue #26 (Monitoring)

---

## Optimal Team Assignment (3 developers)

**Developer 1 (Backend Focus):**
- Phase 1: Issues #1, #2, #3, #4, #5, #6
- Phase 2: Issues #7, #8, #9, #10
- Phase 4: Issue #18 (Critical security)
- Phase 5: Issues #21, #22

**Developer 2 (Admin Dashboard Focus):**
- Phase 3: Issues #11, #12, #13, #14, #15, #16
- Phase 5: Issue #22 (help with tests)
- Phase 6: Issue #24, #25

**Developer 3 (Client Portal Focus):**
- Phase 1: Help with testing
- Phase 4: Issues #17, #19, #20
- Phase 5: Issue #23
- Phase 6: Issue #26

---

## Quick Reference: Critical Path

The absolute minimum sequential path (no parallelization):

```
#1 → #2 → #3 → #4 → #5 → #6 → #9 → #18 → #21 → #22 → #23 → #24
```

These 12 issues form the critical security and infrastructure path. All other issues can be done in parallel with these or afterward.

---

## Usage Tips

1. **Copy the prompt** for the issue you want to implement
2. **Paste it** into your conversation with Claude
3. **Review the output** and test thoroughly
4. **Mark the issue as complete** in GitHub when done
5. **Move to the next issue** following the dependency graph

**Remember:** Always complete issues in dependency order. Don't skip ahead!

---

**Document Version**: 1.0
**Last Updated**: 2025-11-11
**Total Implementation Prompts**: 26
