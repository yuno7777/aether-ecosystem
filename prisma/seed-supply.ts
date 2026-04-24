import { PrismaClient } from '@prisma/client';
import { mockSuppliers, mockWarehouses, mockProducts, mockSales, mockStockTransfers, mockActivityLog, mockCategories } from '../src/supply/services/mockData';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Supply Database...');
    const userId = 'demo-user';

    // Seed Suppliers
    for (const sup of mockSuppliers) {
        await prisma.supplier.create({
            data: {
                id: sup.id,
                name: sup.name,
                leadTimeDays: sup.leadTimeDays,
                contactEmail: sup.contactEmail,
                rating: sup.rating,
                onTimePercent: sup.onTimePercent,
                totalOrders: sup.totalOrders,
                fulfillmentRate: sup.fulfillmentRate,
                location: sup.location
            }
        });
    }

    // Seed Warehouses
    for (const wh of mockWarehouses) {
        await prisma.warehouse.create({
            data: {
                id: wh.id,
                name: wh.name,
                location: wh.location,
                capacity: wh.capacity
            }
        });
    }

    // Seed Categories
    for (const cat of mockCategories) {
        await prisma.category.create({
            data: {
                name: cat,
                userId: userId
            }
        });
    }

    // Seed Products
    for (const prod of mockProducts) {
        await prisma.product.create({
            data: {
                id: prod.id,
                name: prod.name,
                sku: prod.sku,
                barcode: prod.barcode,
                category: prod.category,
                price: prod.price,
                cost: prod.cost,
                stock: prod.stock,
                reorderLevel: prod.reorderLevel,
                supplierId: prod.supplierId,
                warehouseId: prod.warehouseId,
                imageUrl: prod.imageUrl
            }
        });
    }

    // Seed Sales
    for (const sale of mockSales) {
        await prisma.sale.create({
            data: {
                id: sale.id,
                productId: sale.productId,
                quantity: sale.quantity,
                date: new Date(sale.date)
            }
        });
    }

    // Seed Stock Transfers
    for (const t of mockStockTransfers) {
        await prisma.stockTransfer.create({
            data: {
                id: t.id,
                productId: t.productId,
                fromWarehouseId: t.fromWarehouseId,
                toWarehouseId: t.toWarehouseId,
                quantity: t.quantity,
                notes: t.notes,
                createdAt: new Date(t.createdAt)
            }
        });
    }

    // Seed Activity Logs
    for (const log of mockActivityLog) {
        await prisma.activityLog.create({
            data: {
                id: log.id,
                userId: userId,
                action: log.action,
                entityType: log.entityType,
                entityName: log.entityName,
                details: log.details,
                createdAt: new Date(log.timestamp)
            }
        });
    }

    console.log('Supply Database explicitly seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
