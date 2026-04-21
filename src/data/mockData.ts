// ── Types ──────────────────────────────────────────────────────────────────

export type UsageType = 'Urbano' | 'Extraurbano' | 'Misto' | 'Autostrada';
export type ChargeType = 'Prevalentemente AC' | 'Prevalentemente DC' | 'Misto AC/DC';
export type MeasurementMethod =
  | 'OBD2 generico'
  | 'BMS nativo'
  | 'Strumento terzo'
  | 'Software specializzato';
export type EntryStatus = 'approved' | 'pending_moderation' | 'flagged' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // plain text – DEMO ONLY
  isAdmin: boolean;
  avatarInitials: string;
  joinedAt: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  oem: string;
  model: string;
  year: number;
  batteryModel: string;
  sohEntries: SohEntry[];
}

export interface SohEntry {
  id: string;
  vehicleId: string;
  userId: string;
  soh: number; // percentage
  mileage: number; // km
  region: string;
  usageType: UsageType;
  chargeType: ChargeType;
  measurementMethod: MeasurementMethod;
  date: string; // ISO
  notes: string;
  status: EntryStatus;
  flagReason?: string;
  flaggedBy?: string; // userId
  submittedAt: string;
}

// ── Users ─────────────────────────────────────────────────────────────────

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Marco Rossi',
    email: 'marco@example.it',
    password: 'password',
    isAdmin: false,
    avatarInitials: 'MR',
    joinedAt: '2024-01-15',
  },
  {
    id: 'u2',
    name: 'Laura Bianchi',
    email: 'laura@example.it',
    password: 'password',
    isAdmin: false,
    avatarInitials: 'LB',
    joinedAt: '2024-03-08',
  },
  {
    id: 'u3',
    name: 'Admin',
    email: 'admin@ev-soh.it',
    password: 'admin123',
    isAdmin: true,
    avatarInitials: 'AD',
    joinedAt: '2023-09-01',
  },
  {
    id: 'u4',
    name: 'Giuseppe Verdi',
    email: 'giuseppe@example.it',
    password: 'password',
    isAdmin: false,
    avatarInitials: 'GV',
    joinedAt: '2024-06-20',
  },
  {
    id: 'u5',
    name: 'Chiara Esposito',
    email: 'chiara@example.it',
    password: 'password',
    isAdmin: false,
    avatarInitials: 'CE',
    joinedAt: '2025-01-10',
  },
];

// ── SOH Entries (flat, with embedded vehicle info) ────────────────────────

export interface FlatEntry extends SohEntry {
  oem: string;
  model: string;
  year: number;
  batteryModel: string;
  userName: string;
}

