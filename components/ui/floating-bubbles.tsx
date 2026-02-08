'use client';

import { useEffect, useMemo, useState } from 'react';

interface Bubble {
  id: number;
  x: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
}

interface FloatingBubblesProps {
  count?: number;
  className?: string;
}

export function FloatingBubbles({ count = 15, className = '' }: FloatingBubblesProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate bubbles with random values (only rendered after mount to avoid hydration mismatch)
  /* eslint-disable react-hooks/purity -- Intentional: decorative random values, guarded by mounted flag */
  const bubbles = useMemo(() => {
    if (!mounted) return [];
    const result: Bubble[] = [];
    for (let i = 0; i < count; i++) {
      result.push({
        id: i,
        x: Math.random() * 100,
        size: 10 + Math.random() * 28,
        delay: Math.random() * 8,
        duration: 10 + Math.random() * 15,
        opacity: 0.35 + Math.random() * 0.35,
      });
    }
    return result;
  }, [count, mounted]);
  /* eslint-enable react-hooks/purity */

  // Return null until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className={`pointer-events-none fixed inset-0 overflow-hidden ${className}`}>
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute animate-bubble-rise"
          style={{
            left: `${bubble.x}%`,
            bottom: '-50px',
            width: bubble.size,
            height: bubble.size,
            animationDelay: `${bubble.delay}s`,
            animationDuration: `${bubble.duration}s`,
          }}
        >
          {/* Glassmorphism bubble */}
          <div
            className="relative h-full w-full rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%,
                rgba(255, 255, 255, ${bubble.opacity + 0.4}) 0%,
                rgba(153, 246, 228, ${bubble.opacity}) 35%,
                rgba(94, 234, 212, ${bubble.opacity * 0.7}) 70%,
                rgba(45, 212, 191, ${bubble.opacity * 0.5}) 100%)`,
              boxShadow: `
                inset 0 -3px 8px rgba(255, 255, 255, 0.5),
                inset 0 3px 6px rgba(255, 255, 255, 0.9),
                inset -3px 0 6px rgba(255, 255, 255, 0.3),
                0 4px 16px rgba(20, 184, 166, 0.15),
                0 2px 8px rgba(6, 182, 212, 0.1)
              `,
              backdropFilter: 'blur(2px)',
              border: '1.5px solid rgba(255, 255, 255, 0.5)',
            }}
          >
            {/* Shine effect */}
            <div
              className="absolute rounded-full bg-white"
              style={{
                width: '35%',
                height: '35%',
                top: '12%',
                left: '18%',
                opacity: 0.7,
                filter: 'blur(1px)',
              }}
            />
            {/* Secondary shine */}
            <div
              className="absolute rounded-full bg-white"
              style={{
                width: '18%',
                height: '18%',
                top: '50%',
                left: '55%',
                opacity: 0.4,
                filter: 'blur(0.5px)',
              }}
            />
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes bubble-rise {
          0% {
            transform: translateY(0) translateX(0) scale(0.8);
            opacity: 0;
          }
          5% {
            opacity: 1;
            transform: translateY(-5vh) translateX(0) scale(1);
          }
          25% {
            transform: translateY(-25vh) translateX(8px) scale(1);
          }
          50% {
            transform: translateY(-50vh) translateX(-6px) scale(0.95);
          }
          75% {
            transform: translateY(-75vh) translateX(4px) scale(0.9);
          }
          95% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-110vh) translateX(-2px) scale(0.85);
            opacity: 0;
          }
        }

        .animate-bubble-rise {
          animation: bubble-rise linear infinite;
        }
      `}</style>
    </div>
  );
}
