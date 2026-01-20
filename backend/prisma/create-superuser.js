import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@oecs.org';
  const password = 'admin123';
  const firstName = 'System';
  const lastName = 'Administrator';

  console.log('Creating superuser account...');

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`User with email ${email} already exists.`);

    // Update to superuser if not already
    if (existingUser.role !== 'SUPERUSER') {
      await prisma.user.update({
        where: { email },
        data: { role: 'SUPERUSER' },
      });
      console.log('Updated existing user to SUPERUSER role.');
    } else {
      console.log('User is already a SUPERUSER.');
    }
    return;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create superuser
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'SUPERUSER',
      isActive: true,
    },
  });

  console.log('\n✅ Superuser created successfully!');
  console.log('================================');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('================================');
  console.log('\n⚠️  Please change this password after first login!');
}

main()
  .catch((e) => {
    console.error('Error creating superuser:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
