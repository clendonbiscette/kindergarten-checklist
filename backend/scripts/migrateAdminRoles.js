/**
 * One-time migration script: convert SCHOOL_ADMIN and COUNTRY_ADMIN users to SUPERUSER.
 * Must be run BEFORE running `prisma db push` to remove those enum values from the schema.
 *
 * Usage: cd backend && node scripts/migrateAdminRoles.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Audit: show current role distribution
  const roleCounts = await prisma.user.groupBy({
    by: ['role'],
    _count: { role: true },
  });
  console.log('\nCurrent role distribution:');
  roleCounts.forEach(r => console.log(`  ${r.role}: ${r._count.role}`));

  // Find affected users
  const affected = await prisma.user.findMany({
    where: { role: { in: ['SCHOOL_ADMIN', 'COUNTRY_ADMIN'] } },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });

  if (affected.length === 0) {
    console.log('\n✓ No SCHOOL_ADMIN or COUNTRY_ADMIN users found. Database is clean.');
    return;
  }

  console.log(`\nFound ${affected.length} user(s) to migrate:`);
  affected.forEach(u => {
    console.log(`  [${u.role}] ${u.firstName} ${u.lastName} <${u.email}>`);
  });

  // Migrate to SUPERUSER
  const result = await prisma.user.updateMany({
    where: { role: { in: ['SCHOOL_ADMIN', 'COUNTRY_ADMIN'] } },
    data: { role: 'SUPERUSER' },
  });

  console.log(`\n✓ Migrated ${result.count} user(s) to SUPERUSER.`);

  // Verify
  const postMigration = await prisma.user.groupBy({
    by: ['role'],
    _count: { role: true },
  });
  console.log('\nRole distribution after migration:');
  postMigration.forEach(r => console.log(`  ${r.role}: ${r._count.role}`));
}

main()
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
