/**
 * Email Service Package
 * Provides email sending functionality using Resend
 * @package @invoice-app/email
 */

import { render } from '@react-email/components';
import { initializeEmailClient, sendEmail, getEmailConfig, isEmailClientReady, isValidEmail } from './client';
import { InvitationEmail, WelcomeEmail } from './templates';
import type { EmailConfig, InvitationEmailData, WelcomeEmailData, EmailResult } from './types';

// Re-export types
export type { EmailConfig, InvitationEmailData, WelcomeEmailData, EmailResult, SendEmailOptions } from './types';

// Re-export client functions
export { initializeEmailClient, sendEmail, getEmailConfig, isEmailClientReady, isValidEmail };

// Re-export templates for preview/testing
export { InvitationEmail, WelcomeEmail };

/**
 * Send an invitation email to a new user
 * @param data Invitation email data including organization info and invitation details
 * @returns EmailResult with success status and message ID or error
 */
export async function sendInvitationEmail(data: InvitationEmailData): Promise<EmailResult> {
  try {
    // Validate email address
    if (!isValidEmail(data.to)) {
      return {
        success: false,
        error: `Invalid email address: ${data.to}`,
      };
    }

    // Render the React email template to HTML
    const html = await render(
      InvitationEmail({
        organizationName: data.organizationName,
        inviterName: data.inviterName,
        role: data.role,
        acceptUrl: data.acceptUrl,
        expiresAt: data.expiresAt,
        recipientEmail: data.to,
      })
    );

    // Send the email
    const result = await sendEmail({
      to: data.to,
      subject: `You've been invited to join ${data.organizationName}`,
      html,
      text: `You've been invited to join ${data.organizationName} as a ${data.role}. Accept your invitation: ${data.acceptUrl}`,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[Email] Error sending invitation email:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send a welcome email to a newly registered user
 * @param data Welcome email data including user name and organization info
 * @returns EmailResult with success status and message ID or error
 */
export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<EmailResult> {
  try {
    // Validate email address
    if (!isValidEmail(data.to)) {
      return {
        success: false,
        error: `Invalid email address: ${data.to}`,
      };
    }

    // Render the React email template to HTML
    const html = await render(
      WelcomeEmail({
        firstName: data.firstName,
        organizationName: data.organizationName,
        dashboardUrl: data.dashboardUrl,
        recipientEmail: data.to,
      })
    );

    // Send the email
    const result = await sendEmail({
      to: data.to,
      subject: `Welcome to ${data.organizationName}!`,
      html,
      text: `Welcome to ${data.organizationName}! Your account is ready. Access your dashboard: ${data.dashboardUrl}`,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[Email] Error sending welcome email:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
