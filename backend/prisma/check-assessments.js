import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Checking database for assessments...\n');

  // Get all terms
  const terms = await prisma.term.findMany({
    include: {
      school: {
        select: { name: true }
      }
    }
  });

  console.log('=== TERMS ===');
  for (const term of terms) {
    const assessmentCount = await prisma.assessment.count({
      where: { termId: term.id }
    });
    console.log(`${term.name} (${term.school.name}): ${assessmentCount} assessments`);
    console.log(`  ID: ${term.id}`);
  }

  console.log('\n=== ALL ASSESSMENTS ===');
  const allAssessments = await prisma.assessment.findMany({
    include: {
      student: { select: { firstName: true, lastName: true } },
      term: { select: { name: true } },
      creator: { select: { firstName: true, lastName: true } }
    }
  });

  console.log(`Total assessments in database: ${allAssessments.length}`);

  if (allAssessments.length > 0) {
    console.log('\nFirst 5 assessments:');
    allAssessments.slice(0, 5).forEach(a => {
      console.log(`  - ${a.student.firstName} ${a.student.lastName} | Term: ${a.term.name} | By: ${a.creator?.firstName} ${a.creator?.lastName} | Rating: ${a.rating}`);
    });
  }

  console.log('\n=== CLASSES WITH TEACHERS ===');
  const classes = await prisma.class.findMany({
    include: {
      teacher: { select: { firstName: true, lastName: true, email: true } },
      school: { select: { name: true } },
      _count: { select: { students: true } }
    }
  });

  for (const cls of classes) {
    console.log(`${cls.name} (${cls.school.name})`);
    console.log(`  Teacher: ${cls.teacher?.firstName} ${cls.teacher?.lastName} (${cls.teacher?.email})`);
    console.log(`  Students: ${cls._count.students}`);
  }

  console.log('\n=== USER ASSIGNMENTS ===');
  const assignments = await prisma.userAssignment.findMany({
    include: {
      user: { select: { firstName: true, lastName: true, email: true, role: true } },
      school: { select: { name: true } }
    }
  });

  for (const a of assignments) {
    console.log(`${a.user.firstName} ${a.user.lastName} (${a.user.role}) -> ${a.school?.name || 'No school'}`);
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
