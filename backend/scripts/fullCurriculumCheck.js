import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Full assessment data from frontend
const assessmentData = {
  language_arts: [
    // Strand: Listening and Speaking - 10 outcomes
    { code: '1.1', strand: 'Listening and Speaking', description: 'listen to music, conversation and environmental sounds for personal enjoyment' },
    { code: '1.2', strand: 'Listening and Speaking', description: 'demonstrate interest, curiosity, engagement in sharing the experiences of others and with oral stories and information sharing' },
    { code: '1.3', strand: 'Listening and Speaking', description: 'use social listening and speaking skills to interact with a variety of audiences with sensitivity and respect' },
    { code: '1.4', strand: 'Listening and Speaking', description: 'interact and collaborate with the teacher and children who have diverse interests, backgrounds and languages' },
    { code: '1.5', strand: 'Listening and Speaking', description: 'become aware of how effective listening enhances understanding' },
    { code: '1.6', strand: 'Listening and Speaking', description: 'observe how tone, fluency and intonation impact meaning and mood' },
    { code: '1.7', strand: 'Listening and Speaking', description: 'use Home Language(s) and, as Standard English develops, share their thoughts, feelings and questions about engaging events, stories and conversations with increasing confidence' },
    { code: '1.8', strand: 'Listening and Speaking', description: 'develop increasing clarity and focus when sharing stories or experiences' },
    { code: '1.9', strand: 'Listening and Speaking', description: 'engage in active phonological awareness activities and word play to discriminate between various sounds in their environment, letters of the alphabet, rhyme and meaningful sound patterns' },
    { code: '1.10', strand: 'Listening and Speaking', description: 'develop and apply vocabulary and language structures to enhance their understanding of how to communicate ideas with purpose and focus' },

    // Strand: Reading and Viewing - 15 outcomes
    { code: '2.1', strand: 'Reading and Viewing', description: 'interact meaningfully with a wide range of genres and text forms' },
    { code: '2.2', strand: 'Reading and Viewing', description: 'develop questions when browsing through passages of interest' },
    { code: '2.3', strand: 'Reading and Viewing', description: 'connect background knowledge to the titles and pictures of fiction and nonfiction passages to build a foundation of understanding' },
    { code: '2.4', strand: 'Reading and Viewing', description: 'develop understanding and application of the Concepts of Print' },
    { code: '2.5', strand: 'Reading and Viewing', description: 'develop knowledge about the purpose and variety of texts that are read or read to them' },
    { code: '2.6', strand: 'Reading and Viewing', description: 'browse through a variety of images, and nonfiction material in pre-emergent and emergent level passages, or passages of interest, to discover information' },
    { code: '2.7', strand: 'Reading and Viewing', description: 'demonstrate understanding of some environmental print and pictorial information' },
    { code: '2.8', strand: 'Reading and Viewing', description: 'begin to apply comprehension strategies to visualize, predict and connect' },
    { code: '2.9', strand: 'Reading and Viewing', description: 'demonstrate understanding by responding to read-alouds with images, model making, discussions, or temporary writing' },
    { code: '2.10', strand: 'Reading and Viewing', description: 'connect words and images in pre-emergent and emergent level texts to background knowledge' },
    { code: '2.11', strand: 'Reading and Viewing', description: 'recognise and use a variety of high frequency words of personal importance, such as names and pre-emergent level high-frequency words' },
    { code: '2.12', strand: 'Reading and Viewing', description: 'participate in shared reading and use the meaning and flow of the language to anticipate upcoming words' },
    { code: '2.13', strand: 'Reading and Viewing', description: 'begin to demonstrate fluency and phrasing during shared reading, independent and guided reading of emergent level passages' },
    { code: '2.14', strand: 'Reading and Viewing', description: 'identify an increasing number of letter names and letter sounds, beginning with those of personal importance' },
    { code: '2.15', strand: 'Reading and Viewing', description: 'use known letter sounds to problem solve upcoming words in emergent level passages' },

    // Strand: Writing and Representing - 8 outcomes
    { code: '3.1', strand: 'Writing and Representing', description: 'use shared ideas to co-construct stories' },
    { code: '3.2', strand: 'Writing and Representing', description: 'assign meaning to experimental drawing and writing' },
    { code: '3.3', strand: 'Writing and Representing', description: 'begin expressive writing to share ideas and real and imagined topics' },
    { code: '3.4', strand: 'Writing and Representing', description: 'use peer collaboration and classroom tools to assist in writing process' },
    { code: '3.5', strand: 'Writing and Representing', description: 'learn to approximate and begin to refine printing of the lower case and upper case letters of the alphabet' },
    { code: '3.6', strand: 'Writing and Representing', description: 'connect spoken language(s) to written language and other representations (e.g. drawings)' },
    { code: '3.7', strand: 'Writing and Representing', description: 'connect phonological awareness to letter shapes' },
    { code: '3.8', strand: 'Writing and Representing', description: 'spell name and some words of personal importance correctly' },
  ]
};

