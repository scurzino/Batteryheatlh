import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
async function main() {
    console.log("Connecting...");
    await prisma.$connect();
    console.log("Connected");
    await prisma.$disconnect();
}
main().catch(e => {
    console.error("PRISMA CRASH:");
    console.error(e);
});
