/**
 * Email service initialization for client-portal app
 * Initializes the email client with environment configuration
 */

import { initializeEmailClient, isEmailClientReady } from '@invoice-app/email';

let initialized = false;

/**
 * Initialize email client if not already initialized
 * Safe to call multiple times - will only initialize once
 */
export function ensureEmailClientInitialized(): boolean {
  // Skip if already initialized
  if (initialized && isEmailClientReady()) {
    return true;
  }

  // Check if required environment variables are set
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    console.warn('[Email] Email service not configured. Set RESEND_API_KEY and FROM_EMAIL in .env.local');
    return false;
  }

  // Validate API key format
  if (!apiKey.startsWith('re_')) {
    console.warn('[Email] Invalid RESEND_API_KEY format. API key should start with "re_"');
    return false;
  }

  try {
    initializeEmailClient({
      apiKey,
      fromEmail,
      fromName: process.env.FROM_NAME || 'Invoice App',
      replyTo: process.env.REPLY_TO_EMAIL,
    });

    initialized = true;
    console.log('[Email] Email client initialized successfully');
    return true;
  } catch (error) {
    console.error('[Email] Failed to initialize email client:', error);
    return false;
  }
}

/**
 * Get the app URL from environment or fallback to localhost
 */
export function getAppUrl(): string {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

/**
 * In development mode, override recipient email if DEV_EMAIL_TO is set
 */
export function getRecipientEmail(originalEmail: string): string {
  if (process.env.NODE_ENV === 'development' && process.env.DEV_EMAIL_TO) {
    console.log(`[Email] Development mode: Redirecting email from ${originalEmail} to ${process.env.DEV_EMAIL_TO}`);
    return process.env.DEV_EMAIL_TO;
  }
  return originalEmail;
}
