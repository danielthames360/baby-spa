import type { PaymentDetailInput } from "@/components/payments/split-payment-form";
import type {
  PackageData,
  PackagePurchaseData,
} from "@/components/packages/package-selector";
import type { PaymentStatus } from "@/lib/utils/installments";

export interface CompleteSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  onSuccess?: () => void;
}

export interface SessionProduct {
  id: string;
  quantity: number;
  unitPrice: string;
  isChargeable: boolean;
  product: {
    id: string;
    name: string;
    salePrice: string;
  };
}

export interface SessionData {
  id: string;
  appointmentId: string;
  sessionNumber: number;
  packagePurchaseId: string | null;
  packagePurchase: {
    id: string;
    remainingSessions: number;
    totalSessions: number;
    usedSessions: number;
    // Schedule preferences (transferred from appointment at checkout)
    schedulePreferences?: string | null;
    // Installment fields
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
      categoryId: string | null;
    };
  } | null;
  appointment: {
    isEvaluated: boolean;
    selectedPackageId: string | null; // Catalog package selected (provisional)
    // Pending schedule preferences (from portal, before checkout)
    pendingSchedulePreferences?: string | null;
    selectedPackage: {
      id: string;
      name: string;
      categoryId: string | null;
      basePrice: string;
    } | null;
    baby: {
      id: string;
      name: string;
    } | null;
    parent: {
      id: string;
      name: string;
    } | null;
  };
  products: SessionProduct[];
}

export interface Product {
  id: string;
  name: string;
  category: string | null;
  salePrice: string;
  currentStock: number;
}

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

export interface CompletedPurchaseInfo {
  id: string;
  remainingSessions: number;
  packageName: string;
  packageDuration: number;
  babyId?: string;
  babyName?: string;
  parentId?: string;
  parentName?: string;
  schedulePreferences: string | null;
}

export interface RewardInfo {
  id: string;
  displayName: string;
  displayIcon: string | null;
  rewardType: string;
}

// Re-export types from dependencies
export type { PaymentDetailInput, PackageData, PackagePurchaseData, PaymentStatus };
