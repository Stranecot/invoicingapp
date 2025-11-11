/**
 * Email client using Resend for sending emails
 * Handles email delivery with error handling and logging
 */

import { Resend } from 'resend';
import type { EmailConfig, SendEmailOptions, EmailResult } from './types';

let resendClient: Resend | null = null;
let emailConfig: EmailConfig | null = null;

/**
 * Initialize the email client with configuration
 * Call this before sending any emails
 */
export function initializeEmailClient(config: EmailConfig): void {
  if (!config.apiKey) {
    throw new Error('Email API key is required');
  }
  if (!config.fromEmail) {
    throw new Error('From email address is required');
  }

  emailConfig = config;
  resendClient = new Resend(config.apiKey);

  console.log('[Email] Client initialized with from:', config.fromEmail);
}

/**
 * Get the initialized email client
 * @throws Error if client not initialized
 */
function getClient(): Resend {
  if (!resendClient || !emailConfig) {
    throw new Error('Email client not initialized. Call initializeEmailClient() first.');
  }
  return resendClient;
}

/**
 * Get the email configuration
 * @throws Error if config not set
 */
export function getEmailConfig(): EmailConfig {
  if (!emailConfig) {
    throw new Error('Email client not initialized. Call initializeEmailClient() first.');
  }
  return emailConfig;
}

/**
 * Send an email using the Resend API
 * Handles errors gracefully and returns success status
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  try {
    const client = getClient();
    const config = getEmailConfig();

    console.log('[Email] Sending email to:', options.to);
    console.log('[Email] Subject:', options.subject);

    const { data, error } = await client.emails.send({
      from: config.fromName
        ? `${config.fromName} <${config.fromEmail}>`
        : config.fromEmail,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo || config.replyTo,
    });

    if (error) {
      console.error('[Email] Failed to send email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }

    console.log('[Email] Email sent successfully. Message ID:', data?.id);
    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[Email] Error sending email:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Check if email client is initialized and ready to send
 */
export function isEmailClientReady(): boolean {
  return resendClient !== null && emailConfig !== null;
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
