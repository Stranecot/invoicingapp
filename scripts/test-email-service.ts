#!/usr/bin/env tsx

/**
 * Test script for email service
 * Tests email template rendering and sending functionality
 *
 * Usage:
 *   npm run test:email
 *   or
 *   tsx scripts/test-email-service.ts
 *
 * Required environment variables:
 *   RESEND_API_KEY - Resend API key
 *   FROM_EMAIL - Verified sender email address
 *   TEST_EMAIL_TO - Email address to send test emails to
 */

import { render } from '@react-email/components';
import {
  initializeEmailClient,
  sendInvitationEmail,
  sendWelcomeEmail,
  InvitationEmail,
  WelcomeEmail,
} from '../src/packages/email/src';

// Load environment variables
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Try to load .env.local from client-portal app
const envPath = path.join(__dirname, '../src/apps/client-portal/.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✓ Loaded environment from:', envPath);
} else {
  console.warn('⚠ No .env.local found at:', envPath);
  console.log('Looking for environment variables in process.env...');
}

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function success(msg: string) {
  console.log(`${colors.green}✓ ${msg}${colors.reset}`);
}

function error(msg: string) {
  console.log(`${colors.red}✗ ${msg}${colors.reset}`);
}

function info(msg: string) {
  console.log(`${colors.blue}ℹ ${msg}${colors.reset}`);
}

function warn(msg: string) {
  console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`);
}

function section(title: string) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}`);
  console.log(`${title}`);
  console.log(`${'='.repeat(60)}${colors.reset}\n`);
}

async function main() {
  console.log('\n📧 Email Service Test Suite\n');

  // Check environment variables
  section('1. Environment Configuration');

  const requiredEnvVars = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FROM_EMAIL: process.env.FROM_EMAIL,
    TEST_EMAIL_TO: process.env.TEST_EMAIL_TO || process.env.DEV_EMAIL_TO,
  };

  let hasErrors = false;

  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      error(`Missing environment variable: ${key}`);
      hasErrors = true;
    } else {
      // Mask sensitive values
      const displayValue = key === 'RESEND_API_KEY'
        ? value.substring(0, 7) + '...'
        : value;
      success(`${key}: ${displayValue}`);
    }
  }

  if (hasErrors) {
    error('\nPlease set the required environment variables and try again.');
    process.exit(1);
  }

  const testEmailTo = requiredEnvVars.TEST_EMAIL_TO!;

  // Initialize email client
  section('2. Initialize Email Client');

  try {
    initializeEmailClient({
      apiKey: requiredEnvVars.RESEND_API_KEY!,
      fromEmail: requiredEnvVars.FROM_EMAIL!,
      fromName: process.env.FROM_NAME || 'Invoice App Test',
    });
    success('Email client initialized successfully');
  } catch (err) {
    error(`Failed to initialize email client: ${err}`);
    process.exit(1);
  }

  // Test invitation email template rendering
  section('3. Test Invitation Email Template Rendering');

  try {
    const invitationHtml = await render(
      InvitationEmail({
        organizationName: 'Acme Corporation',
        inviterName: 'John Doe',
        role: 'User',
        acceptUrl: 'https://app.example.com/invitations/accept/test-token-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        recipientEmail: testEmailTo,
      })
    );

    success('Invitation template rendered successfully');
    info(`HTML length: ${invitationHtml.length} characters`);

    // Save to file for inspection
    const outputPath = path.join(__dirname, 'test-invitation-email.html');
    fs.writeFileSync(outputPath, invitationHtml);
    success(`Saved to: ${outputPath}`);
  } catch (err) {
    error(`Failed to render invitation template: ${err}`);
  }

  // Test welcome email template rendering
  section('4. Test Welcome Email Template Rendering');

  try {
    const welcomeHtml = await render(
      WelcomeEmail({
        firstName: 'Jane',
        organizationName: 'Acme Corporation',
        dashboardUrl: 'https://app.example.com/dashboard',
        recipientEmail: testEmailTo,
      })
    );

    success('Welcome template rendered successfully');
    info(`HTML length: ${welcomeHtml.length} characters`);

    // Save to file for inspection
    const outputPath = path.join(__dirname, 'test-welcome-email.html');
    fs.writeFileSync(outputPath, welcomeHtml);
    success(`Saved to: ${outputPath}`);
  } catch (err) {
    error(`Failed to render welcome template: ${err}`);
  }

  // Ask user if they want to send real emails
  section('5. Send Test Emails');

  info(`Test emails will be sent to: ${testEmailTo}`);

  // In automated mode, skip actual sending
  if (process.env.AUTO_TEST === 'true') {
    warn('AUTO_TEST=true, skipping actual email sending');
  } else {
    warn('Set SEND_EMAILS=true to actually send test emails');

    if (process.env.SEND_EMAILS === 'true') {
      // Send invitation email
      try {
        info('Sending invitation email...');
        const result = await sendInvitationEmail({
          to: testEmailTo,
          organizationName: 'Acme Corporation',
          inviterName: 'John Doe',
          role: 'User',
          token: 'test-token-' + Date.now(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          acceptUrl: 'https://app.example.com/invitations/accept/test-token',
        });

        if (result.success) {
          success(`Invitation email sent! Message ID: ${result.messageId}`);
        } else {
          error(`Failed to send invitation email: ${result.error}`);
        }
      } catch (err) {
        error(`Error sending invitation email: ${err}`);
      }

      // Send welcome email
      try {
        info('Sending welcome email...');
        const result = await sendWelcomeEmail({
          to: testEmailTo,
          firstName: 'Jane',
          organizationName: 'Acme Corporation',
          dashboardUrl: 'https://app.example.com/dashboard',
        });

        if (result.success) {
          success(`Welcome email sent! Message ID: ${result.messageId}`);
        } else {
          error(`Failed to send welcome email: ${result.error}`);
        }
      } catch (err) {
        error(`Error sending welcome email: ${err}`);
      }
    }
  }

  // Test error handling
  section('6. Test Error Handling');

  try {
    info('Testing invalid email address...');
    const result = await sendInvitationEmail({
      to: 'invalid-email',
      organizationName: 'Test Org',
      role: 'User',
      token: 'test',
      expiresAt: new Date(),
      acceptUrl: 'https://example.com',
    });

    if (!result.success) {
      success(`Correctly rejected invalid email: ${result.error}`);
    } else {
      warn('Invalid email was accepted (unexpected)');
    }
  } catch (err) {
    error(`Error during error handling test: ${err}`);
  }

  // Summary
  section('Test Summary');

  success('Email service tests completed!');
  info('\nNext steps:');
  console.log('  1. Review the generated HTML files in scripts/');
  console.log('  2. Set SEND_EMAILS=true to send actual test emails');
  console.log('  3. Check your inbox at:', testEmailTo);
  console.log('  4. Verify email rendering in different email clients\n');
}

// Run tests
main().catch((err) => {
  error(`Fatal error: ${err}`);
  process.exit(1);
});
