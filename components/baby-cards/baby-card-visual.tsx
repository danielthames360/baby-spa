"use client";

import { useState, useRef } from "react";
import { useLocale } from "next-intl";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Gift, Lock, Check } from "lucide-react";
import { getCurrencySymbol } from "@/lib/utils/currency-utils";

// ===========================================
// COLOR THEMES - Saved options for easy switching
// ===========================================
const COLOR_THEMES = {
  // Current: Pastel Baby Spa (teal/cyan)
  pastelTeal: {
    border: "from-teal-400 via-cyan-300 to-teal-300",
    shadow: "shadow-teal-200/50",
    bubbles: ["from-cyan-200/40", "from-teal-200/40", "from-pink-100/30"],
    title: "from-teal-600 via-cyan-500 to-teal-600",
    gridBg: "bg-white/60 border-teal-100",
    sessionNormal: "border-teal-200 bg-white hover:border-teal-300",
    sessionNumber: "text-teal-400",
    sessionReward:
      "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-amber-200/50",
    statsText: "text-teal-500",
    statsDot: "from-teal-400 to-cyan-400",
    rewardBg: "from-amber-50 to-orange-50 border-amber-200 text-amber-600",
    bottomBar: "from-teal-300 via-cyan-300 to-teal-300",
  },
  // Option 2: Soft Pink/Rose (for baby girls)
  pastelPink: {
    border: "from-pink-400 via-rose-300 to-pink-300",
    shadow: "shadow-pink-200/50",
    bubbles: ["from-pink-200/40", "from-rose-200/40", "from-purple-100/30"],
    title: "from-pink-600 via-rose-500 to-pink-600",
    gridBg: "bg-white/60 border-pink-100",
    sessionNormal: "border-pink-200 bg-white hover:border-pink-300",
    sessionNumber: "text-pink-400",
    sessionReward:
      "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-amber-200/50",
    statsText: "text-pink-500",
    statsDot: "from-pink-400 to-rose-400",
    rewardBg: "from-amber-50 to-orange-50 border-amber-200 text-amber-600",
    bottomBar: "from-pink-300 via-rose-300 to-pink-300",
  },
  // Option 3: Lavender/Purple
  pastelLavender: {
    border: "from-violet-400 via-purple-300 to-violet-300",
    shadow: "shadow-violet-200/50",
    bubbles: ["from-violet-200/40", "from-purple-200/40", "from-pink-100/30"],
    title: "from-violet-600 via-purple-500 to-violet-600",
    gridBg: "bg-white/60 border-violet-100",
    sessionNormal: "border-violet-200 bg-white hover:border-violet-300",
    sessionNumber: "text-violet-400",
    sessionReward:
      "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-amber-200/50",
    statsText: "text-violet-500",
    statsDot: "from-violet-400 to-purple-400",
    rewardBg: "from-amber-50 to-orange-50 border-amber-200 text-amber-600",
    bottomBar: "from-violet-300 via-purple-300 to-violet-300",
  },
  // Option 4: Mint/Green
  pastelMint: {
    border: "from-emerald-400 via-green-300 to-emerald-300",
    shadow: "shadow-emerald-200/50",
    bubbles: ["from-emerald-200/40", "from-green-200/40", "from-teal-100/30"],
    title: "from-emerald-600 via-green-500 to-emerald-600",
    gridBg: "bg-white/60 border-emerald-100",
    sessionNormal: "border-emerald-200 bg-white hover:border-emerald-300",
    sessionNumber: "text-emerald-400",
    sessionReward:
      "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-amber-200/50",
    statsText: "text-emerald-500",
    statsDot: "from-emerald-400 to-green-400",
    rewardBg: "from-amber-50 to-orange-50 border-amber-200 text-amber-600",
    bottomBar: "from-emerald-300 via-green-300 to-emerald-300",
  },
  // Option 5: Peach/Coral
  pastelPeach: {
    border: "from-orange-300 via-amber-200 to-orange-300",
    shadow: "shadow-orange-200/50",
    bubbles: ["from-orange-200/40", "from-amber-200/40", "from-pink-100/30"],
    title: "from-orange-500 via-amber-500 to-orange-500",
    gridBg: "bg-white/60 border-orange-100",
    sessionNormal: "border-orange-200 bg-white hover:border-orange-300",
    sessionNumber: "text-orange-400",
    sessionReward:
      "border-teal-300 bg-gradient-to-br from-teal-50 to-cyan-50 shadow-teal-200/50",
    statsText: "text-orange-500",
    statsDot: "from-orange-400 to-amber-400",
    rewardBg: "from-teal-50 to-cyan-50 border-teal-200 text-teal-600",
    bottomBar: "from-orange-300 via-amber-300 to-orange-300",
  },
};

