const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

function titleCase(str) {
  return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

async function main() {
  console.log('Starting category migration...');

  // 1. Fetch all products
  const products = await prisma.product.findMany();
  console.log(`Found ${products.length} products.`);

  // 2. Extract and normalize categories
  const categoryMap = new Map(); // raw string -> normalized name

  for (const product of products) {
    let rawCat = product.category;
    if (!rawCat || rawCat.trim() === '') {
      rawCat = 'Uncategorized';
    }

    const normalizedCat = titleCase(rawCat.trim());
    categoryMap.set(product.category, normalizedCat);
  }

  // Get unique normalized categories
  const uniqueCategories = Array.from(new Set(categoryMap.values()));
  console.log(`Found ${uniqueCategories.length} unique normalized categories.`);

  // 3. Create categories
  const nameToId = new Map();

  for (const catName of uniqueCategories) {
    let baseSlug = generateSlug(catName);
    let slug = baseSlug;
    let counter = 1;
    
    // Check if category already exists to avoid collisions
    let existingCategory = await prisma.category.findUnique({ where: { name: catName } });
    
    if (!existingCategory) {
       // Ensure unique slug
       while (await prisma.category.findUnique({ where: { slug } })) {
         slug = `${baseSlug}-${counter}`;
         counter++;
       }

       existingCategory = await prisma.category.create({
         data: {
           name: catName,
           slug,
           description: `All products in ${catName}`
         }
       });
       console.log(`Created category: ${catName} (${slug})`);
    } else {
       console.log(`Category already exists: ${catName}`);
    }

    nameToId.set(catName, existingCategory.id);
  }

  // 4. Update products
  let updatedCount = 0;
  for (const product of products) {
    let rawCat = product.category;
    if (!rawCat || rawCat.trim() === '') rawCat = 'Uncategorized';
    
    const normalizedCat = categoryMap.get(product.category) || 'Uncategorized';
    const categoryId = nameToId.get(normalizedCat);

    if (categoryId && product.categoryId !== categoryId) {
      await prisma.product.update({
        where: { id: product.id },
        data: { categoryId }
      });
      updatedCount++;
    }
  }

  console.log(`Updated ${updatedCount} products with category IDs.`);
  console.log('Migration completed successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
