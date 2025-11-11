# Clerk Authentication Setup

## How User Creation Works

Your app now uses **Clerk for authentication** and creates users automatically via webhooks.

### User Flow:

1. **New User Signs Up via Clerk** → Clerk handles authentication
2. **Clerk Webhook Fires** → Sends `user.created` event to `/api/webhooks/clerk`
3. **Database User Created** → App creates user record with:
   - Clerk ID (from Clerk)
   - Email
   - Name
   - Default role: `USER`
   - Company profile (auto-created)

### No More Seed Users!

❌ **Old Approach** (REMOVED):
- Seed script created fake users with test Clerk IDs
- These users couldn't log in (fake IDs don't match real Clerk users)
- Caused "User not found in database" errors

✅ **New Approach** (CURRENT):
- Seed script only creates expense categories
- Real users created automatically when they sign up
- Each user gets their own data isolated by their Clerk ID

## What Gets Seeded

The production seed (`npm run seed`) only creates:
- ✅ **10 Default Expense Categories** (Office Supplies, Travel, etc.)
- ✅ **Cleanup of any test users** (if they exist)

That's it! Everything else is created by real users.

## Clerk Webhook Configuration

### Required Environment Variable:

```env
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Webhook Endpoint:

```
https://your-app.vercel.app/api/webhooks/clerk
```

### Events to Subscribe:

- `user.created` - Creates user in database
- `user.updated` - Updates user info
- `user.deleted` - Removes user from database

### Setting Up the Webhook in Clerk:

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **Webhooks** in the sidebar
4. Click **Add Endpoint**
5. **Endpoint URL**: `https://your-app.vercel.app/api/webhooks/clerk`
6. **Subscribe to events**:
   - user.created
   - user.updated
   - user.deleted
7. Copy the **Signing Secret** (starts with `whsec_`)
8. Add to Vercel environment variables as `CLERK_WEBHOOK_SECRET`

## Environment Variables Needed

### In Vercel Dashboard (Settings → Environment Variables):

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...  # ⚠️ ADD THIS!

# Database
DATABASE_URL=postgresql://...
```

## Testing User Creation

### 1. Sign Up a New User:
```
Go to: https://your-app.vercel.app/sign-up
Create account with email
```

### 2. Check Database:
```powershell
.\check-db.ps1
```

### 3. Verify User Created:
- Should see 1+ users in database
- User should have company profile
- Can create invoices/expenses

## Common Issues

### "User not found in database" Error

**Cause**: User signed up via Clerk but webhook didn't create database record

**Solutions**:
1. Check `CLERK_WEBHOOK_SECRET` is set in Vercel
2. Check webhook endpoint is correct in Clerk dashboard
3. Check Clerk webhook logs for errors
4. Manually sync user: Use `/api/sync-user` endpoint

### Webhook Not Firing

**Cause**: Webhook not configured or endpoint URL wrong

**Solution**:
1. Verify webhook endpoint: `https://your-app.vercel.app/api/webhooks/clerk`
2. Check webhook is enabled in Clerk dashboard
3. Test webhook with "Send test event" in Clerk

### Multiple Users Not Isolated

**Cause**: This shouldn't happen - each user is isolated by their Clerk ID

**Check**:
- All queries filter by `userId` or `clerkId`
- Middleware properly identifies current user

## Roles

### Default Role:
New users get `USER` role automatically.

### Available Roles:
- `USER` - Regular user (default)
- `ACCOUNTANT` - Can view assigned customers
- `ADMIN` - Full access (must be set manually in database)

### Setting Admin Role:

You need to manually update the database:

```sql
UPDATE "User"
SET role = 'ADMIN'
WHERE email = 'your-admin@email.com';
```

Or create a script/API endpoint for this.

## Development vs Production

### Development (Local):
- Use Clerk test environment
- Test users can be created/deleted freely
- Webhook can point to localhost using Clerk's test mode

### Production (Vercel):
- Use Clerk production environment
- Webhook points to production URL
- Real users with real authentication

## Security Notes

1. ✅ **Webhook Security**:
   - All webhooks verified using Svix signature
   - Invalid signatures rejected

2. ✅ **User Isolation**:
   - All data queries filtered by user ID
   - Users can only see their own data

3. ✅ **No Default Admin**:
   - No seeded admin user (security best practice)
   - Admins must be manually promoted

## Summary

✅ **Seed script cleaned up** - Removed fake test users
✅ **Real user creation works** - Via Clerk webhook
✅ **Each user isolated** - Own company, invoices, expenses
✅ **Production ready** - No hardcoded test data

Your app now works correctly with Clerk authentication! 🎉
