import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting demo data seed for existing users...');

  // Get all existing users
  const users = await prisma.user.findMany({
    include: {
      company: true,
    },
  });

  if (users.length === 0) {
    console.log('No users found in database. Please sign up first!');
    return;
  }

  console.log(`Found ${users.length} user(s). Creating demo data for each...`);

  // Get or create expense categories
  const categories = await prisma.expenseCategory.findMany();
  if (categories.length === 0) {
    console.log('No expense categories found. Creating default categories...');
    const defaultCategories = [
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

    for (const name of defaultCategories) {
      await prisma.expenseCategory.create({
        data: { name, isCustom: false },
      });
    }
  }

  const allCategories = await prisma.expenseCategory.findMany();

  // Demo data templates
  const customerNames = [
    'Acme Corporation',
    'Global Tech Industries',
    'StartUp Innovations LLC',
    'Enterprise Software Co',
    'Digital Marketing Agency',
    'Retail Solutions Inc',
    'Tech Consulting Pro',
    'Creative Design Studio',
    'Cloud Services Inc',
    'Data Analytics Corp',
  ];

  const serviceDescriptions = [
    'Website Development',
    'Mobile App Development',
    'Consulting Services',
    'Design Services',
    'SEO Optimization',
    'Cloud Migration',
    'Database Management',
    'UI/UX Design',
    'API Integration',
    'Security Audit',
  ];

  for (const user of users) {
    console.log(`\nCreating demo data for: ${user.email}`);

    // Check if user already has significant data
    const existingCustomers = await prisma.customer.count({ where: { userId: user.id } });
    const existingInvoices = await prisma.invoice.count({ where: { userId: user.id } });
    const existingExpenses = await prisma.expense.count({ where: { userId: user.id } });

    // Skip if user has 3+ customers or 3+ invoices (already has demo data)
    if (existingCustomers >= 3 || existingInvoices >= 3) {
      console.log(`  User already has significant data (${existingCustomers} customers, ${existingInvoices} invoices, ${existingExpenses} expenses)`);
      console.log('  Skipping to avoid duplicates...');
      continue;
    }

    if (existingCustomers > 0 || existingInvoices > 0 || existingExpenses > 0) {
      console.log(`  User has some data (${existingCustomers} customers, ${existingInvoices} invoices, ${existingExpenses} expenses)`);
      console.log('  Adding demo data...');
    }

    // Create 5-10 customers
    const numCustomers = Math.floor(Math.random() * 6) + 5; // 5-10
    const customers = [];

    for (let i = 0; i < numCustomers; i++) {
      const customer = await prisma.customer.create({
        data: {
          userId: user.id,
          name: customerNames[i % customerNames.length] + (i >= customerNames.length ? ` ${Math.floor(i / customerNames.length) + 1}` : ''),
          email: `contact${i + 1}@${customerNames[i % customerNames.length].toLowerCase().replace(/\s+/g, '')}.com`,
          phone: `+1 (555) ${String(100 + i * 11).padStart(3, '0')}-${String(1000 + i * 111).padStart(4, '0')}`,
          address: i % 3 === 0 ? `${100 + i * 10} Business St\nCity, ST ${10000 + i * 100}` : undefined,
        },
      });
      customers.push(customer);
    }
    console.log(`  Created ${customers.length} customers`);

    // Create 5-10 invoices
    const numInvoices = Math.floor(Math.random() * 6) + 5; // 5-10
    const statuses = ['draft', 'sent', 'paid', 'overdue'];
    const invoices = [];

    for (let i = 0; i < numInvoices; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const itemCount = Math.floor(Math.random() * 3) + 1; // 1-3 items per invoice
      const items = [];
      let subtotal = 0;

      for (let j = 0; j < itemCount; j++) {
        const quantity = Math.floor(Math.random() * 40) + 10; // 10-50 hours
        const unitPrice = [50, 75, 100, 125, 150][Math.floor(Math.random() * 5)];
        const total = quantity * unitPrice;
        subtotal += total;

        items.push({
          description: serviceDescriptions[(i + j) % serviceDescriptions.length],
          quantity,
          unitPrice,
          total,
        });
      }

      const taxRate = user.company?.taxRate || 0;
      const tax = (subtotal * taxRate) / 100;
      const total = subtotal + tax;

      const daysAgo = Math.floor(Math.random() * 60); // 0-60 days ago
      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - daysAgo);

      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30); // 30 days payment term

      const invoice = await prisma.invoice.create({
        data: {
          userId: user.id,
          customerId: customer.id,
          invoiceNumber: `INV-${String(1000 + i).padStart(4, '0')}`,
          date: invoiceDate,
          dueDate: dueDate,
          status: status,
          subtotal,
          tax,
          total,
          notes: `Professional services provided - ${invoiceDate.toLocaleDateString()}`,
          items: {
            create: items,
          },
        },
      });
      invoices.push(invoice);
    }
    console.log(`  Created ${invoices.length} invoices`);

    // Create 5-10 expenses
    const numExpenses = Math.floor(Math.random() * 6) + 5; // 5-10
    const paymentMethods = ['credit_card', 'debit_card', 'bank_transfer', 'cash'];
    const expenseStatuses = ['pending', 'paid', 'reimbursed'];

    const expenseTemplates = [
      { category: 'Office Supplies', vendor: 'Staples', desc: 'Office supplies and stationery', min: 50, max: 300 },
      { category: 'Travel', vendor: 'United Airlines', desc: 'Business travel - flight', min: 200, max: 800 },
      { category: 'Travel', vendor: 'Marriott', desc: 'Hotel accommodation', min: 150, max: 400 },
      { category: 'Meals & Entertainment', vendor: 'Various Restaurants', desc: 'Client dinner meeting', min: 50, max: 200 },
      { category: 'Software & Subscriptions', vendor: 'Adobe', desc: 'Monthly software subscription', min: 50, max: 200 },
      { category: 'Software & Subscriptions', vendor: 'Microsoft', desc: 'Office 365 subscription', min: 100, max: 300 },
      { category: 'Marketing', vendor: 'Google Ads', desc: 'Online advertising campaign', min: 200, max: 1000 },
      { category: 'Utilities', vendor: 'Local Utility Co', desc: 'Office utilities - monthly', min: 100, max: 400 },
      { category: 'Professional Services', vendor: 'Legal Advisors', desc: 'Legal consultation', min: 300, max: 1500 },
      { category: 'Insurance', vendor: 'Insurance Co', desc: 'Business insurance premium', min: 200, max: 800 },
    ];

    for (let i = 0; i < numExpenses; i++) {
      const template = expenseTemplates[Math.floor(Math.random() * expenseTemplates.length)];
      const category = allCategories.find(c => c.name === template.category) || allCategories[0];
      const amount = Math.floor(Math.random() * (template.max - template.min)) + template.min;
      const daysAgo = Math.floor(Math.random() * 60); // 0-60 days ago
      const expenseDate = new Date();
      expenseDate.setDate(expenseDate.getDate() - daysAgo);

      await prisma.expense.create({
        data: {
          userId: user.id,
          categoryId: category.id,
          date: expenseDate,
          amount: amount + (Math.random() * 0.99), // Add cents
          description: template.desc,
          vendorName: template.vendor,
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          status: expenseStatuses[Math.floor(Math.random() * expenseStatuses.length)],
          notes: i % 3 === 0 ? 'Business expense - reimbursable' : undefined,
        },
      });
    }
    console.log(`  Created ${numExpenses} expenses`);

    // Create 2-3 budgets for random categories
    const numBudgets = Math.floor(Math.random() * 2) + 2; // 2-3 budgets
    const budgetCategories = allCategories.slice(0, numBudgets);

    for (const category of budgetCategories) {
      const limit = [500, 1000, 1500, 2000, 2500][Math.floor(Math.random() * 5)];
      await prisma.budget.create({
        data: {
          userId: user.id,
          categoryId: category.id,
          limit,
          period: 'monthly',
        },
      });
    }
    console.log(`  Created ${numBudgets} budgets`);
  }

  console.log('\n=== Demo Data Seed Complete ===');
  console.log('✅ Created sample customers, invoices, expenses, and budgets');
  console.log('✅ All data is realistic and ready for testing');
  console.log('\nYou can now:');
  console.log('  - View invoices in the Invoices page');
  console.log('  - Manage customers in the Customers page');
  console.log('  - Track expenses in the Expenses page');
  console.log('  - Create new invoices and expenses');
}

main()
  .catch((e) => {
    console.error('Error seeding demo data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
