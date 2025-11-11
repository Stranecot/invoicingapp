# Database Status & Seeding Guide

## Current Status

Your Neon PostgreSQL database has been successfully seeded with sample data on **2025-11-11**.

## What's in the Database

### Test Users (4):
1. **Admin User** - admin@invoiceapp.com (ADMIN role)
2. **John Business** - john@business.com (USER role)
   - Company: Acme Corporation
3. **Sarah Consultant** - sarah@consulting.com (USER role)
   - Company: Tech Consulting Pro
4. **Amy Accountant** - accountant@cpa.com (ACCOUNTANT role)

### Sample Data:
- **5 Customers** (3 for John, 2 for Sarah)
- **5 Invoices** (4 for John, 1 for Sarah)
  - Statuses: sent, paid, overdue, draft
- **6 Expenses** (5 for John, 1 for Sarah)
- **10 Default Expense Categories**
- **2 Budgets** for John
- **3 Notes** from Amy Accountant
- **2 Accountant Assignments**

## Checking Database Status

Run this command to verify your database has data:

```powershell
.\check-db.ps1
```

Expected output:
```
=== Database Status ===
Users: 4
Customers: 5
Invoices: 5
Expenses: 6
Categories: 10

✅ Database is seeded and ready!
```

## Database is Already Seeded! ✅

**Your database was seeded on the first deployment.** Running `npm run seed` again will fail because the data already exists.

## When Does Seeding Happen?

The database gets seeded:
1. ✅ **Automatically during first Vercel deployment** (already done)
2. When you manually run: `npm run seed`
3. After running: `npx prisma migrate reset` (WARNING: deletes all data)

## Redeployment Process

When you redeploy using `.\redeploy-vercel.ps1`:
- ✅ Your code changes are deployed
- ✅ The existing database data is **preserved**
- ❌ Database is **NOT** reseeded (data already exists)

This is correct behavior - you don't want to lose your production data on every deployment!

## If You Need to Reseed

### ⚠️ WARNING: This will DELETE all existing data!

```powershell
# Reset database (deletes all data and reruns migrations)
npx prisma migrate reset

# Then seed
npm run seed
```

### Safe Seeding (Skips if data exists)

Use the safe seed script that checks if data exists first:

```powershell
npx tsx prisma/seed-safe.ts
```

This will:
- Check if users exist in the database
- If data exists, it skips seeding
- If empty, it seeds the database

## Production Considerations

### ⚠️ Important Notes:

1. **The seed data uses test Clerk IDs** that won't work with real Clerk authentication
2. **For production**, you should:
   - Create real users through Clerk sign-up
   - Remove or modify the seed script
   - Never run seed on production database

3. **Current seed data is for DEVELOPMENT/TESTING only**

## Scripts Available

| Script | Command | Purpose |
|--------|---------|---------|
| **Check DB** | `.\check-db.ps1` | Verify database has data |
| **Seed (original)** | `npm run seed` | Seed database (fails if data exists) |
| **Seed (safe)** | `npx tsx prisma/seed-safe.ts` | Seed only if empty |
| **Reset & Seed** | `npx prisma migrate reset` | Delete all data and reseed |
| **Redeploy** | `.\redeploy-vercel.ps1` | Deploy changes (preserves data) |

## Database Connection

Your app is connected to:
- **Database**: Neon PostgreSQL
- **Host**: ep-silent-violet-ag9wc22i-pooler.c-2.eu-central-1.aws.neon.tech
- **Database Name**: neondb
- **Connection**: Pooled connection with SSL

Connection string is stored in:
- Local: `.env` file
- Vercel: Environment variables (configured)

## Troubleshooting

### "Unique constraint failed" error when seeding
**Solution**: Database already has data. This is normal! Either:
- Use `.\check-db.ps1` to verify data exists
- Run `npx prisma migrate reset` if you really need to reseed

### "Cannot connect to database" error
**Solution**: Check your `.env` file has the correct Neon connection string

### Vercel deployment works but app shows no data
**Solution**:
1. Verify environment variables in Vercel dashboard
2. Check database connection in Vercel logs
3. Run `.\check-db.ps1` locally to verify data exists

## Summary

✅ **Your database IS SEEDED and working!**
✅ **Redeployment preserves data**
✅ **No action needed unless you want to reset data**

When you run `.\redeploy-vercel.ps1`, it will:
1. Commit and push your code changes
2. Deploy to Vercel
3. Use the existing seeded database

Your production data is safe! 🎉
