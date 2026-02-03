import { create } from "zustand";
import { CashRegisterStatus, CashExpenseCategory } from "@prisma/client";

// ============================================================
// TYPES
// ============================================================

export interface CashRegisterExpense {
  id: string;
  amount: number;
  category: CashExpenseCategory;
  description: string;
  createdAt: string;
  createdBy: { id: string; name: string };
}

export interface CashRegisterData {
  id: string;
  openedById: string;
  openedBy: { id: string; name: string };
  openedAt: string;
  initialFund: number;
  closedAt: string | null;
  declaredAmount: number | null;
  expectedAmount: number | null;
  difference: number | null;
  closingNotes: string | null;
  status: CashRegisterStatus;
  expenses: CashRegisterExpense[];
}

interface CashRegisterStore {
  // State
  cashRegister: CashRegisterData | null;
  isLoading: boolean;
  error: string | null;
  hasInitialLoad: boolean;

  // Computed
  isOpen: () => boolean;

  // Actions
  setCashRegister: (data: CashRegisterData | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasInitialLoad: (value: boolean) => void;
  reset: () => void;
}

// ============================================================
// STORE
// ============================================================

const initialState = {
  cashRegister: null,
  isLoading: true,
  error: null,
  hasInitialLoad: false,
};

export const useCashRegisterStore = create<CashRegisterStore>((set, get) => ({
  ...initialState,

  isOpen: () => get().cashRegister !== null,

  setCashRegister: (data) =>
    set({ cashRegister: data, hasInitialLoad: true, error: null }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  setHasInitialLoad: (value) => set({ hasInitialLoad: value }),

  reset: () => set(initialState),
}));
