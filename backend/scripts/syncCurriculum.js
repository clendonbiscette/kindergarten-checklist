import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Assessment data from the frontend file
const assessmentData = {
  science: [
    // Strand: Forces and Interactions: Pushes and Pulls
    { code: '1.1.1', strand: 'Forces and Interactions: Pushes and Pulls', description: 'Demonstrate that pushes can have different strengths and directions' },
    { code: '1.1.2', strand: 'Forces and Interactions: Pushes and Pulls', description: 'Demonstrate that pulls can have different strengths and directions' },
    { code: '1.1.3', strand: 'Forces and Interactions: Pushes and Pulls', description: 'Demonstrate that pushing or pulling on an object can change the speed or direction of its motion' },
    { code: '1.1.4', strand: 'Forces and Interactions: Pushes and Pulls', description: 'Demonstrate that pushing on an object can start or stop it' },
    { code: '1.2.1', strand: 'Forces and Interactions: Pushes and Pulls', description: 'Demonstrate that when objects touch or collide, they push on one another and can change motion' },
    { code: '1.2.2', strand: 'Forces and Interactions: Pushes and Pulls', description: 'Demonstrate that a bigger push or pull makes things speed up or slow down more quickly' },

    // Strand: Interdependent Relationships in Ecosystems: Animals, Plants, and Their Environment
    { code: '2.1.1', strand: 'Interdependent Relationships in Ecosystems', description: 'Understand the difference between living and non-living things' },
    { code: '2.1.2', strand: 'Interdependent Relationships in Ecosystems', description: 'Understand which living things are plants and which living things are animals' },
    { code: '2.1.3', strand: 'Interdependent Relationships in Ecosystems', description: 'Understand that humans are animals' },
    { code: '2.2.1', strand: 'Interdependent Relationships in Ecosystems', description: 'Understand what "survive" means' },
    { code: '2.2.2', strand: 'Interdependent Relationships in Ecosystems', description: 'Understand that all living things need water' },
    { code: '2.2.3', strand: 'Interdependent Relationships in Ecosystems', description: 'Understand plants need light to live and grow' },
    { code: '2.2.4', strand: 'Interdependent Relationships in Ecosystems', description: 'Understand that plants do not need to move around because they make their own food' },
    { code: '2.2.5', strand: 'Interdependent Relationships in Ecosystems', description: 'Understand that some plants need different things to survive than other plants' },
    { code: '2.2.6', strand: 'Interdependent Relationships in Ecosystems', description: 'Understand that all animals need food to live and grow. They obtain their food from plants or from other animals' },
    { code: '2.2.7', strand: 'Interdependent Relationships in Ecosystems', description: 'Understand that some animals need different kinds of food to survive from other animals' },
    { code: '2.2.8', strand: 'Interdependent Relationships in Ecosystems', description: 'Can give a specific example of how a plant or animal can change their environment to meet their needs' },
    { code: '2.2.9', strand: 'Interdependent Relationships in Ecosystems', description: 'Can explain that we know that plants and animals can change their environment because we have evidence' },
    { code: '2.3.1', strand: 'Interdependent Relationships in Ecosystems', description: 'Understand why different plants and animals live where they do (their needs are met)' },
    { code: '2.3.2', strand: 'Interdependent Relationships in Ecosystems', description: 'Create a model to show where a plant or animal lives and what they find there that helps them to survive' },
    { code: '2.3.3', strand: 'Interdependent Relationships in Ecosystems', description: 'Understand the way that plants and animals depend on each other and on the environment where they live - it\'s a system' },
    { code: '2.4.1', strand: 'Interdependent Relationships in Ecosystems', description: 'Understand that things that people do to live comfortably can affect the world around them' },
    { code: '2.4.2', strand: 'Interdependent Relationships in Ecosystems', description: 'Understand that we can do some things to reduce the impact of humans on the environment' },
    { code: '2.4.3', strand: 'Interdependent Relationships in Ecosystems', description: 'Understand that each child can make choices to reduce their impacts on the land, water, air, and other living things' },

    // Strand: Weather and Climate
    { code: '3.1.1', strand: 'Weather and Climate', description: 'Understand that sunlight can make a difference to things on the earth\'s surface' },
    { code: '3.1.2', strand: 'Weather and Climate', description: 'Observe that soil may change when the sun is shining' },
    { code: '3.1.3', strand: 'Weather and Climate', description: 'Observe that a wet rock may change when the sun is shining on it' },
    { code: '3.1.4', strand: 'Weather and Climate', description: 'Observe that a puddle may change when the sun is shining on it' },
    { code: '3.2.1', strand: 'Weather and Climate', description: 'Explain why people might want to reduce the warming effect of the sun' },
    { code: '3.2.2', strand: 'Weather and Climate', description: 'Name one thing people can build to minimize the warming effect of the sun - could be umbrellas, canopies, and tents' },
    { code: '3.2.3', strand: 'Weather and Climate', description: 'Explain one thing (asking questions, making observations, and gathering information) that people might do to solve problems like the warming effect of the sun' },
    { code: '3.2.4', strand: 'Weather and Climate', description: 'Tell one way that the child may protect themself and their belongings from the sun, or the rain' },
    { code: '3.2.5', strand: 'Weather and Climate', description: 'Design a structure that will keep the rain or sun off their play things at their house (this could be making a drawing of something that would keep the rain or sun off their play things)' },
    { code: '3.2.6', strand: 'Weather and Climate', description: 'Build a structure that will keep the rain or sun off their play things at their house (to do this, the children might use recycled objects to make a shelter for their toy car, or tricycle - whatever is relevant to their experience)' },
    { code: '3.3.1', strand: 'Weather and Climate', description: 'Understand that the weather makes a difference to people, plants and animals' },
    { code: '3.3.2', strand: 'Weather and Climate', description: 'Understand that people measure weather conditions to describe and record the weather and to notice patterns over time' },
    { code: '3.3.3', strand: 'Weather and Climate', description: 'Tell one example of a weather patterns could include that it is usually cooler in the morning than in the afternoon and the number of sunny days versus cloudy days is different in different months' },
    { code: '3.3.4', strand: 'Weather and Climate', description: 'List the seasons there are in their country' },
    { code: '3.3.5', strand: 'Weather and Climate', description: 'Keep track of descriptions of the weather (such as sunny, cloudy, rainy, and warm)' },
    { code: '3.3.6', strand: 'Weather and Climate', description: 'Keep track of numbers of sunny, windy, and rainy days in a month' },
    { code: '3.4.1', strand: 'Weather and Climate', description: 'Explain one way that people can find out what the weather forecast is' },
    { code: '3.4.2', strand: 'Weather and Climate', description: 'Tell who prepares a weather forecast' },
    { code: '3.4.3', strand: 'Weather and Climate', description: 'Understand that it is important to know if severe weather is coming so people can prepare for it' },
    { code: '3.4.4', strand: 'Weather and Climate', description: 'Understand that it is important to know if severe weather is coming so people can respond to it' },
    { code: '3.4.5', strand: 'Weather and Climate', description: 'Understand what is meant by the motto: Be prepared; not scared' },
    { code: '3.4.6', strand: 'Weather and Climate', description: 'List one kind of severe weather that might happen where they live' },
  ]
};

