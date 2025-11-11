# Clerk Webhook Setup Guide - Quick Start

This is a quick reference guide for setting up the Clerk webhook for invitation-based signup enforcement.

For comprehensive documentation, see [ISSUE-9-SUMMARY.md](./ISSUE-9-SUMMARY.md)

## 1. Prerequisites

- Clerk account with application created
- Application running on accessible URL (localhost with ngrok for testing, or production domain)
- Database with migrations applied

## 2. Quick Setup (5 minutes)

### Step 1: Get Clerk Credentials

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Copy the following from **API Keys**:
   - Publishable Key (starts with `pk_test_` or `pk_live_`)
   - Secret Key (starts with `sk_test_` or `sk_live_`)

### Step 2: Configure Webhook

1. In Clerk Dashboard, go to **Webhooks** > **Add Endpoint**
2. Enter endpoint URL:
   - **Local testing:** Use ngrok: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk`
   - **Production:** `https://your-domain.com/api/webhooks/clerk`
3. Select these events:
   - ✅ `user.created` (REQUIRED)
   - ✅ `user.updated` (RECOMMENDED)
   - ✅ `user.deleted` (OPTIONAL)
4. Click **Create**
5. Copy the **Signing Secret** (starts with `whsec_`)

### Step 3: Update Environment Variables

Edit `src/apps/client-portal/.env`:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Database (already configured)
DATABASE_URL="postgresql://..."
```

### Step 4: Restart Application

```bash
# Stop the dev server (Ctrl+C)
# Start it again
npm run dev
```

## 3. Test the Webhook

### Create a Test Invitation

Using Prisma Studio or your admin API:

```typescript
await prisma.invitation.create({
  data: {
    email: 'test@example.com',
    role: 'USER',
    organizationId: 'your-org-id',
    invitedBy: 'admin-user-id',
    token: generateInvitationToken(),
    expiresAt: generateInvitationExpiry(7), // 7 days
    status: 'PENDING',
    customerIds: [],
  }
});
```

### Test Signup

1. Go to your app's signup page
2. Sign up with email: `test@example.com`
3. Check database - user should be created
4. Check invitation - status should be `ACCEPTED`

### Test Rejection (CRITICAL)

1. Try to sign up with email that has NO invitation: `unauthorized@example.com`
2. Webhook should:
   - Return 403 Forbidden
   - Delete the Clerk user
   - NOT create database record
3. Check Clerk Dashboard - user should not exist

## 4. Verify Security

Run the automated test suite:

```bash
# Make sure dev server is running on port 3001
npm run dev

# In another terminal
npx tsx scripts/test-clerk-webhook.ts
```

Expected output:
```
TEST 1: Valid invitation signup - PASS ✅
TEST 2: No invitation (unauthorized signup) - PASS ✅
TEST 3: Expired invitation - PASS ✅
TEST 4: Organization user limit enforcement - PASS ✅
TEST 5: Already accepted invitation (reuse attempt) - PASS ✅

All tests passed! ✅
```

## 5. Troubleshooting

### "Webhook returns 401 Unauthorized"

**Solution:** Check `CLERK_WEBHOOK_SECRET` in `.env` matches Clerk Dashboard

### "Valid users are being rejected"

**Solution:** Verify invitation exists and is PENDING:

```sql
SELECT * FROM "Invitation" WHERE email = 'user@example.com';
```

Should show:
- `status = 'PENDING'`
- `expiresAt` is in the future
- Organization is `ACTIVE`

### "Unauthorized users are NOT being deleted"

**Solution:** Check `CLERK_SECRET_KEY` is set correctly in `.env`

### "Webhook not receiving events"

**Solution:**
1. Verify webhook URL is correct in Clerk Dashboard
2. For local testing, ensure ngrok is running
3. Check webhook endpoint is accessible: `curl https://your-url/api/webhooks/clerk`

## 6. Production Checklist

Before going live:

- [ ] Production webhook endpoint configured in Clerk Dashboard
- [ ] Production `CLERK_WEBHOOK_SECRET` set in environment
- [ ] SSL certificate valid (required for webhooks)
- [ ] Test all scenarios in production environment
- [ ] Monitoring/alerting configured for `[CRITICAL]` logs
- [ ] Documentation shared with team

## Security Features Enabled

This webhook implementation provides:

✅ **Invitation-only signup** - No unauthorized access
✅ **Automatic cleanup** - Unauthorized users deleted immediately
✅ **Signature verification** - All requests authenticated
✅ **Expiration enforcement** - Old invitations rejected
✅ **Single-use invitations** - Cannot be reused
✅ **Organization limits** - MaxUsers enforced
✅ **Atomic transactions** - No race conditions
✅ **Comprehensive logging** - Full security audit trail

## Support

For detailed information, see:
- **Full Documentation:** [ISSUE-9-SUMMARY.md](./ISSUE-9-SUMMARY.md)
- **Test Script:** [scripts/test-clerk-webhook.ts](./scripts/test-clerk-webhook.ts)
- **Webhook Implementation:** [src/apps/client-portal/app/api/webhooks/clerk/route.ts](./src/apps/client-portal/app/api/webhooks/clerk/route.ts)

---

**Implementation Date:** 2025-11-11
**Issue:** #9
**Status:** ✅ Complete
