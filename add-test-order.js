const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findFirst();
  if (!product) {
    console.log("No product found");
    return;
  }
  
  await prisma.order.create({
    data: {
      invoiceNumber: 'INV-TEST-999',
      customerName: 'Test Customer',
      totalAmount: 15.50,
      status: 'COMPLETED',
      items: {
        create: [
          {
            productId: product.id,
            quantity: 1,
            priceAtSale: 15.50,
            subtotal: 15.50
          }
        ]
      }
    }
  });
  console.log('Test order added');
}

main().then(() => prisma.$disconnect()).catch(console.error);
