import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // Clear old data
    await prisma.moderationFlag.deleteMany();
    await prisma.sohEntry.deleteMany();
    await prisma.vehicle.deleteMany();
    await prisma.user.deleteMany();

    const adminHash = await bcrypt.hash('admin123', 10);
    const userHash = await bcrypt.hash('password', 10);

    const admin = await prisma.user.create({
        data: {
            email: 'admin@ev-soh.it',
            name: 'Pannello Admin',
            passwordHash: adminHash,
            role: 'ADMIN',
        }
    });

    const marco = await prisma.user.create({
        data: {
            email: 'marco@example.it', // Using marco@example.it based on Login.tsx UI text
            name: 'Marco Test',
            passwordHash: userHash,
            role: 'USER',
        }
    });

    console.log('Database seeded with admin and test user.');
}

main()
    .then(async () => { await prisma.$disconnect(); })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
