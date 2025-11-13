# Vercel Environment Variables Configuration

## Client Portal Project

Add these environment variables to your **Client Portal** Vercel project:

Go to: Vercel Dashboard → Your Client Portal Project → Settings → Environment Variables

**Add to ALL environments (Production, Preview, Development):**

```bash
# Database (Neon PostgreSQL - Shared with Admin Dashboard)
DATABASE_URL=postgresql://neondb_owner:npg_r60zVGLkmaPK@ep-silent-violet-ag9wc22i-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require

# JWT Authentication (MUST match Admin Dashboard)
JWT_SECRET=743XjW7NkDS+UI0gIdodn1UT9of87Fj4qlKLk/aZqe0=
JWT_EXPIRES_IN=7d

# Bcrypt Configuration
BCRYPT_ROUNDS=10

# Email Service (Resend)
RESEND_API_KEY=re_EZTh67tX_9HtGuuo795yfzAkZXdtPRQRE
FROM_EMAIL=onboarding@resend.dev
FROM_NAME=Invoice App
REPLY_TO_EMAIL=radevstefan771@gmail.com

# App URLs (Update with your actual Vercel URL after deployment)
APP_URL=https://your-client-portal.vercel.app
NEXT_PUBLIC_APP_URL=https://your-client-portal.vercel.app

# Development Email Override (Optional - for testing)
# DEV_EMAIL_TO=radevstefan771@gmail.com
```

---

## Admin Dashboard Project

Add these environment variables to your **Admin Dashboard** Vercel project:

Go to: Vercel Dashboard → Your Admin Dashboard Project → Settings → Environment Variables

**Add to ALL environments (Production, Preview, Development):**

```bash
# Database (Neon PostgreSQL - SAME as Client Portal)
DATABASE_URL=postgresql://neondb_owner:npg_r60zVGLkmaPK@ep-silent-violet-ag9wc22i-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require

# JWT Authentication (MUST match Client Portal)
JWT_SECRET=743XjW7NkDS+UI0gIdodn1UT9of87Fj4qlKLk/aZqe0=
JWT_EXPIRES_IN=7d

# Email Service (Resend - SAME key as Client Portal)
RESEND_API_KEY=re_EZTh67tX_9HtGuuo795yfzAkZXdtPRQRE
FROM_EMAIL=onboarding@resend.dev
FROM_NAME=Invoice App Admin
REPLY_TO_EMAIL=radevstefan771@gmail.com

# App URLs (Update with your actual Vercel URL after deployment)
APP_URL=https://your-admin-dashboard.vercel.app
NEXT_PUBLIC_APP_URL=https://your-admin-dashboard.vercel.app

# Client Portal URL (Update after Client Portal is deployed)
CLIENT_PORTAL_URL=https://your-client-portal.vercel.app

# Development Email Override (Optional - for testing)
# DEV_EMAIL_TO=radevstefan771@gmail.com
```

---

## Important Notes

### Critical Requirements

1. **JWT_SECRET MUST BE IDENTICAL** in both apps for shared authentication
2. **DATABASE_URL MUST BE IDENTICAL** - both apps use the same database
3. **RESEND_API_KEY** can be the same (recommended) or different

### After Deployment

Once you deploy, update these URLs:

**Client Portal:**
- `APP_URL` → Your Client Portal Vercel URL
- `NEXT_PUBLIC_APP_URL` → Your Client Portal Vercel URL

**Admin Dashboard:**
- `APP_URL` → Your Admin Dashboard Vercel URL
- `NEXT_PUBLIC_APP_URL` → Your Admin Dashboard Vercel URL
- `CLIENT_PORTAL_URL` → Your Client Portal Vercel URL (for invitation links)

### Email Configuration

Currently using Resend's test domain (`onboarding@resend.dev`):
- ✅ Works for development/testing
- ⚠️ Only sends to verified email: `radevstefan771@gmail.com`
- 📧 To send to any email, verify your own domain at https://resend.com/domains

### Security Note

⚠️ **NEVER commit these values to Git!**
- All sensitive values are in `.env` files (already in `.gitignore`)
- Only add them manually in Vercel UI

---

## How to Add in Vercel UI

1. Go to your Vercel project
2. Click **Settings** tab
3. Click **Environment Variables** in sidebar
4. Click **Add New**
5. For each variable:
   - **Key:** Variable name (e.g., `DATABASE_URL`)
   - **Value:** The value from above
   - **Environments:** Check all three boxes (Production, Preview, Development)
6. Click **Save**
7. Repeat for all variables

---

## After Adding Variables

1. **Redeploy** your projects for changes to take effect
2. **Test** by visiting your deployed apps
3. **Check logs** in Vercel dashboard if issues occur

---

**Last Updated:** 2025-01-13
