import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

async function setupTriggers() {
    const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
    const client = new Client({ connectionString: directUrl });
    await client.connect();

    console.log("Creating handle_new_user function...");
    await client.query(`
        CREATE OR REPLACE FUNCTION public.handle_new_user() 
        RETURNS trigger AS $$
        BEGIN
            INSERT INTO public."User" (id, email, name, role)
            VALUES (
                new.id, 
                new.email, 
                COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
                COALESCE(new.raw_user_meta_data->>'role', 'USER')
            )
            ON CONFLICT (id) DO NOTHING;
            RETURN new;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);

    console.log("Creating on_auth_user_created trigger...");
    await client.query(`
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `);

    console.log("Trigger setup complete. New Supabase users will automatically be synced to Prisma public.User table.");
    await client.end();
}

setupTriggers().catch(console.error);
