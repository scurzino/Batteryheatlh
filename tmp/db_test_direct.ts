
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DIRECT_URL
            }
        }
    });
    try {
        console.log('Testing DIRECT connection...');
        await prisma.$connect();
        console.log('Connected successfully.');

        const vehicleCount = await prisma.vehicle.count();
        const entryCount = await prisma.sohEntry.count();

        console.log(`Vehicles: ${vehicleCount}`);
        console.log(`Entries: ${entryCount}`);
    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
