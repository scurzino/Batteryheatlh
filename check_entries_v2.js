require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const entries = await prisma.sohEntry.findMany({ include: { vehicle: true } });
    console.log(`Total entries: ${entries.length}`);
    if (entries.length > 0) {
      console.log('Sample entry:', JSON.stringify(entries[0], null, 2));
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
