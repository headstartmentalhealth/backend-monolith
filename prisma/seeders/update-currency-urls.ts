// scripts/updateCurrencyUrls.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const currencyMap: Record<string, string> = {
  NGN: 'https://doexcess-file-bucket.s3.us-east-1.amazonaws.com/assets/ngn.png',
  USD: 'https://doexcess-file-bucket.s3.us-east-1.amazonaws.com/assets/usd.png',
  GBP: 'https://doexcess-file-bucket.s3.us-east-1.amazonaws.com/assets/gbp.svg',
};

async function main() {
  const wallets = await prisma.businessWallet.findMany();

  for (const wallet of wallets) {
    const url = currencyMap[wallet.currency.toUpperCase()];

    if (url && wallet.currency_url !== url) {
      await prisma.businessWallet.update({
        where: { id: wallet.id },
        data: { currency_url: url },
      });
      console.log(`✅ Updated ${wallet.currency} for wallet ${wallet.id}`);
    } else {
      console.log(`⚡ Skipped ${wallet.currency} for wallet ${wallet.id}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
