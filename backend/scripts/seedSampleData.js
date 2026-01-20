import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const OECS_COUNTRIES = [
  { name: 'Antigua and Barbuda', code: 'ATG' },
  { name: 'Dominica', code: 'DMA' },
  { name: 'Grenada', code: 'GRD' },
  { name: 'Montserrat', code: 'MSR' },
  { name: 'Saint Kitts and Nevis', code: 'KNA' },
  { name: 'Saint Lucia', code: 'LCA' },
  { name: 'Saint Vincent and the Grenadines', code: 'VCT' },
  { name: 'Anguilla', code: 'AIA' },
  { name: 'British Virgin Islands', code: 'VGB' },
];

async function seedSampleData() {
  try {
    console.log('🌱 Starting sample data seed...\n');

    // 1. Create Countries
    console.log('Creating OECS countries...');
    for (const country of OECS_COUNTRIES) {
      await prisma.country.upsert({
        where: { code: country.code },
        update: {},
        create: country,
      });
    }
    console.log(`✅ Created ${OECS_COUNTRIES.length} countries\n`);

    // Get Saint Lucia for our sample data
    const stLucia = await prisma.country.findUnique({
      where: { code: 'LCA' },
    });

    // 2. Create Schools
    console.log('Creating schools...');
    const school1 = await prisma.school.upsert({
      where: { id: 'sample-school-1' },
      update: {},
      create: {
        id: 'sample-school-1',
        name: 'Castries Primary School',
        countryId: stLucia.id,
        address: 'Castries, Saint Lucia',
        phone: '758-452-1234',
        email: 'info@castriesprimary.edu.lc',
      },
    });

    const school2 = await prisma.school.upsert({
      where: { id: 'sample-school-2' },
      update: {},
      create: {
        id: 'sample-school-2',
        name: 'Vieux Fort Primary School',
        countryId: stLucia.id,
        address: 'Vieux Fort, Saint Lucia',
        phone: '758-454-5678',
        email: 'info@vieuxfortprimary.edu.lc',
      },
    });

    console.log('✅ Created 2 schools\n');

    // 3. Create Academic Terms (use fixed valid UUIDs for repeatability)
    // UUID format: 8-4-4-4-12 where 3rd section starts with 1-5, 4th section starts with 8,9,a,b
    console.log('Creating academic terms...');
    const term1 = await prisma.academicTerm.upsert({
      where: { id: '11111111-1111-4111-8111-111111111111' },
      update: {},
      create: {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Term 1',
        schoolYear: '2024-2025',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2024-12-20'),
        schoolId: school1.id,
      },
    });

    const term2 = await prisma.academicTerm.upsert({
      where: { id: '22222222-2222-4222-8222-222222222222' },
      update: {},
      create: {
        id: '22222222-2222-4222-8222-222222222222',
        name: 'Term 2',
        schoolYear: '2024-2025',
        startDate: new Date('2025-01-06'),
        endDate: new Date('2025-04-04'),
        schoolId: school1.id,
      },
    });

    const term3 = await prisma.academicTerm.upsert({
      where: { id: '33333333-3333-4333-8333-333333333333' },
      update: {},
      create: {
        id: '33333333-3333-4333-8333-333333333333',
        name: 'Term 3',
        schoolYear: '2024-2025',
        startDate: new Date('2025-04-21'),
        endDate: new Date('2025-07-03'),
        schoolId: school1.id,
      },
    });

    console.log('✅ Created 3 academic terms\n');

    // 4. Create Students
    console.log('Creating students...');
    const students = [
      { firstName: 'Anya', lastName: 'Baptiste', studentIdNumber: 'ST001' },
      { firstName: 'Marcus', lastName: 'Charles', studentIdNumber: 'ST002' },
      { firstName: 'Sophia', lastName: 'Joseph', studentIdNumber: 'ST003' },
      { firstName: 'Elijah', lastName: 'Williams', studentIdNumber: 'ST004' },
      { firstName: 'Amara', lastName: 'Edwards', studentIdNumber: 'ST005' },
      { firstName: 'Jayden', lastName: 'Louis', studentIdNumber: 'ST006' },
      { firstName: 'Isabella', lastName: 'Pierre', studentIdNumber: 'ST007' },
      { firstName: 'Noah', lastName: 'Anthony', studentIdNumber: 'ST008' },
      { firstName: 'Mia', lastName: 'Francis', studentIdNumber: 'ST009' },
      { firstName: 'Caleb', lastName: 'George', studentIdNumber: 'ST010' },
    ];

    for (const student of students) {
      await prisma.student.upsert({
        where: {
          schoolId_studentIdNumber: {
            schoolId: school1.id,
            studentIdNumber: student.studentIdNumber,
          },
        },
        update: {},
        create: {
          ...student,
          schoolId: school1.id,
          dateOfBirth: new Date('2019-06-15'), // Kindergarten age
        },
      });
    }

    console.log(`✅ Created ${students.length} students\n`);

    // 5. Assign teacher user to school
    console.log('Assigning users to schools...');
    const teacherUser = await prisma.user.findUnique({
      where: { email: 'teacher@test.com' },
    });

    if (teacherUser) {
      await prisma.userAssignment.upsert({
        where: { id: 'teacher-assignment-1' },
        update: {},
        create: {
          id: 'teacher-assignment-1',
          userId: teacherUser.id,
          schoolId: school1.id,
        },
      });
      console.log('✅ Assigned teacher to Castries Primary School\n');
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@test.com' },
    });

    if (adminUser) {
      await prisma.userAssignment.upsert({
        where: { id: 'admin-assignment-1' },
        update: {},
        create: {
          id: 'admin-assignment-1',
          userId: adminUser.id,
          schoolId: school1.id,
        },
      });
      console.log('✅ Assigned admin to Castries Primary School\n');
    }

    console.log('🎉 Sample data seed completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - Countries: ${OECS_COUNTRIES.length}`);
    console.log('   - Schools: 2');
    console.log('   - Students: 10');
    console.log('   - Terms: 3');
    console.log('\n✨ You can now login and start assessing students!\n');
  } catch (error) {
    console.error('Error seeding sample data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedSampleData();
