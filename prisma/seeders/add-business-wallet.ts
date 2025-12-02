import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // All supported currencies
  const currencies = ['NGN', 'USD', 'GBP'];

  // Get all businesses
  const businesses = await prisma.businessInformation.findMany({
    select: { id: true, business_name: true },
  });

  for (const business of businesses) {
    for (const currency of currencies) {
      // Check if this business already has a wallet in this currency
      const exists = await prisma.businessWallet.findUnique({
        where: {
          business_id_currency: {
            business_id: business.id,
            currency,
          },
        },
      });

      // console.log(exists);

      if (!exists) {
        await prisma.businessWallet.create({
          data: {
            business_id: business.id,
            balance: 0,
            previous_balance: 0,
            currency,
          },
        });

        console.log(
          `✅ Created ${currency} wallet for business: ${business.business_name}`,
        );
      } else {
        console.log(
          `⏩ Skipped ${currency} wallet for business: ${business.business_name} (already exists)`,
        );
      }
    }
  }
}

main()
  .then(async () => {
    console.log('🌍 Business wallets seeding completed.');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
