# Check Database Status
# This script verifies that the Neon database is seeded

Write-Host "Checking Neon database status..." -ForegroundColor Cyan

$checkScript = @'
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  try {
    const users = await prisma.user.count();
    const customers = await prisma.customer.count();
    const invoices = await prisma.invoice.count();
    const expenses = await prisma.expense.count();
    const categories = await prisma.expenseCategory.count();

    console.log('\n=== Database Status ===');
    console.log('Users:', users);
    console.log('Customers:', customers);
    console.log('Invoices:', invoices);
    console.log('Expenses:', expenses);
    console.log('Categories:', categories);

    if (users === 0) {
      console.log('\n⚠️ Database is EMPTY - needs seeding!');
      process.exit(1);
    } else {
      console.log('\n✅ Database is seeded and ready!');
    }
  } catch (error) {
    console.error('Error checking database:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
'@

$checkScript | Out-File -FilePath "check-db-temp.ts" -Encoding utf8

npx tsx check-db-temp.ts

$exitCode = $LASTEXITCODE
Remove-Item "check-db-temp.ts" -ErrorAction SilentlyContinue

exit $exitCode
