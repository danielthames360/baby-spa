"use client";

import { useEffect, useCallback } from "react";
import { CashExpenseCategory } from "@prisma/client";
import {
  useCashRegisterStore,
  CashRegisterData,
} from "@/lib/stores/cash-register-store";

// ============================================================
// HOOK
// ============================================================

export function useCashRegister() {
  const {
    cashRegister,
    isLoading,
    error,
    hasInitialLoad,
    setCashRegister,
    setIsLoading,
    setError,
    setHasInitialLoad,
  } = useCashRegisterStore();

  const fetchCashRegister = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/cash-register/current");

      if (!response.ok) {
        throw new Error("Error al obtener el estado de la caja");
      }

      const data = await response.json();
      setCashRegister(data.cashRegister);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  }, [setCashRegister, setIsLoading, setError]);

  // Initial fetch only once
  useEffect(() => {
    if (!hasInitialLoad) {
      fetchCashRegister();
    }
  }, [hasInitialLoad, fetchCashRegister]);

  const openCashRegister = useCallback(
    async (initialFund: number) => {
      try {
        setError(null);

        const response = await fetch("/api/cash-register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initialFund }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Error al abrir caja");
        }

        const data: CashRegisterData = await response.json();
        setCashRegister(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        setError(message);
        throw err;
      }
    },
    [setCashRegister, setError]
  );

  const closeCashRegister = useCallback(
    async (declaredAmount: number, closingNotes?: string) => {
      if (!cashRegister) {
        throw new Error("No hay caja abierta");
      }

      try {
        setError(null);

        const response = await fetch(
          `/api/cash-register/${cashRegister.id}/close`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ declaredAmount, closingNotes }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Error al cerrar caja");
        }

        // Reset cash register state after closing
        setCashRegister(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        setError(message);
        throw err;
      }
    },
    [cashRegister, setCashRegister, setError]
  );

  const addExpense = useCallback(
    async (
      amount: number,
      category: CashExpenseCategory,
      description: string
    ) => {
      if (!cashRegister) {
        throw new Error("No hay caja abierta");
      }

      try {
        setError(null);

        const response = await fetch("/api/cash-register/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, category, description }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Error al registrar gasto");
        }

        // Refetch to get updated expenses
        await fetchCashRegister();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error desconocido";
        setError(message);
        throw err;
      }
    },
    [cashRegister, fetchCashRegister, setError]
  );

  return {
    cashRegister,
    isLoading,
    error,
    isOpen: cashRegister !== null,
    refetch: fetchCashRegister,
    openCashRegister,
    closeCashRegister,
    addExpense,
  };
}

// Re-export types for convenience
export type { CashRegisterData, CashRegisterExpense } from "@/lib/stores/cash-register-store";
