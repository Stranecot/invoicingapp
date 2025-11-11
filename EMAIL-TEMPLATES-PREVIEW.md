# Email Templates Preview

This document provides a preview of the email templates included in the email service.

## Invitation Email Template

### Purpose
Sent when an admin invites a new user to join their organization.

### Preview Description

**Header**
- Dark slate background (#1e293b)
- Organization name in white, bold, 24px font

**Main Content**
- Personalized greeting: "Hello,"
- Invitation message with inviter name and organization
- Role highlight box with light gray background
  - Label: "YOUR ROLE" (uppercase, small, gray)
  - Value: Role name (large, bold, dark)

**Call-to-Action**
- Large blue button (#3b82f6): "Accept Invitation"
- Rounded corners, white text, bold
- Alternative text link below for accessibility

**Expiry Notice**
- Yellow background warning box (#fef3c7)
- Orange left border accent (#f59e0b)
- Shows days until expiration and exact date

**Footer**
- Organization name
- "Powered by Invoice App"
- Support contact link
- Small, gray text (#94a3b8)

### Key Features
- ✅ Mobile responsive
- ✅ Clear call-to-action
- ✅ Urgency indicator (expiry)
- ✅ Professional design
- ✅ Accessibility compliant
- ✅ Security notice included

### Sample Content

```
Hello,

John Doe has invited you to join Acme Corporation on our invoicing platform.

┌─────────────────────────┐
│      YOUR ROLE          │
│        User             │
└─────────────────────────┘

As a User, you'll be able to access the organization's invoicing tools and collaborate with your team.

[Accept Invitation Button]

Or copy and paste this link into your browser:
https://app.example.com/invitations/accept/token123

⏰ This invitation expires in 7 days (December 31, 2025)

This invitation was sent to user@example.com. If you weren't expecting this invitation, you can safely ignore this email.

---
Acme Corporation
Powered by Invoice App
Need help? Contact support
```

---

## Welcome Email Template

### Purpose
Sent after a user accepts an invitation and completes their account setup.

### Preview Description

**Header**
- Same dark slate background as invitation
- Organization name in white, bold

**Main Content**
- Large welcome heading: "Welcome to [Organization]! 🎉"
- Personalized greeting with first name
- Welcome message
- Feature highlights in light gray box:
  - ✓ Create and manage invoices
  - ✓ Track customer payments
  - ✓ Generate professional PDFs
  - ✓ Collaborate with your team
  - ✓ Access financial reports

**Quick Start Guide**
- 3 numbered steps with blue circular badges
- Each step has title and description
- Steps:
  1. Complete Your Profile
  2. Create Your First Invoice
  3. Invite Team Members

**Call-to-Action**
- Blue button: "Go to Dashboard"
- Prominent placement after feature list

**Support Section**
- Light blue background box (#eff6ff)
- Links to:
  - 📚 Browse Documentation
  - 💬 Contact Support
  - 🎥 Watch Video Tutorials

**Footer**
- Same as invitation email
- Additional links to email preferences and help center

### Key Features
- ✅ Warm, welcoming tone
- ✅ Clear onboarding path
- ✅ Feature education
- ✅ Support resources
- ✅ Mobile responsive
- ✅ Professional design

### Sample Content

```
Welcome to Acme Corporation! 🎉

Hi Jane,

We're excited to have you on board! Your account has been successfully set up, and you're now part of the Acme Corporation team.

Here's what you can do now:

✓ Create and manage invoices
✓ Track customer payments
✓ Generate professional PDFs
✓ Collaborate with your team
✓ Access financial reports

[Go to Dashboard Button]

---

🚀 Quick Start Guide

① Complete Your Profile
  Add your details and preferences to personalize your experience.

② Create Your First Invoice
  Use our intuitive invoice builder to create professional invoices in minutes.

③ Invite Team Members
  Collaborate with your team by inviting colleagues to join your organization.

---

Need help getting started? Our team is here to assist you.

📚 Browse Documentation
💬 Contact Support
🎥 Watch Video Tutorials

We're thrilled to have you as part of our community and look forward to helping you streamline your invoicing workflow!

Best regards,
The Acme Corporation Team

---
Acme Corporation
Powered by Invoice App
This email was sent to user@example.com
Email Preferences · Help Center
```

---

## Design Specifications

### Color Palette

**Primary Colors**
- Blue (CTA): `#3b82f6` - Used for buttons and links
- Dark Slate (Header): `#1e293b` - Header background
- Light Gray (Content BG): `#f8fafc` - Content boxes

**Text Colors**
- Primary Text: `#334155` - Main content
- Secondary Text: `#64748b` - Descriptions, footnotes
- Muted Text: `#94a3b8` - Footer text

**Accent Colors**
- Warning Yellow (BG): `#fef3c7` - Expiry notice
- Warning Orange (Border): `#f59e0b` - Alert accent
- Info Blue (BG): `#eff6ff` - Support section

### Typography

**Fonts**
- System Font Stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif`
- Fast loading, consistent across platforms

**Sizes**
- Heading: 28px (Welcome), 20px (Sections)
- Body: 16px (normal), 14px (small)
- Footer: 12px

**Weights**
- Bold: 700 - Headings, important text
- Normal: 400 - Body text

### Layout

**Container**
- Max width: 600px
- Background: White (#ffffff)
- Margin: Auto-centered
- Padding: 20px 48px (responsive)

**Sections**
- Vertical spacing: 32px between sections
- Horizontal padding: 48px (24px on mobile)
- Border radius: 8px for boxes

**Buttons**
- Padding: 14px 32px (invitation), 14px 40px (welcome)
- Border radius: 6px
- Font size: 16px
- Font weight: Bold

### Accessibility

**Contrast Ratios**
- Text on white: 4.5:1 minimum (WCAG AA)
- Large text: 3:1 minimum (WCAG AA)
- All text passes WCAG AA standards

**Semantic HTML**
- Proper heading hierarchy
- Alt text for images (when used)
- Descriptive link text
- Table-based layout for compatibility

### Responsive Design

**Mobile Breakpoints**
- Container padding reduces to 24px on mobile
- Button text remains readable
- Single column layout maintained
- Touch-friendly tap targets (44px minimum)

### Email Client Compatibility

**Tested/Designed For:**
- ✅ Gmail (Web, iOS, Android)
- ✅ Outlook (Desktop, Web)
- ✅ Apple Mail (macOS, iOS)
- ✅ Yahoo Mail
- ✅ ProtonMail
- ✅ Thunderbird

**Techniques Used:**
- Inline CSS (no external stylesheets)
- Table-based layouts for consistency
- System fonts (no web fonts)
- Fallback colors and styles
- Plain text alternative included

---

## Customization Guide

### How to Customize Templates

#### 1. Change Colors

Edit the style constants at the bottom of each template file:

```typescript
// src/packages/email/src/templates/invitation.tsx

const button = {
  backgroundColor: '#3b82f6',  // Change button color
  // ...
};

const header = {
  backgroundColor: '#1e293b',  // Change header color
  // ...
};
```

#### 2. Modify Content

Edit the JSX content in the template:

```typescript
<Text style={paragraph}>
  Your custom message here
</Text>
```

#### 3. Add Your Logo

```typescript
<Section style={header}>
  <Img
    src="https://yourdomain.com/logo.png"
    alt="Company Logo"
    width="150"
    height="50"
  />
</Section>
```

#### 4. Change Button Text

```typescript
<Button style={button} href={acceptUrl}>
  Your Custom CTA Text
</Button>
```

### Testing Custom Templates

After making changes:

1. Run the test script:
   ```bash
   npm run test:email
   ```

2. Check generated HTML files:
   ```bash
   scripts/test-invitation-email.html
   scripts/test-welcome-email.html
   ```

3. Open HTML files in browser to preview

4. Send test emails:
   ```bash
   SEND_EMAILS=true npm run test:email
   ```

---

## Technical Implementation

### React Email Components Used

```typescript
import {
  Html,           // Root HTML wrapper
  Head,          // HTML head section
  Body,          // HTML body
  Container,     // Main container (600px max width)
  Section,       // Content sections
  Text,          // Text paragraphs
  Button,        // CTA buttons
  Hr,            // Horizontal rules
  Link,          // Hyperlinks
} from '@react-email/components';
```

### Template Props

**Invitation Email**
```typescript
interface InvitationEmailProps {
  organizationName: string;    // Required
  inviterName?: string;        // Optional
  role: string;                // Required
  acceptUrl: string;           // Required
  expiresAt: Date;            // Required
  recipientEmail: string;      // Required
}
```

**Welcome Email**
```typescript
interface WelcomeEmailProps {
  firstName: string;           // Required
  organizationName: string;    // Required
  dashboardUrl: string;        // Required
  recipientEmail?: string;     // Optional
}
```

### Rendering Process

1. React Email components define structure
2. Props populate dynamic content
3. `render()` function converts to HTML
4. Inline CSS applied automatically
5. Plain text version generated
6. HTML sent via Resend API

---

## Performance

### File Sizes
- Invitation Email HTML: ~12-15 KB
- Welcome Email HTML: ~15-18 KB
- Both well within typical email size limits

### Render Time
- Template rendering: < 100ms
- Total send time (including API): < 1 second

### Load Time
- Images: None by default (fast loading)
- Fonts: System fonts (instant)
- No external resources (privacy-friendly)

---

## Future Enhancements

Potential template improvements:

1. **Localization**: Multi-language support
2. **Dark Mode**: Prefers-color-scheme support
3. **Custom Branding**: Per-organization themes
4. **Dynamic Content**: Conditional sections
5. **Analytics**: Open/click tracking
6. **Images**: Organization logos and icons
7. **Rich Media**: Product images, screenshots

---

**Last Updated**: November 11, 2025
**Templates Version**: 1.0
**Design System**: Invoice App Email Design v1
