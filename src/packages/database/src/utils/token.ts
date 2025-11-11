import crypto from 'crypto';

/**
 * Generates a secure random token for invitation links
 * Uses crypto.randomBytes to generate cryptographically secure random data
 *
 * @param byteLength - The number of random bytes to generate (default: 32)
 * @returns A URL-safe base64-encoded token string
 */
export function generateInvitationToken(byteLength: number = 32): string {
  return crypto.randomBytes(byteLength).toString('base64url');
}

/**
 * Generates an expiration date for an invitation
 *
 * @param daysFromNow - Number of days from now when the invitation expires (default: 7)
 * @returns A Date object representing the expiration time
 */
export function generateInvitationExpiry(daysFromNow: number = 7): Date {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysFromNow);
  return expiryDate;
}

/**
 * Checks if an invitation token has expired
 *
 * @param expiresAt - The expiration date of the invitation
 * @returns true if the invitation has expired, false otherwise
 */
export function isInvitationExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}
