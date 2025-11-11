import { prisma } from '../src/index';

async function checkUsers() {
  console.log('Checking users in database...\n');

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      organizationId: true,
      isActive: true,
      lastLoginAt: true,
      invitationId: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`Total users: ${users.length}\n`);

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email}`);
    console.log(`   Name: ${user.name || 'N/A'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Organization ID: ${user.organizationId || 'NULL (needs migration)'}`);
    console.log(`   Active: ${user.isActive}`);
    console.log(`   Last Login: ${user.lastLoginAt ? user.lastLoginAt.toISOString() : 'Never'}`);
    console.log(`   Invitation ID: ${user.invitationId || 'N/A'}`);
    console.log('');
  });

  const usersNeedingMigration = users.filter(u => !u.organizationId).length;
  if (usersNeedingMigration > 0) {
    console.log(`⚠️  ${usersNeedingMigration} users need migration (no organization assigned)`);
    console.log('Run: npx tsx scripts/migrate-existing-users.ts');
  } else {
    console.log('✓ All users have been assigned to organizations');
  }

  await prisma.$disconnect();
}

checkUsers().catch(console.error);
