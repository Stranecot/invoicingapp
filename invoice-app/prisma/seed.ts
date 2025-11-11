import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

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
      name: 'Emma Accountant',
      role: 'ACCOUNTANT',
    },
  });
  console.log('Created accountant:', accountant.email);

  // Create default expense categories (shared system categories, no userId)
  const categories = [
    'Office Supplies',
    'Travel',
    'Utilities',
    'Software & Subscriptions',
    'Marketing',
    'Meals & Entertainment',
    'Equipment',
  ];

  const createdCategories: any[] = [];
  for (const categoryName of categories) {
    const category = await prisma.expenseCategory.create({
      data: {
        name: categoryName,
        isCustom: false,
        userId: null, // System-wide categories
      },
    });
    createdCategories.push(category);
  }
  console.log('Created default expense categories');

  // Create customers for User1
  const today = new Date();
  const dueDate30 = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const dueDate15 = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);
  const pastDue = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);

  const customer1 = await prisma.customer.create({
    data: {
      userId: user1.id,
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+1 (555) 234-5678',
      address: '456 Oak Avenue\nNew York, NY 10001',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      userId: user1.id,
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      phone: '+1 (555) 345-6789',
      address: '789 Pine Street\nLos Angeles, CA 90001',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      userId: user1.id,
      name: 'Tech Solutions Inc.',
      email: 'billing@techsolutions.com',
      phone: '+1 (555) 456-7890',
      address: '321 Tech Boulevard\nAustin, TX 78701',
    },
  });

  console.log('Created customers for user1');

  // Create customers for User2
  const customer4 = await prisma.customer.create({
    data: {
      userId: user2.id,
      name: 'Global Enterprises',
      email: 'accounts@globalent.com',
      phone: '+1 (555) 111-2222',
      address: '100 Corporate Drive\nChicago, IL 60601',
    },
  });

  const customer5 = await prisma.customer.create({
    data: {
      userId: user2.id,
      name: 'Startup XYZ',
      email: 'billing@startupxyz.com',
      phone: '+1 (555) 333-4444',
      address: '200 Innovation Way\nSan Jose, CA 95110',
    },
  });

  console.log('Created customers for user2');

  // Assign some customers to the accountant
  await prisma.accountantAssignment.create({
    data: {
      accountantId: accountant.id,
      customerId: customer1.id,
    },
  });

  await prisma.accountantAssignment.create({
    data: {
      accountantId: accountant.id,
      customerId: customer3.id,
    },
  });

  console.log('Assigned customers to accountant');

  // Create invoices for User1
  const invoice1 = await prisma.invoice.create({
    data: {
      userId: user1.id,
      invoiceNumber: 'INV-001',
      customerId: customer1.id,
      date: today,
      dueDate: dueDate30,
      status: 'sent',
      subtotal: 1500,
      tax: 150,
      total: 1650,
      notes: 'Thank you for your business!',
      items: {
        create: [
          {
            description: 'Web Design Services',
            quantity: 1,
            unitPrice: 1000,
            total: 1000,
          },
          {
            description: 'Logo Design',
            quantity: 1,
            unitPrice: 500,
            total: 500,
          },
        ],
      },
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      userId: user1.id,
      invoiceNumber: 'INV-002',
      customerId: customer2.id,
      date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
      dueDate: dueDate15,
      status: 'paid',
      subtotal: 2500,
      tax: 250,
      total: 2750,
      notes: 'Payment received. Thank you!',
      items: {
        create: [
          {
            description: 'Mobile App Development',
            quantity: 40,
            unitPrice: 50,
            total: 2000,
          },
          {
            description: 'UI/UX Consulting',
            quantity: 10,
            unitPrice: 50,
            total: 500,
          },
        ],
      },
    },
  });

  const invoice3 = await prisma.invoice.create({
    data: {
      userId: user1.id,
      invoiceNumber: 'INV-003',
      customerId: customer3.id,
      date: new Date(today.getTime() - 40 * 24 * 60 * 60 * 1000),
      dueDate: pastDue,
      status: 'overdue',
      subtotal: 3000,
      tax: 300,
      total: 3300,
      notes: 'Payment overdue. Please remit payment immediately.',
      items: {
        create: [
          {
            description: 'Software Development',
            quantity: 60,
            unitPrice: 50,
            total: 3000,
          },
        ],
      },
    },
  });

  const invoice4 = await prisma.invoice.create({
    data: {
      userId: user1.id,
      invoiceNumber: 'INV-004',
      customerId: customer1.id,
      date: today,
      dueDate: dueDate30,
      status: 'draft',
      subtotal: 800,
      tax: 80,
      total: 880,
      items: {
        create: [
          {
            description: 'SEO Optimization',
            quantity: 1,
            unitPrice: 800,
            total: 800,
          },
        ],
      },
    },
  });

  console.log('Created invoices for user1');

  // Create invoices for User2
  await prisma.invoice.create({
    data: {
      userId: user2.id,
      invoiceNumber: 'INV-2001',
      customerId: customer4.id,
      date: today,
      dueDate: dueDate30,
      status: 'sent',
      subtotal: 5000,
      tax: 425,
      total: 5425,
      notes: 'Consulting services as agreed.',
      items: {
        create: [
          {
            description: 'IT Consulting - 50 hours',
            quantity: 50,
            unitPrice: 100,
            total: 5000,
          },
        ],
      },
    },
  });

  console.log('Created invoices for user2');

  // Create budgets for User1
  await prisma.budget.create({
    data: {
      userId: user1.id,
      categoryId: createdCategories[0].id, // Office Supplies
      limit: 500,
      period: 'monthly',
    },
  });

  await prisma.budget.create({
    data: {
      userId: user1.id,
      categoryId: createdCategories[3].id, // Software & Subscriptions
      limit: 1000,
      period: 'monthly',
    },
  });

  await prisma.budget.create({
    data: {
      userId: user1.id,
      categoryId: createdCategories[4].id, // Marketing
      limit: 2000,
      period: 'monthly',
    },
  });

  console.log('Created budgets for user1');

  // Create expenses for User1
  await prisma.expense.create({
    data: {
      userId: user1.id,
      date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
      categoryId: createdCategories[0].id,
      amount: 156.50,
      description: 'Printer paper and toner cartridges',
      notes: 'For office printer',
      paymentMethod: 'credit_card',
      vendorName: 'Office Depot',
      status: 'paid',
    },
  });

  await prisma.expense.create({
    data: {
      userId: user1.id,
      date: new Date(today.getTime() - 12 * 24 * 60 * 60 * 1000),
      categoryId: createdCategories[1].id,
      amount: 450.00,
      description: 'Flight to client meeting',
      notes: 'Round trip SFO to NYC',
      paymentMethod: 'credit_card',
      receiptReference: 'RCPT-2024-001',
      vendorName: 'United Airlines',
      status: 'paid',
      customerId: customer1.id,
    },
  });

  await prisma.expense.create({
    data: {
      userId: user1.id,
      date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
      categoryId: createdCategories[3].id,
      amount: 299.00,
      description: 'Adobe Creative Cloud subscription',
      notes: 'Annual subscription renewal',
      paymentMethod: 'credit_card',
      vendorName: 'Adobe',
      status: 'paid',
    },
  });

  await prisma.expense.create({
    data: {
      userId: user1.id,
      date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
      categoryId: createdCategories[4].id,
      amount: 850.00,
      description: 'Google Ads campaign',
      notes: 'Q4 marketing campaign',
      paymentMethod: 'credit_card',
      vendorName: 'Google',
      status: 'pending',
    },
  });

  await prisma.expense.create({
    data: {
      userId: user1.id,
      date: today,
      categoryId: createdCategories[5].id,
      amount: 125.75,
      description: 'Team lunch meeting',
      notes: 'Discussed Q4 strategy',
      paymentMethod: 'credit_card',
      receiptReference: 'RCPT-2024-002',
      vendorName: 'The Italian Restaurant',
      status: 'pending',
      customerId: customer3.id,
    },
  });

  console.log('Created expenses for user1');

  // Create expenses for User2
  await prisma.expense.create({
    data: {
      userId: user2.id,
      date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
      categoryId: createdCategories[3].id,
      amount: 99.00,
      description: 'Slack subscription',
      paymentMethod: 'credit_card',
      vendorName: 'Slack',
      status: 'paid',
    },
  });

  console.log('Created expenses for user2');

  // Create some notes from the accountant
  await prisma.note.create({
    data: {
      userId: accountant.id,
      entityType: 'INVOICE',
      entityId: invoice1.id,
      content: 'Reviewed - all documentation looks good. Ready for payment processing.',
    },
  });

  await prisma.note.create({
    data: {
      userId: accountant.id,
      entityType: 'INVOICE',
      entityId: invoice3.id,
      content: 'Payment is overdue. Recommend sending a reminder to the client.',
    },
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
