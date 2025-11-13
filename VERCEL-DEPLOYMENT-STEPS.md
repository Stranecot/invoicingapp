# Vercel Deployment - Step by Step Guide

## Prerequisites

- ✅ Git repository pushed to GitHub/GitLab/Bitbucket
- ✅ Vercel account created
- ✅ Neon PostgreSQL database ready
- ✅ Resend API key obtained

---

## Part 1: Deploy Client Portal

### Step 1: Create Vercel Project

1. Go to **Vercel Dashboard** → https://vercel.com/new
2. Click **Import Project**
3. Select your Git repository: `invoice-app`
4. Click **Import**

### Step 2: Configure Build Settings

**CRITICAL:** These settings tell Vercel this is a monorepo.

**Project Name:**
```
invoice-client-portal
```

**Root Directory:**
```
./
```
⚠️ **Leave empty or set to `./`** - Vercel needs access to root package.json!

**Framework Preset:**
```
Next.js
```

**Build & Development Settings** → Click "Override"

**Build Command:**
```
npx turbo run build --filter=@invoice-app/client-portal
```

**Output Directory:**
```
src/apps/client-portal/.next
```

**Install Command:**
```
npm install --legacy-peer-deps
```

**Development Command:**
```
(leave default or blank)
```

### Step 3: Click "Deploy"

Wait for the deployment... It should succeed now!

### Step 4: Add Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Add each variable below
3. **For each variable:** Check **Production**, **Preview**, and **Development**

```bash
DATABASE_URL=postgresql://neondb_owner:npg_r60zVGLkmaPK@ep-silent-violet-ag9wc22i-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require

JWT_SECRET=743XjW7NkDS+UI0gIdodn1UT9of87Fj4qlKLk/aZqe0=

JWT_EXPIRES_IN=7d

BCRYPT_ROUNDS=10

RESEND_API_KEY=re_EZTh67tX_9HtGuuo795yfzAkZXdtPRQRE

FROM_EMAIL=onboarding@resend.dev

FROM_NAME=Invoice App

REPLY_TO_EMAIL=radevstefan771@gmail.com

APP_URL=https://your-deployment-url.vercel.app

NEXT_PUBLIC_APP_URL=https://your-deployment-url.vercel.app
```

⚠️ **Important:** Replace `https://your-deployment-url.vercel.app` with your actual Vercel URL!

### Step 5: Get Your Deployment URL

After deployment completes, Vercel gives you a URL like:
```
https://invoice-client-portal.vercel.app
```

Copy this URL!

### Step 6: Update APP_URL Environment Variables

1. Go back to **Settings** → **Environment Variables**
2. Edit `APP_URL` and `NEXT_PUBLIC_APP_URL`
3. Replace with your actual URL: `https://invoice-client-portal.vercel.app`
4. Save

### Step 7: Redeploy

1. Go to **Deployments** tab
2. Click the three dots (...) on the latest deployment
3. Click **Redeploy**
4. Wait for completion

✅ **Client Portal is now deployed!**

---

## Part 2: Deploy Admin Dashboard

### Step 1: Create Second Vercel Project

1. Go to **Vercel Dashboard** → https://vercel.com/new
2. Click **Import Project**
3. Select the **SAME Git repository**: `invoice-app`
4. Click **Import**

### Step 2: Configure Build Settings

**Project Name:**
```
invoice-admin-dashboard
```

**Root Directory:**
```
./
```
⚠️ **Leave empty or set to `./`** - Same as client portal!

**Framework Preset:**
```
Next.js
```

**Build & Development Settings** → Click "Override"

**Build Command:**
```
npx turbo run build --filter=@invoice-app/admin-dashboard
```

**Output Directory:**
```
src/apps/admin-dashboard/.next
```

**Install Command:**
```
npm install --legacy-peer-deps
```

### Step 3: Click "Deploy"

Wait for deployment...

### Step 4: Add Environment Variables

```bash
DATABASE_URL=postgresql://neondb_owner:npg_r60zVGLkmaPK@ep-silent-violet-ag9wc22i-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require

JWT_SECRET=743XjW7NkDS+UI0gIdodn1UT9of87Fj4qlKLk/aZqe0=

JWT_EXPIRES_IN=7d

RESEND_API_KEY=re_EZTh67tX_9HtGuuo795yfzAkZXdtPRQRE

FROM_EMAIL=onboarding@resend.dev

FROM_NAME=Invoice App Admin

REPLY_TO_EMAIL=radevstefan771@gmail.com

APP_URL=https://your-admin-url.vercel.app

NEXT_PUBLIC_APP_URL=https://your-admin-url.vercel.app

CLIENT_PORTAL_URL=https://invoice-client-portal.vercel.app
```

⚠️ **Important:**
- Replace `https://your-admin-url.vercel.app` with actual admin dashboard URL
- Use the **Client Portal URL** from Part 1 for `CLIENT_PORTAL_URL`

### Step 5: Update URLs and Redeploy

Same process as Client Portal - get URL, update env vars, redeploy.

✅ **Admin Dashboard is now deployed!**

---

## Part 3: Verify Deployment

### Test Client Portal

1. Visit: `https://invoice-client-portal.vercel.app`
2. Try to login (should work with database)
3. Check Vercel logs if issues occur

### Test Admin Dashboard

1. Visit: `https://invoice-admin-dashboard.vercel.app`
2. Login as admin
3. Try sending an invitation (tests email + database)

### Test Email Functionality

1. In Admin Dashboard → Create an invitation
2. Check email arrives at `radevstefan771@gmail.com`
3. Click the invitation link (should go to Client Portal)

---

## Troubleshooting

### Build Fails: "Cannot find turbo"

**Solution:** Turbo is in devDependencies. Make sure package.json has it:
```json
{
  "devDependencies": {
    "turbo": "^2.3.3"
  }
}
```

### Build Fails: "Cannot find @invoice-app/database"

**Solution:** Root directory must be `./` so Vercel can see workspaces.

### Environment Variables Not Working

**Solution:**
1. Make sure you added to **all three environments** (Production, Preview, Development)
2. Redeploy after adding variables

### Email Links Point to Localhost

**Solution:** Update `APP_URL` and `NEXT_PUBLIC_APP_URL` with your Vercel URLs, then redeploy.

### Authentication Doesn't Work Between Apps

**Solution:** `JWT_SECRET` must be **identical** in both Client Portal and Admin Dashboard.

---

## Summary: What You Should Have

After following this guide:

✅ **Two Vercel Projects:**
- Client Portal: `https://invoice-client-portal.vercel.app`
- Admin Dashboard: `https://invoice-admin-dashboard.vercel.app`

✅ **Both projects:**
- Share the same Neon PostgreSQL database
- Share the same JWT secret (for cross-app auth)
- Share the same Resend API key
- Have correct APP_URL environment variables

✅ **Functionality:**
- Users can login to both apps
- Admin can send invitations (via email)
- Users can accept invitations
- Password reset emails work
- All data is in shared database

---

## Next Steps (Optional)

1. **Custom Domains:**
   - Client Portal: `app.yourdomain.com`
   - Admin Dashboard: `admin.yourdomain.com`

2. **Production Email:**
   - Verify your domain in Resend
   - Update `FROM_EMAIL` to use your domain

3. **Monitoring:**
   - Enable Vercel Analytics
   - Set up error tracking (Sentry)

---

**Need help?** Check the Vercel logs at:
- Deployments tab → Click on a deployment → View Function Logs

**Last Updated:** 2025-01-13
