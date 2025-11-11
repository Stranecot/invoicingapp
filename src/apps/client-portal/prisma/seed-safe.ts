import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting safe seed (idempotent)...');

  // Check if data already exists
  const existingUsers = await prisma.user.count();

  if (existingUsers > 0) {
    console.log(`Database already has ${existingUsers} users. Skipping seed.`);
    console.log('To reseed, first run: npx prisma migrate reset');
    return;
  }

  console.log('Database is empty. Seeding...');

  // Create Admin User
  const admin = await prisma.user.create({
    data: {
      clerkId: 'admin_test_clerk_id',
      email: 'admin@invoiceapp.com',
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log('Created admin user:', admin.email);

  // Create Regular User 1 (Business Owner)
  const user1 = await prisma.user.create({
    data: {
      clerkId: 'user1_test_clerk_id',
      email: 'john@business.com',
      name: 'John Business',
      role: 'USER',
      company: {
        create: {
          name: 'Acme Corporation',
          email: 'contact@acmecorp.com',
          phone: '+1 (555) 123-4567',
          address: '123 Business Street, Suite 100\nSan Francisco, CA 94105',
          taxRate: 10,
        },
      },
    },
  });
  console.log('Created user1:', user1.email);

  // Create Regular User 2 (Another Business Owner)
  const user2 = await prisma.user.create({
    data: {
      clerkId: 'user2_test_clerk_id',
      email: 'sarah@consulting.com',
      name: 'Sarah Consultant',
      role: 'USER',
      company: {
        create: {
          name: 'Tech Consulting Pro',
          email: 'hello@techconsulting.com',
          phone: '+1 (555) 987-6543',
          address: '456 Tech Avenue\nAustin, TX 78701',
          taxRate: 8.5,
        },
      },
    },
  });
  console.log('Created user2:', user2.email);

  // Create Accountant User
  const accountant = await prisma.user.create({
    data: {
      clerkId: 'accountant_test_clerk_id',
      email: 'accountant@cpa.com',
      name: 'Amy Accountant',
      role: 'ACCOUNTANT',
    },
  });
  console.log('Created accountant:', accountant.email);

  // Create default expense categories
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
  console.log('Created default expense categories');

  // Create customers for user1
  const customer1 = await prisma.customer.create({
    data: {
      userId: user1.id,
      name: 'Global Tech Industries',
      email: 'billing@globaltech.com',
      phone: '+1 (555) 111-2222',
      address: '789 Corporate Blvd\nNew York, NY 10001',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      userId: user1.id,
      name: 'StartUp Innovations LLC',
      email: 'finance@startup.io',
      phone: '+1 (555) 333-4444',
      address: '321 Innovation Drive\nPalo Alto, CA 94301',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      userId: user1.id,
      name: 'Retail Solutions Inc',
      email: 'ap@retailsolutions.com',
      phone: '+1 (555) 555-6666',
    },
  });
  console.log('Created customers for user1');

  // Create customers for user2
  const customer4 = await prisma.customer.create({
    data: {
      userId: user2.id,
      name: 'Enterprise Software Co',
      email: 'accounts@enterprise.com',
      phone: '+1 (555) 777-8888',
      address: '555 Software Park\nSeattle, WA 98101',
    },
  });

  const customer5 = await prisma.customer.create({
    data: {
      userId: user2.id,
      name: 'Digital Marketing Agency',
      email: 'billing@digitalagency.com',
      phone: '+1 (555) 999-0000',
    },
  });
  console.log('Created customers for user2');

  // Assign some customers to accountant
  await prisma.accountantAssignment.createMany({
    data: [
      {
        accountantId: accountant.id,
        customerId: customer1.id,
      },
      {
        accountantId: accountant.id,
        customerId: customer2.id,
      },
    ],
  });
  console.log('Assigned customers to accountant');

  // Create invoices for user1
  const invoice1 = await prisma.invoice.create({
    data: {
      userId: user1.id,
      customerId: customer1.id,
      invoiceNumber: 'INV-001',
      date: new Date('2025-01-15'),
      dueDate: new Date('2025-02-15'),
      status: 'sent',
      subtotal: 5000,
      tax: 500,
      total: 5500,
      notes: 'Website development services - January 2025',
      items: {
        create: [
          {
            description: 'Frontend Development',
            quantity: 40,
            unitPrice: 100,
            total: 4000,
          },
          {
            description: 'Backend API Development',
            quantity: 10,
            unitPrice: 100,
            total: 1000,
          },
        ],
      },
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      userId: user1.id,
      customerId: customer2.id,
      invoiceNumber: 'INV-002',
      date: new Date('2025-01-20'),
      dueDate: new Date('2025-01-05'),
      status: 'overdue',
      subtotal: 2500,
      tax: 250,
      total: 2750,
      notes: 'Consulting services - December 2024',
      items: {
        create: [
          {
            description: 'Business Consulting',
            quantity: 25,
            unitPrice: 100,
            total: 2500,
          },
        ],
      },
    },
  });

  const invoice3 = await prisma.invoice.create({
    data: {
      userId: user1.id,
      customerId: customer3.id,
      invoiceNumber: 'INV-003',
      date: new Date('2025-02-01'),
      dueDate: new Date('2025-03-01'),
      status: 'paid',
      subtotal: 1500,
      tax: 150,
      total: 1650,
      notes: 'E-commerce integration',
      items: {
        create: [
          {
            description: 'Shopify Integration',
            quantity: 15,
            unitPrice: 100,
            total: 1500,
          },
        ],
      },
    },
  });

  const invoice4 = await prisma.invoice.create({
    data: {
      userId: user1.id,
      customerId: customer1.id,
      invoiceNumber: 'INV-004',
      date: new Date('2025-02-10'),
      dueDate: new Date('2025-03-10'),
      status: 'draft',
      subtotal: 3000,
      tax: 300,
      total: 3300,
      notes: 'Mobile app development - Phase 1',
      items: {
        create: [
          {
            description: 'iOS Development',
            quantity: 15,
            unitPrice: 100,
            total: 1500,
          },
          {
            description: 'Android Development',
            quantity: 15,
            unitPrice: 100,
            total: 1500,
          },
        ],
      },
    },
  });
  console.log('Created invoices for user1');

  // Create invoice for user2
  await prisma.invoice.create({
    data: {
      userId: user2.id,
      customerId: customer4.id,
      invoiceNumber: 'INV-TC-001',
      date: new Date('2025-01-25'),
      dueDate: new Date('2025-02-25'),
      status: 'sent',
      subtotal: 4000,
      tax: 340,
      total: 4340,
      notes: 'Cloud infrastructure consulting',
      items: {
        create: [
          {
            description: 'AWS Architecture Review',
            quantity: 20,
            unitPrice: 150,
            total: 3000,
          },
          {
            description: 'Migration Planning',
            quantity: 10,
            unitPrice: 100,
            total: 1000,
          },
        ],
      },
    },
  });
  console.log('Created invoices for user2');

  // Create budgets for user1
  const officeSuppliesCat = await prisma.expenseCategory.findFirst({
    where: { name: 'Office Supplies' },
  });
  const travelCat = await prisma.expenseCategory.findFirst({
    where: { name: 'Travel' },
  });

  if (officeSuppliesCat) {
    await prisma.budget.create({
      data: {
        userId: user1.id,
        categoryId: officeSuppliesCat.id,
        limit: 500,
        period: 'monthly',
      },
    });
  }

  if (travelCat) {
    await prisma.budget.create({
      data: {
        userId: user1.id,
        categoryId: travelCat.id,
        limit: 2000,
        period: 'monthly',
      },
    });
  }
  console.log('Created budgets for user1');

  // Create expenses for user1
  if (officeSuppliesCat) {
    await prisma.expense.createMany({
      data: [
        {
          userId: user1.id,
          categoryId: officeSuppliesCat.id,
          date: new Date('2025-01-10'),
          amount: 125.50,
          description: 'Office supplies from Staples',
          vendorName: 'Staples',
          paymentMethod: 'credit_card',
          status: 'paid',
        },
        {
          userId: user1.id,
          categoryId: officeSuppliesCat.id,
          date: new Date('2025-01-15'),
          amount: 89.99,
          description: 'Printer paper and ink cartridges',
          vendorName: 'Office Depot',
          paymentMethod: 'credit_card',
          status: 'paid',
        },
      ],
    });
  }

  if (travelCat) {
    await prisma.expense.createMany({
      data: [
        {
          userId: user1.id,
          categoryId: travelCat.id,
          date: new Date('2025-01-20'),
          amount: 450.00,
          description: 'Flight to client meeting',
          vendorName: 'United Airlines',
          paymentMethod: 'credit_card',
          status: 'paid',
        },
        {
          userId: user1.id,
          categoryId: travelCat.id,
          date: new Date('2025-01-21'),
          amount: 189.00,
          description: 'Hotel - 1 night',
          vendorName: 'Marriott',
          paymentMethod: 'credit_card',
          status: 'paid',
        },
      ],
    });
  }

  const softwareCat = await prisma.expenseCategory.findFirst({
    where: { name: 'Software & Subscriptions' },
  });
  if (softwareCat) {
    await prisma.expense.create({
      data: {
        userId: user1.id,
        categoryId: softwareCat.id,
        date: new Date('2025-02-01'),
        amount: 99.00,
        description: 'Monthly Figma subscription',
        vendorName: 'Figma',
        paymentMethod: 'credit_card',
        status: 'paid',
      },
    });
  }
  console.log('Created expenses for user1');

  // Create expense for user2
  if (softwareCat) {
    await prisma.expense.create({
      data: {
        userId: user2.id,
        categoryId: softwareCat.id,
        date: new Date('2025-01-28'),
        amount: 199.00,
        description: 'Adobe Creative Cloud - Annual',
        vendorName: 'Adobe',
        paymentMethod: 'credit_card',
        status: 'paid',
      },
    });
  }
  console.log('Created expenses for user2');

  // Create notes from accountant
  await prisma.note.createMany({
    data: [
      {
        userId: accountant.id,
        entityType: 'INVOICE',
        entityId: invoice1.id,
        content: 'Please ensure payment terms are clearly stated. Consider adding late payment penalties.',
      },
      {
        userId: accountant.id,
        entityType: 'INVOICE',
        entityId: invoice2.id,
        content: 'This invoice is overdue. Follow up with customer immediately.',
      },
      {
        userId: accountant.id,
        entityType: 'CUSTOMER',
        entityId: customer1.id,
        content: 'Reliable client. Payment history: 98% on-time.',
      },
    ],
  });
  console.log('Created notes from accountant');

  console.log('\n=== Seed Summary ===');
  console.log('Users created:');
  console.log('  - Admin: admin@invoiceapp.com (ADMIN)');
  console.log('  - User1: john@business.com (USER) - Acme Corporation');
  console.log('  - User2: sarah@consulting.com (USER) - Tech Consulting Pro');
  console.log('  - Accountant: accountant@cpa.com (ACCOUNTANT)');
  console.log('\nCustomers:');
  console.log('  - User1 has 3 customers');
  console.log('  - User2 has 2 customers');
  console.log('  - Accountant assigned to 2 of User1\'s customers');
  console.log('\nInvoices:');
  console.log('  - User1 has 4 invoices');
  console.log('  - User2 has 1 invoice');
  console.log('\nExpenses:');
  console.log('  - User1 has 5 expenses');
  console.log('  - User2 has 1 expense');
  console.log('\nDatabase seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
