import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function exploreDatabase() {
  try {
    console.log('=== DATABASE EXPLORATION ===\n');

    // Count all records in each table
    console.log('📊 RECORD COUNTS:');
    const counts = {
      users: await prisma.user.count(),
      countries: await prisma.country.count(),
      schools: await prisma.school.count(),
      classes: await prisma.class.count(),
      students: await prisma.student.count(),
      subjects: await prisma.subject.count(),
      strands: await prisma.strand.count(),
      learningOutcomes: await prisma.learningOutcome.count(),
      academicTerms: await prisma.academicTerm.count(),
      assessments: await prisma.assessment.count(),
      userAssignments: await prisma.userAssignment.count(),
      studentParents: await prisma.studentParent.count(),
    };
    console.log(JSON.stringify(counts, null, 2));

    // Get all users
    console.log('\n👥 USERS:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    console.log(JSON.stringify(users, null, 2));

    // Get all countries
    console.log('\n🌍 COUNTRIES:');
    const countries = await prisma.country.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        _count: {
          select: { schools: true }
        }
      },
    });
    console.log(JSON.stringify(countries, null, 2));

    // Get all schools with country info
    console.log('\n🏫 SCHOOLS:');
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        country: {
          select: { name: true, code: true }
        },
        _count: {
          select: { students: true, classes: true, terms: true }
        }
      },
    });
    console.log(JSON.stringify(schools, null, 2));

    // Get all classes with details
    console.log('\n📚 CLASSES:');
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        academicYear: true,
        isActive: true,
        teacher: {
          select: { firstName: true, lastName: true, email: true }
        },
        school: {
          select: { name: true }
        },
        _count: {
          select: { students: true }
        }
      },
    });
    console.log(JSON.stringify(classes, null, 2));

    // Get all students
    console.log('\n👶 STUDENTS:');
    const students = await prisma.student.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        studentIdNumber: true,
        isActive: true,
        school: {
          select: { name: true }
        },
        class: {
          select: { name: true, gradeLevel: true }
        },
        _count: {
          select: { assessments: true }
        }
      },
      orderBy: { firstName: 'asc' }
    });
    console.log(JSON.stringify(students, null, 2));

    // Get subjects and strands
    console.log('\n📖 CURRICULUM STRUCTURE:');
    const subjects = await prisma.subject.findMany({
      select: {
        id: true,
        name: true,
        displayOrder: true,
        strands: {
          select: {
            id: true,
            name: true,
            displayOrder: true,
            _count: {
              select: { learningOutcomes: true }
            }
          },
          orderBy: { displayOrder: 'asc' }
        },
        _count: {
          select: { learningOutcomes: true }
        }
      },
      orderBy: { displayOrder: 'asc' }
    });
    console.log(JSON.stringify(subjects, null, 2));

    // Get learning outcomes by subject
    console.log('\n🎯 LEARNING OUTCOMES SUMMARY:');
    for (const subject of subjects) {
      const outcomes = await prisma.learningOutcome.findMany({
        where: { subjectId: subject.id },
        select: {
          code: true,
          description: true,
        },
        orderBy: { displayOrder: 'asc' },
        take: 5  // Just first 5 for each subject
      });
      console.log(`\n${subject.name} (Total: ${subject._count.learningOutcomes}):`);
      console.log(JSON.stringify(outcomes, null, 2));
    }

    // Get academic terms
    console.log('\n📅 ACADEMIC TERMS:');
    const terms = await prisma.academicTerm.findMany({
      select: {
        id: true,
        name: true,
        schoolYear: true,
        startDate: true,
        endDate: true,
        school: {
          select: { name: true }
        },
        _count: {
          select: { assessments: true }
        }
      },
    });
    console.log(JSON.stringify(terms, null, 2));

    // Get assessment statistics
    console.log('\n📝 ASSESSMENT STATISTICS:');
    const assessmentStats = await prisma.assessment.groupBy({
      by: ['rating'],
      _count: {
        rating: true
      }
    });
    console.log(JSON.stringify(assessmentStats, null, 2));

    // Get sample assessments
    console.log('\n📋 SAMPLE ASSESSMENTS (First 10):');
    const assessments = await prisma.assessment.findMany({
      take: 10,
      select: {
        id: true,
        assessmentDate: true,
        rating: true,
        comment: true,
        student: {
          select: { firstName: true, lastName: true }
        },
        learningOutcome: {
          select: { code: true, description: true }
        },
        teacher: {
          select: { name: true, schoolYear: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log(JSON.stringify(assessments, null, 2));

    // User assignments
    console.log('\n🔗 USER ASSIGNMENTS:');
    const assignments = await prisma.userAssignment.findMany({
      select: {
        user: {
          select: { email: true, firstName: true, lastName: true, role: true }
        },
        school: {
          select: { name: true }
        },
        country: {
          select: { name: true }
        }
      }
    });
    console.log(JSON.stringify(assignments, null, 2));

    console.log('\n✅ Database exploration complete!');
  } catch (error) {
    console.error('❌ Error exploring database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exploreDatabase();
