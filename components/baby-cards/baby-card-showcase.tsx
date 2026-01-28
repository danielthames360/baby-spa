"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Gift, Star, Sparkles, Heart, Crown } from "lucide-react";

// ===========================================
// MOCK DATA
// ===========================================
const MOCK_REWARDS = [
  { id: "1", sessionNumber: 1, displayName: "Primera Sesión", displayIcon: "🛁", rewardType: "FREE_SERVICE" },
  { id: "2", sessionNumber: 4, displayName: "Bloques ABC", displayIcon: "🧱", rewardType: "FREE_SERVICE" },
  { id: "3", sessionNumber: 8, displayName: "Sesión de Fotos", displayIcon: "📸", rewardType: "FREE_SERVICE" },
  { id: "4", sessionNumber: 12, displayName: "Masaje Bebé", displayIcon: "💆", rewardType: "FREE_SERVICE" },
  { id: "5", sessionNumber: 16, displayName: "Hora de Juego", displayIcon: "🎮", rewardType: "FREE_SERVICE" },
  { id: "6", sessionNumber: 20, displayName: "VIP Crown", displayIcon: "👑", rewardType: "CUSTOM" },
  { id: "7", sessionNumber: 24, displayName: "Graduación", displayIcon: "🎓", rewardType: "CUSTOM" },
];

const SESSIONS_PER_ROW = 8;

