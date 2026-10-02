import { PrismaClient } from '@prisma/client';
import { initialUsers, initialProducts, initialMachines, initialQrIdentifiers } from '../src/data/seed-data.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PostgreSQL database for NAREE VendTrack...');

  // 1. Seed Users
  for (const u of initialUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        phone: u.phone,
        role: u.role as any,
        isActive: u.isActive,
      },
      create: {
        id: u.id,
        email: u.email,
        passwordHash: u.passwordHash,
        name: u.name,
        phone: u.phone,
        role: u.role as any,
        isActive: u.isActive,
      },
    });
  }
  console.log(`✓ Seeded ${initialUsers.length} users`);

  // 2. Seed Products
  for (const p of initialProducts) {
    await prisma.product.upsert({
      where: { productId: p.productId },
      update: {
        name: p.name,
        description: p.description,
        price: p.price,
        sku: p.sku,
        isActive: p.isActive,
      },
      create: {
        id: p.id,
        productId: p.productId,
        name: p.name,
        description: p.description,
        price: p.price,
        sku: p.sku,
        isActive: p.isActive,
      },
    });
  }
  console.log(`✓ Seeded ${initialProducts.length} products`);

  // 3. Seed Machines
  for (const m of initialMachines) {
    await prisma.machine.upsert({
      where: { machineId: m.machineId },
      update: {
        machineName: m.machineName,
        location: m.location,
        address: m.address,
        city: m.city,
        state: m.state,
        latitude: m.latitude,
        longitude: m.longitude,
        productCapacity: m.productCapacity,
        currentStock: m.currentStock,
        lowStockThreshold: m.lowStockThreshold,
        status: m.status as any,
        simNumber: m.simNumber,
        simOperator: m.simOperator,
        businessMobileNumber: m.businessMobileNumber,
        imei: m.imei,
        iotDeviceId: m.iotDeviceId,
      },
      create: {
        id: m.id,
        machineId: m.machineId,
        machineCode: m.machineCode,
        machineName: m.machineName,
        location: m.location,
        address: m.address,
        city: m.city,
        state: m.state,
        latitude: m.latitude,
        longitude: m.longitude,
        installationDate: new Date(m.installationDate),
        iotDeviceId: m.iotDeviceId,
        simNumber: m.simNumber,
        simOperator: m.simOperator,
        businessMobileNumber: m.businessMobileNumber,
        imei: m.imei,
        productCapacity: m.productCapacity,
        currentStock: m.currentStock,
        lowStockThreshold: m.lowStockThreshold,
        status: m.status as any,
      },
    });
  }
  console.log(`✓ Seeded ${initialMachines.length} machines`);

  // 4. Seed QR Identifiers
  for (const q of initialQrIdentifiers) {
    const existing = await prisma.qrIdentifier.findFirst({
      where: { identifier: q.identifier },
    });
    if (!existing) {
      await prisma.qrIdentifier.create({
        data: {
          id: q.id,
          machineId: q.machineId,
          gateway: q.gateway as any,
          identifier: q.identifier,
          merchantId: q.merchantId,
          isActive: q.isActive,
        },
      });
    }
  }
  console.log(`✓ Seeded ${initialQrIdentifiers.length} QR identifiers`);

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
