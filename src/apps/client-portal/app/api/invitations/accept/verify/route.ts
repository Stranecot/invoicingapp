import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isInvitationExpired } from '@invoice-app/database';
import { isValidTokenFormat } from '@/lib/invitation-cookie';

/**
 * Rate limiting map: IP -> { count, resetTime }
 * In production, use Redis or a proper rate limiting solution
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple rate limiting implementation
 * Limits to 5 requests per minute per IP
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const limit = 5;
  const windowMs = 60000; // 1 minute

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    // New window
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count };
}

/**
 * GET /api/invitations/accept/verify
 * Verifies if an invitation token is valid (public endpoint, no auth required)
 *
 * Query params:
 * - token: The invitation token from the email link
 *
 * Response:
 * - 200: { valid: true, invitation: { email, organizationName, role, expiresAt } }
 * - 200: { valid: false, reason: "expired"|"not_found"|"already_used" }
 * - 400: { error: "Missing or invalid token" }
 * - 429: { error: "Rate limit exceeded" }
 * - 500: { error: "Internal server error" }
 */
export async function GET(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    // Check rate limit
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + 60),
          },
        }
      );
    }

    // Get token from query params
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing token parameter' },
        { status: 400 }
      );
    }

    // Validate token format
    if (!isValidTokenFormat(token)) {
      return NextResponse.json(
        { valid: false, reason: 'not_found' },
        {
          status: 200,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        }
      );
    }

    // Look up invitation by token
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    // Token not found
    if (!invitation) {
      return NextResponse.json(
        { valid: false, reason: 'not_found' },
        {
          status: 200,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        }
      );
    }

    // Check if already used
    if (invitation.status === 'ACCEPTED') {
      return NextResponse.json(
        { valid: false, reason: 'already_used' },
        {
          status: 200,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        }
      );
    }

    // Check if revoked
    if (invitation.status === 'REVOKED') {
      return NextResponse.json(
        { valid: false, reason: 'revoked' },
        {
          status: 200,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        }
      );
    }

    // Check if expired
    if (isInvitationExpired(invitation.expiresAt)) {
      // Update status to EXPIRED if not already
      if (invitation.status === 'PENDING') {
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: 'EXPIRED' },
        });
      }

      return NextResponse.json(
        { valid: false, reason: 'expired' },
        {
          status: 200,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        }
      );
    }

    // Check if status is PENDING
    if (invitation.status !== 'PENDING') {
      return NextResponse.json(
        { valid: false, reason: 'not_found' },
        {
          status: 200,
          headers: {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        }
      );
    }

    // Invitation is valid
    return NextResponse.json(
      {
        valid: true,
        invitation: {
          email: invitation.email,
          organizationName: invitation.organization.name,
          role: invitation.role,
          expiresAt: invitation.expiresAt.toISOString(),
        },
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
  } catch (error) {
    console.error('Error verifying invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
