/**
 * Welcome Email Template
 * Sent after user accepts invitation and completes signup
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

interface WelcomeEmailProps {
  firstName: string;
  organizationName: string;
  dashboardUrl: string;
  recipientEmail?: string;
}

export default function WelcomeEmail({
  firstName = 'John',
  organizationName = 'Acme Corporation',
  dashboardUrl = 'https://app.example.com/dashboard',
  recipientEmail = 'user@example.com',
}: WelcomeEmailProps) {
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
            <Text style={heading}>Welcome to {organizationName}! 🎉</Text>

            <Text style={greeting}>Hi {firstName},</Text>

            <Text style={paragraph}>
              We're excited to have you on board! Your account has been successfully set up,
              and you're now part of the <strong>{organizationName}</strong> team.
            </Text>

            <Text style={paragraph}>
              Here's what you can do now:
            </Text>

            {/* Feature List */}
            <Section style={featureList}>
              <Text style={featureItem}>✓ Create and manage invoices</Text>
              <Text style={featureItem}>✓ Track customer payments</Text>
              <Text style={featureItem}>✓ Generate professional PDFs</Text>
              <Text style={featureItem}>✓ Collaborate with your team</Text>
              <Text style={featureItem}>✓ Access financial reports</Text>
            </Section>

            {/* Call to Action Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={dashboardUrl}>
                Go to Dashboard
              </Button>
            </Section>

            <Hr style={hr} />

            {/* Getting Started Section */}
            <Text style={sectionTitle}>🚀 Quick Start Guide</Text>

            <Section style={stepBox}>
              <Text style={stepNumber}>1</Text>
              <Section style={stepContent}>
                <Text style={stepTitle}>Complete Your Profile</Text>
                <Text style={stepText}>
                  Add your details and preferences to personalize your experience.
                </Text>
              </Section>
            </Section>

            <Section style={stepBox}>
              <Text style={stepNumber}>2</Text>
              <Section style={stepContent}>
                <Text style={stepTitle}>Create Your First Invoice</Text>
                <Text style={stepText}>
                  Use our intuitive invoice builder to create professional invoices in minutes.
                </Text>
              </Section>
            </Section>

            <Section style={stepBox}>
              <Text style={stepNumber}>3</Text>
              <Section style={stepContent}>
                <Text style={stepTitle}>Invite Team Members</Text>
                <Text style={stepText}>
                  Collaborate with your team by inviting colleagues to join your organization.
                </Text>
              </Section>
            </Section>

            <Hr style={hr} />

            {/* Support Section */}
            <Text style={paragraph}>
              Need help getting started? Our team is here to assist you.
            </Text>

            <Section style={supportBox}>
              <Text style={supportText}>
                📚 <Link href={`${dashboardUrl}/help`} style={link}>Browse Documentation</Link>
                <br />
                💬 <Link href={`${dashboardUrl}/support`} style={link}>Contact Support</Link>
                <br />
                🎥 <Link href={`${dashboardUrl}/tutorials`} style={link}>Watch Video Tutorials</Link>
              </Text>
            </Section>

            <Text style={paragraph}>
              We're thrilled to have you as part of our community and look forward to helping
              you streamline your invoicing workflow!
            </Text>

            <Text style={signature}>
              Best regards,
              <br />
              The {organizationName} Team
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
              This email was sent to <strong>{recipientEmail}</strong>
            </Text>
            <Text style={footerText}>
              <Link href={`${dashboardUrl}/settings/notifications`} style={link}>
                Email Preferences
              </Link>
              {' · '}
              <Link href={`${dashboardUrl}/help`} style={link}>
                Help Center
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

const heading = {
  fontSize: '28px',
  fontWeight: 'bold',
  lineHeight: '36px',
  color: '#1e293b',
  marginTop: '32px',
  marginBottom: '24px',
  textAlign: 'center' as const,
};

const greeting = {
  fontSize: '18px',
  lineHeight: '26px',
  marginTop: '24px',
  marginBottom: '8px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#334155',
  marginTop: '16px',
  marginBottom: '16px',
};

const featureList = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px 24px',
  marginTop: '20px',
  marginBottom: '20px',
};

const featureItem = {
  fontSize: '15px',
  lineHeight: '28px',
  color: '#334155',
  margin: '4px 0',
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
  padding: '14px 40px',
};

const hr = {
  borderColor: '#e2e8f0',
  marginTop: '32px',
  marginBottom: '32px',
};

const sectionTitle = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1e293b',
  marginTop: '24px',
  marginBottom: '20px',
};

const stepBox = {
  display: 'flex',
  marginBottom: '20px',
  alignItems: 'flex-start' as const,
};

const stepNumber = {
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold',
  borderRadius: '50%',
  width: '36px',
  height: '36px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '16px',
  flexShrink: 0,
  textAlign: 'center' as const,
  lineHeight: '36px',
};

const stepContent = {
  flex: 1,
};

const stepTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#1e293b',
  margin: '0 0 4px 0',
};

const stepText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#64748b',
  margin: '0',
};

const supportBox = {
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  padding: '20px 24px',
  marginTop: '20px',
  marginBottom: '20px',
};

const supportText = {
  fontSize: '15px',
  lineHeight: '28px',
  color: '#334155',
  margin: '0',
};

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
};

const signature = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#334155',
  marginTop: '32px',
  marginBottom: '24px',
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
