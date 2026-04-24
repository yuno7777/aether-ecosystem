"use server";
import { PrismaClient } from '@prisma/client';
import { User, Role } from './AuthProvider';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
    });

    if (user && user.password === password) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role as Role,
        };
    }

    return null;
};
