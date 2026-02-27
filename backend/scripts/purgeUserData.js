/**
 * Pre-launch database cleanup script.
 *
 * Deletes ALL user-generated data (assessments, students, classes, terms,
 * student-parent links, user assignments) and ALL users EXCEPT the one
 * specified in KEEP_EMAIL.
 *
 * Curriculum data (subjects, strands, learning outcomes) and reference data
 * (countries, schools) are LEFT INTACT.
 *
 * Usage:
 *   cd backend
 *   node --env-file=.env scripts/purgeUserData.js
 *
 * Add --confirm to actually execute deletions (dry-run by default).
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const KEEP_EMAIL = 'clendon.biscette@oecs.int';
const DRY_RUN = !process.argv.includes('--confirm');

async function main() {
  console.log('\n========================================');
  console.log('  PRE-LAUNCH DATABASE PURGE');
  console.log('========================================');
  if (DRY_RUN) {
    console.log('\n⚠️  DRY RUN — no data will be deleted.');
    console.log('   Add --confirm to execute.\n');
  } else {
    console.log('\n🔴 LIVE RUN — data WILL be permanently deleted.\n');
  }

  // ── Audit: show what will be deleted ──────────────────────────────────────

  const assessmentCount = await prisma.assessment.count();
  const studentParentCount = await prisma.studentParent.count();
  const studentCount = await prisma.student.count();
  const classCount = await prisma.class.count();
  const termCount = await prisma.academicTerm.count();
  const auditLogCount = await prisma.auditLog.count();

  const usersToDelete = await prisma.user.findMany({
    where: { email: { not: KEEP_EMAIL } },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });

  const assignmentCount = await prisma.userAssignment.count({
    where: { userId: { in: usersToDelete.map(u => u.id) } },
  });

  const keptUser = await prisma.user.findUnique({
    where: { email: KEEP_EMAIL },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });

  console.log('── Data to be DELETED ─────────────────────');
  console.log(`  Assessments:        ${assessmentCount}`);
  console.log(`  Student-Parent links: ${studentParentCount}`);
  console.log(`  Students:           ${studentCount}`);
  console.log(`  Classes:            ${classCount}`);
  console.log(`  Academic Terms:     ${termCount}`);
  console.log(`  Audit Logs:         ${auditLogCount}`);
  console.log(`  User Assignments:   (all except kept user's)`);
  console.log(`  Users to delete:    ${usersToDelete.length}`);
  if (usersToDelete.length > 0) {
    usersToDelete.forEach(u =>
      console.log(`    - [${u.role}] ${u.firstName} ${u.lastName} <${u.email}>`)
    );
  }

  console.log('\n── Data to be KEPT ────────────────────────');
  if (keptUser) {
    console.log(`  ✓ User: [${keptUser.role}] ${keptUser.firstName} ${keptUser.lastName} <${keptUser.email}>`);
  } else {
    console.log(`  ⚠️  WARNING: ${KEEP_EMAIL} not found in database!`);
  }
  console.log('  ✓ Countries (reference data)');
  console.log('  ✓ Schools (reference data)');
  console.log('  ✓ Subjects, Strands, Learning Outcomes (curriculum)');

  if (DRY_RUN) {
    console.log('\n── DRY RUN COMPLETE ───────────────────────');
    console.log('Run with --confirm to execute the purge.\n');
    return;
  }

  // ── Execute deletions in dependency order ─────────────────────────────────

  console.log('\n── Executing purge... ─────────────────────');

  const a = await prisma.assessment.deleteMany({});
  console.log(`  ✓ Deleted ${a.count} assessments`);

  const sp = await prisma.studentParent.deleteMany({});
  console.log(`  ✓ Deleted ${sp.count} student-parent links`);

  const s = await prisma.student.deleteMany({});
  console.log(`  ✓ Deleted ${s.count} students`);

  const c = await prisma.class.deleteMany({});
  console.log(`  ✓ Deleted ${c.count} classes`);

  const t = await prisma.academicTerm.deleteMany({});
  console.log(`  ✓ Deleted ${t.count} academic terms`);

  const al = await prisma.auditLog.deleteMany({});
  console.log(`  ✓ Deleted ${al.count} audit log entries`);

  // Delete assignments for users being removed, PLUS any lingering assignments
  // for the kept user (they'll re-assign themselves through the UI)
  const ua = await prisma.userAssignment.deleteMany({});
  console.log(`  ✓ Deleted ${ua.count} user assignments`);

  // Delete all users except the kept one
  const u = await prisma.user.deleteMany({
    where: { email: { not: KEEP_EMAIL } },
  });
  console.log(`  ✓ Deleted ${u.count} users`);

  console.log('\n── Verifying final state... ───────────────');
  const remaining = await prisma.user.findMany({
    select: { email: true, role: true, firstName: true, lastName: true },
  });
  console.log(`  Users remaining: ${remaining.length}`);
  remaining.forEach(u => console.log(`    - [${u.role}] ${u.firstName} ${u.lastName} <${u.email}>`));

  const schoolCount = await prisma.school.count();
  const countryCount = await prisma.country.count();
  const subjectCount = await prisma.subject.count();
  console.log(`  Schools: ${schoolCount}, Countries: ${countryCount}, Subjects: ${subjectCount}`);

  console.log('\n✅ Purge complete. Database is ready for launch.\n');
}

main()
  .catch(err => {
    console.error('\n❌ Purge failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
