# Email Service Architecture

Visual documentation of the email service architecture and data flow.

## Package Structure

```
invoice-app-monorepo/
├── src/
│   ├── packages/
│   │   └── email/                          # @invoice-app/email package
│   │       ├── package.json                # Dependencies: resend, react-email
│   │       ├── tsconfig.json               # TypeScript config
│   │       ├── README.md                   # Package documentation
│   │       └── src/
│   │           ├── index.ts                # Main exports & high-level functions
│   │           ├── client.ts               # Resend client initialization
│   │           ├── types.ts                # TypeScript type definitions
│   │           └── templates/
│   │               ├── index.ts            # Template exports
│   │               ├── invitation.tsx      # Invitation email template
│   │               └── welcome.tsx         # Welcome email template
│   │
│   └── apps/
│       └── client-portal/
│           ├── lib/
│           │   └── email.ts                # Email helper utilities
│           └── app/
│               └── api/
│                   └── invitations/
│                       ├── route.ts        # POST - Create & send invitation
│                       └── [id]/
│                           └── resend/
│                               └── route.ts # POST - Resend invitation
│
├── scripts/
│   └── test-email-service.ts              # Comprehensive test script
│
└── Documentation Files
    ├── ISSUE-8-SUMMARY.md                  # Complete implementation guide
    ├── RESEND-SETUP-GUIDE.md               # Step-by-step Resend setup
    ├── EMAIL-TEMPLATES-PREVIEW.md          # Template documentation
    ├── EMAIL-SERVICE-QUICKSTART.md         # 5-minute quick start
    ├── IMPLEMENTATION-CHECKLIST.md         # Verification checklist
    └── EMAIL-ARCHITECTURE.md               # This file
```

## Data Flow Diagram

### Creating an Invitation with Email

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Admin User (Frontend)                          │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                │ POST /api/invitations
                                │ { email, role }
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    POST /api/invitations Endpoint                       │
│                                                                          │
│  1. Validate admin authentication                                       │
│  2. Validate request data (email, role)                                │
│  3. Check for existing user/invitation                                 │
│  4. Check organization user limits                                     │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Database (Prisma)                              │
│                                                                          │
│  5. Generate invitation token (crypto)                                 │
│  6. Calculate expiry (7 days from now)                                 │
│  7. Create invitation record                                           │
│     - email, role, organizationId                                      │
│     - token, expiresAt, status: PENDING                                │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   Email Service Initialization                          │
│                   (ensureEmailClientInitialized)                        │
│                                                                          │
│  8. Check if client already initialized                                │
│  9. Validate environment variables                                     │
│     - RESEND_API_KEY (must start with 're_')                          │
│     - FROM_EMAIL (required)                                            │
│  10. Initialize Resend client                                          │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Email Template Rendering                             │
│                    (@invoice-app/email)                                 │
│                                                                          │
│  11. Fetch inviter details (name from database)                        │
│  12. Build acceptance URL (APP_URL + token)                            │
│  13. Override recipient if DEV_EMAIL_TO set                            │
│  14. Render React Email template to HTML                               │
│      InvitationEmail({                                                  │
│        organizationName, inviterName, role,                            │
│        acceptUrl, expiresAt, recipientEmail                            │
│      })                                                                 │
│  15. Generate plain text version                                       │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Resend API                                      │
│                                                                          │
│  16. Send email via Resend SDK                                         │
│      - From: FROM_NAME <FROM_EMAIL>                                    │
│      - To: recipient email (or DEV_EMAIL_TO)                           │
│      - Subject: "You've been invited to join [Org]"                    │
│      - HTML: rendered template                                         │
│      - Text: plain text fallback                                       │
│  17. Receive response (success/error)                                  │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Error Handling                                   │
│                                                                          │
│  18. If email succeeds:                                                │
│      ✓ Log success with message ID                                    │
│                                                                          │
│  19. If email fails:                                                   │
│      ✗ Log error details                                              │
│      ✓ Continue anyway (non-blocking)                                 │
│      ✓ Invitation still created                                       │
│      ✓ Admin can resend later                                         │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Response to Frontend                               │
│                                                                          │
│  20. Return sanitized invitation (token excluded)                      │
│      { id, email, role, status, expiresAt, ... }                       │
│  21. Frontend shows success message                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Interactions

### Email Package (@invoice-app/email)

