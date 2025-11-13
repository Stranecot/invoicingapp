import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPlans() {
  console.log('Seeding subscription plans...');

  // Create default plans
  const plans = [
    {
      name: 'Free',
      slug: 'free',
      description: 'Perfect for getting started with basic invoicing',
      price: 0,
      currency: 'USD',
      maxUsers: 1,
      maxInvoices: 10,
      maxCustomers: 10,
      maxExpenses: 50,
      features: ['basic_invoicing', 'basic_expenses'],
      isActive: true,
      isPublic: true,
      sortOrder: 1,
    },
    {
      name: 'Pro',
      slug: 'pro',
      description: 'For growing businesses that need more power',
      price: 29,
      currency: 'USD',
      maxUsers: 5,
      maxInvoices: 100,
      maxCustomers: 100,
      maxExpenses: 500,
      features: [
        'basic_invoicing',
        'basic_expenses',
        'advanced_reports',
        'custom_branding',
        'team_collaboration',
        'email_support',
      ],
      isActive: true,
      isPublic: true,
      sortOrder: 2,
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Unlimited everything for large organizations',
      price: 99,
      currency: 'USD',
      maxUsers: 999999,
      maxInvoices: -1, // Unlimited
      maxCustomers: -1, // Unlimited
      maxExpenses: -1, // Unlimited
      features: [
        'basic_invoicing',
        'basic_expenses',
        'advanced_reports',
        'custom_branding',
        'team_collaboration',
        'email_support',
        'api_access',
        'priority_support',
        'custom_integrations',
        'dedicated_account_manager',
      ],
      isActive: true,
      isPublic: true,
      sortOrder: 3,
    },
  ];

  for (const plan of plans) {
    const existingPlan = await prisma.subscriptionPlan.findUnique({
      where: { slug: plan.slug },
    });

    if (existingPlan) {
      console.log(`Plan "${plan.name}" already exists, updating...`);
      await prisma.subscriptionPlan.update({
        where: { slug: plan.slug },
        data: plan,
      });
    } else {
      console.log(`Creating plan "${plan.name}"...`);
      await prisma.subscriptionPlan.create({
        data: plan,
      });
    }
  }

  // Link existing organizations to plans based on their current enum value
  console.log('Linking existing organizations to plans...');

  const freePlan = await prisma.subscriptionPlan.findUnique({ where: { slug: 'free' } });
  const proPlan = await prisma.subscriptionPlan.findUnique({ where: { slug: 'pro' } });
  const enterprisePlan = await prisma.subscriptionPlan.findUnique({ where: { slug: 'enterprise' } });

  if (freePlan && proPlan && enterprisePlan) {
    // Update organizations with FREE plan
    await prisma.organization.updateMany({
      where: { plan: 'FREE', planId: null },
      data: { planId: freePlan.id },
    });

    // Update organizations with PRO plan
    await prisma.organization.updateMany({
      where: { plan: 'PRO', planId: null },
      data: { planId: proPlan.id },
    });

    // Update organizations with ENTERPRISE plan
    await prisma.organization.updateMany({
      where: { plan: 'ENTERPRISE', planId: null },
      data: { planId: enterprisePlan.id },
    });

    console.log('Successfully linked organizations to plans');
  }

  console.log('Subscription plans seeded successfully!');
}

seedPlans()
  .catch((e) => {
    console.error('Error seeding plans:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
