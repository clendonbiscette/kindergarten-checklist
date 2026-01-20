import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAssessments() {
  try {
    console.log('🔍 Checking assessments in database...\n');

    // Get total count
    const total = await prisma.assessment.count();
    console.log(`📊 Total assessments in database: ${total}\n`);

    if (total === 0) {
      console.log('❌ No assessments found in the database!');
      console.log('This could mean:');
      console.log('  1. Assessments were not saved');
      console.log('  2. API endpoint failed');
      console.log('  3. Validation error prevented creation\n');
    } else {
      // Get recent assessments
      const recent = await prisma.assessment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: { firstName: true, lastName: true }
          },
          learningOutcome: {
            select: { code: true, description: true }
          },
          teacher: {
            select: { name: true }
          }
        }
      });

      console.log('📝 Recent assessments:\n');
      recent.forEach((a, i) => {
        console.log(`${i + 1}. Student: ${a.student.firstName} ${a.student.lastName}`);
        console.log(`   Outcome: ${a.learningOutcome.code} - ${a.learningOutcome.description.substring(0, 50)}...`);
        console.log(`   Rating: ${a.rating}`);
        console.log(`   Term: ${a.teacher?.name || 'N/A'}`);
        console.log(`   Date: ${a.assessmentDate}`);
        console.log(`   Created: ${a.createdAt}\n`);
      });

      // Group by student
      const byStudent = await prisma.assessment.groupBy({
        by: ['studentId'],
        _count: { id: true }
      });

      console.log(`\n📊 Assessments by student (${byStudent.length} students have assessments):\n`);
      for (const group of byStudent) {
        const student = await prisma.student.findUnique({
          where: { id: group.studentId },
          select: { firstName: true, lastName: true }
        });
        console.log(`   ${student.firstName} ${student.lastName}: ${group._count.id} assessments`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssessments();
