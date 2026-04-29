
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    try {
        console.log('Testing connection...');
        await prisma.$connect();
        console.log('Connected successfully.');

        const vehicleCount = await prisma.vehicle.count();
        const entryCount = await prisma.sohEntry.count();

        console.log(`Vehicles: ${vehicleCount}`);
        console.log(`Entries: ${entryCount}`);

        if (entryCount > 0) {
            const latest = await prisma.sohEntry.findFirst({
                include: { vehicle: true },
                orderBy: { date: 'desc' }
            });
            console.log('Latest Entry:', JSON.stringify(latest, null, 2));
        }
    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
