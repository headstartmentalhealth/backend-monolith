import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // --- Seed Currency Rates ---
  await prisma.currencyRate.createMany({
    data: [
      {
        base_currency: 'NGN',
        foreign_currency: 'USD',
        base_to_foreign_rate: new Prisma.Decimal('0.0013'), // 1 NGN -> USD
        foreign_to_base_rate: new Prisma.Decimal('770.00'), // 1 USD -> NGN
      },
      {
        base_currency: 'NGN',
        foreign_currency: 'GBP',
        base_to_foreign_rate: new Prisma.Decimal('0.0010'), // 1 NGN -> GBP
        foreign_to_base_rate: new Prisma.Decimal('1000.00'), // 1 GBP -> NGN
      },
    ],
    skipDuplicates: true,
  });

  // --- Seed Allowed Currencies ---
  await prisma.allowedCurrency.createMany({
    data: [
      {
        currency: 'NGN',
        charge: new Prisma.Decimal('3.50'), // Example 1.5%
        additional_flat_amount: new Prisma.Decimal('50.00'), // ₦50 extra flat
        enabled: true,
      },
      {
        currency: 'USD',
        charge: new Prisma.Decimal('6.50'), // Example 2%
        additional_flat_amount: new Prisma.Decimal('0.50'), // 50 cents flat
        enabled: true,
      },
      {
        currency: 'GBP',
        charge: new Prisma.Decimal('6.50'), // Example 2.5%
        additional_flat_amount: new Prisma.Decimal('0.50'), // 50P flat
        enabled: true,
      },
    ],
    skipDuplicates: true,
  });

  // --- Create Business Account Currencies ---
  const businesses = await prisma.businessInformation.findMany({
    where: { deleted_at: null },
    select: { id: true, business_name: true },
  });

  if (businesses.length === 0) {
    console.log('No businesses found.');
    return;
  }

  // Step 1: Business Account Currencies (NGN, USD, GBP)
  const supportedCurrencies = ['NGN', 'USD', 'GBP'];

  const accountCurrencyData = businesses.flatMap((b) =>
    supportedCurrencies.map((currency) => ({
      business_id: b.id,
      currency,
    })),
  );

  const accountRes = await prisma.businessAccountCurrency.createMany({
    data: accountCurrencyData,
    skipDuplicates: true,
  });
  console.log(
    `BusinessAccountCurrencies → Inserted ${accountRes.count} records (NGN, USD, GBP for each business).`,
  );

  // Step 2: Business Product Enabled Currency (NGN only)
  const productCurrencyData = businesses.map((b) => ({
    business_id: b.id,
    currency: 'NGN',
  }));

  const productRes = await prisma.businessProductEnabledCurrency.createMany({
    data: productCurrencyData,
    skipDuplicates: true,
  });
  console.log(
    `BusinessProductEnabledCurrency → Inserted ${productRes.count} records (NGN only).`,
  );
}

main()
  .then(() => {
    console.log('✅ Seeded currency rates and allowed currencies successfully');
  })
  .catch((e) => {
    console.error('❌ Error seeding data', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
