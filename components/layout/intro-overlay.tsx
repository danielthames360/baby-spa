'use client';

import { useState, useEffect, useCallback } from 'react';
import BabySpaIntro from './baby-spa-intro';
import { useSession } from 'next-auth/react';

const STORAGE_KEY = 'babyspa_intro_last_shown';

function checkShouldShowIntro(): boolean {
  if (typeof window === 'undefined') return false;

  const lastShown = localStorage.getItem(STORAGE_KEY);
  if (!lastShown) return true;

  const lastDate = new Date(lastShown);
  const today = new Date();
  const isSameDay =
    lastDate.getDate() === today.getDate() &&
    lastDate.getMonth() === today.getMonth() &&
    lastDate.getFullYear() === today.getFullYear();

  return !isSameDay;
}

function markIntroAsShown(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, new Date().toISOString());
}

type RedirectTarget = 'login' | 'parent-portal' | 'dashboard';

interface IntroOverlayProps {
  children: React.ReactNode;
}

export function IntroOverlay({ children }: IntroOverlayProps) {
  const { data: session, status } = useSession();
  const [showIntro, setShowIntro] = useState<boolean | null>(null);

  // Determine redirect target based on session (used by intro animation)
  const getRedirectTarget = useCallback((): RedirectTarget => {
    if (status === 'loading') return 'login';
    if (!session) return 'login';

    const role = session.user?.role;
    switch (role) {
      case 'ADMIN':
      case 'RECEPTION':
      case 'THERAPIST':
        return 'dashboard';
      case 'PARENT':
        return 'parent-portal';
      default:
        return 'login';
    }
  }, [status, session]);

  // Check if we should show intro on mount (client-side localStorage check)
  useEffect(() => {
    // Check for reset parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'intro') {
      localStorage.removeItem(STORAGE_KEY);
      window.history.replaceState({}, '', window.location.pathname);
    }

    const shouldShow = checkShouldShowIntro();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: hydration-safe localStorage initialization
    setShowIntro(shouldShow);
  }, []);

  // Handle intro completion - just close the overlay, don't redirect
  const handleIntroComplete = useCallback(() => {
    markIntroAsShown();
    setShowIntro(false);
  }, []);

  // While checking, show children (no loading state)
  if (showIntro === null) {
    return <>{children}</>;
  }

  // Show intro overlay on top of children
  if (showIntro) {
    return (
      <>
        {/* Children are rendered behind but hidden */}
        <div className="invisible">
          {children}
        </div>
        {/* Intro overlay */}
        <BabySpaIntro
          getRedirectTarget={getRedirectTarget}
          onIntroComplete={handleIntroComplete}
          forceShow={true}
        />
      </>
    );
  }

  // Normal render
  return <>{children}</>;
}
