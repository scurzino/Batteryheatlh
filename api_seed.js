async function createAccount(name, email, password) {
    try {
        const res = await fetch('http://localhost:3005/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const text = await res.text();
        console.log(`Registration for ${email}: ${res.status} - ${text}`);
    } catch (e) {
        console.error(`Failed for ${email}:`, e.message);
    }
}

async function main() {
    await createAccount('Marco Test', 'marco@example.it', 'password');
    await createAccount('Pannello Admin', 'admin@ev-soh.it', 'admin123');

    // Make the admin an actual admin in DB... wait! We can't set role via register API easily unless API allows it.
    // Actually, we can check if it worked first.
}

main();
