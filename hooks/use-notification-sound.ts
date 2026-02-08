"use client";

import { useCallback } from "react";

const SOUND_PATH = "/sounds/notification.mp3";
const DEBOUNCE_MS = 1000; // 1 second debounce to prevent multiple sounds

// Module-level audio instance - persists across component lifecycles
// This avoids issues with React StrictMode double-mount and component unmounting
let audioInstance: HTMLAudioElement | null = null;
let lastPlayed = 0;

function getAudioInstance(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!audioInstance) {
    audioInstance = new Audio(SOUND_PATH);
    audioInstance.preload = "auto";
    audioInstance.volume = 0.5;
  }
  return audioInstance;
}

export function useNotificationSound() {
  const playSound = useCallback(() => {
    // Only play if tab is visible
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }

    // Debounce: don't play if played recently
    const now = Date.now();
    if (now - lastPlayed < DEBOUNCE_MS) {
      return;
    }

    // Play the sound
    const audio = getAudioInstance();
    if (audio) {
      audio.currentTime = 0; // Reset to start
      audio.play().catch((error) => {
        // Ignore autoplay errors (browser policy) and abort errors
        if (error.name !== "NotAllowedError" && error.name !== "AbortError") {
          console.error("Error playing notification sound:", error);
        }
      });
      lastPlayed = now;
    }
  }, []);

  return { playSound };
}
