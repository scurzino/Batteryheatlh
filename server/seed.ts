import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Inizio il popolamento del database...');

  // 1. Crea un utente di test se non esiste
  const passwordHash = await bcrypt.hash('password123', 10);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Mario Rossi',
      passwordHash: passwordHash,
      role: 'ADMIN'
    }
  });

  console.log(`Utente di test garantito: ${testUser.email}`);

  // 2. Crea veicoli
  const vehiclesData = [
    { oem: 'Tesla', model: 'Model 3', year: 2021, batteryModel: 'LFP 60 kWh', minEnvTemp: -10, maxEnvTemp: 45 },
    { oem: 'Volkswagen', model: 'ID.3', year: 2020, batteryModel: 'NCM 58 kWh', minEnvTemp: -5, maxEnvTemp: 40 },
    { oem: 'Hyundai', model: 'Ioniq 5', year: 2022, batteryModel: 'NCM 72.6 kWh', minEnvTemp: -15, maxEnvTemp: 45 },
    { oem: 'Polestar', model: 'Polestar 2', year: 2023, batteryModel: 'NMC 78 kWh', minEnvTemp: -10, maxEnvTemp: 40 },
    { oem: 'BMW', model: 'i4', year: 2022, batteryModel: 'NCM 80 kWh', minEnvTemp: -5, maxEnvTemp: 45 },
  ];

  const vehicles = [];
  for (const v of vehiclesData) {
    const dbVehicle = await prisma.vehicle.upsert({
      where: { oem_model_year_batteryModel: { oem: v.oem, model: v.model, year: v.year, batteryModel: v.batteryModel } },
      update: {},
      create: v
    });
    vehicles.push(dbVehicle);
  }

  console.log(`Creati/Verificati ${vehicles.length} veicoli.`);

  // 3. Pulisci misurazioni esistenti per evitare duplicati massivi se lo script viene rilanciato
  // (Opzionale: puoi commentarlo se vuoi che accumuli dati)
  // await prisma.sohEntry.deleteMany({});
  
  // Controlla quanti entry ci sono già. Se ce ne sono più di 10, evitiamo di aggiungere troppi dati.
  const count = await prisma.sohEntry.count();
  if (count > 20) {
    console.log('Database già popolato con SOH entries sufficienti.');
    return;
  }

  // 4. Genera misurazioni verosimili (SOH entries)
  const regions = ['Nord Italia', 'Centro Italia', 'Sud Italia', 'Isole'];
  const usageTypes = ['Urbano', 'Extraurbano', 'Misto', 'Autostrada'];
  const chargeTypes = ['Prevalentemente AC', 'Prevalentemente DC', 'Misto AC/DC'];
  const methods = ['OBD2 Dongle', 'Dati ricarica (API)'];

  let entryCount = 0;
  for (const v of vehicles) {
    // Genera ~8 misurazioni per veicolo
    for (let i = 0; i < 8; i++) {
      const mileage = Math.floor(Math.random() * 80000) + 5000; // da 5.000 a 85.000 km
      // Modello esponenziale super base per il degrado per far avere un andamento verosimile
      const degradation = mileage * 0.00015; 
      const soh = parseFloat((100 - degradation + (Math.random() * 2 - 1)).toFixed(1)); // 100 - degrado +/- 1%

      const region = regions[Math.floor(Math.random() * regions.length)];
      const usageType = usageTypes[Math.floor(Math.random() * usageTypes.length)];
      const chargeType = chargeTypes[Math.floor(Math.random() * chargeTypes.length)];
      const method = methods[Math.floor(Math.random() * methods.length)];

      const date = new Date();
      date.setMonth(date.getMonth() - Math.floor(Math.random() * 12)); // sparso nell'ultimo anno

      await prisma.sohEntry.create({
        data: {
          vehicleId: v.id,
          userId: testUser.id,
          soh: Math.min(100, Math.max(0, soh)),
          mileage,
          region,
          usageType,
          chargeType,
          measurementMethod: method,
          date,
          status: 'APPROVED',
          notes: 'Dato generato automaticamente dal seed'
        }
      });
      entryCount++;
    }
  }

  console.log(`Create ${entryCount} misurazioni SOH fittizie. Popolamento completato!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
