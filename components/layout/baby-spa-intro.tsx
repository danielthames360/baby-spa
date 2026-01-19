'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

// ============================================
// BABY SPA INTRO COMPONENT
// ============================================
// Lógica:
// - Aparece 1 vez al día por dispositivo (localStorage)
// - Después del intro, cierra el overlay
// ============================================

const STORAGE_KEY = 'babyspa_intro_last_shown';

// Función para verificar si debe mostrar el intro
const shouldShowIntro = () => {
  if (typeof window === 'undefined') return false;

  const lastShown = localStorage.getItem(STORAGE_KEY);
  if (!lastShown) return true;

  const lastDate = new Date(lastShown);
  const today = new Date();

  // Comparar solo la fecha (ignorar hora)
  const isSameDay =
    lastDate.getDate() === today.getDate() &&
    lastDate.getMonth() === today.getMonth() &&
    lastDate.getFullYear() === today.getFullYear();

  return !isSameDay;
};

// Función para marcar que se mostró el intro
const markIntroAsShown = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, new Date().toISOString());
};

// Type definitions
type RedirectTarget = 'login' | 'parent-portal' | 'dashboard';

interface Bubble {
  id: number | string;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
}

interface BabySpaIntroProps {
  getRedirectTarget?: () => RedirectTarget;
  onIntroComplete?: (target: RedirectTarget) => void;
  forceShow?: boolean;
  skip?: boolean;
}

