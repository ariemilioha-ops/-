/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DocumentData {
  id: string;
  type: 'passport' | 'driver' | 'custom';
  title: string;
  titleEn?: string;
  photoUrl: string;
  lastName: string;
  firstName: string;
  middleName: string;
  lastNameEn?: string;
  firstNameEn?: string;
  birthDate: string;
  docNumber: string;
  expiryDate: string;
  citizenship?: string;
  gender?: string;
  signatureData?: string; // base64 or SVG path for handwritten signature
  customFields?: { label: string; value: string }[];
  backgroundColor?: string; // custom gradient or background
  isVerified?: boolean;
}

export interface FineData {
  id: string;
  title: string;
  amount: number;
  currency: string;
  date: string;
  status: 'pending' | 'paid';
  description: string;
  vehicleInfo?: string;
  articleNumber?: string;
}

export interface PrankSettings {
  profileName: string;
  isFaceIDEnabled: boolean;
  hapticEnabled: boolean;
  soundEnabled: boolean;
  activeTab: 'documents' | 'services' | 'notifications' | 'menu';
  selectedDocId: string;
  currentTimeOverride: string; // custom system time e.g., "15:45"
  batteryLevel: number;
  signalStrength: number; // 1-4
  showSimulatedPhoneOnly: boolean; // hide config panel entirely
}

export interface PrankState {
  documents: DocumentData[];
  fines: FineData[];
  settings: PrankSettings;
}
