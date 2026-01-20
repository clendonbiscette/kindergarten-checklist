import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function inspectDatabase() {
  try {
    console.log('🔍 Inspecting PostgreSQL database...\n');

    // Check countries
    const countries = await prisma.country.findMany();
    console.log(`📍 Countries: ${countries.length}`);
    if (countries.length > 0) {
      console.log('   ', countries.map(c => c.name).join(', '));
    }

    // Check schools
    const schools = await prisma.school.findMany();
    console.log(`🏫 Schools: ${schools.length}`);
    if (schools.length > 0) {
      console.log('   ', schools.map(s => s.name).join(', '));
    }

    // Check subjects
    const subjects = await prisma.subject.findMany();
    console.log(`📚 Subjects: ${subjects.length}`);
    if (subjects.length > 0) {
      console.log('   ', subjects.map(s => s.name).join(', '));
    }

    // Check strands
    const strands = await prisma.strand.findMany();
    console.log(`🔗 Strands: ${strands.length}`);

    // Check learning outcomes
    const outcomes = await prisma.learningOutcome.findMany();
    console.log(`🎯 Learning Outcomes: ${outcomes.length}`);

    // Check users
    const users = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    });
    console.log(`👤 Users: ${users.length}`);
    if (users.length > 0) {
      users.forEach(u => {
        console.log(`   - ${u.firstName} ${u.lastName} (${u.email}) - ${u.role} - ${u.isActive ? 'Active' : 'Inactive'}`);
      });
    }

    // Check classes
    const classes = await prisma.class.findMany();
    console.log(`🏫 Classes: ${classes.length}`);
    if (classes.length > 0) {
      console.log('   ', classes.map(c => c.name).join(', '));
    }

    // Check students
    const students = await prisma.student.findMany();
    console.log(`👶 Students: ${students.length}`);
    if (students.length > 0 && students.length <= 10) {
      students.forEach(s => {
        console.log(`   - ${s.firstName} ${s.lastName}`);
      });
    }

    // Check assessments
    const assessments = await prisma.assessment.findMany();
    console.log(`📝 Assessments: ${assessments.length}`);

    // Check academic terms
    const terms = await prisma.academicTerm.findMany();
    console.log(`📅 Academic Terms: ${terms.length}`);
    if (terms.length > 0) {
      terms.forEach(t => {
        console.log(`   - ${t.name} (${t.schoolYear}): ${t.startDate.toISOString().split('T')[0]} to ${t.endDate.toISOString().split('T')[0]}`);
      });
    }

    console.log('\n✅ Database inspection complete!');
    console.log('\nDatabase: kindergarten_assessment');
    console.log('Host: localhost:5432');
    console.log('User: kinder_app_user');

  } catch (error) {
    console.error('❌ Error inspecting database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

inspectDatabase();
