import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

enum OnboardingProcesses {
  BUSINESS_DETAILS = 'BUSINESS_DETAILS',
  KYC = 'KYC',
  WITHDRAWAL_ACCOUNT = 'WITHDRAWAL_ACCOUNT',
  TEAM_MEMBERS_INVITATION = 'TEAM_MEMBERS_INVITATION',
  PRODUCT_CREATION = 'PRODUCT_CREATION',
}

async function main() {
  const businesses = await prisma.businessInformation.findMany({
    include: {
      kyc: true,
      withdrawal_account: true,
      business_contacts: true,
      products: true,
      onboarding_status: true,
    },
  });

  for (const business of businesses) {
    // Build base processes
    const processes: OnboardingProcesses[] = [
      OnboardingProcesses.BUSINESS_DETAILS,
    ];

    if (business.kyc && business.kyc.length >= 1) {
      processes.push(OnboardingProcesses.KYC);
    }

    if (business.withdrawal_account) {
      processes.push(OnboardingProcesses.WITHDRAWAL_ACCOUNT);
    }

    if (business.business_contacts && business.business_contacts.length > 1) {
      processes.push(OnboardingProcesses.TEAM_MEMBERS_INVITATION);
    }

    if (business.products && business.products.length > 1) {
      processes.push(OnboardingProcesses.PRODUCT_CREATION);
    }

    if (!business.onboarding_status) {
      // Create if onboarding_status does not exist
      await prisma.onboardingStatus.create({
        data: {
          user_id: business.user_id,
          business_id: business.id,
          current_step: 1,
          is_completed: false,
          onboard_processes: processes,
        },
      });
      console.log(
        `✅ Created onboarding_status for ${business.business_name} with processes: [${processes.join(', ')}]`,
      );
    } else {
      // Merge with existing onboard_processes without duplicates
      const existing = (business.onboarding_status.onboard_processes ||
        []) as OnboardingProcesses[];

      const merged = Array.from(new Set([...existing, ...processes]));

      await prisma.onboardingStatus.update({
        where: { id: business.onboarding_status.id },
        data: {
          onboard_processes: merged,
        },
      });

      console.log(
        `🔄 Updated onboarding_status for ${business.business_name} with processes: [${merged.join(', ')}]`,
      );
    }
  }
}

main()
  .then(() => {
    console.log('🌱 Seeding finished.');
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
