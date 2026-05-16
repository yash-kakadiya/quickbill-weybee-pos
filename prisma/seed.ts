import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { subDays, startOfDay } from 'date-fns';

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const isReset = args.includes('--reset');

const CATEGORIES = [
  { name: 'Stationery', slug: 'stationery', description: 'Pens, pencils, and desk essentials' },
  { name: 'Electronics', slug: 'electronics', description: 'Gadgets, devices, and peripherals' },
  { name: 'Accessories', slug: 'accessories', description: 'Cables, adapters, and carrying cases' },
  { name: 'Office Supplies', slug: 'office-supplies', description: 'Staplers, folders, and paper products' },
  { name: 'Storage Devices', slug: 'storage-devices', description: 'Hard drives, flash drives, and memory cards' },
  { name: 'Writing Tools', slug: 'writing-tools', description: 'Premium pens, markers, and highlighters' },
  { name: 'Computer Peripherals', slug: 'computer-peripherals', description: 'Keyboards, mice, and webcams' },
  { name: 'Cables & Chargers', slug: 'cables-chargers', description: 'Power banks, USB-C, and Lightning cables' },
  { name: 'Notebooks', slug: 'notebooks', description: 'Journals, planners, and spiral notebooks' },
  { name: 'Desk Essentials', slug: 'desk-essentials', description: 'Organizers, lamps, and mouse pads' },
];

