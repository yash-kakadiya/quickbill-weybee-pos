const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.product.upsert({
    where: { sku: 'TEST-SKU-001' },
    update: { stock: 2, isActive: true },
    create: {
      name: 'Test Limit Product',
      sku: 'TEST-SKU-001',
      category: 'Testing',
      price: 15.50,
      stock: 2,
      lowStockThreshold: 5,
      isActive: true,
    }
  });
  console.log('Test product added/updated');
}

main().then(() => prisma.$disconnect()).catch(console.error);
