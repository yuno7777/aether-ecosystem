import { PrismaClient } from '@prisma/client';
import { INITIAL_CLIENTS, INITIAL_TASKS, INITIAL_DEALS } from '../src/store';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding CRM Database...');

    // Seed Clients
    for (const client of INITIAL_CLIENTS) {
        await prisma.client.create({
            data: {
                name: client.name,
                company: client.company,
                email: client.email,
                status: client.status,
            }
        });
    }

    // Seed Tasks
    for (const task of INITIAL_TASKS) {
        await prisma.task.create({
            data: {
                title: task.title,
                time: task.time,
                type: task.type,
                completed: task.completed,
            }
        });
    }

    // Seed Deals
    for (const deal of INITIAL_DEALS) {
        await prisma.deal.create({
            data: {
                client: deal.client,
                value: deal.value,
                days: deal.days,
                stageId: deal.stageId,
            }
        });
    }

    console.log('CRM Database explicitly seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
