import { prisma } from './server/index.js';
async function check() {
  const entries = await prisma.sohEntry.findMany();
  const flags = await prisma.moderationFlag.findMany();
  console.log('Entries:', JSON.stringify(entries, null, 2));
  console.log('Flags:', JSON.stringify(flags, null, 2));
}
check().then(() => process.exit(0));
