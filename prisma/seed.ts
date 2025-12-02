import {
  Action,
  BusinessSize,
  MultimediaType,
  PrismaClient,
  ProductType,
} from '@prisma/client';
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid'; // Import uuid from the uuid package

const prisma = new PrismaClient();

// Function to get a random action from the enum
function getRandomAction(): Action {
  const actions = Object.values(Action); // Convert enum to array
  const randomIndex = Math.floor(Math.random() * actions.length); // Get a random index
  return actions[randomIndex]; // Return the random action
}

async function main() {
  console.log('Seeding logs...');

  try {
    // Log

    const entities = ['User', 'Role', 'Post', 'Comment'];

    // for (let i = 0; i < 10; i++) {
    //   const userId = uuidv4(); // Use uuid package
    //   const entityId = uuidv4(); // Use uuid package
    //   const created_at = faker.date.past();
    //   const updated_at = faker.date.past();
    //   const metadata = {
    //     details: faker.lorem.sentence(),
    //   };
    //   const ipAddress = faker.internet.ip();
    //   const userAgent = faker.internet.userAgent();
    //   await prisma.log.create({
    //     data: {
    //       id: uuidv4(), // Use uuid package for unique ID
    //       user_id: userId,
    //       action: getRandomAction(), // Use the function to get a random action
    //       entity: faker.helpers.arrayElement(entities),
    //       entity_id: entityId,
    //       created_at,
    //       updated_at,
    //       metadata,
    //       ip_address: ipAddress,
    //       user_agent: userAgent,
    //     },
    //   });
    // }

    // role group & role (default)
    const ownerRoleGroupId = uuidv4();
    const businessRoleGroupId = uuidv4();
    const userRoleGroupId = uuidv4();

    const roleGroups = [
      {
        id: ownerRoleGroupId, // Use a specific ID or generate one
        name: 'Owner',
        roles: [
          {
            id: uuidv4(),
            name: 'Owner Administrator',
            role_id: 'owner-administrator',
            description: 'Administrator role with full access (Owner)',
            role_group_id: ownerRoleGroupId,
          },
          {
            id: uuidv4(),
            name: 'Owner Super Administrator',
            role_id: 'owner-super-administrator',
            description:
              'Super Administrator role with elevated privileges (Owner)',
            role_group_id: ownerRoleGroupId,
          },
        ],
      },
      {
        id: businessRoleGroupId, // Use a specific ID or generate one
        name: 'Business',
        roles: [
          {
            id: uuidv4(),
            name: 'Business Administrator',
            role_id: 'business-administrator',
            description: 'Administrator role with full access (Business)',
            role_group_id: businessRoleGroupId,
          },
          {
            id: uuidv4(),
            name: 'Business Super Administrator',
            role_id: 'business-super-administrator',
            description:
              'Business Super Administrator role with elevated privileges (Business)',
            role_group_id: businessRoleGroupId,
          },
        ],
      },
      {
        id: userRoleGroupId, // Use a specific ID or generate one
        name: 'End User',
        roles: [
          {
            id: uuidv4(),
            name: 'User',
            role_id: 'user',
            description: 'User role with minimal privileges',
            role_group_id: userRoleGroupId,
          },
        ],
      },
    ];
    for (let index = 0; index < roleGroups.length; index++) {
      const roleGroup = roleGroups[index];

      const roles = [...roleGroup.roles];

      await prisma.roleGroup.upsert({
        where: { id: roleGroup.id },
        update: {},
        create: {
          id: roleGroup.id,
          name: roleGroup.name,
        },
      });

      for (let second_index = 0; second_index < roles.length; second_index++) {
        const role = roles[second_index];

        await prisma.role.upsert({
          where: { id: role.id },
          update: {},
          create: role,
        });
      }
    }

    // await seedBusinessCourses();
  } catch (error) {
    console.error('Error creating log:', error);
  }

  console.log('Seeding completed.');
}

async function seedBusinessCourses() {
  try {
    // Create a Creator (User)
    const creator = await prisma.user.upsert({
      where: { id: 'creator-001' },
      update: {},
      create: {
        id: 'creator-001',
        name: 'John Doe',
        email: 'johndoe@example.com',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Create a Business
    const business = await prisma.businessInformation.upsert({
      where: { id: 'business-001' },
      update: {},
      create: {
        id: 'business-001',
        user_id: creator.id,
        business_name: 'Tech Academy',
        business_size: BusinessSize.medium,
        timeline: 'Africa/Lagos',
        industry: 'Software',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    for (let i = 1; i <= 5; i++) {
      // Create Multimedia for each course
      const multimedia = await prisma.multimedia.create({
        data: {
          id: `multimedia-${i}`,
          url: `https://example.com/video-${i}.mp4`,
          type: MultimediaType.VIDEO,
          created_at: new Date(),
          updated_at: new Date(),
          business_id: 'business-001',
          creator_id: 'creator-001',
          provider: 'CLOUDINARY',
        },
      });

      const category = await prisma.productCategory.create({
        data: {
          name: `product-category-${i}`,
          creator_id: 'creator-001',
        },
      });

      // Create Course
      const course = await prisma.product.create({
        data: {
          id: `course-${i}`,
          business_id: business.id,
          category_id: category.id,
          title: `Course ${i}: Advanced Programming`,
          price: i * 10 + 49.99,
          description: `A detailed guide to programming - Course ${i}`,
          keywords: `Programming, Advanced, Course ${i}`,
          metadata: { level: 'Advanced' },
          status: 'PUBLISHED',
          type: ProductType.COURSE,
          published_at: new Date(),
          creator_id: creator.id,
          multimedia_id: multimedia.id,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      for (let j = 1; j <= 5; j++) {
        // Create Module
        const module = await prisma.module.create({
          data: {
            id: `module-${i}-${j}`,
            course_id: course.id,
            title: `Module ${j} of Course ${i}`,
            position: j,
            creator_id: creator.id,
            business_id: business.id,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        for (let k = 1; k <= 5; k++) {
          // Create Module Content
          await prisma.moduleContent.create({
            data: {
              id: `content-${i}-${j}-${k}`,
              title: `Content ${k} of Module ${j} in Course ${i}`,
              module_id: module.id,
              creator_id: creator.id,
              business_id: business.id,
              multimedia_id: multimedia.id,
              position: k,
              created_at: new Date(),
              updated_at: new Date(),
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('Error seeding business courses: ', error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