// ===========================================
// 1. SUNSET GLOW (Favorito V2)
// Atardecer cálido + Glass dorado + Rayos
// ===========================================
function SunsetGlowCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTilt({ x: (y - rect.height / 2) / 16, y: (rect.width / 2 - x) / 16 });
  };

  const rewardMap = new Map(MOCK_REWARDS.map((r) => [r.sessionNumber, r]));
  const rows = Math.ceil(24 / SESSIONS_PER_ROW);

  return (
    <div className="perspective-1000">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => { setIsHovering(false); setTilt({ x: 0, y: 0 }); }}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovering ? 1.03 : 1})`,
          transition: isHovering ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
          boxShadow: isHovering 
            ? "0 25px 50px -12px rgba(251, 146, 60, 0.35), 0 0 40px rgba(251, 191, 36, 0.2)"
            : "0 20px 40px -12px rgba(251, 146, 60, 0.25)",
        }}
        className="relative overflow-hidden rounded-3xl cursor-pointer w-[340px]"
      >
        {/* Fondo atardecer */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-200 via-orange-200 to-rose-200 rounded-3xl" />

        {/* Rayos de sol */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 overflow-hidden">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-300/40 rounded-full blur-3xl" />
        </div>

        {/* Tarjeta glass */}
        <div className="relative m-2 backdrop-blur-xl bg-white/50 border border-white/60 rounded-[20px] p-5 shadow-xl">
          {/* Brillo cálido */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-100/30 to-transparent rounded-[20px]" />

          {/* Header */}
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200/50 flex items-center justify-center shadow-lg shadow-amber-200/50">
                <span className="text-2xl">🛁</span>
              </div>
              <div>
                <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider">Baby Spa</p>
                <p className="text-amber-800 font-bold text-lg">Card Premium</p>
              </div>
            </div>
            <div className="text-2xl">☀️</div>
          </div>

          {/* Grid */}
          <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-3 border border-amber-100">
            <div className="space-y-2">
              {Array.from({ length: rows }, (_, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-2">
                  {Array.from({ length: SESSIONS_PER_ROW }, (_, colIndex) => {
                    const sessionNumber = rowIndex * SESSIONS_PER_ROW + colIndex + 1;
                    if (sessionNumber > 24) return null;
                    const reward = rewardMap.get(sessionNumber);
                    return (
                      <div
                        key={sessionNumber}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                          reward
                            ? "border-rose-300 bg-gradient-to-br from-rose-100 to-pink-100 shadow-md shadow-rose-200/40"
                            : "border-amber-200/80 bg-white/80 hover:border-amber-300 hover:shadow-sm"
                        )}
                      >
                        {reward ? (
                          <span className="text-sm">{reward.displayIcon}</span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-medium">{sessionNumber}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="relative mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-amber-600">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
              <span className="font-medium">24 sesiones</span>
            </div>
            <div className="flex items-center gap-2 text-rose-500">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-rose-400 to-pink-400" />
              <span className="font-medium">{MOCK_REWARDS.length} premios</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// 2. FROSTED ROSE (Favorito V2)
// Glass rosa suave + Shimmer elegante
// ===========================================
function FrostedRoseCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTilt({ x: (y - rect.height / 2) / 18, y: (rect.width / 2 - x) / 18 });
  };

  const rewardMap = new Map(MOCK_REWARDS.map((r) => [r.sessionNumber, r]));
  const rows = Math.ceil(24 / SESSIONS_PER_ROW);

  return (
    <div className="perspective-1000">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => { setIsHovering(false); setTilt({ x: 0, y: 0 }); }}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovering ? 1.03 : 1})`,
          transition: isHovering ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
        }}
        className="relative overflow-hidden rounded-3xl cursor-pointer w-[340px]"
      >
        {/* Borde gradiente suave */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-300 via-rose-200 to-pink-300 rounded-3xl p-[2px]">
          <div className="absolute inset-[2px] bg-gradient-to-br from-rose-50 via-pink-50 to-white rounded-[22px]" />
        </div>

        {/* Shimmer al hover */}
        <div 
          className="absolute inset-0 pointer-events-none z-20 rounded-3xl"
          style={{
            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.8) 50%, transparent 60%)",
            backgroundSize: "200% 200%",
            backgroundPosition: isHovering ? "100% 100%" : "-100% -100%",
            transition: "background-position 0.8s ease",
          }}
        />

        {/* Contenido */}
        <div className="relative m-[2px] backdrop-blur-sm bg-white/60 rounded-[22px] p-5">
          {/* Decoración de pétalos */}
          <div className="absolute top-3 right-3 w-16 h-16 bg-pink-200/30 rounded-full blur-2xl" />
          <div className="absolute bottom-8 left-3 w-12 h-12 bg-rose-200/40 rounded-full blur-xl" />

          {/* Header */}
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 border border-pink-200/50 flex items-center justify-center shadow-md shadow-pink-200/30">
                <span className="text-2xl">🛁</span>
              </div>
              <div>
                <p className="text-[10px] text-rose-500 font-semibold uppercase tracking-wider">Baby Spa</p>
                <p className="text-rose-700 font-bold text-lg">Card Premium</p>
              </div>
            </div>
            <Heart className="h-6 w-6 text-pink-400 fill-pink-200" />
          </div>

          {/* Grid */}
          <div className="relative bg-white/70 backdrop-blur-sm rounded-2xl p-3 border border-pink-100">
            <div className="space-y-2">
              {Array.from({ length: rows }, (_, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-2">
                  {Array.from({ length: SESSIONS_PER_ROW }, (_, colIndex) => {
                    const sessionNumber = rowIndex * SESSIONS_PER_ROW + colIndex + 1;
                    if (sessionNumber > 24) return null;
                    const reward = rewardMap.get(sessionNumber);
                    return (
                      <div
                        key={sessionNumber}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                          reward
                            ? "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md shadow-amber-100"
                            : "border-pink-200 bg-white hover:border-pink-300 hover:shadow-sm"
                        )}
                      >
                        {reward ? (
                          <span className="text-sm">{reward.displayIcon}</span>
                        ) : (
                          <span className="text-[10px] text-pink-400 font-medium">{sessionNumber}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="relative mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-rose-500">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-pink-400 to-rose-400" />
              <span className="font-medium">24 sesiones</span>
            </div>
            <div className="flex items-center gap-2 text-amber-500">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
              <span className="font-medium">{MOCK_REWARDS.length} premios</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// 3. GLASSMORPHISM DELUXE (Favorito V1)
// Blur máximo + Blobs animados
// ===========================================
function GlassmorphismDeluxeCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTilt({ x: (y - rect.height / 2) / 20, y: (rect.width / 2 - x) / 20 });
  };

  const rewardMap = new Map(MOCK_REWARDS.map((r) => [r.sessionNumber, r]));
  const rows = Math.ceil(24 / SESSIONS_PER_ROW);

  return (
    <div className="perspective-1000">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => { setIsHovering(false); setTilt({ x: 0, y: 0 }); }}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovering ? 1.02 : 1})`,
          transition: isHovering ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
        }}
        className="relative overflow-hidden rounded-3xl cursor-pointer w-[340px]"
      >
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div 
            className="absolute -top-20 -left-20 w-40 h-40 bg-teal-400/40 rounded-full blur-3xl"
            style={{ animation: "blob 7s ease-in-out infinite" }}
          />
          <div 
            className="absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-400/40 rounded-full blur-3xl"
            style={{ animation: "blob 7s ease-in-out infinite 2s" }}
          />
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-pink-300/30 rounded-full blur-3xl"
            style={{ animation: "blob 7s ease-in-out infinite 4s" }}
          />
        </div>

        {/* Glass card */}
        <div className="relative backdrop-blur-xl bg-white/20 border border-white/40 rounded-3xl p-5 shadow-2xl">
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent rounded-3xl" />

          {/* Header */}
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/30 backdrop-blur border border-white/50 flex items-center justify-center">
                <span className="text-2xl">🛁</span>
              </div>
              <div>
                <p className="text-xs text-teal-700 font-medium">Baby Spa</p>
                <p className="text-teal-900 font-bold text-lg">Card Premium</p>
              </div>
            </div>
            <Sparkles className="h-6 w-6 text-amber-500" />
          </div>

          {/* Grid */}
          <div className="relative bg-white/30 backdrop-blur rounded-2xl p-3 border border-white/50">
            <div className="space-y-2">
              {Array.from({ length: rows }, (_, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-2">
                  {Array.from({ length: SESSIONS_PER_ROW }, (_, colIndex) => {
                    const sessionNumber = rowIndex * SESSIONS_PER_ROW + colIndex + 1;
                    if (sessionNumber > 24) return null;
                    const reward = rewardMap.get(sessionNumber);
                    return (
                      <div
                        key={sessionNumber}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all backdrop-blur-sm",
                          reward
                            ? "border-amber-400 bg-amber-100/50 shadow-lg shadow-amber-300/30"
                            : "border-white/60 bg-white/40 hover:bg-white/60"
                        )}
                      >
                        {reward ? (
                          <span className="text-sm">{reward.displayIcon}</span>
                        ) : (
                          <span className="text-[10px] text-teal-600 font-medium">{sessionNumber}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="relative mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-teal-700">
              <div className="h-2 w-2 rounded-full bg-teal-500" />
              <span>24 sesiones</span>
            </div>
            <div className="flex items-center gap-2 text-amber-600">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span>{MOCK_REWARDS.length} premios</span>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(20px, -20px) scale(1.1); }
            66% { transform: translate(-10px, 10px) scale(0.9); }
          }
        `}</style>
      </div>
    </div>
  );
}

// ===========================================
// 4. ORIGINAL MEJORADA (Favorito V1)
// Baby Spa Pastel Teal + Shimmer
// ===========================================
function OriginalImprovedCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTilt({ x: (y - rect.height / 2) / 15, y: (rect.width / 2 - x) / 15 });
  };

  const rewardMap = new Map(MOCK_REWARDS.map((r) => [r.sessionNumber, r]));
  const rows = Math.ceil(24 / SESSIONS_PER_ROW);

  return (
    <div className="perspective-1000">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => { setIsHovering(false); setTilt({ x: 0, y: 0 }); }}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovering ? 1.02 : 1})`,
          transition: isHovering ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
        }}
        className={cn(
          "relative overflow-hidden rounded-3xl cursor-pointer w-[340px]",
          "bg-gradient-to-br from-teal-400 via-cyan-300 to-teal-300",
          "p-[3px]",
          "shadow-xl shadow-teal-200/50"
        )}
      >
        {/* Shimmer effect */}
        <div 
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%)",
            backgroundSize: "200% 200%",
            animation: isHovering ? "shimmer 1.5s ease-in-out infinite" : "none",
          }}
        />

        {/* Inner card */}
        <div className="relative rounded-[21px] bg-gradient-to-br from-white via-cyan-50/80 to-teal-50 p-5">
          {/* Decorative bubbles */}
          <div className="absolute top-2 right-2 h-20 w-20 rounded-full bg-gradient-to-br from-cyan-200/40 to-transparent blur-2xl" />
          <div className="absolute bottom-10 left-2 h-16 w-16 rounded-full bg-gradient-to-br from-teal-200/40 to-transparent blur-2xl" />
          <div className="absolute top-1/2 right-1/4 h-12 w-12 rounded-full bg-gradient-to-br from-pink-100/30 to-transparent blur-xl" />

          {/* Header */}
          <div className="relative mb-4 flex items-center justify-between gap-3">
            <div className="relative h-11 w-11 shrink-0 rounded-xl overflow-hidden shadow-md shadow-teal-200/50 bg-white p-1 flex items-center justify-center">
              <span className="text-2xl">🛁</span>
            </div>
            <h4 className="flex-1 text-center font-bold text-lg bg-gradient-to-r from-teal-600 via-cyan-500 to-teal-600 bg-clip-text text-transparent truncate">
              Baby Spa Card Premium
            </h4>
            <div className="shrink-0 text-amber-400">
              <span className="text-xl">⭐</span>
            </div>
          </div>

          {/* Grid */}
          <div className="rounded-2xl backdrop-blur-sm p-3 border border-teal-100 bg-white/60 shadow-inner shadow-teal-50">
            <div className="space-y-2">
              {Array.from({ length: rows }, (_, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-2">
                  {Array.from({ length: SESSIONS_PER_ROW }, (_, colIndex) => {
                    const sessionNumber = rowIndex * SESSIONS_PER_ROW + colIndex + 1;
                    if (sessionNumber > 24) return null;
                    const reward = rewardMap.get(sessionNumber);
                    return (
                      <div
                        key={sessionNumber}
                        className={cn(
                          "relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                          reward
                            ? "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 shadow-amber-200/50"
                            : "border-teal-200 bg-white hover:border-teal-300"
                        )}
                      >
                        {reward ? (
                          <span className="text-sm">{reward.displayIcon}</span>
                        ) : (
                          <span className="text-[10px] font-medium text-teal-400">{sessionNumber}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-teal-500">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400" />
              <span>24 sesiones</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-500">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-300 to-orange-300" />
              <span>{MOCK_REWARDS.length} premios</span>
            </div>
          </div>

          {/* Rewards legend */}
          <div className="mt-3 pt-3 border-t border-teal-100">
            <p className="text-[10px] uppercase tracking-wider mb-2 text-teal-500">Premios</p>
            <div className="flex flex-wrap gap-2">
              {MOCK_REWARDS.slice(0, 4).map((reward, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-600 px-2 py-1 text-[10px]"
                >
                  <span>{reward.displayIcon}</span>
                  <span>#{reward.sessionNumber}</span>
                </div>
              ))}
              {MOCK_REWARDS.length > 4 && (
                <span className="text-[10px] self-center text-teal-500">
                  +{MOCK_REWARDS.length - 4} más
                </span>
              )}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-300 via-cyan-300 to-teal-300 rounded-b-[21px]" />
        </div>

        <style jsx>{`
          @keyframes shimmer {
            0% { background-position: -200% -200%; }
            100% { background-position: 200% 200%; }
          }
        `}</style>
      </div>
    </div>
  );
}

// ===========================================
// 5. NUEVO: CRYSTAL AURORA
// Mezcla de Glassmorphism + Colores aurora
// ===========================================
function CrystalAuroraCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTilt({ x: (y - rect.height / 2) / 16, y: (rect.width / 2 - x) / 16 });
  };

  const rewardMap = new Map(MOCK_REWARDS.map((r) => [r.sessionNumber, r]));
  const rows = Math.ceil(24 / SESSIONS_PER_ROW);

  return (
    <div className="perspective-1000">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => { setIsHovering(false); setTilt({ x: 0, y: 0 }); }}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovering ? 1.03 : 1})`,
          transition: isHovering ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
        }}
        className="relative overflow-hidden rounded-3xl cursor-pointer w-[340px]"
      >
        {/* Aurora background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-300 via-cyan-200 via-purple-200 to-pink-200 rounded-3xl" />
        
        {/* Moving aurora lights */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div 
            className="absolute top-0 left-0 w-full h-full opacity-60"
            style={{
              background: "linear-gradient(45deg, transparent 30%, rgba(139, 92, 246, 0.3) 50%, transparent 70%)",
              animation: isHovering ? "aurora 3s ease-in-out infinite" : "none",
            }}
          />
          <div 
            className="absolute top-0 left-0 w-full h-full opacity-40"
            style={{
              background: "linear-gradient(-45deg, transparent 30%, rgba(6, 182, 212, 0.4) 50%, transparent 70%)",
              animation: isHovering ? "aurora 4s ease-in-out infinite reverse" : "none",
            }}
          />
        </div>

        {/* Glass card */}
        <div className="relative m-2 backdrop-blur-xl bg-white/40 border border-white/60 rounded-[20px] p-5 shadow-2xl">
          {/* Prismatic shine */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-purple-100/20 rounded-[20px]" />

          {/* Header */}
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/50 backdrop-blur border border-white/70 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🛁</span>
              </div>
              <div>
                <p className="text-[10px] text-purple-600 font-semibold uppercase tracking-wider">Baby Spa</p>
                <p className="text-slate-700 font-bold text-lg">Card Premium</p>
              </div>
            </div>
            <div className="relative">
              <Star className="h-6 w-6 text-amber-400 fill-amber-300" />
              <div className="absolute inset-0 animate-ping opacity-30">
                <Star className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="relative bg-white/50 backdrop-blur-sm rounded-2xl p-3 border border-white/60">
            <div className="space-y-2">
              {Array.from({ length: rows }, (_, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-2">
                  {Array.from({ length: SESSIONS_PER_ROW }, (_, colIndex) => {
                    const sessionNumber = rowIndex * SESSIONS_PER_ROW + colIndex + 1;
                    if (sessionNumber > 24) return null;
                    const reward = rewardMap.get(sessionNumber);
                    return (
                      <div
                        key={sessionNumber}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                          reward
                            ? "border-amber-300 bg-gradient-to-br from-amber-100/80 to-orange-100/80 shadow-md shadow-amber-200/40"
                            : "border-purple-200/60 bg-white/60 hover:border-purple-300 hover:bg-white/80"
                        )}
                      >
                        {reward ? (
                          <span className="text-sm">{reward.displayIcon}</span>
                        ) : (
                          <span className="text-[10px] text-purple-500 font-medium">{sessionNumber}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="relative mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-purple-600">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400" />
              <span className="font-medium">24 sesiones</span>
            </div>
            <div className="flex items-center gap-2 text-amber-500">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
              <span className="font-medium">{MOCK_REWARDS.length} premios</span>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes aurora {
            0%, 100% { transform: translateX(-30%) translateY(-30%); }
            50% { transform: translateX(30%) translateY(30%); }
          }
        `}</style>
      </div>
    </div>
  );
}

// ===========================================
// 6. NUEVO: DREAMY CLOUDS
// Nubes suaves + Pastel celeste + Estrellas
// ===========================================
function DreamyCloudsCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTilt({ x: (y - rect.height / 2) / 18, y: (rect.width / 2 - x) / 18 });
  };

  const rewardMap = new Map(MOCK_REWARDS.map((r) => [r.sessionNumber, r]));
  const rows = Math.ceil(24 / SESSIONS_PER_ROW);

  return (
    <div className="perspective-1000">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => { setIsHovering(false); setTilt({ x: 0, y: 0 }); }}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${isHovering ? 1.03 : 1})`,
          transition: isHovering ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
        }}
        className="relative overflow-hidden rounded-3xl cursor-pointer w-[340px]"
      >
        {/* Sky gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-200 via-blue-100 to-indigo-100 rounded-3xl" />
        
        {/* Clouds */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl">
          <div 
            className="absolute top-4 -left-8 w-24 h-12 bg-white/70 rounded-full blur-md"
            style={{ animation: isHovering ? "cloud 8s ease-in-out infinite" : "none" }}
          />
          <div 
            className="absolute top-8 left-4 w-16 h-8 bg-white/60 rounded-full blur-md"
            style={{ animation: isHovering ? "cloud 10s ease-in-out infinite 1s" : "none" }}
          />
          <div 
            className="absolute bottom-16 -right-4 w-20 h-10 bg-white/50 rounded-full blur-md"
            style={{ animation: isHovering ? "cloud 9s ease-in-out infinite 2s reverse" : "none" }}
          />
        </div>

        {/* Stars */}
        <div className="absolute top-6 right-8 text-amber-300 animate-pulse">✦</div>
        <div className="absolute top-12 right-16 text-amber-200 animate-pulse" style={{ animationDelay: "0.5s" }}>✦</div>
        <div className="absolute bottom-20 left-8 text-amber-300/60 animate-pulse" style={{ animationDelay: "1s" }}>✦</div>

        {/* Glass card */}
        <div className="relative m-2 backdrop-blur-lg bg-white/50 border border-white/70 rounded-[20px] p-5 shadow-xl shadow-sky-200/30">
          {/* Soft glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-[20px]" />

          {/* Header */}
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100 border border-sky-200/50 flex items-center justify-center shadow-lg shadow-sky-200/40">
                <span className="text-2xl">🛁</span>
              </div>
              <div>
                <p className="text-[10px] text-sky-600 font-semibold uppercase tracking-wider">Baby Spa</p>
                <p className="text-sky-800 font-bold text-lg">Card Premium</p>
              </div>
            </div>
            <div className="text-2xl">🌙</div>
          </div>

          {/* Grid */}
          <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-3 border border-sky-100">
            <div className="space-y-2">
              {Array.from({ length: rows }, (_, rowIndex) => (
                <div key={rowIndex} className="flex justify-center gap-2">
                  {Array.from({ length: SESSIONS_PER_ROW }, (_, colIndex) => {
                    const sessionNumber = rowIndex * SESSIONS_PER_ROW + colIndex + 1;
                    if (sessionNumber > 24) return null;
                    const reward = rewardMap.get(sessionNumber);
                    return (
                      <div
                        key={sessionNumber}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all",
                          reward
                            ? "border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-md shadow-amber-200/40"
                            : "border-sky-200 bg-white/80 hover:border-sky-300 hover:shadow-sm"
                        )}
                      >
                        {reward ? (
                          <span className="text-sm">{reward.displayIcon}</span>
                        ) : (
                          <span className="text-[10px] text-sky-500 font-medium">{sessionNumber}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="relative mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-sky-600">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-sky-400 to-blue-400" />
              <span className="font-medium">24 sesiones</span>
            </div>
            <div className="flex items-center gap-2 text-amber-500">
              <div className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400" />
              <span className="font-medium">{MOCK_REWARDS.length} premios</span>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes cloud {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(20px); }
          }
        `}</style>
      </div>
    </div>
  );
}

// ===========================================
// SHOWCASE FINAL
// ===========================================
export default function BabyCardShowcaseFinal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-teal-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          🎴 Baby Card - Showcase Final
        </h1>
        <p className="text-center text-slate-500 mb-2">
          6 diseños finalistas para el equipo
        </p>
        <p className="text-center text-slate-400 text-sm mb-12">
          Mueve el mouse sobre cada tarjeta para ver los efectos ✨
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 justify-items-center">
          {/* Card 1 */}
          <div className="space-y-4">
            <SunsetGlowCard />
            <div className="text-center">
              <p className="text-lg font-bold text-slate-700">1. Sunset Glow ☀️</p>
              <p className="text-sm text-slate-400">Atardecer cálido + Sombra dinámica</p>
              <div className="flex justify-center gap-2 mt-2">
                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">Cálido</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">Acogedor</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="space-y-4">
            <FrostedRoseCard />
            <div className="text-center">
              <p className="text-lg font-bold text-slate-700">2. Frosted Rose 🌸</p>
              <p className="text-sm text-slate-400">Rosa suave + Shimmer elegante</p>
              <div className="flex justify-center gap-2 mt-2">
                <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">Delicado</span>
                <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs rounded-full">Femenino</span>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="space-y-4">
            <GlassmorphismDeluxeCard />
            <div className="text-center">
              <p className="text-lg font-bold text-slate-700">3. Glassmorphism Deluxe 💎</p>
              <p className="text-sm text-slate-400">Blur máximo + Blobs animados</p>
              <div className="flex justify-center gap-2 mt-2">
                <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">Moderno</span>
                <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded-full">Trendy</span>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="space-y-4">
            <OriginalImprovedCard />
            <div className="text-center">
              <p className="text-lg font-bold text-slate-700">4. Original Mejorada 🛁</p>
              <p className="text-sm text-slate-400">Baby Spa Teal + Shimmer + Burbujas</p>
              <div className="flex justify-center gap-2 mt-2">
                <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">Marca</span>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">Confiable</span>
              </div>
            </div>
          </div>

          {/* Card 5 */}
          <div className="space-y-4">
            <CrystalAuroraCard />
            <div className="text-center">
              <p className="text-lg font-bold text-slate-700">5. Crystal Aurora ✨</p>
              <p className="text-sm text-slate-400">Colores aurora + Luces móviles</p>
              <div className="flex justify-center gap-2 mt-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">Mágico</span>
                <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded-full">Premium</span>
              </div>
            </div>
          </div>

          {/* Card 6 */}
          <div className="space-y-4">
            <DreamyCloudsCard />
            <div className="text-center">
              <p className="text-lg font-bold text-slate-700">6. Dreamy Clouds ☁️</p>
              <p className="text-sm text-slate-400">Nubes suaves + Cielo pastel</p>
              <div className="flex justify-center gap-2 mt-2">
                <span className="px-2 py-1 bg-sky-100 text-sky-700 text-xs rounded-full">Suave</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">Soñador</span>
              </div>
            </div>
          </div>
        </div>

        {/* Voting Section */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg max-w-4xl mx-auto">
          <h2 className="font-bold text-xl mb-6 text-slate-700 text-center">📋 Guía de Votación</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-slate-600 mb-3">Criterios a considerar:</h3>
              <ul className="space-y-2 text-sm text-slate-500">
                <li className="flex items-center gap-2">
                  <span className="text-teal-500">✓</span>
                  ¿Refleja la identidad de Baby Spa?
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal-500">✓</span>
                  ¿Es atractivo para los padres?
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal-500">✓</span>
                  ¿Los efectos son agradables o distraen?
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal-500">✓</span>
                  ¿Se ven claros los premios?
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-teal-500">✓</span>
                  ¿Transmite calidad y confianza?
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-600 mb-3">Recomendación por contexto:</h3>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><strong className="text-amber-600">Cálido/Acogedor:</strong> Sunset Glow</li>
                <li><strong className="text-pink-600">Delicado/Femenino:</strong> Frosted Rose</li>
                <li><strong className="text-teal-600">Moderno/Tech:</strong> Glassmorphism Deluxe</li>
                <li><strong className="text-cyan-600">Marca/Original:</strong> Original Mejorada</li>
                <li><strong className="text-purple-600">Premium/Lujoso:</strong> Crystal Aurora</li>
                <li><strong className="text-sky-600">Suave/Infantil:</strong> Dreamy Clouds</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}