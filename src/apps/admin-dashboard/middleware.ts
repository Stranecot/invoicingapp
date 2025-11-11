import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@invoice-app/database';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/unauthorized']);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // If the user is not authenticated and the route is not public, redirect to sign-in
  if (!isPublicRoute(req) && !userId) {
    return NextResponse.redirect(new URL('/sign-in', req.url));
  }

  // If authenticated, check if user has ADMIN role
  if (userId && !isPublicRoute(req)) {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { role: true },
      });

      // If user doesn't exist or is not an admin, redirect to unauthorized page
      if (!user || user.role !== 'ADMIN') {
        console.log(`Unauthorized access attempt by user ${userId} with role ${user?.role || 'unknown'}`);
        return NextResponse.redirect(new URL('/unauthorized', req.url));
      }

      // User is admin, allow access
      console.log(`Admin access granted for user ${userId}`);
    } catch (error) {
      console.error('Error checking user role in middleware:', error);
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
