import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

async function backfillSlugs() {
  const businesses = await prisma.businessInformation.findMany();

  const usedSlugs = new Set<string>();

  for (const biz of businesses) {
    let baseSlug = slugify(biz.business_name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    // ensure uniqueness
    while (usedSlugs.has(slug)) {
      slug = `${baseSlug}-${counter++}`;
    }

    usedSlugs.add(slug);

    await prisma.businessInformation.update({
      where: { id: biz.id },
      data: { business_slug: slug },
    });

    console.log(`Updated ${biz.business_name} -> ${slug}`);
  }
}

backfillSlugs()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