const PRODUCTS_DATA = [
  // Computer Peripherals (Hero items)
  { name: 'Logitech MX Master 3S Wireless Mouse', category: 'Computer Peripherals', price: 8999, stock: 45, threshold: 10, isHero: true },
  { name: 'Keychron K2 Mechanical Keyboard', category: 'Computer Peripherals', price: 7500, stock: 25, threshold: 5, isHero: true },
  { name: 'Razer DeathAdder V3 Pro', category: 'Computer Peripherals', price: 12999, stock: 15, threshold: 5 },
  { name: 'Dell UltraSharp 27" 4K Monitor', category: 'Computer Peripherals', price: 45000, stock: 8, threshold: 3 },
  { name: 'Logitech C920 HD Pro Webcam', category: 'Computer Peripherals', price: 6500, stock: 0, threshold: 10 }, // Out of stock
  
  // Storage Devices
  { name: 'Samsung T7 Shield 1TB Portable SSD', category: 'Storage Devices', price: 8999, stock: 30, threshold: 10, isHero: true },
  { name: 'SanDisk Extreme Pro 128GB SD Card', category: 'Storage Devices', price: 2199, stock: 50, threshold: 15 },
  { name: 'Seagate Backup Plus 2TB HDD', category: 'Storage Devices', price: 5500, stock: 12, threshold: 5 },
  { name: 'Kingston DataTraveler 64GB USB 3.2', category: 'Storage Devices', price: 599, stock: 3, threshold: 20 }, // Low stock
  { name: 'WD Blue SN570 500GB NVMe SSD', category: 'Storage Devices', price: 3200, stock: 20, threshold: 10 },
  
  // Cables & Chargers
  { name: 'Anker Nano II 65W GaN Charger', category: 'Cables & Chargers', price: 2999, stock: 60, threshold: 15, isHero: true },
  { name: 'Apple 20W USB-C Power Adapter', category: 'Cables & Chargers', price: 1900, stock: 100, threshold: 20 },
  { name: 'Belkin Braided USB-C to USB-C Cable (2m)', category: 'Cables & Chargers', price: 1499, stock: 40, threshold: 10 },
  { name: 'AmazonBasics HDMI Cable (1.5m)', category: 'Cables & Chargers', price: 399, stock: 150, threshold: 30 },
  { name: 'Spigen 10000mAh Power Bank', category: 'Cables & Chargers', price: 1999, stock: 2, threshold: 10 }, // Low stock
  { name: 'Mivi 3-in-1 Nylon Braided Cable', category: 'Cables & Chargers', price: 499, stock: 0, threshold: 10 }, // Out of stock
  
  // Notebooks
  { name: 'Moleskine Classic Ruled Large Notebook', category: 'Notebooks', price: 1850, stock: 35, threshold: 10 },
  { name: 'Leuchtturm1917 A5 Dotted Hardcover', category: 'Notebooks', price: 2100, stock: 20, threshold: 10 },
  { name: 'Classmate Pulse 6 Subject Spiral', category: 'Notebooks', price: 250, stock: 80, threshold: 20 },
  { name: 'Oxford Campus A4 Refill Pad', category: 'Notebooks', price: 350, stock: 60, threshold: 15 },
  { name: 'Rhodia Webnotebook A5', category: 'Notebooks', price: 1999, stock: 4, threshold: 10 }, // Low stock
  
  // Writing Tools
  { name: 'Pilot V7 Hi-Tecpoint Rollerball Pen (Pack of 3)', category: 'Writing Tools', price: 180, stock: 120, threshold: 20, isHero: true },
  { name: 'Parker Jotter Standard Ball Pen', category: 'Writing Tools', price: 350, stock: 45, threshold: 10 },
  { name: 'Lamy Safari Fountain Pen - Matte Black', category: 'Writing Tools', price: 2800, stock: 15, threshold: 5 },
  { name: 'Faber-Castell Textliner Highlighter (Set of 5)', category: 'Writing Tools', price: 100, stock: 85, threshold: 15 },
  { name: 'Uni-ball Eye Micro Rollerball (Pack of 3)', category: 'Writing Tools', price: 240, stock: 0, threshold: 15 }, // Out of stock
  
  // Desk Essentials
  { name: 'IKEA SKÅDIS Pegboard Organizer', category: 'Desk Essentials', price: 1290, stock: 25, threshold: 5 },
  { name: 'Portronics MyBuddy K Portable Laptop Stand', category: 'Desk Essentials', price: 899, stock: 40, threshold: 10 },
  { name: 'Xiaomi Mi LED Desk Lamp 1S', category: 'Desk Essentials', price: 2999, stock: 18, threshold: 5 },
  { name: 'DailyObjects Vegan Leather Desk Mat', category: 'Desk Essentials', price: 1499, stock: 30, threshold: 10 },
  { name: 'Post-it Super Sticky Notes (3x3 inch, 5 Pads)', category: 'Desk Essentials', price: 399, stock: 110, threshold: 20 },
  
  // Accessories
  { name: 'Spigen Liquid Air Case for iPhone 15 Pro', category: 'Accessories', price: 1299, stock: 22, threshold: 5 },
  { name: 'Logitech K380 Multi-Device Bluetooth Keyboard', category: 'Accessories', price: 2895, stock: 14, threshold: 5 },
  { name: 'Targus 15.6" Intellect Laptop Backpack', category: 'Accessories', price: 1599, stock: 5, threshold: 10 }, // Low stock
  { name: 'JBL C100SI Wired Earphones', category: 'Accessories', price: 599, stock: 55, threshold: 15 },
  
  // Office Supplies
  { name: 'Kangaro HD-45 Stapler', category: 'Office Supplies', price: 165, stock: 65, threshold: 15 },
  { name: 'Camel Camlin Whiteboard Marker (Box of 10)', category: 'Office Supplies', price: 250, stock: 40, threshold: 10 },
  { name: 'Kores Glue Stick (15g, Pack of 5)', category: 'Office Supplies', price: 125, stock: 90, threshold: 20 },
  { name: 'Century A4 Copier Paper (500 Sheets)', category: 'Office Supplies', price: 280, stock: 150, threshold: 30, isHero: true },
  { name: 'GBC Binding Combs 10mm (Box of 100)', category: 'Office Supplies', price: 450, stock: 0, threshold: 5 }, // Out of stock
  
  // Electronics
  { name: 'Amazon Echo Dot (5th Gen)', category: 'Electronics', price: 4499, stock: 25, threshold: 10 },
  { name: 'Sony WH-1000XM5 Wireless Headphones', category: 'Electronics', price: 29990, stock: 8, threshold: 3 },
  { name: 'Apple AirTag (1 Pack)', category: 'Electronics', price: 3490, stock: 35, threshold: 10 },
  { name: 'Boat Stone 1200 Bluetooth Speaker', category: 'Electronics', price: 3999, stock: 12, threshold: 5 },
  { name: 'Samsung Galaxy SmartTag2', category: 'Electronics', price: 2499, stock: 2, threshold: 5 }, // Low stock
];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate an order id locally to use before insert
function generateInvoiceNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${dateStr}-${randomStr}`;
}

async function main() {
  console.log('🌱 Starting database seeding process...');

  if (isReset) {
    console.log('⚠️ --reset flag detected. Truncating database...');
    // We explicitly truncate these tables to preserve migrations and schema.
    // ORDER IS IMPORTANT due to foreign keys.
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "OrderItem" CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Order" CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "StockLog" CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Product" CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Category" CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "User" CASCADE;`);
    console.log('✅ Database truncated successfully.');
  } else {
    // Basic idempotency check if we aren't resetting
    const adminExists = await prisma.user.findUnique({ where: { username: 'admin' } });
    if (adminExists) {
      console.log('⚠️ Database already contains an admin user. Run with "npm run db:reset-demo" if you want to wipe and re-seed.');
      process.exit(0);
    }
  }

  // 1. Create Admin
  console.log('👤 Seeding Admin User...');
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash,
      role: 'ADMIN'
    }
  });

  // 2. Create Categories
  console.log('📁 Seeding Categories...');
  const categoryMap = new Map();
  for (const cat of CATEGORIES) {
    const created = await prisma.category.create({
      data: cat
    });
    categoryMap.set(cat.name, created.id);
  }

  // 3. Create Products
  console.log('📦 Seeding Products...');
  const heroProductIds: string[] = [];
  const allProductIds: string[] = [];
  const productPriceMap = new Map();

  let skuCounter = 1000;
  for (const prod of PRODUCTS_DATA) {
    const categoryId = categoryMap.get(prod.category);
    if (!categoryId) {
      console.warn(`Category ${prod.category} not found for product ${prod.name}`);
      continue;
    }

    const createdProduct = await prisma.product.create({
      data: {
        name: prod.name,
        sku: `SKU-${skuCounter++}`,
        categoryId: categoryId,
        description: `Professional-grade ${prod.name.toLowerCase()} suitable for retail and office use.`,
        price: prod.price,
        stock: prod.stock,
        lowStockThreshold: prod.threshold,
        isActive: true,
      }
    });

    allProductIds.push(createdProduct.id);
    productPriceMap.set(createdProduct.id, prod.price);
    
    if (prod.isHero) {
      heroProductIds.push(createdProduct.id);
    }
  }

  // 4. Create Historical Orders (Last 90 Days)
  console.log('🛒 Seeding 90 Days of Historical Orders...');
  
  const today = new Date();
  const NUM_DAYS = 90;
  
  let totalOrdersCreated = 0;
  let totalRevenueGenerated = 0;

  for (let i = NUM_DAYS; i >= 0; i--) {
    const orderDate = subDays(today, i);
    
    // Simulate natural variance: weekends have slightly different volume, some random peaks
    const dayOfWeek = orderDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Base volume: 1 to 5 orders a day. Weekends 0 to 3.
    let numOrdersToday = isWeekend ? getRandomInt(0, 3) : getRandomInt(1, 5);
    
    // Randomly create a "spike" day 10% of the time
    if (Math.random() < 0.1) {
      numOrdersToday += getRandomInt(3, 8);
    }

    for (let o = 0; o < numOrdersToday; o++) {
      const numItemsInOrder = getRandomInt(1, 4);
      const itemsToInclude = [];
      let orderSubtotal = 0;

      // Select products for this order
      for (let item = 0; item < numItemsInOrder; item++) {
        // 40% chance to pick a hero product to ensure strong analytics patterns
        const pickHero = Math.random() < 0.4;
        let selectedProductId;
        
        if (pickHero && heroProductIds.length > 0) {
          selectedProductId = heroProductIds[getRandomInt(0, heroProductIds.length - 1)];
        } else {
          selectedProductId = allProductIds[getRandomInt(0, allProductIds.length - 1)];
        }

        // Avoid duplicate items in same order (simplification)
        if (itemsToInclude.some(i => i.productId === selectedProductId)) continue;

        const quantity = getRandomInt(1, 3);
        const priceAtSale = productPriceMap.get(selectedProductId);
        const itemSubtotal = priceAtSale * quantity;
        
        orderSubtotal += itemSubtotal;

        itemsToInclude.push({
          productId: selectedProductId,
          quantity: quantity,
          priceAtSale: priceAtSale,
          subtotal: itemSubtotal
        });
      }

      if (itemsToInclude.length === 0) continue; // Skip empty orders (all duplicates generated)

      // Randomly adjust order creation time within the day
      const orderDateTime = new Date(orderDate);
      orderDateTime.setHours(getRandomInt(9, 19), getRandomInt(0, 59), 0, 0); // between 9 AM and 7 PM

      await prisma.order.create({
        data: {
          invoiceNumber: generateInvoiceNumber(),
          customerName: Math.random() > 0.5 ? 'Walk-in Customer' : undefined,
          totalAmount: orderSubtotal,
          status: 'COMPLETED',
          createdAt: orderDateTime,
          items: {
            create: itemsToInclude
          }
        }
      });

      totalOrdersCreated++;
      totalRevenueGenerated += orderSubtotal;
    }
  }

  console.log('✅ Seeding Complete!');
  console.log(`📊 Generated ${totalOrdersCreated} orders spanning 90 days.`);
  console.log(`💰 Total Revenue Simulated: ₹${totalRevenueGenerated.toFixed(2)}`);
  console.log(`🔑 Admin Login: admin / admin123`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
