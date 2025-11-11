/**
 * Email service types for invoice-app
 */

export interface EmailConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
}

export interface InvitationEmailData {
  to: string;
  organizationName: string;
  inviterName?: string;
  role: string;
  token: string;
  expiresAt: Date;
  acceptUrl: string;
}

export interface WelcomeEmailData {
  to: string;
  firstName: string;
  organizationName: string;
  dashboardUrl: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}
