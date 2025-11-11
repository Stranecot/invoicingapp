import { redirect } from 'next/navigation';
import { getCurrentUser } from '@invoice-app/auth/server';
import { prisma } from '@invoice-app/database';
import { WelcomeWizard } from '@/components/wizard/welcome-wizard';

export const metadata = {
  title: 'Welcome - Invoice App',
  description: 'Get started with your new account',
};

export default async function WelcomePage() {
  // Get current user
  const user = await getCurrentUser();

  // Redirect to dashboard if user has already completed welcome
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        hasCompletedWelcome: true,
        organization: {
          select: {
            name: true,
          },
        },
      },
    });

    if (dbUser?.hasCompletedWelcome) {
      redirect('/');
    }

    // Get organization name or default
    const organizationName = dbUser?.organization?.name || 'Your Organization';

    return (
      <WelcomeWizard
        organizationName={organizationName}
        userEmail={user.email}
        userName={user.name || undefined}
      />
    );
  }

  // If no user, redirect to sign in
  redirect('/sign-in');
}
