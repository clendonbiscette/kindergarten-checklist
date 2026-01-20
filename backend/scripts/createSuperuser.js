import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSuperuser() {
  try {
    // Configuration - CHANGE THESE VALUES before running in production
    const SUPERUSER_EMAIL = process.env.SUPERUSER_EMAIL || 'superuser@example.com';
    const SUPERUSER_PASSWORD = process.env.SUPERUSER_PASSWORD || 'ChangeThisPassword123!';
    const SUPERUSER_FIRST_NAME = process.env.SUPERUSER_FIRST_NAME || 'System';
    const SUPERUSER_LAST_NAME = process.env.SUPERUSER_LAST_NAME || 'Administrator';

    console.log('Creating superuser account...\n');

    // Check if superuser already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: SUPERUSER_EMAIL },
    });

    if (existingUser) {
      if (existingUser.role === 'SUPERUSER') {
        console.log('⚠️  Superuser already exists with this email.');
        console.log(`   Email: ${SUPERUSER_EMAIL}`);
        console.log('   No changes made.\n');
        return;
      } else {
        // Upgrade existing user to SUPERUSER
        const upgraded = await prisma.user.update({
          where: { email: SUPERUSER_EMAIL },
          data: { role: 'SUPERUSER' },
        });
        console.log('✅ Existing user upgraded to SUPERUSER!');
        console.log(`   Email: ${upgraded.email}`);
        console.log(`   Name: ${upgraded.firstName} ${upgraded.lastName}`);
        console.log(`   Role: ${upgraded.role}\n`);
        return;
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(SUPERUSER_PASSWORD, salt);

    // Create superuser
    const superuser = await prisma.user.create({
      data: {
        email: SUPERUSER_EMAIL,
        passwordHash,
        firstName: SUPERUSER_FIRST_NAME,
        lastName: SUPERUSER_LAST_NAME,
        role: 'SUPERUSER',
      },
    });

    console.log('✅ Superuser created successfully!');
    console.log(`   Email: ${superuser.email}`);
    console.log(`   Name: ${superuser.firstName} ${superuser.lastName}`);
    console.log(`   Role: ${superuser.role}`);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!\n');

  } catch (error) {
    console.error('Error creating superuser:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperuser();
