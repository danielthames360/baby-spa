"use client";

import { useRef, useCallback, useEffect } from "react";

const SOUND_PATH = "/sounds/notification.mp3";
const DEBOUNCE_MS = 1000; // 1 second debounce to prevent multiple sounds

export function useNotificationSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedRef = useRef<number>(0);

  // Initialize audio element on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio(SOUND_PATH);
      audioRef.current.preload = "auto";
      audioRef.current.volume = 0.5; // 50% volume
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Play sound with debounce
  const playSound = useCallback(() => {
    // Only play if tab is visible
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }

    // Debounce: don't play if played recently
    const now = Date.now();
    if (now - lastPlayedRef.current < DEBOUNCE_MS) {
      return;
    }

    // Play the sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Reset to start
      audioRef.current.play().catch((error) => {
        // Ignore autoplay errors (browser policy)
        if (error.name !== "NotAllowedError") {
          console.error("Error playing notification sound:", error);
        }
      });
      lastPlayedRef.current = now;
    }
  }, []);

  return { playSound };
}
