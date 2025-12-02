import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

async function backfillSlugs() {
  const products = await prisma.product.findMany();

  const usedSlugs = new Set<string>();

  for (const product of products) {
    let baseSlug = slugify(product.title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    // ensure uniqueness
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    usedSlugs.add(slug);

    await prisma.product.update({
      where: { id: product.id },
      data: { slug: slug },
    });

    console.log(`Updated ${product.slug} -> ${slug}`);
  }
}

backfillSlugs()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