// Current active theme - change this to switch colors
const ACTIVE_THEME = COLOR_THEMES.pastelTeal;

interface Reward {
  id: string;
  sessionNumber: number;
  displayName: string;
  displayIcon?: string | null;
  rewardType: string;
}

interface BabyCardVisualProps {
  name: string;
  totalSessions: number;
  completedSessions?: number;
  rewards: Reward[];
  usedRewardIds?: string[];
  firstSessionDiscount?: number; // Amount of first session discount (0 = none)
  firstSessionDiscountUsed?: boolean; // Whether the first session discount was already used
  variant?: "full" | "compact" | "preview";
  className?: string;
}

// Number of sessions per row
const SESSIONS_PER_ROW = 8;

// Preview Card Component with Tilt Effect
interface PreviewCardProps {
  name: string;
  totalSessions: number;
  completedSessions: number;
  rows: number;
  rewardMap: Map<number, Reward>;
  rewards: Reward[];
  usedRewardIds: string[];
  firstSessionDiscount: number;
  firstSessionDiscountUsed: boolean;
  className?: string;
}

function PreviewCard({
  name,
  totalSessions,
  completedSessions,
  rows,
  rewardMap,
  rewards,
  usedRewardIds,
  firstSessionDiscount,
  firstSessionDiscountUsed,
  className,
}: PreviewCardProps) {
  const locale = useLocale();
  const currencySymbol = getCurrencySymbol(locale);
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = (y - centerY) / 20;
    const tiltY = (centerX - x) / 20;

    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => {
    setIsHovering(false);
    setTilt({ x: 0, y: 0 });
  };

  const theme = ACTIVE_THEME;

  return (
    <div className={cn("perspective-1000", className)}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovering ? 1.02 : 1})`,
          transition: isHovering
            ? "transform 0.1s ease-out"
            : "transform 0.5s ease-out",
        }}
        className="relative overflow-hidden rounded-3xl cursor-pointer"
      >
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-teal-400/40 rounded-full blur-3xl animate-blob" />
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-400/40 rounded-full blur-3xl animate-blob animation-delay-2000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-pink-300/30 rounded-full blur-3xl animate-blob animation-delay-4000" />
        </div>

        {/* Shimmer effect on hover - diagonal light line */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: `linear-gradient(
              105deg,
              transparent 40%,
              rgba(255,255,255,0.8) 45%,
              rgba(255,255,255,0.8) 50%,
              transparent 55%
            )`,
            backgroundSize: "200% 200%",
            backgroundPosition: isHovering ? "100% 100%" : "-100% -100%",
            transition: "background-position 0.6s ease",
          }}
        />

        {/* Glass card container */}
        <div className="relative backdrop-blur-xl bg-white/20 border border-white/40 rounded-3xl p-3 sm:p-5 shadow-2xl">
          {/* Subtle shine overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-3xl pointer-events-none" />

          {/* Header - Logo, Title, Star in a row */}
          <div className="relative mb-3 sm:mb-4 flex items-center justify-between gap-2 sm:gap-3">
            {/* Logo */}
            <div className="relative h-9 w-9 sm:h-12 sm:w-12 shrink-0 rounded-xl sm:rounded-2xl overflow-hidden bg-white/30 backdrop-blur border border-white/50 p-0.5 sm:p-1">
              <Image
                src="/images/logoBabySpa.png"
                alt="Baby Spa"
                fill
                className="object-contain"
              />
            </div>

            {/* Card name - centered */}
            <div className="flex-1 text-center min-w-0">
              <p className="text-[10px] sm:text-xs text-teal-700 font-medium">
                Baby Spa
              </p>
              <h4 className="font-nunito text-sm sm:text-lg font-bold text-teal-900 truncate">
                {name || "Baby Card"}
              </h4>
            </div>

            {/* Decorative star */}
            <div className="shrink-0">
              <span className="text-lg sm:text-2xl">⭐</span>
            </div>
          </div>

          {/* Sessions grid - glass style */}
          <div className="relative bg-white/30 backdrop-blur rounded-xl sm:rounded-2xl p-2 sm:p-4 border border-white/50">
            <div className="space-y-2 sm:space-y-3">
              {Array.from({ length: rows }, (_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="flex justify-between gap-1.5 sm:gap-3"
                >
                  {Array.from({ length: SESSIONS_PER_ROW }, (_, colIndex) => {
                    const sessionNumber =
                      rowIndex * SESSIONS_PER_ROW + colIndex + 1;
                    if (sessionNumber > totalSessions) return null;

                    const reward = rewardMap.get(sessionNumber);
                    const isCompleted = sessionNumber <= completedSessions;
                    // Reward unlocks when available to use IN that session (sessionNumber - 1 completed)
                    const isRewardUnlocked =
                      reward && sessionNumber <= completedSessions + 1;
                    const isRewardUsed =
                      reward && usedRewardIds.includes(reward.id);

                    // Session #1 is ALWAYS reserved for first session discount
                    const isFirstSession = sessionNumber === 1;
                    const hasFirstDiscount = firstSessionDiscount > 0;

                    // Determine circle style
                    let circleClass = "border-white/60 bg-white/40";

                    if (isFirstSession) {
                      // First session - always show as special (first session discount)
                      if (firstSessionDiscountUsed || isCompleted) {
                        // Used/completed - gray like used rewards
                        circleClass = "border-gray-300 bg-gray-100/50";
                      } else if (hasFirstDiscount) {
                        // Has discount, not used - glowing
                        circleClass =
                          "border-amber-400 bg-gradient-to-br from-amber-100 to-orange-100 shadow-lg shadow-amber-400/40 ring-2 ring-amber-300/50";
                      } else {
                        // No discount configured - still show gift but dimmed
                        circleClass = "border-amber-300/50 bg-amber-50/30";
                      }
                    } else if (reward) {
                      if (isRewardUsed) {
                        // Used reward - grayed out
                        circleClass = "border-gray-300 bg-gray-100/50";
                      } else if (isRewardUnlocked) {
                        // Unlocked reward - glowing green
                        circleClass =
                          "border-emerald-400 bg-emerald-100/70 shadow-lg shadow-emerald-400/40 ring-2 ring-emerald-300/50";
                      } else {
                        // Locked reward - amber but dimmed
                        circleClass = "border-amber-300/50 bg-amber-50/30";
                      }
                    } else if (isCompleted) {
                      // Completed session (no reward)
                      circleClass = "border-teal-400 bg-teal-500";
                    }

                    return (
                      <div
                        key={sessionNumber}
                        className={cn(
                          "relative flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full border-2 transition-all backdrop-blur-sm",
                          circleClass,
                        )}
                        title={
                          isFirstSession
                            ? hasFirstDiscount
                              ? `${firstSessionDiscount} ${currencySymbol}`
                              : "Primera sesión"
                            : reward?.displayName
                        }
                      >
                        {isFirstSession ? (
                          // First session - always show gift icon for first session discount
                          firstSessionDiscountUsed || isCompleted ? (
                            // Used - emoji grayscale with check overlay (like used rewards)
                            <>
                              <span className="text-sm sm:text-base opacity-60 grayscale">
                                🎁
                              </span>
                              <Check className="absolute -bottom-1 -right-1 h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 bg-white rounded-full p-0.5" />
                            </>
                          ) : (
                            <span className="text-sm sm:text-base">🎁</span>
                          )
                        ) : reward ? (
                          isRewardUsed ? (
                            // Used reward - emoji in color with check overlay
                            <>
                              <span className="text-sm sm:text-base opacity-60">
                                {reward.displayIcon || "🎁"}
                              </span>
                              <Check className="absolute -bottom-1 -right-1 h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 bg-white rounded-full p-0.5" />
                            </>
                          ) : isRewardUnlocked ? (
                            // Unlocked reward - emoji with glow
                            <span className="text-sm sm:text-base">
                              {reward.displayIcon || "🎁"}
                            </span>
                          ) : (
                            // Locked reward - emoji in color with lock overlay
                            <>
                              <span className="text-sm sm:text-base opacity-50">
                                {reward.displayIcon || "🎁"}
                              </span>
                              <Lock className="absolute -bottom-1 -right-1 h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 bg-white rounded-full p-0.5" />
                            </>
                          )
                        ) : isCompleted ? (
                          // Completed session - checkmark
                          <Check className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        ) : (
                          // Upcoming session - number
                          <span className="text-[10px] sm:text-xs text-teal-600 font-medium">
                            {sessionNumber}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Footer stats */}
          <div className="relative mt-3 sm:mt-4 flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2 text-teal-700">
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-teal-500" />
              <span>
                {completedSessions}/{totalSessions} sesiones
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-amber-600">
              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-amber-500" />
              <span>{rewards.length} premios</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BabyCardVisual({
  name,
  totalSessions,
  completedSessions = 0,
  rewards,
  usedRewardIds = [],
  firstSessionDiscount = 0,
  firstSessionDiscountUsed = false,
  variant = "full",
  className,
}: BabyCardVisualProps) {
  const locale = useLocale();
  const currencySymbol = getCurrencySymbol(locale);

  // Create a map of session number to reward
  const rewardMap = new Map(rewards.map((r) => [r.sessionNumber, r]));

  // Calculate rows
  const rows = Math.ceil(totalSessions / SESSIONS_PER_ROW);

  // Generate session circles
  const renderSession = (sessionNumber: number) => {
    const isCompleted = sessionNumber <= completedSessions;
    const reward = rewardMap.get(sessionNumber);
    const isRewardUsed = reward && usedRewardIds.includes(reward.id);
    // Reward unlocks when available to use IN that session (sessionNumber - 1 completed)
    const isRewardUnlocked = reward && sessionNumber <= completedSessions + 1;

    // Session #1 is ALWAYS reserved for first session discount
    const isFirstSession = sessionNumber === 1;
    const hasFirstDiscount = firstSessionDiscount > 0;

    const size = variant === "compact" ? "h-6 w-6" : "h-8 w-8";
    const iconSize = variant === "compact" ? "h-3 w-3" : "h-4 w-4";

    // First session - always shows gift icon for first session discount
    if (isFirstSession) {
      const isUsed = firstSessionDiscountUsed || isCompleted;
      return (
        <div
          key={sessionNumber}
          className={cn(
            "relative flex items-center justify-center rounded-full border-2 transition-all",
            size,
            isUsed
              ? "border-gray-300 bg-gray-100" // Used - gray like used rewards
              : hasFirstDiscount
                ? "border-amber-400 bg-amber-100 ring-2 ring-amber-200"
                : "border-amber-300 bg-amber-50",
          )}
          title={
            hasFirstDiscount
              ? `${firstSessionDiscount} ${currencySymbol}`
              : "Primera sesión"
          }
        >
          {isUsed ? (
            // Used - emoji grayscale with check overlay (like used rewards)
            <>
              <span
                className={cn(
                  variant === "compact" ? "text-xs" : "text-sm",
                  "grayscale opacity-50",
                )}
              >
                🎁
              </span>
              <Check className="absolute -bottom-1 -right-1 h-3.5 w-3.5 text-emerald-500 bg-white rounded-full p-0.5" />
            </>
          ) : (
            <span className={variant === "compact" ? "text-xs" : "text-sm"}>
              🎁
            </span>
          )}
        </div>
      );
    }

    if (reward) {
      // Session with reward
      return (
        <div
          key={sessionNumber}
          className={cn(
            "relative flex items-center justify-center rounded-full border-2 transition-all",
            size,
            isRewardUsed
              ? "border-gray-300 bg-gray-100"
              : isRewardUnlocked
                ? "border-emerald-500 bg-emerald-100 ring-2 ring-emerald-200"
                : isCompleted
                  ? "border-teal-500 bg-teal-500"
                  : "border-gray-300 bg-white",
          )}
          title={reward.displayName}
        >
          {isRewardUsed ? (
            // Used reward - emoji grayscale with check overlay
            <>
              <span
                className={cn(
                  variant === "compact" ? "text-xs" : "text-sm",
                  "grayscale opacity-50",
                )}
              >
                {reward.displayIcon || "🎁"}
              </span>
              <Check className="absolute -bottom-1 -right-1 h-3.5 w-3.5 text-emerald-500 bg-white rounded-full p-0.5" />
            </>
          ) : reward.displayIcon ? (
            <span className={variant === "compact" ? "text-xs" : "text-sm"}>
              {reward.displayIcon}
            </span>
          ) : (
            <Gift
              className={cn(
                iconSize,
                isRewardUnlocked ? "text-emerald-600" : "text-gray-400",
              )}
            />
          )}
          {!isRewardUnlocked && !isRewardUsed && (
            <Lock className="absolute -bottom-1 -right-1 h-3.5 w-3.5 text-red-500 bg-white rounded-full p-0.5" />
          )}
        </div>
      );
    }

    // Regular session circle
    return (
      <div
        key={sessionNumber}
        className={cn(
          "flex items-center justify-center rounded-full border-2 transition-all",
          size,
          isCompleted
            ? "border-teal-500 bg-teal-500"
            : "border-gray-300 bg-white",
        )}
      >
        {isCompleted && <Check className={cn(iconSize, "text-white")} />}
      </div>
    );
  };

  // Progress percentage
  const progressPercent = (completedSessions / totalSessions) * 100;

  if (variant === "preview") {
    // Preview mode - Premium Baby Spa pastel card with tilt effect
    return (
      <PreviewCard
        name={name}
        totalSessions={totalSessions}
        completedSessions={completedSessions}
        rows={rows}
        rewardMap={rewardMap}
        rewards={rewards}
        usedRewardIds={usedRewardIds}
        firstSessionDiscount={firstSessionDiscount}
        firstSessionDiscountUsed={firstSessionDiscountUsed}
        className={className}
      />
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("rounded-xl bg-white/50 p-3", className)}>
        <div className="space-y-1.5">
          {Array.from({ length: rows }, (_, rowIndex) => (
            <div key={rowIndex} className="flex justify-center gap-1.5">
              {Array.from({ length: SESSIONS_PER_ROW }, (_, colIndex) => {
                const sessionNumber =
                  rowIndex * SESSIONS_PER_ROW + colIndex + 1;
                if (sessionNumber > totalSessions) return null;
                return renderSession(sessionNumber);
              })}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              {completedSessions}/{totalSessions}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/50 bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-6 shadow-lg shadow-teal-500/10",
        className,
      )}
    >
      <h4 className="mb-4 text-center font-nunito text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
        {name}
      </h4>

      <div className="space-y-2">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-2">
            {Array.from({ length: SESSIONS_PER_ROW }, (_, colIndex) => {
              const sessionNumber = rowIndex * SESSIONS_PER_ROW + colIndex + 1;
              if (sessionNumber > totalSessions) return null;
              return renderSession(sessionNumber);
            })}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            {completedSessions} de {totalSessions} sesiones
          </span>
          <span className="font-medium text-teal-600">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
