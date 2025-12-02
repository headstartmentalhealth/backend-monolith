// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const currencyMap: Record<string, string> = {
  NGN: 'https://doexcess-file-bucket.s3.us-east-1.amazonaws.com/assets/ngn.png',
  USD: 'https://doexcess-file-bucket.s3.us-east-1.amazonaws.com/assets/usd.png',
  GBP: 'https://doexcess-file-bucket.s3.us-east-1.amazonaws.com/assets/gbp.svg',
};

async function updateCurrencyUrls() {
  // 1. AllowedCurrency
  for (const [currency, url] of Object.entries(currencyMap)) {
    await prisma.allowedCurrency.updateMany({
      where: { currency },
      data: { currency_url: url },
    });
  }
  console.log('✅ AllowedCurrency updated');

  // 2. BusinessAccountCurrency
  for (const [currency, url] of Object.entries(currencyMap)) {
    await prisma.businessAccountCurrency.updateMany({
      where: { currency },
      data: { currency_url: url },
    });
  }
  console.log('✅ BusinessAccountCurrency updated');

  // 3. BusinessProductEnabledCurrency
  for (const [currency, url] of Object.entries(currencyMap)) {
    await prisma.businessProductEnabledCurrency.updateMany({
      where: { currency },
      data: { currency_url: url },
    });
  }
  console.log('✅ BusinessProductEnabledCurrency updated');
}

async function main() {
  await updateCurrencyUrls();
}

main()
  .then(async () => {
    console.log('🎉 Currency URLs updated successfully');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error updating currency URLs:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
