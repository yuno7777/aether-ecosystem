import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_USERS = {
  'admin@aether.io': {
    password: 'admin123',
    user: {
      id: 'usr-001',
      name: 'Aether Admin',
      email: 'admin@aether.io',
      role: 'admin',
    },
  },
  'manager@aether.io': {
    password: 'manager123',
    user: {
      id: 'usr-002',
      name: 'Sarah Chen',
      email: 'manager@aether.io',
      role: 'manager',
    },
  },
  'sales@aether.io': {
    password: 'sales123',
    user: {
      id: 'usr-003',
      name: 'Alex Rivera',
      email: 'sales@aether.io',
      role: 'sales',
    },
  },
  'warehouse@aether.io': {
    password: 'warehouse123',
    user: {
      id: 'usr-004',
      name: 'Jordan Lee',
      email: 'warehouse@aether.io',
      role: 'warehouse',
    },
  },
  'viewer@aether.io': {
    password: 'viewer123',
    user: {
      id: 'usr-005',
      name: 'Taylor Kim',
      email: 'viewer@aether.io',
      role: 'viewer',
    },
  },
};

async function main() {
    console.log("Seeding Neon DB with Users...");
    for (const [email, entry] of Object.entries(DEMO_USERS)) {
        await prisma.user.upsert({
            where: { email },
            update: {
                name: entry.user.name,
                password: entry.password,
                role: entry.user.role
            },
            create: {
                id: entry.user.id,
                email: entry.user.email,
                name: entry.user.name,
                password: entry.password,
                role: entry.user.role
            }
        });
        console.log(`Upserted user: ${email}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
