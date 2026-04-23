import { prisma } from './server/index.js';
async function fix() {
  await prisma.sohEntry.updateMany({
    where: { userId: null },
    data: { userId: '064f7993-39c9-4601-8404-2a4bdc4a3c72' }
  });
  console.log('Fixed DB');
}
fix().then(() => process.exit(0));
