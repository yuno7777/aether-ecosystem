const fs = require('fs');
const file = 'src/supply/services/dataService.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('revalidatePath')) {
    code = code.replace(
        "import { PrismaClient } from '@prisma/client';",
        "import { PrismaClient } from '@prisma/client';\nimport { revalidatePath } from 'next/cache';"
    );
}

if (!code.includes('globalForPrisma')) {
    code = code.replace(
        "const prisma = new PrismaClient();",
        "const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };\nconst prisma = globalForPrisma.prisma || new PrismaClient();\nif (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;"
    );
}

// Simple string replacement for mutations.
// Just find all 'await prisma.<model>.create({...})', 'await prisma.<model>.update({...})', 'await prisma.<model>.delete({...})' 
// and append 'revalidatePath('/', 'layout');' after the promise completes.

const mutationsToFind = [
    /export const addSupplier = async[^\{]+\{[\s\S]+?const s = await prisma\.supplier\.create\(\{[\s\S]+?\}\);/g,
    /export const updateSupplier = async[^\{]+\{[\s\S]+?await prisma\.supplier\.update\(\{[\s\S]+?\}\);/g,
    /export const deleteSupplier = async[^\{]+\{[\s\S]+?await prisma\.supplier\.delete\(\{[\s\S]+?\}\);/g,

    /export const addWarehouse = async[^\{]+\{[\s\S]+?const w = await prisma\.warehouse\.create\(\{[\s\S]+?\}\);/g,
    /export const updateWarehouse = async[^\{]+\{[\s\S]+?await prisma\.warehouse\.update\(\{[\s\S]+?\}\);/g,
    /export const deleteWarehouse = async[^\{]+\{[\s\S]+?await prisma\.warehouse\.delete\(\{[\s\S]+?\}\);/g,

    /export const addCategory = async[^\{]+\{[\s\S]+?await prisma\.category\.create\(\{[\s\S]+?\}\);/g,
    /export const updateCategory = async[^\{]+\{[\s\S]+?await prisma\.category\.update\(\{[\s\S]+?\}\);/g,
    /export const deleteCategory = async[^\{]+\{[\s\S]+?await prisma\.category\.delete\(\{[\s\S]+?\}\);/g,

    /export const addProduct = async[^\{]+\{[\s\S]+?const p = await prisma\.product\.create\(\{[\s\S]+?\}\);/g,
    /export const updateProduct = async[^\{]+\{[\s\S]+?await prisma\.product\.update\(\{[\s\S]+?\}\);/g,
    /export const deleteProduct = async[^\{]+\{[\s\S]+?await prisma\.product\.delete\(\{[\s\S]+?\}\);/g,

    /export const addSale = async[^\{]+\{[\s\S]+?await prisma\.product\.update\(\{[\s\S]+?\}\);\n    \}/g,
    
    /export const createStockTransfer = async[^\{]+\{[\s\S]+?const t = await prisma\.stockTransfer\.create\(\{[\s\S]+?\}\);/g
];

mutationsToFind.forEach(regex => {
    code = code.replace(regex, match => match + '\n    revalidatePath(\'/\', \'layout\');');
});

fs.writeFileSync(file, code);
console.log('Done!');
