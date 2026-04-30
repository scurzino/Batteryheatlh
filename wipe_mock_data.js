require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting mock data deletion...');
  
  const testUser = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
  
  if (!testUser) {
    console.log('Mock user test@example.com not found. Mock data may have already been deleted.');
    return;
  }

  // Delete all sohEntries associated with the mock user
  const delEntries = await prisma.sohEntry.deleteMany({
    where: { userId: testUser.id }
  });
  console.log(`Deleted ${delEntries.count} fake SOH entries.`);

  // Delete all trip logs associated with the mock user
  const delTrips = await prisma.tripLog.deleteMany({
    where: { userId: testUser.id }
  });
  console.log(`Deleted ${delTrips.count} fake trip logs.`);

  // Delete all vehicle notes associated with the mock user
  const delNotes = await prisma.vehicleNote.deleteMany({
    where: { userId: testUser.id }
  });
  console.log(`Deleted ${delNotes.count} fake vehicle notes.`);

  // Delete the fake user
  await prisma.user.delete({
    where: { id: testUser.id }
  });
  console.log(`Deleted mock user: test@example.com`);
  
  console.log('Mock data deletion complete. You can now refresh the app.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
