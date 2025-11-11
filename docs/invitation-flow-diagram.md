# Invitation Acceptance Flow - Visual Diagram

## Complete End-to-End Flow

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                         INVITATION ACCEPTANCE SYSTEM                            │
│                              (Issue #10)                                        │
└────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: INVITATION CREATION (Issues #7-8)                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

    Admin Dashboard
         │
         │ POST /api/invitations
         │ { email, role, organizationId }
         ↓
    ┌─────────────────┐
    │   Database      │
    │   - Generate    │
    │     token       │
    │   - Save        │
    │     invitation  │
    │   - Status:     │
    │     PENDING     │
    └────────┬────────┘
             │
             │ Email notification
             ↓
    ┌─────────────────┐
    │  User's Inbox   │
    │                 │
    │  Subject:       │
    │  "You're        │
    │  invited!"      │
    │                 │
    │  Link:          │
    │  /accept-       │
    │  invitation?    │
    │  token=xxx      │
    └─────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: INVITATION VERIFICATION (Issue #10 - Part 1)                          │
└─────────────────────────────────────────────────────────────────────────────────┘

    User clicks email link
         │
         ↓
    ┌──────────────────────┐
    │  Browser Navigation  │
    │  /accept-invitation  │
    │  ?token=xxx          │
    └──────────┬───────────┘
               │
               │ Page loads
               ↓
    ┌──────────────────────────────────┐
    │  Accept Invitation Page          │
    │  (page.tsx)                      │
    │                                  │
    │  1. Extract token from URL       │
    │  2. Show loading spinner         │
    │  3. Call verify endpoint         │
    └──────────┬───────────────────────┘
               │
               │ GET /api/invitations/accept/verify?token=xxx
               ↓
    ┌──────────────────────────────────────────────────────┐
    │  Verify Endpoint (verify/route.ts)                   │
    │                                                       │
    │  Security Checks:                                    │
    │  ✓ Rate limit (5 req/min per IP)                    │
    │  ✓ Token format validation                           │
    │  ✓ Token exists in database                          │
    │  ✓ Status is PENDING                                 │
    │  ✓ Not expired                                       │
    │  ✓ Organization is ACTIVE                            │
    └──────────┬────────────────────────────────────────────┘
               │
               ├─── Valid? ───┐
               │              │
        ┌──────┴──────┐  ┌────┴─────────┐
        │   YES       │  │    NO        │
        └──────┬──────┘  └────┬─────────┘
               │              │
               │              │ Return { valid: false,
               │              │         reason: "expired" | "not_found" | ... }
               │              ↓
               │         ┌──────────────────┐
               │         │  Show Error      │
               │         │  - Expired       │
               │         │  - Already used  │
               │         │  - Revoked       │
               │         │  - Not found     │
               │         └──────────────────┘
               │
               │ Return { valid: true,
               │         invitation: { email, org, role, expires } }
               ↓
    ┌──────────────────────────────────┐
    │  Display Invitation Details      │
    │                                  │
    │  ┌────────────────────────────┐ │
    │  │ You're Invited!            │ │
    │  │                            │ │
    │  │ Organization: Acme Corp    │ │
    │  │ Email: user@example.com    │ │
    │  │ Role: User                 │ │
    │  │ Expires: in 6 days         │ │
    │  │                            │ │
    │  │ [Accept Invitation]        │ │
    │  │ [I Already Have Account]   │ │
    │  └────────────────────────────┘ │
    └──────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: INVITATION ACCEPTANCE (Issue #10 - Part 2)                            │
└─────────────────────────────────────────────────────────────────────────────────┘

    User clicks "Accept Invitation"
         │
         │ POST /api/invitations/accept
         │ { token: "xxx" }
         ↓
    ┌────────────────────────────────────────────────────┐
    │  Accept Endpoint (route.ts)                        │
    │                                                     │
    │  Validation:                                       │
    │  ✓ Token format valid                              │
    │  ✓ Invitation exists                               │
    │  ✓ Status is PENDING                               │
    │  ✓ Not expired                                     │
    │  ✓ Not revoked                                     │
    │                                                     │
    │  Actions:                                          │
    │  1. Store token in HTTP-only cookie                │
    │     - Name: invitation_token                       │
    │     - Expires: matches invitation expiry           │
    │     - Secure, HttpOnly, SameSite                   │
    │                                                     │
    │  2. Generate Clerk sign-up URL                     │
    │     - Pre-fill email                               │
    │     - Set redirect URL                             │
    └────────────┬───────────────────────────────────────┘
                 │
                 │ Return { success: true,
                 │         redirectUrl: "/sign-up?email=..." }
                 ↓
    ┌────────────────────────────────┐
    │  Browser Redirect              │
    │  window.location.href =        │
    │  "/sign-up?email=user@..."     │
    └────────────┬───────────────────┘
                 │
                 │ Cookie: invitation_token=xxx
                 ↓


┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 4: CLERK SIGN-UP                                                          │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌────────────────────────────────┐
    │  Clerk Sign-Up Page            │
    │                                │
    │  ┌──────────────────────────┐ │
    │  │ Create Account           │ │
    │  │                          │ │
    │  │ Email: user@example.com  │ │
    │  │       (pre-filled)       │ │
    │  │                          │ │
    │  │ Password: [........]     │ │
    │  │                          │ │
    │  │ First Name: [.......]    │ │
    │  │ Last Name: [........]    │ │
    │  │                          │ │
    │  │ [Create Account]         │ │
    │  └──────────────────────────┘ │
    └────────────┬───────────────────┘
                 │
                 │ User submits form
                 ↓
    ┌────────────────────────────────┐
    │  Clerk Backend                 │
    │  - Validates credentials       │
    │  - Creates user account        │
    │  - Generates user.created      │
    │    webhook event               │
    └────────────┬───────────────────┘
                 │
                 │ POST /api/webhooks/clerk
                 │ Event: user.created
                 │ Cookie: invitation_token=xxx
                 ↓


┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 5: WEBHOOK VALIDATION (Issue #9)                                          │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌────────────────────────────────────────────────────────┐
    │  Clerk Webhook (route.ts)                              │
    │                                                         │
    │  1. Verify webhook signature (Svix)                    │
    │  2. Extract user data (email, name, clerkId)           │
    │  3. Read invitation_token from cookie                  │
    │  4. Validate invitation in database                    │
    └────────────┬───────────────────────────────────────────┘
                 │
                 │ Transaction (atomic)
                 ↓
    ┌────────────────────────────────────────────────────────┐
    │  Database Transaction                                   │
    │                                                         │
    │  Validation Checks:                                    │
    │  ✓ Find invitation by email                            │
    │  ✓ Status is PENDING                                   │
    │  ✓ Not expired                                         │
    │  ✓ Organization is ACTIVE                              │
    │  ✓ Organization under user limit                       │
    │                                                         │
    │  If ALL pass:                                          │
    │  1. Create User record                                 │
    │     - clerkId                                          │
    │     - email                                            │
    │     - name                                             │
    │     - role (from invitation)                           │
    │     - organizationId (from invitation)                 │
    │     - invitationId                                     │
    │                                                         │
    │  2. Update Invitation                                  │
    │     - status: ACCEPTED                                 │
    │     - acceptedAt: now                                  │
    │     - acceptedBy: user.id                              │
    │                                                         │
    │  3. Clear invitation_token cookie                      │
    └────────────┬───────────────────────────────────────────┘
                 │
          ┌──────┴──────┐
          │ Success?    │
          └──────┬──────┘
                 │
         ┌───────┴───────┐
         │               │
    ┌────┴────┐    ┌─────┴──────┐
    │  YES    │    │    NO      │
    └────┬────┘    └─────┬──────┘
         │               │
         │               │ Delete Clerk user
         │               │ (security measure)
         │               ↓
         │          ┌──────────────┐
         │          │  User cannot │
         │          │  sign in     │
         │          │  (blocked)   │
         │          └──────────────┘
         │
         │ Return 200 OK
         ↓


┌─────────────────────────────────────────────────────────────────────────────────┐
│ PHASE 6: USER ONBOARDING                                                        │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌────────────────────────────────┐
    │  User Successfully Created     │
    │                                │
    │  Database State:               │
    │  - User record exists          │
    │  - Proper role assigned        │
    │  - Organization membership     │
    │  - Invitation marked ACCEPTED  │
    │                                │
    │  Clerk State:                  │
    │  - User authenticated          │
    │  - Session created             │
    └────────────┬───────────────────┘
                 │
                 │ Redirect to dashboard
                 ↓
    ┌────────────────────────────────┐
    │  Application Dashboard         │
    │                                │
    │  Welcome, [User Name]!         │
    │                                │
    │  Organization: Acme Corp       │
    │  Role: User                    │
    │                                │
    │  [View Invoices]               │
    │  [View Expenses]               │
    │  [Settings]                    │
    └────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────┐
│ ERROR HANDLING PATHS                                                            │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│ Invalid Token    │ → Shows: "This invitation is not valid"
└──────────────────┘

┌──────────────────┐
│ Expired Token    │ → Shows: "This invitation has expired"
└──────────────────┘   Action: Contact admin for new invitation

┌──────────────────┐
│ Already Used     │ → Shows: "Already used. Please sign in"
└──────────────────┘   Action: Redirect to sign-in

┌──────────────────┐
│ Revoked Token    │ → Shows: "This invitation has been revoked"
└──────────────────┘   Action: Contact admin

┌──────────────────┐
│ Rate Limited     │ → Shows: "Too many requests. Wait 1 minute"
└──────────────────┘   Status: 429 with retry headers

┌──────────────────┐
│ Org Inactive     │ → Webhook blocks signup + deletes Clerk user
└──────────────────┘   Shows: Generic "Signup not allowed"

┌──────────────────┐
│ User Limit       │ → Webhook blocks signup + deletes Clerk user
└──────────────────┘   Shows: Generic "Signup not allowed"


┌─────────────────────────────────────────────────────────────────────────────────┐
│ SECURITY LAYERS                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

Layer 1: Rate Limiting
         ↓
Layer 2: Token Format Validation
         ↓
Layer 3: Database Token Lookup
         ↓
Layer 4: Invitation Status Check
         ↓
Layer 5: Expiry Validation
         ↓
Layer 6: Organization Status Check
         ↓
Layer 7: User Limit Check
         ↓
Layer 8: Webhook Signature Verification
         ↓
Layer 9: Clerk User Deletion on Failure


┌─────────────────────────────────────────────────────────────────────────────────┐
│ COOKIE LIFECYCLE                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

Creation:
  POST /api/invitations/accept
  ↓
  Set-Cookie: invitation_token=xxx;
              HttpOnly; Secure; SameSite=Lax;
              Expires=[invitation.expiresAt];
              Path=/

Usage:
  Clerk webhook reads cookie
  ↓
  Validates invitation
  ↓
  Creates user

Cleanup:
  Success: Cookie cleared after user creation
  Failure: Cookie cleared, Clerk user deleted
  Expiry: Cookie auto-expires with invitation


┌─────────────────────────────────────────────────────────────────────────────────┐
│ FILE LOCATIONS                                                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

Frontend:
  src/apps/client-portal/app/accept-invitation/page.tsx

API Endpoints:
  src/apps/client-portal/app/api/invitations/accept/route.ts
  src/apps/client-portal/app/api/invitations/accept/verify/route.ts

Utilities:
  src/apps/client-portal/lib/invitation-cookie.ts

Middleware:
  src/apps/client-portal/middleware.ts

Webhook:
  src/apps/client-portal/app/api/webhooks/clerk/route.ts

Tests:
  scripts/test-invitation-acceptance.ts

Documentation:
  ISSUE-10-SUMMARY.md
  ISSUE-10-IMPLEMENTATION.md
  docs/invitation-flow-diagram.md (this file)
```

## Key Takeaways

1. **Three-Stage Process**:
   - Stage 1: Verify invitation (public, no auth)
   - Stage 2: Accept invitation (public, stores cookie)
   - Stage 3: Sign up with Clerk (validated via webhook)

2. **Security-First Design**:
   - Multiple validation layers
   - Automatic Clerk user deletion on failure
   - Rate limiting to prevent abuse
   - Secure cookie storage

3. **User Experience**:
   - Clear error messages for all scenarios
   - Pre-filled email in sign-up form
   - Human-readable expiry countdown
   - Responsive and accessible UI

4. **Fail-Safe Mechanisms**:
   - Atomic database transactions
   - Webhook validation as final gate
   - No orphaned Clerk users
   - Clear audit trail (acceptedAt, acceptedBy)

## Testing Flow

```
Test Script Execution:
  ↓
Create test organization
  ↓
Create valid invitation (status: PENDING)
  ↓
Create expired invitation (expiresAt: yesterday)
  ↓
Test verify endpoint (valid) → ✅
  ↓
Test verify endpoint (expired) → ✅
  ↓
Test verify endpoint (invalid) → ✅
  ↓
Test accept endpoint (valid) → ✅
  ↓
Test accept endpoint (expired) → ✅
  ↓
Test rate limiting (6 requests) → ✅
  ↓
Cleanup test data
  ↓
Print summary (6/6 passed)
```

---

**Created**: 2025-11-11
**Issue**: #10
**Diagram Version**: 1.0
