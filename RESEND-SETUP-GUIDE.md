# Resend Setup Guide

Quick guide to setting up Resend for the invoice app email service.

## Overview

This guide walks you through setting up Resend.com for sending invitation emails in the invoice app. Estimated time: 10 minutes.

## Prerequisites

- Email address for signup
- Domain name (optional, for production)
- Access to DNS settings (optional, for production)

## Step-by-Step Setup

### 1. Create Resend Account (2 minutes)

1. Visit https://resend.com
2. Click "Get Started Free"
3. Sign up with your email or GitHub account
4. Verify your email address

### 2. Get API Key (1 minute)

1. After login, you'll be on the dashboard
2. Click "API Keys" in the left sidebar
3. Click "Create API Key" button
4. Give it a descriptive name:
   - Development: "Invoice App - Development"
   - Production: "Invoice App - Production"
5. Select permissions: "Full Access" (or "Sending access" for production)
6. Click "Create"
7. **IMPORTANT**: Copy the API key immediately - it starts with `re_`
   - You won't be able to see it again!
   - Store it securely

### 3. Configure Development Environment (2 minutes)

1. Navigate to your project:
   ```bash
   cd src/apps/client-portal
   ```

2. Copy the environment example:
   ```bash
   cp .env.example .env.local
   ```

3. Open `.env.local` and add your Resend API key:
   ```bash
   RESEND_API_KEY=re_your_actual_api_key_here
   ```

4. For development, you can use your personal email:
   ```bash
   FROM_EMAIL=yourname@gmail.com  # Or any email you own
   FROM_NAME=Invoice App Dev
   APP_URL=http://localhost:3000
   ```

5. Set up email override for testing:
   ```bash
   DEV_EMAIL_TO=yourname@gmail.com  # All emails go here in development
   TEST_EMAIL_TO=yourname@gmail.com  # For test script
   ```

### 4. Test the Setup (3 minutes)

1. Run the test script:
   ```bash
   npm run test:email
   ```

2. You should see:
   ```
   ✓ RESEND_API_KEY: re_xxxxx...
   ✓ FROM_EMAIL: yourname@gmail.com
   ✓ TEST_EMAIL_TO: yourname@gmail.com
   ✓ Email client initialized successfully
   ✓ Invitation template rendered successfully
   ✓ Welcome template rendered successfully
   ```

3. Check the generated HTML files in `scripts/`:
   - `test-invitation-email.html`
   - `test-welcome-email.html`

4. To actually send test emails:
   ```bash
   SEND_EMAILS=true npm run test:email
   ```

5. Check your inbox - you should receive 2 test emails!

### 5. Production Setup (Optional, 10+ minutes)

For production, verify your domain for better deliverability:

#### 5.1 Add Domain to Resend

1. In Resend dashboard, click "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Click "Add"

#### 5.2 Configure DNS Records

Resend will provide DNS records to add. You need to add these to your domain's DNS settings:

**SPF Record** (TXT record):
```
Name: @ (or yourdomain.com)
Value: v=spf1 include:resend.com ~all
```

**DKIM Record** (TXT record):
```
Name: resend._domainkey
Value: [provided by Resend - long string]
```

**DMARC Record** (TXT record - optional but recommended):
```
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:postmaster@yourdomain.com
```

#### 5.3 Verify Domain

1. After adding DNS records, click "Verify" in Resend
2. Verification usually takes 1-5 minutes
3. If it fails, wait 15 minutes and try again (DNS propagation)
4. You'll see a green checkmark when verified

#### 5.4 Update Production Environment

```bash
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Your Organization Name
APP_URL=https://yourdomain.com
# Remove or leave empty DEV_EMAIL_TO in production
```

## Testing Checklist

After setup, verify everything works:

- [ ] Resend account created
- [ ] API key copied and saved securely
- [ ] `.env.local` configured with API key
- [ ] Test script runs successfully (`npm run test:email`)
- [ ] HTML email files generated in `scripts/`
- [ ] Test emails received (with `SEND_EMAILS=true`)
- [ ] Domain verified (production only)
- [ ] Production environment configured (if applicable)

## Common Issues

### "Email client not initialized"

**Cause**: Environment variables not loaded

**Solution**:
1. Check `.env.local` exists in `src/apps/client-portal/`
2. Verify `RESEND_API_KEY` is set
3. Restart development server

### "Invalid RESEND_API_KEY format"

**Cause**: API key doesn't start with `re_`

**Solution**:
1. Copy the API key again from Resend dashboard
2. Make sure you copied the entire key
3. Check for extra spaces or quotes

### "Failed to send email: Domain not found"

**Cause**: Email domain not verified (production)

**Solution**:
1. Use Resend's test domain in development
2. Or verify your domain in Resend dashboard
3. Or use a personal email for testing

### "Emails going to spam"

**Cause**: Domain not verified or missing DNS records

**Solution**:
1. Verify domain in Resend
2. Add all DNS records (SPF, DKIM, DMARC)
3. Wait for DNS propagation (up to 24 hours)
4. Warm up your domain with gradual sending

## Rate Limits

### Free Tier
- 100 emails per day
- 3,000 emails per month
- No credit card required

### If You Hit Limits
1. Upgrade to paid tier ($20/month for 50,000 emails)
2. Use email queuing to spread out sends
3. Monitor usage in Resend dashboard

## Security Best Practices

1. **Never commit API keys** to version control
   - Always use `.env.local` (already in `.gitignore`)
   - Use different keys for dev/staging/production

2. **Rotate keys regularly**
   - Create new key every 3-6 months
   - Delete old keys from Resend dashboard

3. **Use environment-specific keys**
   - Development key: Full access for testing
   - Production key: Sending access only

4. **Monitor API usage**
   - Check Resend dashboard regularly
   - Set up alerts for unusual activity

## Next Steps

After successful setup:

1. **Test invitation flow**:
   ```bash
   # Start dev server
   npm run dev

   # Create invitation via API or UI
   # Check console logs for email sending confirmation
   # Check inbox for invitation email
   ```

2. **Customize email templates**:
   - Edit `src/packages/email/src/templates/invitation.tsx`
   - Edit `src/packages/email/src/templates/welcome.tsx`
   - Update colors, copy, or layout

3. **Monitor email delivery**:
   - Check Resend dashboard for delivery status
   - Monitor bounce rates
   - Track open rates (if configured)

## Support

- **Resend Documentation**: https://resend.com/docs
- **Resend Support**: support@resend.com
- **Resend Status**: https://status.resend.com
- **Package README**: `src/packages/email/README.md`
- **Project Documentation**: `ISSUE-8-SUMMARY.md`

## Quick Reference

### Environment Variables
```bash
# Required
RESEND_API_KEY=re_xxxxx
FROM_EMAIL=noreply@yourdomain.com

# Optional
FROM_NAME=Your Org Name
REPLY_TO_EMAIL=support@yourdomain.com
APP_URL=http://localhost:3000

# Development Only
DEV_EMAIL_TO=dev@example.com
TEST_EMAIL_TO=test@example.com
```

### Useful Commands
```bash
# Test email service
npm run test:email

# Send actual test emails
SEND_EMAILS=true npm run test:email

# Start dev server
npm run dev

# View email logs (in dev server console)
# Look for: [Email] prefixed messages
```

### Resend Dashboard URLs
- API Keys: https://resend.com/api-keys
- Domains: https://resend.com/domains
- Email Logs: https://resend.com/logs
- Settings: https://resend.com/settings

---

**Last Updated**: November 11, 2025
**Version**: 1.0
**Status**: Ready for Use
