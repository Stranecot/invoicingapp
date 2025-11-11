import { prisma } from '../src/index';

async function main() {
  console.log('Starting production seed...');

  // First, clean up any existing fake test users
  console.log('Cleaning up test users...');

  const testClerkIds = [
    'admin_test_clerk_id',
    'user1_test_clerk_id',
    'user2_test_clerk_id',
    'accountant_test_clerk_id',
  ];

  for (const clerkId of testClerkIds) {
    try {
      const user = await prisma.user.findUnique({ where: { clerkId } });
      if (user) {
        await prisma.user.delete({ where: { clerkId } });
        console.log(`Deleted test user: ${clerkId}`);
      }
    } catch (error) {
      // User might not exist or already deleted
      console.log(`Test user ${clerkId} not found or already deleted`);
    }
  }

  // Check if expense categories already exist
  const existingCategories = await prisma.expenseCategory.count();

  if (existingCategories > 0) {
    console.log(`${existingCategories} expense categories already exist. Skipping category creation.`);
  } else {
    console.log('Creating default expense categories...');

    const categories = [
      'Office Supplies',
      'Travel',
      'Meals & Entertainment',
      'Utilities',
      'Marketing',
      'Software & Subscriptions',
      'Professional Services',
      'Rent',
      'Insurance',
      'Other',
    ];

    for (const categoryName of categories) {
      await prisma.expenseCategory.create({
        data: {
          name: categoryName,
          isCustom: false,
        },
      });
    }
    console.log(`Created ${categories.length} default expense categories`);
  }

  console.log('\n=== Production Seed Complete ===');
  console.log('✅ Test users removed');
  console.log('✅ Default expense categories ready');
  console.log('\nReal users will be created automatically when they sign up through Clerk.');
  console.log('Each user will get their own company profile via the Clerk webhook.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