export const MOCK_ENTRIES: FlatEntry[] = [
  // ── Tesla Model Y ────────────────────────────────────────────────────────
  {
    id: 'e1', vehicleId: 'v1', userId: 'u1',
    oem: 'Tesla', model: 'Model Y', year: 2022, batteryModel: 'LFP 57.5 kWh',
    soh: 97.2, mileage: 24000, region: 'Lombardia',
    usageType: 'Misto', chargeType: 'Prevalentemente AC',
    measurementMethod: 'Software specializzato',
    date: '2025-10-01', notes: '', status: 'approved',
    submittedAt: '2025-10-02', userName: 'Marco Rossi',
  },
  {
    id: 'e2', vehicleId: 'v2', userId: 'u2',
    oem: 'Tesla', model: 'Model Y', year: 2022, batteryModel: 'LFP 57.5 kWh',
    soh: 95.8, mileage: 38000, region: 'Piemonte',
    usageType: 'Autostrada', chargeType: 'Prevalentemente DC',
    measurementMethod: 'Software specializzato',
    date: '2025-09-15', notes: 'Molti viaggi autostradali.', status: 'approved',
    submittedAt: '2025-09-16', userName: 'Laura Bianchi',
  },
  {
    id: 'e3', vehicleId: 'v3', userId: 'u4',
    oem: 'Tesla', model: 'Model Y', year: 2021, batteryModel: 'NCA 75 kWh',
    soh: 92.4, mileage: 61000, region: 'Toscana',
    usageType: 'Extraurbano', chargeType: 'Misto AC/DC',
    measurementMethod: 'Software specializzato',
    date: '2025-08-20', notes: '', status: 'approved',
    submittedAt: '2025-08-21', userName: 'Giuseppe Verdi',
  },
  {
    id: 'e4', vehicleId: 'v4', userId: 'u5',
    oem: 'Tesla', model: 'Model Y', year: 2023, batteryModel: 'LFP 57.5 kWh',
    soh: 99.1, mileage: 8000, region: 'Veneto',
    usageType: 'Urbano', chargeType: 'Prevalentemente AC',
    measurementMethod: 'BMS nativo',
    date: '2025-11-02', notes: '', status: 'approved',
    submittedAt: '2025-11-03', userName: 'Chiara Esposito',
  },
  // Outlier – trigger moderation
  {
    id: 'e5', vehicleId: 'v5', userId: 'u4',
    oem: 'Tesla', model: 'Model Y', year: 2022, batteryModel: 'LFP 57.5 kWh',
    soh: 68.0, mileage: 22000, region: 'Sicilia',
    usageType: 'Urbano', chargeType: 'Prevalentemente AC',
    measurementMethod: 'OBD2 generico',
    date: '2025-07-10', notes: 'Rilevato con dongle economico, potrebbe essere impreciso.',
    status: 'pending_moderation',
    submittedAt: '2025-07-11', userName: 'Giuseppe Verdi',
  },

  // ── Volkswagen ID.4 ───────────────────────────────────────────────────────
  {
    id: 'e6', vehicleId: 'v6', userId: 'u1',
    oem: 'Volkswagen', model: 'ID.4', year: 2021, batteryModel: 'NCM 77 kWh',
    soh: 91.0, mileage: 55000, region: 'Emilia-Romagna',
    usageType: 'Misto', chargeType: 'Misto AC/DC',
    measurementMethod: 'OBD2 generico',
    date: '2025-06-01', notes: '', status: 'approved',
    submittedAt: '2025-06-02', userName: 'Marco Rossi',
  },
  {
    id: 'e7', vehicleId: 'v7', userId: 'u2',
    oem: 'Volkswagen', model: 'ID.4', year: 2022, batteryModel: 'NCM 77 kWh',
    soh: 94.5, mileage: 31000, region: 'Lazio',
    usageType: 'Urbano', chargeType: 'Prevalentemente AC',
    measurementMethod: 'BMS nativo',
    date: '2025-09-01', notes: '', status: 'approved',
    submittedAt: '2025-09-02', userName: 'Laura Bianchi',
  },
  {
    id: 'e8', vehicleId: 'v8', userId: 'u5',
    oem: 'Volkswagen', model: 'ID.4', year: 2023, batteryModel: 'NCM 77 kWh',
    soh: 98.2, mileage: 12000, region: 'Lombardia',
    usageType: 'Extraurbano', chargeType: 'Prevalentemente DC',
    measurementMethod: 'Software specializzato',
    date: '2025-10-20', notes: '', status: 'approved',
    submittedAt: '2025-10-21', userName: 'Chiara Esposito',
  },

  // ── Hyundai IONIQ 5 ───────────────────────────────────────────────────────
  {
    id: 'e9', vehicleId: 'v9', userId: 'u4',
    oem: 'Hyundai', model: 'IONIQ 5', year: 2022, batteryModel: 'NCM 72.6 kWh',
    soh: 96.3, mileage: 27000, region: 'Campania',
    usageType: 'Misto', chargeType: 'Misto AC/DC',
    measurementMethod: 'BMS nativo',
    date: '2025-07-15', notes: '', status: 'approved',
    submittedAt: '2025-07-16', userName: 'Giuseppe Verdi',
  },
  {
    id: 'e10', vehicleId: 'v10', userId: 'u1',
    oem: 'Hyundai', model: 'IONIQ 5', year: 2023, batteryModel: 'NCM 72.6 kWh',
    soh: 99.0, mileage: 9500, region: 'Lombardia',
    usageType: 'Urbano', chargeType: 'Prevalentemente AC',
    measurementMethod: 'BMS nativo',
    date: '2025-10-05', notes: '', status: 'approved',
    submittedAt: '2025-10-06', userName: 'Marco Rossi',
  },
  {
    id: 'e11', vehicleId: 'v11', userId: 'u2',
    oem: 'Hyundai', model: 'IONIQ 5', year: 2021, batteryModel: 'NCM 72.6 kWh',
    soh: 88.7, mileage: 72000, region: 'Sicilia',
    usageType: 'Autostrada', chargeType: 'Prevalentemente DC',
    measurementMethod: 'OBD2 generico',
    date: '2025-08-10', notes: 'Tanti viaggi in autostrada con ricarica rapida.', status: 'approved',
    submittedAt: '2025-08-11', userName: 'Laura Bianchi',
  },

  // ── Polestar 2 ────────────────────────────────────────────────────────────
  {
    id: 'e12', vehicleId: 'v12', userId: 'u5',
    oem: 'Polestar', model: 'Polestar 2', year: 2022, batteryModel: 'NMC 78 kWh',
    soh: 93.1, mileage: 42000, region: 'Veneto',
    usageType: 'Misto', chargeType: 'Misto AC/DC',
    measurementMethod: 'Strumento terzo',
    date: '2025-09-20', notes: '', status: 'approved',
    submittedAt: '2025-09-21', userName: 'Chiara Esposito',
  },
  {
    id: 'e13', vehicleId: 'v13', userId: 'u4',
    oem: 'Polestar', model: 'Polestar 2', year: 2023, batteryModel: 'NMC 78 kWh',
    soh: 97.8, mileage: 15000, region: 'Toscana',
    usageType: 'Extraurbano', chargeType: 'Prevalentemente AC',
    measurementMethod: 'BMS nativo',
    date: '2025-10-15', notes: '', status: 'approved',
    submittedAt: '2025-10-16', userName: 'Giuseppe Verdi',
  },

  // ── BMW iX3 ───────────────────────────────────────────────────────────────
  {
    id: 'e14', vehicleId: 'v14', userId: 'u1',
    oem: 'BMW', model: 'iX3', year: 2022, batteryModel: 'NCM 80 kWh',
    soh: 94.0, mileage: 34000, region: 'Piemonte',
    usageType: 'Extraurbano', chargeType: 'Misto AC/DC',
    measurementMethod: 'Software specializzato',
    date: '2025-08-01', notes: '', status: 'approved',
    submittedAt: '2025-08-02', userName: 'Marco Rossi',
  },
  {
    id: 'e15', vehicleId: 'v15', userId: 'u2',
    oem: 'BMW', model: 'iX3', year: 2021, batteryModel: 'NCM 80 kWh',
    soh: 90.5, mileage: 58000, region: 'Lazio',
    usageType: 'Autostrada', chargeType: 'Prevalentemente DC',
    measurementMethod: 'OBD2 generico',
    date: '2025-07-20', notes: '', status: 'approved',
    submittedAt: '2025-07-21', userName: 'Laura Bianchi',
  },

  // ── Renault Zoe ───────────────────────────────────────────────────────────
  {
    id: 'e16', vehicleId: 'v16', userId: 'u5',
    oem: 'Renault', model: 'Zoe', year: 2020, batteryModel: 'NMC R135 52 kWh',
    soh: 85.2, mileage: 78000, region: 'Calabria',
    usageType: 'Urbano', chargeType: 'Prevalentemente AC',
    measurementMethod: 'BMS nativo',
    date: '2025-06-15', notes: '', status: 'approved',
    submittedAt: '2025-06-16', userName: 'Chiara Esposito',
  },
  {
    id: 'e17', vehicleId: 'v17', userId: 'u4',
    oem: 'Renault', model: 'Zoe', year: 2021, batteryModel: 'NMC R135 52 kWh',
    soh: 90.1, mileage: 44000, region: 'Puglia',
    usageType: 'Misto', chargeType: 'Prevalentemente AC',
    measurementMethod: 'BMS nativo',
    date: '2025-09-10', notes: '', status: 'approved',
    submittedAt: '2025-09-11', userName: 'Giuseppe Verdi',
  },

  // ── Pending + Flagged entries ─────────────────────────────────────────────
  {
    id: 'e18', vehicleId: 'v18', userId: 'u1',
    oem: 'Volkswagen', model: 'ID.3', year: 2022, batteryModel: 'NCM 58 kWh',
    soh: 55.0, mileage: 19000, region: 'Lombardia',
    usageType: 'Urbano', chargeType: 'Prevalentemente AC',
    measurementMethod: 'OBD2 generico',
    date: '2025-10-30', notes: 'Valore rilevato strano, potrebbe essere errore strumento.',
    status: 'pending_moderation',
    submittedAt: '2025-10-31', userName: 'Marco Rossi',
  },
  {
    id: 'e19', vehicleId: 'v19', userId: 'u2',
    oem: 'Tesla', model: 'Model 3', year: 2022, batteryModel: 'LFP 60 kWh',
    soh: 72.0, mileage: 15000, region: 'Piemonte',
    usageType: 'Misto', chargeType: 'Prevalentemente DC',
    measurementMethod: 'OBD2 generico',
    date: '2025-11-01', notes: '',
    status: 'flagged',
    flagReason: 'SOH molto basso per chilometraggio ridotto – probabile errore di rilevazione.',
    flaggedBy: 'u1',
    submittedAt: '2025-11-02', userName: 'Laura Bianchi',
  },
  {
    id: 'e20', vehicleId: 'v20', userId: 'u5',
    oem: 'BMW', model: 'iX3', year: 2023, batteryModel: 'NCM 80 kWh',
    soh: 99.5, mileage: 10000, region: 'Liguria',
    usageType: 'Extraurbano', chargeType: 'Misto AC/DC',
    measurementMethod: 'Software specializzato',
    date: '2025-11-05', notes: '', status: 'approved',
    submittedAt: '2025-11-06', userName: 'Chiara Esposito',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

export const OEMS = [...new Set(MOCK_ENTRIES.map((e) => e.oem))].sort();
export const REGIONS = [
  'Abruzzo','Basilicata','Calabria','Campania','Emilia-Romagna','Friuli-Venezia Giulia',
  'Lazio','Liguria','Lombardia','Marche','Molise','Piemonte','Puglia','Sardegna',
  'Sicilia','Toscana','Trentino-Alto Adige','Umbria','Valle d\'Aosta','Veneto',
];
export const USAGE_TYPES: UsageType[] = ['Urbano', 'Extraurbano', 'Misto', 'Autostrada'];
export const CHARGE_TYPES: ChargeType[] = ['Prevalentemente AC', 'Prevalentemente DC', 'Misto AC/DC'];
export const MEASUREMENT_METHODS: MeasurementMethod[] = [
  'OBD2 generico', 'BMS nativo', 'Strumento terzo', 'Software specializzato',
];

export function getApprovedEntries(): FlatEntry[] {
  return MOCK_ENTRIES.filter((e) => e.status === 'approved');
}

export function getPendingEntries(): FlatEntry[] {
  return MOCK_ENTRIES.filter((e) => e.status === 'pending_moderation');
}

export function getFlaggedEntries(): FlatEntry[] {
  return MOCK_ENTRIES.filter((e) => e.status === 'flagged');
}

export function getEntryById(id: string): FlatEntry | undefined {
  return MOCK_ENTRIES.find((e) => e.id === id);
}

export function getUserById(id: string): User | undefined {
  return MOCK_USERS.find((u) => u.id === id);
}
