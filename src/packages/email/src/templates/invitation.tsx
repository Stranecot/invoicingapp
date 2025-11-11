/**
 * Invitation Email Template
 * Professional email template for sending organization invitations
 * Uses React Email components for cross-client compatibility
 */

import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Link,
} from '@react-email/components';

interface InvitationEmailProps {
  organizationName: string;
  inviterName?: string;
  role: string;
  acceptUrl: string;
  expiresAt: Date;
  recipientEmail: string;
}

export default function InvitationEmail({
  organizationName = 'Acme Corporation',
  inviterName,
  role = 'User',
  acceptUrl = 'https://app.example.com/invitations/accept/token123',
  expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  recipientEmail = 'user@example.com',
}: InvitationEmailProps) {
  const expiryDate = expiresAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const daysUntilExpiry = Math.ceil(
    (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          {/* Header Section */}
          <Section style={header}>
            <Text style={logoText}>{organizationName}</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Text style={greeting}>Hello,</Text>

            <Text style={paragraph}>
              {inviterName ? (
                <>
                  <strong>{inviterName}</strong> has invited you to join{' '}
                  <strong>{organizationName}</strong> on our invoicing platform.
                </>
              ) : (
                <>
                  You've been invited to join <strong>{organizationName}</strong> on our
                  invoicing platform.
                </>
              )}
            </Text>

            <Section style={roleBox}>
              <Text style={roleLabel}>Your Role</Text>
              <Text style={roleValue}>{role}</Text>
            </Section>

            <Text style={paragraph}>
              As a <strong>{role}</strong>, you'll be able to access the organization's
              invoicing tools and collaborate with your team.
            </Text>

            {/* Call to Action Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={acceptUrl}>
                Accept Invitation
              </Button>
            </Section>

            {/* Alternative Link */}
            <Text style={alternativeLink}>
              Or copy and paste this link into your browser:
              <br />
              <Link href={acceptUrl} style={link}>
                {acceptUrl}
              </Link>
            </Text>

            {/* Expiry Warning */}
            <Section style={expiryBox}>
              <Text style={expiryText}>
                ⏰ This invitation expires in <strong>{daysUntilExpiry} days</strong> ({expiryDate})
              </Text>
            </Section>

            <Hr style={hr} />

            {/* Security Notice */}
            <Text style={footnote}>
              This invitation was sent to <strong>{recipientEmail}</strong>. If you weren't
              expecting this invitation, you can safely ignore this email.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              {organizationName}
              <br />
              Powered by Invoice App
            </Text>
            <Text style={footerText}>
              Need help? Contact{' '}
              <Link href={`mailto:support@${organizationName.toLowerCase().replace(/\s+/g, '')}.com`} style={link}>
                support
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles using inline CSS for email client compatibility
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#1e293b',
  padding: '24px 48px',
  textAlign: 'center' as const,
};

const logoText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const content = {
  padding: '0 48px',
};

const greeting = {
  fontSize: '18px',
  lineHeight: '26px',
  marginTop: '32px',
  marginBottom: '8px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#334155',
  marginTop: '16px',
  marginBottom: '16px',
};

const roleBox = {
  backgroundColor: '#f1f5f9',
  borderRadius: '8px',
  padding: '16px 24px',
  marginTop: '24px',
  marginBottom: '24px',
  textAlign: 'center' as const,
};

const roleLabel = {
  fontSize: '14px',
  color: '#64748b',
  textTransform: 'uppercase' as const,
  fontWeight: '600',
  letterSpacing: '0.5px',
  margin: '0 0 4px 0',
};

const roleValue = {
  fontSize: '20px',
  color: '#1e293b',
  fontWeight: 'bold',
  margin: '0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  marginTop: '32px',
  marginBottom: '32px',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const alternativeLink = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#64748b',
  textAlign: 'center' as const,
  marginTop: '16px',
  marginBottom: '32px',
};

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
};

const expiryBox = {
  backgroundColor: '#fef3c7',
  borderLeft: '4px solid #f59e0b',
  borderRadius: '4px',
  padding: '16px 20px',
  marginTop: '24px',
  marginBottom: '24px',
};

const expiryText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#92400e',
  margin: '0',
};

const hr = {
  borderColor: '#e2e8f0',
  marginTop: '32px',
  marginBottom: '32px',
};

const footnote = {
  fontSize: '12px',
  lineHeight: '20px',
  color: '#64748b',
  marginTop: '16px',
};

const footer = {
  padding: '0 48px',
  marginTop: '32px',
};

const footerText = {
  fontSize: '12px',
  lineHeight: '20px',
  color: '#94a3b8',
  textAlign: 'center' as const,
  margin: '4px 0',
};
