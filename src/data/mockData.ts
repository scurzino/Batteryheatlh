export interface BaseVehicle {
  oem: string;
  model: string;
  year: number;
  batteryModel: string;
}

// Region/countries are simple strings to support countries worldwide.

export type UsageType = 'Urban' | 'Suburban' | 'Mixed' | 'Highway';
export type ChargeType = 'Mostly AC' | 'Mostly DC' | 'Mixed AC/DC';
export type MeasurementMethod = 'OBD2 Dongle' | 'Charge Data (API)' | 'SoC Check' | 'OEM Certificate' | 'Other';
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
  vehicleId?: string;
  soh: number;
  mileage: number;
  region: string;
  usageType: UsageType;
  chargeType: ChargeType;
  measurementMethod: MeasurementMethod;
  date: string; // ISO string (e.g. "2025-10-01")
  notes?: string;
  status: EntryStatus;

  // Backend management fields
  submittedAt?: string;
  userName?: string;
  flagReason?: string;
  flaggedBy?: string; // User ID or 'system'
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
  'Italy', 'France', 'Germany', 'United Kingdom', 'Spain', 'Netherlands', 'Belgium', 'Switzerland', 'Austria',
  'Norway', 'Sweden', 'Denmark', 'Finland', 'Poland', 'Portugal', 'Greece', 'Ireland',
  'United States', 'Canada', 'Australia', 'New Zealand', 'Japan', 'South Korea', 'China',
  'United Arab Emirates', 'Other'
];

export const USAGE_TYPES: UsageType[] = [
  'Urban',
  'Suburban',
  'Mixed',
  'Highway',
];

export const CHARGE_TYPES: ChargeType[] = [
  'Mostly AC',
  'Mostly DC',
  'Mixed AC/DC',
];

export const MEASUREMENT_METHODS: MeasurementMethod[] = [
  'OBD2 Dongle',
  'Charge Data (API)',
  'SoC Check',
  'OEM Certificate',
  'Other',
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Mario Rossi', email: 'mario@example.com', password: 'password', isAdmin: true, avatarInitials: 'MR', joinedAt: '2025-01-15' },
];

export const MOCK_ENTRIES: FlatEntry[] = [];
