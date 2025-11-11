/**
 * Resend email service mock for testing
 */

import { vi } from 'vitest';

/**
 * Mock Resend client
 */
export class MockResend {
  emails = {
    send: vi.fn().mockResolvedValue({
      id: 'email-test-123',
      from: 'test@example.com',
      to: 'recipient@example.com',
      created_at: new Date().toISOString(),
    }),
  };
}

/**
 * Create a mock Resend instance
 */
export function createMockResend() {
  return new MockResend();
}

/**
 * Setup Resend mock with custom behavior
 */
export function setupResendMock(mockResend: MockResend, config: {
  shouldSucceed?: boolean;
  error?: string;
}) {
  if (config.shouldSucceed === false) {
    mockResend.emails.send.mockRejectedValue(
      new Error(config.error || 'Email sending failed')
    );
  } else {
    mockResend.emails.send.mockResolvedValue({
      id: 'email-test-123',
      from: 'test@example.com',
      to: 'recipient@example.com',
      created_at: new Date().toISOString(),
    });
  }
}

/**
 * Reset Resend mocks
 */
export function resetResendMock(mockResend: MockResend) {
  mockResend.emails.send.mockClear();
  mockResend.emails.send.mockResolvedValue({
    id: 'email-test-123',
    from: 'test@example.com',
    to: 'recipient@example.com',
    created_at: new Date().toISOString(),
  });
}
