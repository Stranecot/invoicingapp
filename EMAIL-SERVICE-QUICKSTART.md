# Email Service Quick Start

**5-Minute Setup Guide for Invoice App Email Service**

## Prerequisites
- Resend account (free - sign up at https://resend.com)
- API key from Resend dashboard

## Setup Steps

### 1. Get Resend API Key (2 min)
```bash
1. Go to https://resend.com
2. Sign up / Log in
3. Navigate to "API Keys"
4. Create new key → Copy it (starts with re_)
```

### 2. Configure Environment (1 min)
```bash
cd src/apps/client-portal
cp .env.example .env.local
```

Edit `.env.local`:
```env
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=yourname@gmail.com
FROM_NAME=Invoice App
APP_URL=http://localhost:3000
DEV_EMAIL_TO=yourname@gmail.com
TEST_EMAIL_TO=yourname@gmail.com
```

### 3. Test Email Service (2 min)
```bash
# From project root
npm run test:email

# To actually send emails
SEND_EMAILS=true npm run test:email
```

### 4. Start Development Server
```bash
npm run dev
```

## That's It!

Emails will now be sent when:
- Admin creates invitation: `POST /api/invitations`
- Admin resends invitation: `POST /api/invitations/[id]/resend`

## Quick Test

**Create an invitation:**
```bash
curl -X POST http://localhost:3000/api/invitations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"email": "test@example.com", "role": "USER"}'
```

Check console for:
```
[Email] Client initialized
[Email] Sending email to: test@example.com
[Email] Email sent successfully. Message ID: xxx
```

## Troubleshooting

**"Email service not configured"**
- Check RESEND_API_KEY is set in .env.local
- Verify API key starts with `re_`

**"Failed to send email"**
- Check FROM_EMAIL is valid
- Verify API key is correct
- Check Resend dashboard for errors

## Resources

- **Setup Guide**: `RESEND-SETUP-GUIDE.md`
- **Full Docs**: `ISSUE-8-SUMMARY.md`
- **Templates**: `EMAIL-TEMPLATES-PREVIEW.md`
- **Package**: `src/packages/email/README.md`

## Environment Variables Reference

```env
# Required
RESEND_API_KEY=re_xxxxx         # Get from resend.com/api-keys
FROM_EMAIL=noreply@domain.com   # Your email or verified domain

# Optional
FROM_NAME=Your Org Name         # Sender name
APP_URL=http://localhost:3000   # For invitation links
DEV_EMAIL_TO=dev@example.com    # Override recipient in dev
TEST_EMAIL_TO=test@example.com  # For test script
```

## Test Commands

```bash
# Test template rendering only
npm run test:email

# Send actual test emails
SEND_EMAILS=true npm run test:email

# Start dev server
npm run dev

# Check email logs (in dev server console)
# Look for: [Email] prefixed messages
```

## Next Steps

1. Customize email templates (optional)
2. Add your logo to templates (optional)
3. Verify domain for production (see RESEND-SETUP-GUIDE.md)
4. Deploy and monitor email delivery

---

**Need Help?**
- Resend Docs: https://resend.com/docs
- Package README: src/packages/email/README.md
- Full Implementation Guide: ISSUE-8-SUMMARY.md
