# Setup Guide - Multi-Tenant RBAC Invoice App

## Quick Start

### 1. Install Dependencies
```bash
cd invoice-app
npm install
```

### 2. Configure Clerk Authentication

#### Step 1: Create Clerk Account
1. Go to https://dashboard.clerk.com
2. Sign up or log in
3. Create a new application (choose "Next.js" template)

#### Step 2: Get API Keys
From your Clerk dashboard:
1. Go to "API Keys" in the left sidebar
2. Copy your keys

#### Step 3: Update Environment Variables
Edit the `.env` file in the project root:

```env
# Database
DATABASE_URL="file:./dev.db"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_secret_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Clerk URL Configuration (already set)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

#### Step 4: Configure Webhook (Important!)
1. In Clerk dashboard, go to "Webhooks"
2. Click "Add Endpoint"
3. Set endpoint URL: `http://localhost:3001/api/webhooks/clerk` (for development)
4. Subscribe to these events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Copy the "Signing Secret" and add it to your `.env` as `CLERK_WEBHOOK_SECRET`

### 3. Set Up Database

```bash
# The database should already be set up, but if you need to reset:
npm run seed
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3001

---

## Testing the Application

### Create Test Accounts

Since the database already has seeded users, you need to create matching Clerk accounts:

#### Option 1: Create New Users and Update Seed Data
1. Sign up in your app with these emails:
   - `admin@invoiceapp.com`
   - `john@business.com`
   - `sarah@consulting.com`
   - `accountant@cpa.com`

2. After creating each user, note their Clerk ID from the Clerk dashboard

3. Update `prisma/seed.ts` with the real Clerk IDs

4. Re-run the seed:
   ```bash
   npm run seed
   ```

#### Option 2: Set Roles via Clerk Metadata (Recommended)
1. Create users in your app
2. In Clerk dashboard, for each user:
   - Go to Users
   - Click on the user
   - Go to "Public metadata"
   - Add: `{ "role": "ADMIN" }` or `{ "role": "USER" }` or `{ "role": "ACCOUNTANT" }`

3. Update `lib/hooks/useAuth.ts` to read from publicMetadata (already done)

#### Option 3: Manual Database Update
1. Create users through the app
2. Get their Clerk IDs from the Clerk dashboard
3. Update the database directly:
   ```sql
   UPDATE User SET role = 'ADMIN' WHERE clerkId = 'user_xxxxx';
   ```

---

## User Roles & Permissions

### Admin
- **Email**: admin@invoiceapp.com
- **Access**: Full access to all data
- **Can**:
  - View all users' data
  - Manage all customers, invoices, expenses
  - Access admin panel
  - Assign customers to accountants

### User (Business Owner)
- **Example**: john@business.com
- **Access**: Own company data only
- **Can**:
  - Manage own company settings
  - Full CRUD on own customers
  - Full CRUD on own invoices
  - Full CRUD on own expenses
  - Manage own budgets and categories

### Accountant
- **Example**: accountant@cpa.com
- **Access**: Assigned customers only
- **Can**:
  - View assigned customers' invoices
  - Update invoice status (mark as paid, etc.)
  - Add notes to invoices
  - View assigned customers' expenses (read-only)
  - Download PDFs
- **Cannot**:
  - Edit invoice amounts or items
  - Create, edit, or delete anything
  - Access unassigned customers

---

## Common Issues & Solutions

### Issue: "Unauthorized" when accessing API routes
**Solution**: Make sure you're signed in with Clerk. Check browser console for auth errors.

### Issue: Webhook not working
**Solution**:
1. Verify `CLERK_WEBHOOK_SECRET` in `.env`
2. For local development, use ngrok or similar to expose localhost
3. Check webhook logs in Clerk dashboard

### Issue: User has wrong role
**Solution**:
1. Check public metadata in Clerk dashboard
2. Or update database directly:
   ```bash
   npx prisma studio
   # Edit User table, change role field
   ```

### Issue: Database schema mismatch
**Solution**:
```bash
npx prisma migrate reset --force
npm run seed
```

### Issue: Cannot see any data after login
**Solution**: The user might not have any associated data. Either:
1. Create new data through the UI
2. Run seed script to populate test data
3. Check that userId matches in database

---

## Development Workflow

### Making Schema Changes
```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name your_migration_name

# 3. Generate Prisma client
npx prisma generate
```

### Resetting Database
```bash
# Danger: This will delete all data!
npx prisma migrate reset --force
npm run seed
```

### Viewing Database
```bash
npx prisma studio
# Opens web interface at http://localhost:5555
```

### Testing Different Roles
1. Sign out of current account
2. Sign in with different test account
3. Verify role-based access in UI and API

---

## Production Deployment

### Environment Variables for Production
```env
DATABASE_URL="your_production_database_url"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."
CLERK_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### Deployment Checklist
- [ ] Update Clerk webhook URL to production domain
- [ ] Switch to production Clerk keys
- [ ] Use production database (PostgreSQL recommended)
- [ ] Run migrations on production database
- [ ] Do NOT run seed script in production
- [ ] Set up proper backup strategy
- [ ] Enable Clerk production mode
- [ ] Test all three roles in production

---

## Support & Resources

- **Clerk Documentation**: https://clerk.com/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **Project Implementation Status**: See `IMPLEMENTATION_STATUS.md`

---

## Security Notes

1. Never commit `.env` file to version control
2. Use `.env.local` for local overrides
3. Rotate API keys regularly
4. Enable MFA for admin accounts in production
5. Monitor webhook logs for suspicious activity
6. Implement rate limiting in production
7. Use HTTPS for webhook endpoints
8. Regularly review user access logs

---

## Next Steps

After setup, you can:
1. Create your first invoice as a USER
2. Test accountant access with assigned customers
3. Use admin panel to manage user roles
4. Explore the API endpoints
5. Customize the UI to match your brand

Happy invoicing!
