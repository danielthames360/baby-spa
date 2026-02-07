"use client";

import { useState, useCallback } from "react";

/**
 * Hook that intercepts CASH_REGISTER_REQUIRED API errors
 * and provides state for showing the CashRegisterRequiredModal.
 *
 * Usage in components:
 * 1. Destructure { showCashRegisterModal, setShowCashRegisterModal, handleCashRegisterError, onCashRegisterSuccess }
 * 2. In your API response handler, check if error is CASH_REGISTER_REQUIRED:
 *    if (handleCashRegisterError(data.error, retryFn)) return;
 * 3. Render <CashRegisterRequiredModal> with these props
 */
export function useCashRegisterGuard() {
  const [showCashRegisterModal, setShowCashRegisterModal] = useState(false);
  const [retryCallback, setRetryCallback] = useState<(() => void) | null>(null);

  /**
   * Checks if an API error is CASH_REGISTER_REQUIRED.
   * If so, shows the modal and stores the retry callback.
   * Returns true if the error was handled (caller should stop processing).
   */
  const handleCashRegisterError = useCallback(
    (errorCode: string, retryFn?: () => void): boolean => {
      if (errorCode === "CASH_REGISTER_REQUIRED") {
        setShowCashRegisterModal(true);
        if (retryFn) {
          // Wrap in a function to avoid React treating it as a state updater
          setRetryCallback(() => retryFn);
        }
        return true;
      }
      return false;
    },
    []
  );

  /**
   * Called when cash register is successfully opened.
   * Closes the modal and optionally retries the original action.
   */
  const onCashRegisterSuccess = useCallback(() => {
    setShowCashRegisterModal(false);
    if (retryCallback) {
      // Small delay to ensure the cash register state is updated
      setTimeout(() => {
        retryCallback();
        setRetryCallback(null);
      }, 300);
    }
  }, [retryCallback]);

  return {
    showCashRegisterModal,
    setShowCashRegisterModal,
    handleCashRegisterError,
    onCashRegisterSuccess,
  };
}