```
┌────────────────────────────────────────────────────────────────┐
│                     @invoice-app/email                         │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ index.ts (Public API)                                    │ │
│  │                                                           │ │
│  │  - sendInvitationEmail(data)                            │ │
│  │  - sendWelcomeEmail(data)                               │ │
│  │  - initializeEmailClient(config)                        │ │
│  │  - sendEmail(options)                                   │ │
│  │  - isValidEmail(email)                                  │ │
│  └────────────────┬─────────────────────────────────────────┘ │
│                   │                                            │
│                   ▼                                            │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ client.ts (Resend Integration)                          │ │
│  │                                                           │ │
│  │  - Resend client instance                               │ │
│  │  - Email sending logic                                  │ │
│  │  - Configuration management                             │ │
│  │  - Error handling                                       │ │
│  └────────────────┬─────────────────────────────────────────┘ │
│                   │                                            │
│                   ▼                                            │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ templates/ (React Email Components)                     │ │
│  │                                                           │ │
│  │  ├─ invitation.tsx                                       │ │
│  │  │  - Professional invitation template                  │ │
│  │  │  - Role display, CTA button                          │ │
│  │  │  - Expiry warning                                    │ │
│  │  │                                                       │ │
│  │  └─ welcome.tsx                                          │ │
│  │     - Onboarding welcome template                       │ │
│  │     - Feature highlights                                │ │
│  │     - Quick start guide                                 │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### API Integration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Client Portal App (Next.js)                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ lib/email.ts (Helper Utilities)                           │ │
│  │                                                             │ │
│  │  - ensureEmailClientInitialized()                         │ │
│  │    • Validates environment variables                      │ │
│  │    • Initializes Resend client once                       │ │
│  │    • Returns true/false                                   │ │
│  │                                                             │ │
│  │  - getAppUrl()                                            │ │
│  │    • Returns APP_URL from env                             │ │
│  │    • Fallback to localhost                                │ │
│  │                                                             │ │
│  │  - getRecipientEmail(original)                            │ │
│  │    • Returns DEV_EMAIL_TO in development                  │ │
│  │    • Returns original in production                       │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                              │
│                   ▼                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ app/api/invitations/route.ts                              │ │
│  │                                                             │ │
│  │  POST handler:                                            │ │
│  │    1. Validate admin authentication                       │ │
│  │    2. Create invitation in database                       │ │
│  │    3. Initialize email client                             │ │
│  │    4. Send invitation email                               │ │
│  │    5. Log result (don't fail if email fails)             │ │
│  │    6. Return invitation to client                         │ │
│  └────────────────┬───────────────────────────────────────────┘ │
│                   │                                              │
│                   ▼                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ app/api/invitations/[id]/resend/route.ts                 │ │
│  │                                                             │ │
│  │  POST handler:                                            │ │
│  │    1. Validate admin authentication                       │ │
│  │    2. Find existing invitation                            │ │
│  │    3. Generate new token & expiry                         │ │
│  │    4. Update invitation in database                       │ │
│  │    5. Initialize email client                             │ │
│  │    6. Send invitation email with new token                │ │
│  │    7. Log result (don't fail if email fails)             │ │
│  │    8. Return updated invitation                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Environment Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│                    Environment Variables                        │
│                                                                  │
│  Required:                                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ RESEND_API_KEY                                            │ │
│  │   - Get from: https://resend.com/api-keys                │ │
│  │   - Format: re_xxxxxxxxxxxxxxxxxxxxxxxx                  │ │
│  │   - Used by: client.ts to initialize Resend             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ FROM_EMAIL                                                │ │
│  │   - Your verified email or domain                        │ │
│  │   - Examples: noreply@yourdomain.com                     │ │
│  │   - Used by: client.ts as sender email                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Optional:                                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ FROM_NAME                                                 │ │
│  │   - Sender display name                                  │ │
│  │   - Default: "Invoice App"                               │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ APP_URL                                                   │ │
│  │   - Base URL for invitation links                        │ │
│  │   - Dev: http://localhost:3000                           │ │
│  │   - Prod: https://yourdomain.com                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Development Only:                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ DEV_EMAIL_TO                                              │ │
│  │   - Override all recipients in development               │ │
│  │   - Prevents accidental sends to real users              │ │
│  │   - Example: developer@example.com                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ TEST_EMAIL_TO                                             │ │
│  │   - Email address for test script                        │ │
│  │   - Used by: scripts/test-email-service.ts               │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

## Error Handling Strategy

```
Email Sending Attempt
      │
      ▼
┌──────────────────────────────────┐
│ Initialize Email Client          │
│ (ensureEmailClientInitialized)   │
└────────┬─────────────────────────┘
         │
         ├─── API Key missing? ──────> Log Warning ──> Continue without email
         │                              "Email service not configured"
         │
         ├─── Invalid API key? ─────> Log Warning ──> Continue without email
         │                              "Invalid RESEND_API_KEY format"
         │
         ▼
