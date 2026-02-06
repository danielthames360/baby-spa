/**
 * Types for portal appointments components
 */

export interface BabyPackage {
  id: string;
  remainingSessions: number;
  totalSessions: number;
  usedSessions: number;
  package: {
    id: string;
    name: string;
    categoryId: string | null;
    duration: number;
  };
}

export interface ScheduleBabyData {
  id: string;
  name: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  totalRemainingSessions: number;
  packages: BabyPackage[];
}

// Alias for internal use
export type BabyData = ScheduleBabyData;

export interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  baby?: {
    id: string;
    name: string;
    gender: "MALE" | "FEMALE" | "OTHER";
  } | null;
  parent?: {
    id: string;
    name: string;
  } | null;
  therapist: {
    name: string;
  } | null;
  packagePurchase: {
    id: string;
    package: {
      name: string;
    };
  } | null;
  selectedPackage: {
    id: string;
    name: string;
    advancePaymentAmount?: string | number | null;
  } | null;
}

// Parent info for self-appointments
export interface ParentInfo {
  id: string;
  name: string;
  pregnancyWeeks?: number | null;
  totalRemainingSessions: number;
  packages: BabyPackage[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
  remaining: number;
}

// Wizard step type
export type WizardStep = 'client' | 'baby' | 'package' | 'preferences' | 'datetime' | 'payment' | 'success';

// Client type for appointment
export type ClientType = 'baby' | 'self';

// Payment settings interface
export interface PaymentSettings {
  paymentQrImage: string | null;
  whatsappNumber: string | null;
  whatsappCountryCode: string | null;
  whatsappMessage: string | null;
}

// Baby Card checkout info for portal
export interface BabyCardPortalInfo {
  hasActiveCard: boolean;
  purchase: {
    id: string;
    babyCardName: string;
    completedSessions: number;
    totalSessions: number;
    progressPercent: number;
  } | null;
  nextReward: {
    id: string;
    displayName: string;
    displayIcon: string | null;
    sessionNumber: number;
    sessionsUntilUnlock: number;
  } | null;
  rewardForNextSession: {
    id: string;
    displayName: string;
    displayIcon: string | null;
    sessionNumber: number;
  } | null;
  specialPrices: Array<{
    packageId: string;
    packageName: string;
    normalPrice: number;
    specialPrice: number;
  }>;
}
