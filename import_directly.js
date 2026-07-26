import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    const csvPath = path.join(__dirname, 'supabase_users_import.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim() !== '');
    
    // Skip header
    const dataLines = lines.slice(1);
    
    for (const line of dataLines) {
        // Simple CSV parse. Assumes no commas inside the password hash.
        // We have: id,email,encrypted_password,raw_user_meta_data
        // Because raw_user_meta_data contains JSON, it might contain commas, but we wrapped it in quotes.
        // A better parsing approach:
        const firstComma = line.indexOf(',');
        const secondComma = line.indexOf(',', firstComma + 1);
        const thirdComma = line.indexOf(',', secondComma + 1);
        
        const id = line.substring(0, firstComma);
        const email = line.substring(firstComma + 1, secondComma);
        const encrypted_password = line.substring(secondComma + 1, thirdComma);
        let raw_user_meta_data = line.substring(thirdComma + 1);
        
        // Remove surrounding quotes from metadata and fix escaped quotes
        if (raw_user_meta_data.startsWith('"') && raw_user_meta_data.endsWith('"')) {
            raw_user_meta_data = raw_user_meta_data.substring(1, raw_user_meta_data.length - 1);
        }
        raw_user_meta_data = raw_user_meta_data.replace(/""/g, '"');

        const identityData = JSON.stringify({ sub: id, email: email });
        const appMetaData = JSON.stringify({ provider: "email", providers: ["email"] });

        try {
            // Insert into auth.users
            await prisma.$executeRawUnsafe(`
                INSERT INTO auth.users (
                    id, email, encrypted_password, raw_app_meta_data, raw_user_meta_data,
                    aud, role, created_at, updated_at, instance_id
                ) VALUES (
                    $1::uuid, $2, $3, $4::jsonb, $5::jsonb,
                    'authenticated', 'authenticated', now(), now(), '00000000-0000-0000-0000-000000000000'
                ) ON CONFLICT (id) DO NOTHING;
            `, id, email, encrypted_password, appMetaData, raw_user_meta_data);

            // Insert into auth.identities
            await prisma.$executeRawUnsafe(`
                INSERT INTO auth.identities (
                    id, user_id, provider_id, identity_data, provider, created_at, updated_at
                ) VALUES (
                    $1::uuid, $1::uuid, $1::text, $2::jsonb, 'email', now(), now()
                ) ON CONFLICT (provider, provider_id) DO NOTHING;
            `, id, identityData);

            console.log(`Successfully migrated user: ${email}`);
        } catch (err) {
            console.error(`Error migrating ${email}:`, err.message);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
