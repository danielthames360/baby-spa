/**
 * Types for appointment details components
 * Extracted from appointment-details.tsx for reusability
 */

// Baby Card checkout info interface
export interface BabyCardCheckoutInfo {
  hasActiveCard: boolean;
  purchase: {
    id: string;
    babyCardName: string;
    completedSessions: number;
    totalSessions: number;
    progressPercent: number;
    status: string;
  } | null;
  firstSessionDiscount: {
    amount: number;
    used: boolean;
  } | null;
  availableRewards: {
    id: string;
    displayName: string;
    displayIcon: string | null;
    rewardType: string;
    sessionNumber: number;
  }[];
  nextReward: {
    id: string;
    displayName: string;
    displayIcon: string | null;
    sessionNumber: number;
    sessionsUntilUnlock: number;
  } | null;
  specialPrices: {
    packageId: string;
    packageName: string;
    normalPrice: number;
    specialPrice: number;
  }[];
}

// Baby details from API
export interface BabyDetails {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  birthWeeks?: number | null;
  birthWeight?: number | string | null;
  birthType?: string | null;
  birthDifficulty?: boolean;
  birthDifficultyDesc?: string | null;
  diagnosedIllness?: boolean;
  diagnosedIllnessDesc?: string | null;
  allergies?: string | null;
  specialObservations?: string | null;
  parents?: Array<{
    isPrimary: boolean;
    parent: {
      id: string;
      name: string;
    };
  }>;
}

// Appointment data structure
export interface AppointmentData {
  id: string;
  babyId?: string | null;
  parentId?: string | null;
  date: Date;
  startTime: string;
  endTime: string;
  status:
    | "PENDING_PAYMENT"
    | "SCHEDULED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "NO_SHOW";
  isPendingPayment?: boolean;
  notes: string | null;
  cancelReason: string | null;
  packagePurchaseId?: string | null;
  pendingSchedulePreferences?: string | null;
  session?: {
    id: string;
  } | null;
  baby?: {
    id: string;
    name: string;
    parents: {
      isPrimary: boolean;
      parent: {
        id: string;
        name: string;
        phone: string;
      };
    }[];
  } | null;
  parent?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    pregnancyWeeks: number | null;
  } | null;
  packagePurchase?: {
    id: string;
    totalSessions?: number;
    usedSessions?: number;
    remainingSessions?: number;
    schedulePreferences?: string | null;
    paymentPlan?: string;
    installments?: number;
    installmentAmount?: string | number | null;
    totalPrice?: string | number | null;
    finalPrice?: string | number;
    paidAmount?: string | number;
    installmentsPayOnSessions?: string | null;
    package: {
      id: string;
      name: string;
      basePrice?: number | string | null;
      advancePaymentAmount?: number | string | null;
    };
  } | null;
  selectedPackage?: {
    id: string;
    name: string;
    basePrice?: number | string | null;
    advancePaymentAmount?: number | string | null;
  } | null;
}
