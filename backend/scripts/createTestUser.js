import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('Creating test user...\n');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // Create test teacher user
    const teacher = await prisma.user.create({
      data: {
        email: 'teacher@test.com',
        passwordHash,
        firstName: 'Test',
        lastName: 'Teacher',
        role: 'TEACHER',
      },
    });

    console.log('✅ Test teacher created successfully!');
    console.log('   Email: teacher@test.com');
    console.log('   Password: password123');
    console.log(`   Role: ${teacher.role}\n`);

    // Create test admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        passwordHash,
        firstName: 'Test',
        lastName: 'Admin',
        role: 'SCHOOL_ADMIN',
      },
    });

    console.log('✅ Test admin created successfully!');
    console.log('   Email: admin@test.com');
    console.log('   Password: password123');
    console.log(`   Role: ${admin.role}\n`);

    console.log('🎉 All test users created!\n');
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