┌──────────────────────────────────┐
│ Render Email Template            │
│ (React Email → HTML)             │
└────────┬─────────────────────────┘
         │
         ├─── Template error? ───────> Log Error ──> Continue without email
         │                              Return { success: false, error }
         │
         ▼
┌──────────────────────────────────┐
│ Send Email via Resend API        │
└────────┬─────────────────────────┘
         │
         ├─── Network error? ────────> Log Error ──> Continue without email
         │                              Retry not implemented (v1)
         │
         ├─── API error? ────────────> Log Error ──> Continue without email
         │                              e.g., invalid domain, rate limit
         │
         ├─── Success! ──────────────> Log Success ──> Return message ID
         │                              Continue with invitation creation
         │
         ▼
┌──────────────────────────────────┐
│ Return Result to API Handler     │
│ • Invitation always created      │
│ • Email failure is logged        │
│ • User can resend later          │
└──────────────────────────────────┘

Key Principle: NON-BLOCKING
  - Email failures don't break invitation creation
  - All errors are logged for debugging
  - Graceful degradation always
```

## Testing Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              scripts/test-email-service.ts                      │
│                                                                  │
│  Test Suite:                                                    │
│                                                                  │
│  1. Environment Configuration                                   │
│     ✓ Check RESEND_API_KEY exists and valid                   │
│     ✓ Check FROM_EMAIL exists                                 │
│     ✓ Check TEST_EMAIL_TO exists                              │
│                                                                  │
│  2. Initialize Email Client                                     │
│     ✓ Initialize with test credentials                        │
│     ✓ Verify client is ready                                  │
│                                                                  │
│  3. Test Invitation Template Rendering                         │
│     ✓ Render template with test data                          │
│     ✓ Verify HTML output is valid                             │
│     ✓ Save to test-invitation-email.html                      │
│                                                                  │
│  4. Test Welcome Template Rendering                            │
│     ✓ Render template with test data                          │
│     ✓ Verify HTML output is valid                             │
│     ✓ Save to test-welcome-email.html                         │
│                                                                  │
│  5. Send Test Emails (if SEND_EMAILS=true)                    │
│     ✓ Send invitation email                                   │
│     ✓ Send welcome email                                      │
│     ✓ Verify success and message IDs                          │
│                                                                  │
│  6. Test Error Handling                                        │
│     ✓ Invalid email address rejection                         │
│     ✓ Proper error messages                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Dependencies Graph

```
invoice-app-monorepo
  │
  ├─ @invoice-app/email (src/packages/email)
  │    │
  │    ├─ resend@^4.0.1
  │    │    └─ Official Resend SDK for Node.js
  │    │
  │    ├─ react-email@^3.0.3
  │    │    └─ React Email framework
  │    │
  │    ├─ @react-email/components@^0.0.29
  │    │    ├─ Html, Head, Body, Container
  │    │    ├─ Section, Text, Button
  │    │    └─ Hr, Link components
  │    │
  │    └─ react@^18.3.1
  │         └─ React runtime for templates
  │
  ├─ client-portal (src/apps/client-portal)
  │    │
  │    └─ Imports @invoice-app/email
  │         ├─ sendInvitationEmail
  │         ├─ sendWelcomeEmail
  │         └─ initializeEmailClient
  │
  └─ test script (scripts/)
       │
       └─ Uses @invoice-app/email
            └─ All functions and templates
```

## Security Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                     Security Layers                             │
│                                                                  │
│  1. API Key Protection                                          │
│     ✓ Stored in .env.local (gitignored)                        │
│     ✓ Never committed to version control                       │
│     ✓ Validated on initialization                              │
│     ✓ Different keys for dev/prod                              │
│                                                                  │
│  2. Email Validation                                            │
│     ✓ Format validation before sending                         │
│     ✓ Checks for disposable domains (optional)                 │
│     ✓ Rate limiting on invitation creation                     │
│                                                                  │
│  3. Token Security                                              │
│     ✓ Cryptographically secure tokens                          │
│     ✓ Not exposed in email subject                             │
│     ✓ One-time use tokens                                      │
│     ✓ 7-day expiration                                         │
│                                                                  │
│  4. Content Security                                            │
│     ✓ User input sanitized                                     │
│     ✓ URLs validated before inclusion                          │
│     ✓ HTML escaped in templates                                │
│     ✓ No external resources loaded                             │
│                                                                  │
│  5. Development Safety                                          │
│     ✓ DEV_EMAIL_TO prevents real user emails                   │
│     ✓ Clear logging for debugging                              │
│     ✓ Test mode available                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**Architecture Version**: 1.0
**Last Updated**: November 11, 2025
**Status**: Production Ready
