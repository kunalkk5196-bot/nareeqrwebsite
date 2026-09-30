import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PostgreSQL database for Naree VendTrack...');

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // Seed default Super Admin user
  await prisma.user.upsert({
    where: { email: 'superadmin@naree.com' },
    update: {},
    create: {
      email: 'superadmin@naree.com',
      passwordHash,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('PostgreSQL database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
