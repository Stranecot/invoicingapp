/**
 * Unit tests for email service
 * Tests email sending, template rendering, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockResend, setupResendMock, resetResendMock } from '../../../../test/mocks/resend';

// Mock Resend
const mockResend = new MockResend();
vi.mock('resend', () => ({
  Resend: vi.fn(() => mockResend),
}));

// Mock React Email
vi.mock('@react-email/components', () => ({
  render: vi.fn((component) => Promise.resolve('<html>Mocked Email</html>')),
}));

// Import after mocks
import {
  initializeEmailClient,
  sendEmail,
  getEmailConfig,
  isEmailClientReady,
  isValidEmail,
  sendInvitationEmail,
  sendWelcomeEmail,
} from './index';

describe('email service', () => {
  beforeEach(() => {
    resetResendMock(mockResend);
    // Re-initialize the client for each test
    initializeEmailClient({
      apiKey: 'test-api-key',
      fromEmail: 'test@example.com',
      fromName: 'Test Service',
    });
  });

  describe('initializeEmailClient', () => {
    it('should initialize client with valid config', () => {
      initializeEmailClient({
        apiKey: 'test-key',
        fromEmail: 'test@example.com',
      });

      expect(isEmailClientReady()).toBe(true);
    });

    it('should throw error when API key is missing', () => {
      expect(() => {
        initializeEmailClient({
          apiKey: '',
          fromEmail: 'test@example.com',
        });
      }).toThrow('Email API key is required');
    });

    it('should throw error when from email is missing', () => {
      expect(() => {
        initializeEmailClient({
          apiKey: 'test-key',
          fromEmail: '',
        });
      }).toThrow('From email address is required');
    });

    it('should accept optional fromName and replyTo', () => {
      initializeEmailClient({
        apiKey: 'test-key',
        fromEmail: 'test@example.com',
        fromName: 'Test Name',
        replyTo: 'reply@example.com',
      });

      const config = getEmailConfig();
      expect(config.fromName).toBe('Test Name');
      expect(config.replyTo).toBe('reply@example.com');
    });
  });

  describe('getEmailConfig', () => {
    it('should return current email config', () => {
      const config = getEmailConfig();

      expect(config.apiKey).toBe('test-api-key');
      expect(config.fromEmail).toBe('test@example.com');
      expect(config.fromName).toBe('Test Service');
    });
  });

  describe('isEmailClientReady', () => {
    it('should return true when client is initialized', () => {
      expect(isEmailClientReady()).toBe(true);
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test @example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      setupResendMock(mockResend, { shouldSucceed: true });

      const result = await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(mockResend.emails.send).toHaveBeenCalled();
    });

    it('should handle single recipient', async () => {
      const result = await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(true);
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['recipient@example.com'],
        })
      );
    });

    it('should handle multiple recipients', async () => {
      const result = await sendEmail({
        to: ['recipient1@example.com', 'recipient2@example.com'],
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(true);
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['recipient1@example.com', 'recipient2@example.com'],
        })
      );
    });

    it('should include from name in email', async () => {
      const result = await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Test Service <test@example.com>',
        })
      );
    });

    it('should include reply-to if provided', async () => {
      const result = await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        replyTo: 'custom-reply@example.com',
      });

      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          reply_to: 'custom-reply@example.com',
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      setupResendMock(mockResend, {
        shouldSucceed: false,
        error: 'API rate limit exceeded',
      });

      const result = await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle network errors', async () => {
      mockResend.emails.send.mockRejectedValue(new Error('Network error'));

      const result = await sendEmail({
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('sendInvitationEmail', () => {
    it('should send invitation email successfully', async () => {
      setupResendMock(mockResend, { shouldSucceed: true });

      const result = await sendInvitationEmail({
        to: 'invited@example.com',
        organizationName: 'Test Org',
        inviterName: 'John Doe',
        role: 'USER',
        acceptUrl: 'https://example.com/accept/token123',
        expiresAt: new Date('2024-12-31'),
      });

      expect(result.success).toBe(true);
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['invited@example.com'],
          subject: "You've been invited to join Test Org",
        })
      );
    });

    it('should reject invalid email address', async () => {
      const result = await sendInvitationEmail({
        to: 'invalid-email',
        organizationName: 'Test Org',
        inviterName: 'John Doe',
        role: 'USER',
        acceptUrl: 'https://example.com/accept/token123',
        expiresAt: new Date('2024-12-31'),
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email address');
      expect(mockResend.emails.send).not.toHaveBeenCalled();
    });

    it('should include both HTML and text versions', async () => {
      setupResendMock(mockResend, { shouldSucceed: true });

      const result = await sendInvitationEmail({
        to: 'invited@example.com',
        organizationName: 'Test Org',
        inviterName: 'John Doe',
        role: 'ADMIN',
        acceptUrl: 'https://example.com/accept/token123',
        expiresAt: new Date('2024-12-31'),
      });

      expect(result.success).toBe(true);
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.any(String),
          text: expect.stringContaining('Test Org'),
        })
      );
    });

    it('should handle email sending errors', async () => {
      setupResendMock(mockResend, {
        shouldSucceed: false,
        error: 'Failed to send',
      });

      const result = await sendInvitationEmail({
        to: 'invited@example.com',
        organizationName: 'Test Org',
        inviterName: 'John Doe',
        role: 'USER',
        acceptUrl: 'https://example.com/accept/token123',
        expiresAt: new Date('2024-12-31'),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      setupResendMock(mockResend, { shouldSucceed: true });

      const result = await sendWelcomeEmail({
        to: 'newuser@example.com',
        firstName: 'John',
        organizationName: 'Test Org',
        dashboardUrl: 'https://example.com/dashboard',
      });

      expect(result.success).toBe(true);
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['newuser@example.com'],
          subject: 'Welcome to Test Org!',
        })
      );
    });

    it('should reject invalid email address', async () => {
      const result = await sendWelcomeEmail({
        to: 'invalid',
        firstName: 'John',
        organizationName: 'Test Org',
        dashboardUrl: 'https://example.com/dashboard',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email address');
      expect(mockResend.emails.send).not.toHaveBeenCalled();
    });

    it('should include both HTML and text versions', async () => {
      setupResendMock(mockResend, { shouldSucceed: true });

      const result = await sendWelcomeEmail({
        to: 'newuser@example.com',
        firstName: 'John',
        organizationName: 'Test Org',
        dashboardUrl: 'https://example.com/dashboard',
      });

      expect(result.success).toBe(true);
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.any(String),
          text: expect.stringContaining('Test Org'),
        })
      );
    });

    it('should handle email sending errors', async () => {
      setupResendMock(mockResend, {
        shouldSucceed: false,
        error: 'Failed to send',
      });

      const result = await sendWelcomeEmail({
        to: 'newuser@example.com',
        firstName: 'John',
        organizationName: 'Test Org',
        dashboardUrl: 'https://example.com/dashboard',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle undefined errors gracefully', async () => {
      mockResend.emails.send.mockRejectedValue('string error');

      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error occurred');
    });

    it('should handle template rendering errors', async () => {
      const { render } = await import('@react-email/components');
      vi.mocked(render).mockRejectedValueOnce(new Error('Template error'));

      const result = await sendInvitationEmail({
        to: 'test@example.com',
        organizationName: 'Test',
        inviterName: 'Test',
        role: 'USER',
        acceptUrl: 'https://example.com/test',
        expiresAt: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Template error');
    });
  });
});