async function fullCheck() {
  try {
    console.log('🔍 COMPREHENSIVE CURRICULUM VERIFICATION\n');
    console.log('='.repeat(70));

    // Count from assessmentData.js
    console.log('\n📄 EXPECTED FROM assessmentData.js:\n');

    const expected = {
      'Language Arts': assessmentData.language_arts.length,
      'Mathematics': 43, // Manual count from file
      'Science': 46, // Manual count from file (6 + 18 + 22)
      'Social Studies': 48 // Manual count from file (18 + 21 + 9)
    };

    let expectedTotal = 0;
    Object.entries(expected).forEach(([subject, count]) => {
      console.log(`   ${subject}: ${count} outcomes`);
      expectedTotal += count;
    });
    console.log(`   ${'─'.repeat(40)}`);
    console.log(`   TOTAL: ${expectedTotal} outcomes`);

    // Count from database
    console.log('\n📊 ACTUAL IN DATABASE:\n');

    const subjects = await prisma.subject.findMany({
      include: {
        _count: {
          select: {
            learningOutcomes: true
          }
        }
      },
      orderBy: {
        displayOrder: 'asc'
      }
    });

    let actualTotal = 0;
    subjects.forEach(subject => {
      console.log(`   ${subject.name}: ${subject._count.learningOutcomes} outcomes`);
      actualTotal += subject._count.learningOutcomes;
    });
    console.log(`   ${'─'.repeat(40)}`);
    console.log(`   TOTAL: ${actualTotal} outcomes`);

    console.log('\n' + '='.repeat(70));
    console.log('\n📈 COMPARISON:\n');
    console.log(`   Expected: ${expectedTotal} outcomes`);
    console.log(`   Actual:   ${actualTotal} outcomes`);
    console.log(`   Difference: ${actualTotal - expectedTotal}`);

    if (actualTotal === expectedTotal) {
      console.log('\n✅ DATABASE IS COMPLETE! All curriculum outcomes are present.\n');
    } else {
      console.log(`\n⚠️  DISCREPANCY: ${Math.abs(actualTotal - expectedTotal)} outcome(s) ${actualTotal > expectedTotal ? 'extra' : 'missing'}\n`);
    }

    // Detailed breakdown by subject
    console.log('='.repeat(70));
    console.log('\n📚 DETAILED BREAKDOWN BY SUBJECT:\n');

    for (const subject of subjects) {
      const strands = await prisma.strand.findMany({
        where: { subjectId: subject.id },
        include: {
          _count: {
            select: {
              learningOutcomes: true
            }
          }
        },
        orderBy: {
          displayOrder: 'asc'
        }
      });

      console.log(`\n  ${subject.name.toUpperCase()}`);
      console.log(`  ${'─'.repeat(60)}`);
      strands.forEach(strand => {
        console.log(`    • ${strand.name}: ${strand._count.learningOutcomes} outcomes`);
      });
    }

    console.log('\n' + '='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fullCheck();
