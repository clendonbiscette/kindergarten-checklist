import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPasswords() {
  try {
    console.log('🔐 Resetting passwords for test accounts...\n');

    const newPassword = 'Adminpass123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Reset teacher account
    const teacher = await prisma.user.update({
      where: { email: 'teacher@test.com' },
      data: { passwordHash }
    });
    console.log(`✅ Password reset for: ${teacher.email}`);

    // Reset admin account
    const admin = await prisma.user.update({
      where: { email: 'admin@test.com' },
      data: { passwordHash }
    });
    console.log(`✅ Password reset for: ${admin.email}`);

    console.log('\n🎉 All passwords have been reset to: Adminpass123');
    console.log('\nYou can now log in with:');
    console.log('  Teacher account: teacher@test.com / Adminpass123');
    console.log('  Admin account: admin@test.com / Adminpass123');

  } catch (error) {
    console.error('❌ Error resetting passwords:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetPasswords();
