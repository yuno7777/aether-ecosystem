"use server";
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { Client, Task, Deal } from '../../store';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const fetchClients = async (): Promise<Client[]> => {
    const rows = await prisma.client.findMany();
    // Maps from Prisma object to expected type
    return rows.map(c => ({
        id: c.id,
        name: c.name,
        company: c.company,
        email: c.email,
        status: c.status as any
    }));
};

export const fetchTasks = async (): Promise<Task[]> => {
    const rows = await prisma.task.findMany();
    return rows.map(t => ({
        id: t.id,
        title: t.title,
        time: t.time,
        type: t.type as any,
        completed: t.completed
    }));
};

export const fetchDeals = async (): Promise<Deal[]> => {
    const rows = await prisma.deal.findMany();
    return rows.map(d => ({
        id: d.id,
        client: d.client,
        value: d.value,
        days: d.days,
        stageId: d.stageId
    }));
};

export const toggleTaskCompleted = async (id: number, currentStatus: boolean): Promise<void> => {
    await prisma.task.update({
        where: { id },
        data: { completed: !currentStatus }
    });
    revalidatePath('/', 'layout');
};

export const createDeal = async (deal: Omit<Deal, 'id'>): Promise<Deal> => {
    const d = await prisma.deal.create({
        data: {
            client: deal.client,
            value: deal.value,
            days: deal.days,
            stageId: deal.stageId
        }
    });
    revalidatePath('/', 'layout');
    return {
        id: d.id,
        client: d.client,
        value: d.value,
        days: d.days,
        stageId: d.stageId
    };
};

export const updateDealStage = async (id: number, stageId: string): Promise<void> => {
    await prisma.deal.update({
        where: { id },
        data: { stageId }
    });
    revalidatePath('/', 'layout');
};

export const deleteDeal = async (id: number): Promise<void> => {
    await prisma.deal.delete({
        where: { id }
    });
    revalidatePath('/', 'layout');
};