async function syncCurriculum() {
  try {
    console.log('🔍 Analyzing Science curriculum discrepancies...\n');

    // Get Science subject
    const science = await prisma.subject.findFirst({
      where: { name: 'Science' },
      include: {
        strands: {
          include: {
            learningOutcomes: true
          }
        }
      }
    });

    if (!science) {
      console.error('❌ Science subject not found in database!');
      return;
    }

    console.log(`📚 Science Subject ID: ${science.id}\n`);

    // Group assessment data by strand
    const expectedByStrand = {};
    assessmentData.science.forEach(outcome => {
      if (!expectedByStrand[outcome.strand]) {
        expectedByStrand[outcome.strand] = [];
      }
      expectedByStrand[outcome.strand].push(outcome);
    });

    console.log('📊 Expected vs Actual:\n');

    let totalMissing = 0;
    const missingOutcomes = [];

    // Check each strand
    for (const [strandName, expectedOutcomes] of Object.entries(expectedByStrand)) {
      const dbStrand = science.strands.find(s => s.name === strandName);

      if (!dbStrand) {
        console.log(`❌ Strand "${strandName}" not found in database!`);
        continue;
      }

      const dbCodes = new Set(dbStrand.learningOutcomes.map(o => o.code));
      const missing = expectedOutcomes.filter(o => !dbCodes.has(o.code));

      console.log(`  📌 ${strandName}`);
      console.log(`     Expected: ${expectedOutcomes.length} | In DB: ${dbStrand.learningOutcomes.length}`);

      if (missing.length > 0) {
        console.log(`     ⚠️  Missing ${missing.length} outcome(s):`);
        missing.forEach(o => {
          console.log(`        - ${o.code}: ${o.description.substring(0, 50)}...`);
          missingOutcomes.push({
            code: o.code,
            description: o.description,
            strandId: dbStrand.id,
            subjectId: science.id,
            displayOrder: parseInt(o.code.replace(/\./g, ''))
          });
        });
        totalMissing += missing.length;
      } else {
        console.log(`     ✅ All outcomes present`);
      }
      console.log();
    }

    if (totalMissing === 0) {
      console.log('✅ No missing outcomes found! Database is complete.');
      return;
    }

    console.log(`\n📝 Found ${totalMissing} missing outcome(s). Adding them to the database...\n`);

    // Add missing outcomes
    for (const outcome of missingOutcomes) {
      const created = await prisma.learningOutcome.create({
        data: outcome
      });
      console.log(`✅ Added: ${created.code} - ${created.description.substring(0, 60)}...`);
    }

    console.log(`\n🎉 Successfully added ${totalMissing} missing outcome(s)!`);

    // Verify final count
    const finalCount = await prisma.learningOutcome.count();
    console.log(`\n📊 Total Learning Outcomes in Database: ${finalCount}`);
    console.log(`   Expected: 175`);

    if (finalCount === 175) {
      console.log(`   ✅ Database is now complete!`);
    } else {
      console.log(`   ⚠️  Still ${Math.abs(175 - finalCount)} outcome(s) ${finalCount < 175 ? 'missing' : 'extra'}`);
    }

  } catch (error) {
    console.error('❌ Error syncing curriculum:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

syncCurriculum();
