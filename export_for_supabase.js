import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    console.log("Starting user export for Supabase...");
    const users = await prisma.user.findMany();
    
    // Supabase requires: id, email, encrypted_password (for bcrypt hashes)
    // Optional but good: raw_user_meta_data
    
    let csvContent = "id,email,encrypted_password,raw_user_meta_data\n";
    
    for (const user of users) {
        // bcrypt hashes from Node usually start with $2a$ or $2b$. Supabase accepts them.
        const metaData = JSON.stringify({ name: user.name, role: user.role }).replace(/"/g, '""');
        csvContent += `${user.id},${user.email},${user.passwordHash},"${metaData}"\n`;
    }
    
    const outputPath = path.join(__dirname, 'supabase_users_import.csv');
    fs.writeFileSync(outputPath, csvContent, 'utf-8');
    
    console.log(`Exported ${users.length} users to ${outputPath}`);
    console.log("You can now upload this CSV to Supabase Auth -> Users -> Import");
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
