import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Check if Clerk is configured
const isClerkConfigured =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'your_clerk_publishable_key_here' &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_');

// Simple passthrough middleware for when Clerk is not configured
async function passthroughMiddleware(request: NextRequest) {
  // Development mode - no authentication
  return NextResponse.next();
}

// Lazy-load Clerk middleware only when configured
async function getClerkMiddleware() {
  if (!isClerkConfigured) {
    return passthroughMiddleware;
  }

  const { clerkMiddleware, createRouteMatcher } = await import('@clerk/nextjs/server');

  // Define public routes that don't require authentication
  const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks/clerk(.*)',
  ]);

  // Return Clerk-protected middleware
  return clerkMiddleware(async (auth, request) => {
    // Protect all routes except public ones
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  });
}

// Initialize middleware
const middlewarePromise = getClerkMiddleware();

// Export middleware function that uses the initialized middleware
export default async function middleware(request: NextRequest) {
  const middlewareFn = await middlewarePromise;
  return middlewareFn(request);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
