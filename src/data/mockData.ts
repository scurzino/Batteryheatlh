export interface BaseVehicle {
  oem: string;
  model: string;
  year: number;
  batteryModel: string;
}

// Le region/paesi ora sono semplici stringhe per supportare tutti gli stati del mondo.

export type UsageType = 'Urbano' | 'Extraurbano' | 'Misto' | 'Autostrada';
export type ChargeType = 'Prevalentemente AC' | 'Prevalentemente DC' | 'Misto AC/DC';
export type MeasurementMethod = 'OBD2 Dongle' | 'Dati ricarica (API)' | 'SoC Check' | 'Certificato OEM' | 'Altro';
export type EntryStatus = 'APPROVED' | 'PENDING' | 'FLAGGED_BY_SYSTEM' | 'REJECTED';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  isAdmin?: boolean;
  avatarInitials: string;
  joinedAt: string;
}

export interface FlatEntry extends BaseVehicle {
  id: string;
  userId: string;
  vehicleId?: string; // Optional per retrocompatibilità backend/mock
  soh: number;
  mileage: number;
  region: string;
  usageType: UsageType;
  chargeType: ChargeType;
  measurementMethod: MeasurementMethod;
  date: string; // ISO string (es. "2025-10-01")
  notes?: string;
  status: EntryStatus;

  // Campi gestionali backend
  submittedAt?: string;
  userName?: string;
  flagReason?: string;
  flaggedBy?: string; // User ID o 'system'
}

export const OEMS = [
  'Tesla',
  'Volkswagen',
  'Hyundai',
  'Kia',
  'Audi',
  'BMW',
  'Polestar',
  'Renault',
  'Peugeot',
  'Fiat',
  'MG',
  'BYD',
] as const;

export const COUNTRIES: string[] = [
  'Italia', 'Francia', 'Germania', 'Regno Unito', 'Spagna', 'Olanda', 'Belgio', 'Svizzera', 'Austria',
  'Norvegia', 'Svezia', 'Danimarca', 'Finlandia', 'Polonia', 'Portogallo', 'Grecia', 'Irlanda',
  'Stati Uniti', 'Canada', 'Australia', 'Nuova Zelanda', 'Giappone', 'Corea del Sud', 'Cina',
  'Emirati Arabi Uniti', 'Altro'
];

export const USAGE_TYPES: UsageType[] = [
  'Urbano',
  'Extraurbano',
  'Misto',
  'Autostrada',
];

export const CHARGE_TYPES: ChargeType[] = [
  'Prevalentemente AC',
  'Prevalentemente DC',
  'Misto AC/DC',
];

export const MEASUREMENT_METHODS: MeasurementMethod[] = [
  'OBD2 Dongle',
  'Dati ricarica (API)',
  'SoC Check',
  'Certificato OEM',
  'Altro',
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Mario Rossi', email: 'mario@example.com', password: 'password', isAdmin: true, avatarInitials: 'MR', joinedAt: '2025-01-15' },
];

export const MOCK_ENTRIES: FlatEntry[] = [];
