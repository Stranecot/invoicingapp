import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

/**
 * This endpoint manually syncs the current logged-in user to the database
 * Useful for existing users who signed up before webhooks were configured
 */
export async function POST() {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user already exists by Clerk ID
    const existingUserByClerkId = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (existingUserByClerkId) {
      return NextResponse.json({
        message: 'User already exists in database',
        user: existingUserByClerkId,
      });
    }

    // Get primary email
    const primaryEmail = clerkUser.emailAddresses.find(
      (email) => email.id === clerkUser.primaryEmailAddressId
    );

    if (!primaryEmail) {
      return NextResponse.json(
        { error: 'No primary email found' },
        { status: 400 }
      );
    }

    // Check if email already exists (from seed data or previous user)
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: primaryEmail.emailAddress },
    });

    // If email exists, update the Clerk ID instead of creating new user
    if (existingUserByEmail) {
      const updatedUser = await prisma.user.update({
        where: { email: primaryEmail.emailAddress },
        data: {
          clerkId: clerkUser.id,
          name: clerkUser.firstName && clerkUser.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`
            : clerkUser.firstName || clerkUser.lastName || existingUserByEmail.name,
        },
      });

      return NextResponse.json({
        message: 'User successfully linked to existing account',
        user: updatedUser,
      });
    }

    // Create new user in database
    const newUser = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: primaryEmail.emailAddress,
        name: clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.firstName || clerkUser.lastName || null,
        role: 'USER', // Default role
        company: {
          create: {
            name: 'My Company',
            email: primaryEmail.emailAddress,
            taxRate: 0,
          },
        },
      },
    });

    return NextResponse.json({
      message: 'User successfully synced to database',
      user: newUser,
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: 'Failed to sync user', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
