import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCurriculum() {
  try {
    console.log('📚 Checking Curriculum Data in Database...\n');

    // Get subjects with their strands and learning outcomes
    const subjects = await prisma.subject.findMany({
      include: {
        strands: {
          include: {
            learningOutcomes: {
              orderBy: {
                displayOrder: 'asc'
              }
            }
          },
          orderBy: {
            displayOrder: 'asc'
          }
        }
      },
      orderBy: {
        displayOrder: 'asc'
      }
    });

    let totalStrands = 0;
    let totalOutcomes = 0;

    subjects.forEach(subject => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📖 SUBJECT: ${subject.name.toUpperCase()}`);
      console.log(`${'='.repeat(60)}`);

      totalStrands += subject.strands.length;

      subject.strands.forEach(strand => {
        console.log(`\n  📌 Strand: ${strand.name}`);
        console.log(`  └─ Learning Outcomes: ${strand.learningOutcomes.length}`);

        totalOutcomes += strand.learningOutcomes.length;

        // Show first 3 outcomes as sample
        strand.learningOutcomes.slice(0, 3).forEach(outcome => {
          console.log(`     • ${outcome.code}: ${outcome.description.substring(0, 60)}${outcome.description.length > 60 ? '...' : ''}`);
        });

        if (strand.learningOutcomes.length > 3) {
          console.log(`     ... and ${strand.learningOutcomes.length - 3} more outcomes`);
        }
      });
    });

    console.log(`\n${'='.repeat(60)}`);
    console.log(`\n📊 SUMMARY:`);
    console.log(`   • Total Subjects: ${subjects.length}`);
    console.log(`   • Total Strands: ${totalStrands}`);
    console.log(`   • Total Learning Outcomes: ${totalOutcomes}`);
    console.log(`\n${'='.repeat(60)}`);

    // Check the assessmentData.js file for comparison
    console.log(`\n📝 Expected from assessmentData.js:`);
    console.log(`   • Language Arts: 3 strands, 33 outcomes`);
    console.log(`   • Mathematics: 6 strands, 42 outcomes`);
    console.log(`   • Science: 3 strands, 52 outcomes`);
    console.log(`   • Social Studies: 3 strands, 48 outcomes`);
    console.log(`   • TOTAL: 15 strands, 175 outcomes`);

    const difference = 175 - totalOutcomes;
    if (difference !== 0) {
      console.log(`\n⚠️  DISCREPANCY: Database has ${Math.abs(difference)} ${difference < 0 ? 'more' : 'fewer'} outcomes than expected`);
    } else {
      console.log(`\n✅ All curriculum data matches!`);
    }

  } catch (error) {
    console.error('❌ Error checking curriculum:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurriculum();
