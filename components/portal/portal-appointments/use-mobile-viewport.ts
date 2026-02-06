"use client";

import { useState, useLayoutEffect } from "react";

/**
 * Hook for mobile fullscreen modal (iOS Safari compatible)
 * Handles visual viewport changes for keyboard and toolbar interactions
 */
export function useMobileViewport() {
  const [styles, setStyles] = useState<{ height?: number; isMobile: boolean }>({
    isMobile: false,
  });
  const [mounted, setMounted] = useState(false);

  useLayoutEffect(() => {
    // Mark as mounted first to avoid hydration mismatch
    setMounted(true);

    function update() {
      const isMobile = window.innerWidth < 640;
      // Use visualViewport for most accurate height (handles iOS Safari toolbar)
      const height = window.visualViewport?.height ?? window.innerHeight;
      setStyles({ height, isMobile });
    }

    update();

    // visualViewport is the most reliable for iOS Safari
    const viewport = window.visualViewport;
    if (viewport) {
      viewport.addEventListener("resize", update);
      viewport.addEventListener("scroll", update);
    }
    window.addEventListener("orientationchange", update);

    return () => {
      if (viewport) {
        viewport.removeEventListener("resize", update);
        viewport.removeEventListener("scroll", update);
      }
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  // Return safe defaults until mounted
  if (!mounted) {
    return { isMobile: false, height: undefined };
  }

  return styles;
}