export default function BabySpaIntro({
  getRedirectTarget = () => 'login',
  onIntroComplete,
  forceShow = false,
  skip = false,
}: BabySpaIntroProps) {
  const t = useTranslations();
  const [shouldRender, setShouldRender] = useState(forceShow);
  const [phase, setPhase] = useState<'intro' | 'transition' | 'complete'>('intro');
  const [babyX, setBabyX] = useState(-15);
  const [showLogo, setShowLogo] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const [initialBubbles, setInitialBubbles] = useState<Bubble[]>([
    { id: 'init-1', x: 15, y: 20, size: 14, opacity: 0.6, speed: 0.25 },
    { id: 'init-2', x: 75, y: 35, size: 10, opacity: 0.5, speed: 0.3 },
    { id: 'init-3', x: 45, y: 15, size: 18, opacity: 0.7, speed: 0.2 },
    { id: 'init-4', x: 85, y: 55, size: 12, opacity: 0.5, speed: 0.35 },
    { id: 'init-5', x: 25, y: 60, size: 20, opacity: 0.6, speed: 0.28 },
    { id: 'init-6', x: 60, y: 25, size: 11, opacity: 0.4, speed: 0.32 },
    { id: 'init-7', x: 90, y: 40, size: 16, opacity: 0.6, speed: 0.22 },
    { id: 'init-8', x: 10, y: 45, size: 13, opacity: 0.5, speed: 0.3 },
    { id: 'init-9', x: 55, y: 70, size: 19, opacity: 0.7, speed: 0.26 },
    { id: 'init-10', x: 35, y: 30, size: 9, opacity: 0.4, speed: 0.35 },
    { id: 'init-11', x: 80, y: 18, size: 15, opacity: 0.5, speed: 0.28 },
    { id: 'init-12', x: 20, y: 75, size: 12, opacity: 0.6, speed: 0.32 },
    { id: 'init-13', x: 70, y: 50, size: 10, opacity: 0.4, speed: 0.3 },
    { id: 'init-14', x: 40, y: 42, size: 14, opacity: 0.5, speed: 0.25 },
    { id: 'init-15', x: 92, y: 65, size: 11, opacity: 0.6, speed: 0.33 },
    { id: 'init-16', x: 5, y: 80, size: 16, opacity: 0.5, speed: 0.27 },
    { id: 'init-17', x: 50, y: 85, size: 13, opacity: 0.6, speed: 0.31 },
    { id: 'init-18', x: 30, y: 90, size: 17, opacity: 0.5, speed: 0.24 },
  ]);

  // Pre-generate ambient bubble sizes (pure, no Math.random during render)
  const ambientBubbleSizes = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      width: 8 + ((i * 7) % 10),
      height: 8 + ((i * 11) % 10),
    })),
  []);

  const floatingToys = [
    { emoji: '🦆', top: '12%', left: '5%', delay: '0s', duration: '4s', size: 'text-2xl sm:text-3xl md:text-4xl' },
    { emoji: '🐙', top: '20%', left: '88%', delay: '0.5s', duration: '3.5s', size: 'text-xl sm:text-2xl md:text-3xl' },
    { emoji: '🐢', top: '65%', left: '92%', delay: '1s', duration: '4.5s', size: 'text-xl sm:text-2xl md:text-3xl' },
    { emoji: '🐠', top: '72%', left: '3%', delay: '0.3s', duration: '5s', size: 'text-2xl sm:text-3xl md:text-4xl' },
    { emoji: '🦀', top: '78%', left: '80%', delay: '1.5s', duration: '3.8s', size: 'text-lg sm:text-xl md:text-2xl' },
    { emoji: '🐠', top: '30%', left: '94%', delay: '0.8s', duration: '3.2s', size: 'text-lg sm:text-xl md:text-2xl' },
    { emoji: '🐡', top: '18%', left: '75%', delay: '2s', duration: '4.2s', size: 'text-lg sm:text-xl md:text-2xl' },
    { emoji: '⭐', top: '8%', left: '65%', delay: '0.2s', duration: '3s', size: 'text-xl sm:text-2xl md:text-3xl' },
    { emoji: '🌊', top: '40%', left: '2%', delay: '1.2s', duration: '4s', size: 'text-lg sm:text-xl md:text-2xl' },
    { emoji: '🧴', top: '50%', left: '90%', delay: '0.7s', duration: '3.6s', size: 'text-lg sm:text-xl md:text-2xl' },
    { emoji: '🛁', top: '82%', left: '12%', delay: '1.8s', duration: '4.8s', size: 'text-lg sm:text-xl md:text-2xl' },
    { emoji: '🐟', top: '25%', left: '4%', delay: '0.4s', duration: '2.8s', size: 'text-xl sm:text-2xl md:text-3xl' },
  ];

  // Handle intro completion - defined BEFORE useEffect that uses it
  const handleIntroComplete = useCallback(() => {
    const target = getRedirectTarget();
    if (onIntroComplete) {
      onIntroComplete(target);
    }
  }, [getRedirectTarget, onIntroComplete]);

  // Check if should show intro on mount
  useEffect(() => {
    if (skip) {
      handleIntroComplete();
      return;
    }

    if (forceShow) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: forceShow prop triggers initial render
      setShouldRender(true);
    } else if (shouldShowIntro()) {
      setShouldRender(true);
      markIntroAsShown();
    } else {
      handleIntroComplete();
    }
  }, [skip, forceShow, handleIntroComplete]);

  // Animate initial bubbles rising
  useEffect(() => {
    if (!shouldRender || phase !== 'intro') return;
    const interval = setInterval(() => {
      setInitialBubbles(prev => prev.map(b => ({
        ...b,
        y: b.y - b.speed,
        x: b.x + Math.sin(Date.now() / 600 + b.size) * 0.04,
      })).map(b => b.y < -5 ? { ...b, y: 95 + Math.random() * 10, x: 5 + Math.random() * 90 } : b));
    }, 50);
    return () => clearInterval(interval);
  }, [shouldRender, phase]);

  // Baby movement
  useEffect(() => {
    if (!shouldRender || phase !== 'intro') return;
    const moveInterval = setInterval(() => {
      setBabyX(prev => {
        if (prev >= 40) setShowLogo(true);
        if (prev >= 115) {
          clearInterval(moveInterval);
          setTimeout(() => setPhase('transition'), 500);
          return prev;
        }
        return prev + 0.6;
      });
    }, 25);
    return () => clearInterval(moveInterval);
  }, [shouldRender, phase]);

  // Transition to complete
  useEffect(() => {
    if (phase === 'transition') {
      const timeout = setTimeout(() => {
        setPhase('complete');
        handleIntroComplete();
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [phase, handleIntroComplete]);

  // Generate bubbles from baby
  useEffect(() => {
    if (!shouldRender || phase !== 'intro') return;
    const interval = setInterval(() => {
      setBubbles(prev => [...prev.slice(-20), {
        id: Date.now(),
        x: babyX + 2 + Math.random() * 5,
        y: 48 + Math.random() * 8,
        size: 6 + Math.random() * 14,
        opacity: 0.5 + Math.random() * 0.4,
        speed: 0.35 + Math.random() * 0.25,
      }]);
    }, 180);
    return () => clearInterval(interval);
  }, [shouldRender, phase, babyX]);

  // Animate bubbles rising
  useEffect(() => {
    if (!shouldRender || phase !== 'intro') return;
    const interval = setInterval(() => {
      setBubbles(prev => prev.map(b => ({
        ...b,
        y: b.y - b.speed,
        x: b.x + Math.sin(Date.now() / 500 + Number(b.id)) * 0.05
      })).filter(b => b.y > -5));
    }, 50);
    return () => clearInterval(interval);
  }, [shouldRender, phase]);

  // Generate random ripples
  useEffect(() => {
    if (!shouldRender || phase !== 'intro') return;
    const interval = setInterval(() => {
      setRipples(prev => [...prev.slice(-8), {
        id: Date.now(),
        x: 10 + Math.random() * 80,
        y: 30 + Math.random() * 50,
      }]);
    }, 800);
    return () => clearInterval(interval);
  }, [shouldRender, phase]);

  // Remove old ripples
  useEffect(() => {
    if (!shouldRender || phase !== 'intro') return;
    const interval = setInterval(() => {
      setRipples(prev => prev.filter(r => Date.now() - r.id < 2000));
    }, 100);
    return () => clearInterval(interval);
  }, [shouldRender, phase]);

  // Don't render anything if not needed
  if (!shouldRender || phase === 'complete') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100]">
      <div className={`fixed inset-0 transition-opacity duration-500 ${phase === 'transition' ? 'opacity-0' : 'opacity-100'}`}>

        {/* Deep pool gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-200 via-teal-200 to-teal-400" />

        {/* Water surface shimmer at top */}
        <div className="absolute top-0 left-0 right-0 h-20 sm:h-24 bg-gradient-to-b from-white/30 to-transparent">
          <div className="absolute inset-0 opacity-50" style={{
            background: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 20px)',
            animation: 'shimmer 3s linear infinite',
          }}/>
        </div>

        {/* Underwater light rays */}
        <div className="absolute inset-0 overflow-hidden opacity-60">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute h-full w-16 sm:w-24 md:w-32 bg-gradient-to-b from-white/20 via-white/5 to-transparent"
              style={{
                left: `${5 + i * 13}%`,
                transform: 'skewX(-15deg)',
                animation: `lightRay ${5 + i * 0.4}s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>

        {/* Water texture waves */}
        <div className="absolute inset-0 opacity-40">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-full h-1 bg-white/50 rounded-full"
              style={{
                top: `${10 + i * 12}%`,
                animation: `wave ${2.5 + i * 0.3}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>

        {/* Water ripples */}
        {ripples.map(ripple => (
          <div
            key={ripple.id}
            className="absolute pointer-events-none"
            style={{ left: `${ripple.x}%`, top: `${ripple.y}%` }}
          >
            <div className="relative">
              <div
                className="absolute w-4 h-4 border-2 border-white/40 rounded-full"
                style={{ animation: 'ripple 2s ease-out forwards' }}
              />
              <div
                className="absolute w-4 h-4 border-2 border-white/30 rounded-full"
                style={{ animation: 'ripple 2s ease-out forwards', animationDelay: '0.3s' }}
              />
            </div>
          </div>
        ))}

        {/* Floating toys */}
        {floatingToys.map((toy, index) => (
          <div
            key={index}
            className={`absolute ${toy.size} select-none`}
            style={{
              top: toy.top,
              left: toy.left,
              animation: `float ${toy.duration} ease-in-out infinite`,
              animationDelay: toy.delay,
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
            }}
          >
            {toy.emoji}
          </div>
        ))}

        {/* Bubbles - Always on top */}
        <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
          {/* Initial bubbles */}
          {initialBubbles.map((bubble) => (
            <div
              key={bubble.id}
              className="absolute rounded-full transition-all duration-100"
              style={{
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                width: bubble.size,
                height: bubble.size,
                background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(153,246,228,${bubble.opacity * 0.5}))`,
                boxShadow: `0 2px 10px rgba(20,184,166,0.15), inset 0 -2px 4px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,0.8)`,
              }}
            />
          ))}

          {/* Dynamic bubbles from baby */}
          {bubbles.map(bubble => (
            <div
              key={bubble.id}
              className="absolute rounded-full"
              style={{
                left: `${bubble.x}%`,
                top: `${bubble.y}%`,
                width: bubble.size,
                height: bubble.size,
                background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95), rgba(153,246,228,${bubble.opacity * 0.5}))`,
                boxShadow: `0 2px 10px rgba(20,184,166,0.15), inset 0 -2px 4px rgba(0,0,0,0.05), inset 0 2px 4px rgba(255,255,255,0.8)`,
              }}
            />
          ))}
        </div>

        {/* Ambient bubbles - using pre-generated sizes */}
        <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
          {ambientBubbleSizes.map((sizes, i) => (
            <div
              key={`ambient-${i}`}
              className="absolute rounded-full"
              style={{
                left: `${8 + (i * 7.5)}%`,
                bottom: '-20px',
                width: sizes.width,
                height: sizes.height,
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.9), rgba(153,246,228,0.3))',
                animation: `ambientBubble ${12 + (i * 1.5)}s ease-in-out infinite`,
                animationDelay: `${i * 1}s`,
                opacity: 0.5,
              }}
            />
          ))}
        </div>

        {/* Swimming Baby with Duck float */}
        <div
          className="absolute top-1/2 -translate-y-1/2 z-20"
          style={{ left: `${babyX}%` }}
        >
          <div className="relative w-36 sm:w-44 md:w-52 lg:w-60" style={{ animation: 'swim 0.6s ease-in-out infinite' }}>
            <svg viewBox="0 0 140 110" className="w-full h-auto drop-shadow-2xl">
              {/* Duck float ring */}
              <ellipse cx="70" cy="72" rx="52" ry="22" fill="#fbbf24"/>
              <ellipse cx="70" cy="72" rx="42" ry="16" fill="#fcd34d"/>
              <ellipse cx="70" cy="70" rx="30" ry="11" fill="#fef3c7"/>

              {/* Duck head on float */}
              <circle cx="110" cy="58" r="14" fill="#fbbf24"/>
              <circle cx="114" cy="55" r="3" fill="#1f2937"/>
              <ellipse cx="120" cy="60" rx="6" ry="3" fill="#f97316"/>

              {/* Baby body */}
              <ellipse cx="70" cy="55" rx="24" ry="28" fill="#fef3c7"/>

              {/* Baby face */}
              <circle cx="70" cy="42" r="24" fill="#fefce8"/>

              {/* Rosy cheeks */}
              <circle cx="56" cy="48" r="6" fill="#fda4af" opacity="0.4"/>
              <circle cx="84" cy="48" r="6" fill="#fda4af" opacity="0.4"/>

              {/* Happy eyes */}
              <ellipse cx="62" cy="40" rx="3.5" ry="4.5" fill="#374151"/>
              <ellipse cx="78" cy="40" rx="3.5" ry="4.5" fill="#374151"/>
              <circle cx="63" cy="39" r="1.5" fill="white"/>
              <circle cx="79" cy="39" r="1.5" fill="white"/>

              {/* Big happy smile */}
              <path d="M 62 52 Q 70 60 78 52" stroke="#374151" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

              {/* Cute hair tuft */}
              <path d="M 52 26 Q 60 14 70 18 Q 80 14 88 26" stroke="#78350f" strokeWidth="6" fill="none" strokeLinecap="round"/>
              <circle cx="62" cy="18" r="5" fill="#78350f"/>
              <circle cx="70" cy="15" r="4" fill="#78350f"/>
              <circle cx="78" cy="18" r="5" fill="#78350f"/>

              {/* Arms splashing */}
              <ellipse cx="38" cy="58" rx="12" ry="7" fill="#fefce8" transform="rotate(-25 38 58)"/>
              <ellipse cx="102" cy="58" rx="12" ry="7" fill="#fefce8" transform="rotate(25 102 58)"/>

              {/* Hands with splash */}
              <circle cx="28" cy="54" r="6" fill="#fefce8">
                <animate attributeName="cy" values="54;48;54" dur="0.35s" repeatCount="indefinite"/>
              </circle>
              <circle cx="112" cy="54" r="6" fill="#fefce8">
                <animate attributeName="cy" values="54;60;54" dur="0.35s" repeatCount="indefinite"/>
              </circle>

              {/* Water splashes */}
              <g>
                <circle cx="20" cy="60" r="3" fill="#67e8f9" opacity="0.8">
                  <animate attributeName="r" values="2;5;2" dur="0.4s" repeatCount="indefinite"/>
                  <animate attributeName="cy" values="60;55;60" dur="0.4s" repeatCount="indefinite"/>
                </circle>
                <circle cx="26" cy="65" r="2" fill="#a5f3fc" opacity="0.6">
                  <animate attributeName="r" values="1;3;1" dur="0.3s" repeatCount="indefinite"/>
                </circle>
                <circle cx="120" cy="60" r="3" fill="#67e8f9" opacity="0.8">
                  <animate attributeName="r" values="2;5;2" dur="0.4s" repeatCount="indefinite" begin="0.2s"/>
                  <animate attributeName="cy" values="60;55;60" dur="0.4s" repeatCount="indefinite" begin="0.2s"/>
                </circle>
                <circle cx="114" cy="65" r="2" fill="#a5f3fc" opacity="0.6">
                  <animate attributeName="r" values="1;3;1" dur="0.3s" repeatCount="indefinite" begin="0.1s"/>
                </circle>
              </g>
            </svg>

            {/* Splash droplets */}
            <div className="absolute -left-3 sm:-left-5 top-1/3">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-cyan-300 rounded-full animate-ping" style={{animationDuration: '0.5s'}}/>
            </div>
            <div className="absolute -left-1 sm:-left-2 top-1/4">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-ping" style={{animationDuration: '0.6s', animationDelay: '0.15s'}}/>
            </div>
            <div className="absolute -right-2 sm:-right-4 top-1/3">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white/80 rounded-full animate-ping" style={{animationDuration: '0.7s'}}/>
            </div>
            <div className="absolute -right-3 sm:-right-5 top-1/2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-cyan-200/80 rounded-full animate-ping" style={{animationDuration: '0.9s', animationDelay: '0.2s'}}/>
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center transition-all duration-700 z-30 px-4 w-full max-w-sm sm:max-w-md ${showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
          <div className="relative">
            <div className="absolute inset-0 bg-teal-300/30 rounded-[2.5rem] blur-xl scale-110" />
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-44 md:h-44 mx-auto bg-white/95 backdrop-blur-sm rounded-[1.5rem] sm:rounded-[2rem] flex items-center justify-center shadow-2xl mb-3 sm:mb-4 border-4 border-teal-100 p-2 sm:p-3">
              <Image
                src="/images/logoBabySpa.png"
                alt="Baby Spa"
                width={160}
                height={160}
                className="w-full h-full object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-teal-700 drop-shadow-sm">Baby Spa</h1>
          <p className="text-teal-600 mt-1 sm:mt-2 text-base sm:text-lg font-medium">{t("common.introTagline")} 💙</p>
          <div className="flex justify-center gap-2 mt-2 sm:mt-3">
            <span className="text-xl sm:text-2xl animate-bounce" style={{animationDelay: '0s'}}>🫧</span>
            <span className="text-xl sm:text-2xl animate-bounce" style={{animationDelay: '0.1s'}}>💧</span>
            <span className="text-xl sm:text-2xl animate-bounce" style={{animationDelay: '0.2s'}}>🫧</span>
          </div>
        </div>

        {/* Bottom waves */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-16 sm:h-20 md:h-24 opacity-50">
            <path fill="#5eead4" d="M0,60 Q180,100 360,60 T720,60 T1080,60 T1440,60 L1440,120 L0,120 Z">
              <animate attributeName="d" dur="5s" repeatCount="indefinite"
                values="M0,60 Q180,100 360,60 T720,60 T1080,60 T1440,60 L1440,120 L0,120 Z;
                        M0,70 Q180,30 360,70 T720,70 T1080,70 T1440,70 L1440,120 L0,120 Z;
                        M0,60 Q180,100 360,60 T720,60 T1080,60 T1440,60 L1440,120 L0,120 Z"/>
            </path>
          </svg>
          <svg viewBox="0 0 1440 100" preserveAspectRatio="none" className="w-full h-12 sm:h-16 md:h-20 -mt-8 sm:-mt-10 md:-mt-12 opacity-70">
            <path fill="#2dd4bf" d="M0,50 Q240,90 480,50 T960,50 T1440,50 L1440,100 L0,100 Z">
              <animate attributeName="d" dur="4s" repeatCount="indefinite"
                values="M0,50 Q240,90 480,50 T960,50 T1440,50 L1440,100 L0,100 Z;
                        M0,60 Q240,30 480,60 T960,60 T1440,60 L1440,100 L0,100 Z;
                        M0,50 Q240,90 480,50 T960,50 T1440,50 L1440,100 L0,100 Z"/>
            </path>
          </svg>
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="w-full h-10 sm:h-12 md:h-16 -mt-6 sm:-mt-8 md:-mt-10">
            <path fill="#14b8a6" d="M0,40 Q360,70 720,40 T1440,40 L1440,80 L0,80 Z">
              <animate attributeName="d" dur="3s" repeatCount="indefinite"
                values="M0,40 Q360,70 720,40 T1440,40 L1440,80 L0,80 Z;
                        M0,50 Q360,20 720,50 T1440,50 L1440,80 L0,80 Z;
                        M0,40 Q360,70 720,40 T1440,40 L1440,80 L0,80 Z"/>
            </path>
          </svg>
        </div>
      </div>

      <style>{`
        @keyframes swim {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes wave {
          0%, 100% { transform: translateX(-5%) scaleY(1); }
          50% { transform: translateX(5%) scaleY(1.5); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-5deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        @keyframes ambientBubble {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-100vh) scale(0.8); opacity: 0; }
        }
        @keyframes ripple {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(8); opacity: 0; }
        }
        @keyframes lightRay {
          0%, 100% { opacity: 0.15; transform: skewX(-15deg) translateX(0); }
          50% { opacity: 0.25; transform: skewX(-15deg) translateX(20px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-20px); }
          100% { transform: translateX(20px); }
        }
      `}</style>
    </div>
  );
}
