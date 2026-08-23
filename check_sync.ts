import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';

const prisma = new PrismaClient();
const { Client } = pg;

async function checkSync() {
    console.log("Checking synchronization between auth.users and public.User...");
    
    // Get all Prisma users
    const prismaUsers = await prisma.user.findMany({
        select: { id: true, email: true }
    });
    console.log(`\nPrisma Users (${prismaUsers.length}):`);
    prismaUsers.forEach(u => console.log(`  - ${u.email}: ${u.id}`));

    // Get all Supabase Auth users
    const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
    const client = new Client({ connectionString: directUrl });
    await client.connect();
    
    const { rows: authUsers } = await client.query('SELECT id, email FROM auth.users');
    console.log(`\nSupabase Auth Users (${authUsers.length}):`);
    authUsers.forEach(u => console.log(`  - ${u.email}: ${u.id}`));
    
    await client.end();
    await prisma.$disconnect();
}

checkSync().catch(console.error);
