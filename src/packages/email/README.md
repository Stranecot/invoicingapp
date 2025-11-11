# @invoice-app/email

Email service package for the invoice app. Provides email sending functionality using Resend with React Email templates.

## Features

- **Resend Integration**: Modern email API with excellent deliverability
- **React Email Templates**: Beautiful, responsive HTML emails built with React
- **TypeScript**: Full type safety for email data and configuration
- **Error Handling**: Graceful error handling with detailed logging
- **Template Library**: Pre-built templates for invitations and welcome emails

## Installation

This package is part of the monorepo workspace. Install dependencies:

```bash
npm install
```

## Configuration

### Environment Variables

Set the following environment variables in your app's `.env.local`:

```bash
# Resend API Key (get from https://resend.com/api-keys)
RESEND_API_KEY=re_your_api_key_here

# From email address (must be verified in Resend)
FROM_EMAIL=noreply@yourdomain.com

# From name (optional, appears as sender name)
FROM_NAME=Your Organization Name

# App URL for generating links
APP_URL=https://yourapp.com

# Development mode email override (optional)
DEV_EMAIL_TO=developer@example.com
```

### Initialize Email Client

Before sending emails, initialize the client with your configuration:

```typescript
import { initializeEmailClient } from '@invoice-app/email';

initializeEmailClient({
  apiKey: process.env.RESEND_API_KEY!,
  fromEmail: process.env.FROM_EMAIL!,
  fromName: process.env.FROM_NAME,
});
```

## Usage

### Send Invitation Email

```typescript
import { sendInvitationEmail } from '@invoice-app/email';

const result = await sendInvitationEmail({
  to: 'newuser@example.com',
  organizationName: 'Acme Corporation',
  inviterName: 'John Doe',
  role: 'User',
  token: 'invitation-token-here',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  acceptUrl: 'https://app.example.com/invitations/accept/token',
});

if (result.success) {
  console.log('Email sent successfully:', result.messageId);
} else {
  console.error('Email failed:', result.error);
}
```

### Send Welcome Email

```typescript
import { sendWelcomeEmail } from '@invoice-app/email';

const result = await sendWelcomeEmail({
  to: 'newuser@example.com',
  firstName: 'Jane',
  organizationName: 'Acme Corporation',
  dashboardUrl: 'https://app.example.com/dashboard',
});

if (result.success) {
  console.log('Welcome email sent:', result.messageId);
} else {
  console.error('Email failed:', result.error);
}
```

### Custom Email

For custom emails, use the lower-level `sendEmail` function:

```typescript
import { sendEmail } from '@invoice-app/email';

const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Your Custom Subject',
  html: '<h1>Hello World</h1><p>This is a custom email.</p>',
  text: 'Hello World. This is a custom email.',
});
```

## Email Templates

### Invitation Email

Professional invitation template with:
- Organization branding
- Personalized greeting
- Role information
- Prominent "Accept Invitation" button
- Expiry countdown
- Security notice
- Mobile responsive design

### Welcome Email

Onboarding email template with:
- Welcome message
- Feature highlights
- Quick start guide
- Support resources
- Dashboard access button
- Mobile responsive design

## Development

### Preview Templates

Use React Email's preview mode to view templates in development:

```bash
npm run email:dev
```

### Test Email Sending

Run the test script:

```bash
npm run test
```

## Best Practices

### Error Handling

Always handle email failures gracefully:

```typescript
const result = await sendInvitationEmail(data);

if (!result.success) {
  // Log error but don't fail the request
  console.error('Failed to send invitation email:', result.error);

  // You might want to:
  // 1. Store failed email in database for retry
  // 2. Show user a warning
  // 3. Trigger a background job to retry
}

// Continue with your business logic
return { success: true, invitation };
```

### Environment-Based Behavior

Use different configurations for development vs production:

```typescript
// In development, override recipient
const recipientEmail = process.env.NODE_ENV === 'development'
  ? process.env.DEV_EMAIL_TO || data.to
  : data.to;

const result = await sendInvitationEmail({
  ...data,
  to: recipientEmail,
});
```

### Rate Limiting

Be aware of Resend's rate limits:
- Free tier: 100 emails/day, 3,000/month
- Paid tier: Higher limits based on plan

Implement rate limiting or queuing for high-volume scenarios.

## Troubleshooting

### Email Not Sending

1. **Check API Key**: Verify `RESEND_API_KEY` is set correctly
2. **Verify Domain**: Ensure your `FROM_EMAIL` domain is verified in Resend
3. **Check Logs**: Look for error messages in console output
4. **Test Connection**: Run the test script to verify configuration

### Email in Spam

1. **SPF/DKIM**: Ensure DNS records are configured in Resend
2. **Content**: Avoid spam trigger words
3. **Reputation**: Use a verified domain with good reputation

### Template Not Rendering

1. **React Email**: Ensure all components are from `@react-email/components`
2. **Inline Styles**: Use inline styles, not external CSS
3. **Testing**: Preview templates using React Email's dev mode

## API Reference

### Types

```typescript
interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
}

interface InvitationEmailData {
  to: string;
  organizationName: string;
  inviterName?: string;
  role: string;
  token: string;
  expiresAt: Date;
  acceptUrl: string;
}

interface WelcomeEmailData {
  to: string;
  firstName: string;
  organizationName: string;
  dashboardUrl: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
```

### Functions

- `initializeEmailClient(config: EmailConfig): void` - Initialize email client
- `sendInvitationEmail(data: InvitationEmailData): Promise<EmailResult>` - Send invitation
- `sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResult>` - Send welcome email
- `sendEmail(options: SendEmailOptions): Promise<EmailResult>` - Send custom email
- `isEmailClientReady(): boolean` - Check if client is initialized
- `isValidEmail(email: string): boolean` - Validate email format

## License

MIT
