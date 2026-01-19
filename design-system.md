# 🎨 BABY SPA - DESIGN SYSTEM

## Guía Oficial de Estilos para Claude Code

**Última actualización:** Enero 2026  
**Versión:** 2.0

---

## 📋 ÍNDICE

1. [Filosofía de Diseño](#1-filosofía-de-diseño)
2. [Paleta de Colores](#2-paleta-de-colores)
3. [Tipografía](#3-tipografía)
4. [Componentes UI](#4-componentes-ui)
5. [Animaciones y Transiciones](#5-animaciones-y-transiciones)
6. [Layouts y Espaciado](#6-layouts-y-espaciado)
7. [Responsive Design](#7-responsive-design)
8. [Ejemplos de Código](#8-ejemplos-de-código)

---

# 1. FILOSOFÍA DE DISEÑO

## 1.1 Principios Clave

```
🌊 TEMA ACUÁTICO
├── Colores que evocan agua y calma
├── Formas fluidas y redondeadas
├── Animaciones suaves como olas
└── Sensación de spa relajante

✨ GLASSMORPHISM
├── Fondos semi-transparentes (bg-white/70)
├── Backdrop blur para profundidad
├── Bordes sutiles (border-white/50)
└── Sombras coloridas suaves

🍼 AMIGABLE PARA BEBÉS
├── Colores pasteles y cálidos
├── Íconos y emojis amigables
├── Bordes muy redondeados (no sharp)
└── Diseño limpio y no abrumador

💫 MICRO-INTERACCIONES
├── Hover con elevación sutil
├── Transiciones suaves (300ms)
├── Feedback visual inmediato
└── Toggle con emojis (🌊/💤)
```

## 1.2 NO HACER ❌

```
❌ Esquinas puntiagudas (usar rounded-xl mínimo)
❌ Colores muy saturados o agresivos
❌ Animaciones excesivas o que distraigan
❌ Sombras duras (usar sombras suaves con color)
❌ Fondos completamente opacos en cards
❌ Texto pequeño difícil de leer
❌ Interfaces sobrecargadas
```

---

# 2. PALETA DE COLORES

## 2.1 Colores Principales (tailwind.config.js)

```javascript
colors: {
  // PRIMARY - Turquesa/Teal (tema agua)
  primary: {
    50:  '#f0fdfd',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',  // ← Principal
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  
  // SECONDARY - Cyan/Azul cielo
  secondary: {
    50:  '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',  // ← Principal
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },
  
  // ACCENT - Ámbar/Dorado (calidez)
  accent: {
    50:  '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',  // ← Principal
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
}
```

## 2.2 Uso de Colores

```
FONDOS:
├── Página: bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50
├── Cards: bg-white/70 backdrop-blur-sm
├── Cards destacadas: bg-gradient-to-br from-teal-500 to-cyan-500
├── Alertas: bg-gradient-to-br from-amber-50 to-orange-50
└── Modales: bg-white/95 backdrop-blur-md

TEXTOS:
├── Principal: text-gray-800
├── Secundario: text-gray-600
├── Terciario: text-gray-500
├── Sobre gradiente: text-white
├── Acciones: text-teal-600
└── Errores: text-red-600

BORDES:
├── Cards: border border-white/50
├── Inputs: border-2 border-gray-200
├── Focus: border-teal-500
├── Alertas: border-2 border-amber-200/50
└── Errores: border-red-300

SOMBRAS:
├── Cards: shadow-lg shadow-gray-100/50
├── Cards hover: shadow-xl shadow-teal-100/50
├── Botones primary: shadow-lg shadow-teal-200
├── Botones accent: shadow-lg shadow-amber-200
└── Inputs focus: ring-4 ring-teal-500/20
```

---

# 3. TIPOGRAFÍA

## 3.1 Fuentes

```css
/* Importar en globals.css */
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');

/* tailwind.config.js */
fontFamily: {
  sans: ['Inter', 'sans-serif'],
  heading: ['Nunito', 'sans-serif'],
}
```

## 3.2 Escalas de Texto

```
HEADINGS (font-heading):
├── h1: text-3xl md:text-4xl font-bold
├── h2: text-2xl md:text-3xl font-bold
├── h3: text-xl font-semibold
├── h4: text-lg font-semibold
└── h5: text-base font-semibold

BODY (font-sans):
├── Large: text-lg
├── Normal: text-base
├── Small: text-sm
├── XSmall: text-xs
└── Labels: text-sm font-medium text-gray-700
```

---

# 4. COMPONENTES UI

## 4.1 Botones

```jsx
// PRIMARY - Acción principal
<button className="
  px-6 py-3 
  bg-gradient-to-r from-teal-500 to-cyan-500 
  hover:from-teal-600 hover:to-cyan-600 
  text-white 
  rounded-2xl 
  font-medium 
  shadow-lg shadow-teal-200 
  transition-all duration-300 
  hover:shadow-xl hover:-translate-y-0.5 
  active:translate-y-0
">
  Guardar Cambios
</button>

// SECONDARY - Acción secundaria
<button className="
  px-6 py-3 
  bg-teal-50 hover:bg-teal-100 
  text-teal-700 
  rounded-2xl 
  font-medium 
  border-2 border-teal-200 
  transition-all duration-300
">
  Cancelar
</button>

// OUTLINE - Alternativa
<button className="
  px-6 py-3 
  bg-transparent hover:bg-teal-50 
  text-teal-600 
  rounded-2xl 
  font-medium 
  border-2 border-teal-500 
  transition-all duration-300
">
  Ver Detalles
</button>

// ACCENT - Destacado/Venta
<button className="
  px-6 py-3 
  bg-gradient-to-r from-amber-400 to-orange-400 
  hover:from-amber-500 hover:to-orange-500 
  text-white 
  rounded-2xl 
  font-medium 
  shadow-lg shadow-amber-200 
  transition-all duration-300 
  hover:shadow-xl
">
  ⭐ Vender Paquete
</button>

// DANGER - Eliminar
<button className="
  px-6 py-3 
  bg-gradient-to-r from-red-500 to-rose-500 
  hover:from-red-600 hover:to-rose-600 
  text-white 
  rounded-2xl 
  font-medium 
  shadow-lg shadow-red-200 
  transition-all duration-300
">
  🗑️ Eliminar
</button>

// ICON BUTTON
<button className="
  w-12 h-12 
  bg-white hover:bg-gray-50 
  rounded-xl 
  flex items-center justify-center 
  shadow-md hover:shadow-lg 
  transition-all duration-300 
  text-gray-600 hover:text-teal-600
">
  <PlusIcon className="w-5 h-5" />
</button>

// DISABLED
<button className="
  px-6 py-3 
  bg-gradient-to-r from-teal-500 to-cyan-500 
  text-white 
  rounded-2xl 
  font-medium 
  opacity-50 
  cursor-not-allowed
" disabled>
  Guardando...
</button>
```

## 4.2 Cards

```jsx
// CARD ESTÁNDAR (Glassmorphism)
<div className="
  bg-white/70 
  backdrop-blur-sm 
  rounded-3xl 
  p-6 
  shadow-lg shadow-gray-100/50 
  border border-white/50 
  transition-all duration-300 
  hover:shadow-xl hover:shadow-teal-100/50 
  hover:-translate-y-1
">
  {/* Contenido */}
</div>

// CARD GRADIENTE (Destacada)
<div className="
  bg-gradient-to-br from-teal-500 to-cyan-500 
  rounded-3xl 
  p-6 
  shadow-xl shadow-teal-200/50 
  text-white 
  transition-all duration-300 
  hover:-translate-y-1
">
  {/* Contenido */}
</div>

// CARD ALERTA/NOTIFICACIÓN
<div className="
  bg-gradient-to-br from-amber-50 to-orange-50 
  rounded-3xl 
  p-6 
  border-2 border-amber-200/50 
  transition-all duration-300 
  hover:shadow-xl hover:shadow-amber-100/50
">
  {/* Contenido */}
</div>

// CARD BEBÉ (Perfil)
<div className="
  bg-white/70 
  backdrop-blur-sm 
  rounded-3xl 
  p-6 
  shadow-lg 
  border border-white/50
">
  <div className="flex items-start gap-4">
    <div className="
      w-16 h-16 
      bg-gradient-to-br from-amber-200 to-orange-200 
      rounded-2xl 
      flex items-center justify-center 
      text-3xl 
      shadow-md
    ">
      👶
    </div>
    <div className="flex-1">
      <h3 className="text-lg font-semibold text-gray-800">Mateo Pérez</h3>
      <p className="text-teal-600 text-sm font-medium">8 meses</p>
      <div className="flex gap-2 mt-2">
        <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
          Paquete 12
        </span>
        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
          5 restantes
        </span>
      </div>
    </div>
  </div>
</div>

// CARD ESTADÍSTICA
<div className="
  bg-white/70 
  backdrop-blur-sm 
  rounded-2xl 
  p-4 
  shadow-lg 
  border border-white/50 
  transition-all duration-300 
  hover:shadow-xl hover:-translate-y-1
">
  <div className="flex items-center gap-2 mb-2">
    <span className="text-xl">📅</span>
    <span className="text-xs text-gray-500 font-medium">Sesiones Hoy</span>
  </div>
  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500">
    12
  </div>
  <p className="text-sm text-gray-500 mt-1">+3 vs ayer</p>
</div>
```

## 4.3 Inputs

```jsx
// INPUT TEXTO
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Nombre del bebé
  </label>
  <input 
    type="text" 
    placeholder="Ej: Mateo"
    className="
      w-full 
      px-4 py-3 
      bg-white 
      rounded-2xl 
      border-2 border-gray-200 
      focus:border-teal-500 
      focus:ring-4 focus:ring-teal-500/20 
      outline-none 
      transition-all duration-300
    "
  />
</div>

// INPUT CON ICONO
<div className="relative">
  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
    🔍
  </span>
  <input 
    type="text" 
    placeholder="Buscar bebé..."
    className="
      w-full 
      pl-12 pr-4 py-3 
      bg-white 
      rounded-2xl 
      border-2 border-gray-200 
      focus:border-teal-500 
      focus:ring-4 focus:ring-teal-500/20 
      outline-none 
      transition-all duration-300
    "
  />
</div>

// INPUT ERROR
<div>
  <input 
    type="email" 
    className="
      w-full 
      px-4 py-3 
      bg-white 
      rounded-2xl 
      border-2 border-red-300 
      focus:border-red-500 
      focus:ring-4 focus:ring-red-500/20 
      outline-none
    "
  />
  <p className="mt-2 text-sm text-red-600">
    Por favor ingresa un email válido
  </p>
</div>

// SELECT
<select className="
  w-full 
  px-4 py-3 
  bg-white 
  rounded-2xl 
  border-2 border-gray-200 
  focus:border-teal-500 
  focus:ring-4 focus:ring-teal-500/20 
  outline-none 
  transition-all duration-300 
  cursor-pointer
  appearance-none
">
  <option>Seleccionar paquete...</option>
  <option>4 sesiones - Bs. 280</option>
  <option>8 sesiones - Bs. 520</option>
</select>

// TEXTAREA
<textarea 
  rows={4}
  placeholder="Notas de la sesión..."
  className="
    w-full 
    px-4 py-3 
    bg-white 
    rounded-2xl 
    border-2 border-gray-200 
    focus:border-teal-500 
    focus:ring-4 focus:ring-teal-500/20 
    outline-none 
    transition-all duration-300 
    resize-none
  "
/>

// TOGGLE SWITCH (con emojis)
<button
  onClick={() => setEnabled(!enabled)}
  className={`
    relative w-14 h-8 
    rounded-full 
    transition-colors duration-300 
    ${enabled 
      ? 'bg-gradient-to-r from-teal-400 to-cyan-400' 
      : 'bg-gray-200'
    }
  `}
>
  <div className={`
    absolute top-1 
    w-6 h-6 
    bg-white 
    rounded-full 
    shadow-md 
    transition-all duration-300 
    flex items-center justify-center 
    text-sm
    ${enabled ? 'left-7' : 'left-1'}
  `}>
    {enabled ? '🌊' : '💤'}
  </div>
</button>
```

## 4.4 Badges

```jsx
// ESTADOS DE CITA
<span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
  ⏳ Pendiente
</span>
<span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
  🔄 En Progreso
</span>
<span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
  ✓ Completada
</span>
<span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
  ✗ Cancelada
</span>
<span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
  ⊘ No Show
</span>

// PAQUETES
<span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
  🌱 Básico
</span>
<span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium">
  💎 Premium
</span>
<span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
  👑 VIP
</span>

// ROLES
<span className="px-3 py-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-full text-sm font-medium">
  👤 Admin
</span>
<span className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-medium">
  🏢 Recepción
</span>
<span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium">
  💆 Terapeuta
</span>

// PAÍS
<span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium border border-red-200">
  🇧🇴 Bolivia
</span>
<span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium border border-green-200">
  🇧🇷 Brasil
</span>

// CON CONTADOR
<div className="relative">
  <button className="w-10 h-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center">
    🔔
  </button>
  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
    3
  </span>
</div>
```

## 4.5 Alerts

```jsx
// SUCCESS
<div className="
  bg-green-50 
  border-2 border-green-200 
  rounded-2xl 
  p-4 
  flex items-start gap-4
">
  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
    ✓
  </div>
  <div className="flex-1">
    <h4 className="font-semibold text-green-800">¡Éxito!</h4>
    <p className="text-sm text-green-700">La cita ha sido agendada correctamente.</p>
  </div>
  <button className="text-green-500 hover:text-green-700">✕</button>
</div>

// WARNING
<div className="
  bg-amber-50 
  border-2 border-amber-200 
  rounded-2xl 
  p-4 
  flex items-start gap-4
">
  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
    ⚠️
  </div>
  <div className="flex-1">
    <h4 className="font-semibold text-amber-800">Advertencia</h4>
    <p className="text-sm text-amber-700">El paquete tiene solo 2 sesiones restantes.</p>
  </div>
</div>

// ERROR
<div className="
  bg-red-50 
  border-2 border-red-200 
  rounded-2xl 
  p-4 
  flex items-start gap-4
">
  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
    ✗
  </div>
  <div className="flex-1">
    <h4 className="font-semibold text-red-800">Error</h4>
    <p className="text-sm text-red-700">No se pudo procesar el pago.</p>
  </div>
</div>

// INFO
<div className="
  bg-blue-50 
  border-2 border-blue-200 
  rounded-2xl 
  p-4 
  flex items-start gap-4
">
  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
    ℹ️
  </div>
  <div className="flex-1">
    <h4 className="font-semibold text-blue-800">Información</h4>
    <p className="text-sm text-blue-700">Nueva funcionalidad disponible.</p>
  </div>
</div>

// CELEBRATION (Mesversario)
<div className="
  bg-teal-50 
  border-2 border-teal-200 
  rounded-2xl 
  p-4 
  flex items-start gap-4
">
  <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
    🎉
  </div>
  <div className="flex-1">
    <h4 className="font-semibold text-teal-800">¡Feliz Mesversario!</h4>
    <p className="text-sm text-teal-700">María García cumple 8 meses hoy.</p>
  </div>
</div>
```

---

# 5. ANIMACIONES Y TRANSICIONES

## 5.1 Transiciones Base

```css
/* globals.css */

/* Transición suave para todos los elementos interactivos */
.transition-smooth {
  @apply transition-all duration-300 ease-out;
}

/* Hover elevación */
.hover-lift {
  @apply transition-all duration-300 hover:-translate-y-1 hover:shadow-xl;
}

/* Fade in para contenido */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}

/* Slide in desde abajo */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideUp {
  animation: slideUp 0.4s ease-out;
}

/* Burbujas flotantes (fondo) */
@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(-5deg);
  }
  50% {
    transform: translateY(-15px) rotate(5deg);
  }
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}

/* Pulse suave */
@keyframes softPulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

.animate-softPulse {
  animation: softPulse 2s ease-in-out infinite;
}

/* Ondas (para fondos) */
@keyframes wave {
  0%, 100% {
    transform: translateX(-5%) scaleY(1);
  }
  50% {
    transform: translateX(5%) scaleY(1.2);
  }
}
```

## 5.2 Uso Recomendado

```
HOVER EFFECTS:
├── Cards: hover:-translate-y-1 hover:shadow-xl
├── Botones: hover:-translate-y-0.5 active:translate-y-0
├── Links: hover:text-teal-600
└── Iconos: hover:scale-110

PAGE TRANSITIONS:
├── Contenido nuevo: animate-fadeIn
├── Modales: animate-slideUp
├── Listas: stagger con delay

LOADING STATES:
├── Skeleton: animate-pulse bg-gray-200
├── Spinner: animate-spin (usar sparingly)
├── Progress: transición de width

MICRO-INTERACCIONES:
├── Toggle: transición de left + color
├── Checkbox: scale en check
├── Notifications: badge con animate-bounce
```

---

# 6. LAYOUTS Y ESPACIADO

## 6.1 Container Principal

```jsx
// Layout de página
<div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
  {/* Background bubbles */}
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-20 left-10 w-32 h-32 bg-teal-200/30 rounded-full blur-3xl animate-pulse" />
    <div className="absolute top-40 right-20 w-40 h-40 bg-cyan-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
    <div className="absolute bottom-20 left-1/3 w-36 h-36 bg-amber-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
  </div>
  
  {/* Content */}
  <div className="relative z-10">
    {children}
  </div>
</div>
```

## 6.2 Espaciado

```
PADDING:
├── Cards: p-4 (compacto) | p-6 (normal) | p-8 (amplio)
├── Secciones: py-8 md:py-12
├── Container: px-4 sm:px-6 lg:px-8
└── Entre elementos: gap-4 | gap-6

MARGIN:
├── Entre secciones: mb-8 md:mb-12
├── Entre cards: gap-4 md:gap-6
├── Títulos: mb-4 md:mb-6
└── Párrafos: mb-2

MAX-WIDTH:
├── Contenido: max-w-7xl mx-auto
├── Formularios: max-w-md
├── Cards: max-w-sm | max-w-md
└── Modales: max-w-lg
```

## 6.3 Grid System

```jsx
// Grid de cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>

// Grid de stats
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {/* Stats */}
</div>

// Layout 2 columnas
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">{/* Contenido principal */}</div>
  <div>{/* Sidebar */}</div>
</div>
```

---

# 7. RESPONSIVE DESIGN

## 7.1 Breakpoints

```
sm:  640px   (móvil grande)
md:  768px   (tablet)
lg:  1024px  (desktop)
xl:  1280px  (desktop grande)
2xl: 1536px  (pantallas muy grandes)
```

## 7.2 Patrones Responsive

```jsx
// Texto responsive
<h1 className="text-2xl md:text-3xl lg:text-4xl">

// Padding responsive
<div className="p-4 md:p-6 lg:p-8">

// Grid responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Mostrar/ocultar
<div className="hidden md:block">  {/* Solo desktop */}
<div className="md:hidden">        {/* Solo móvil */}

// Flex direction
<div className="flex flex-col md:flex-row">
```

---

# 8. EJEMPLOS DE CÓDIGO

## 8.1 Página Completa

```jsx
// app/[locale]/(admin)/dashboard/page.tsx
'use client';

import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const t = useTranslations('dashboard');

  return (
    <div className="p-4 md:p-6 lg:p-8 animate-fadeIn">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          {t('title')}
        </h1>
        <p className="text-gray-500 mt-1">
          {t('subtitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div 
            key={i}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{stat.icon}</span>
              <span className="text-xs text-gray-500 font-medium">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-cyan-500">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-white/50">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {t('todaySessions')}
          </h2>
          {/* Lista de sesiones */}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Notifications Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-6 border-2 border-amber-200/50">
            <h3 className="font-semibold text-gray-800 mb-4">
              🎂 {t('upcomingBirthdays')}
            </h3>
            {/* Lista */}
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 8.2 Formulario

```jsx
// components/babies/baby-form.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

export function BabyForm({ onSubmit }) {
  const t = useTranslations('babies');
  const [loading, setLoading] = useState(false);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('babyName')}
        </label>
        <input
          type="text"
          required
          className="w-full px-4 py-3 bg-white rounded-2xl border-2 border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 outline-none transition-all duration-300"
          placeholder={t('babyNamePlaceholder')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('birthDate')}
          </label>
          <input
            type="date"
            required
            className="w-full px-4 py-3 bg-white rounded-2xl border-2 border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 outline-none transition-all duration-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('gender')}
          </label>
          <select className="w-full px-4 py-3 bg-white rounded-2xl border-2 border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 outline-none transition-all duration-300 cursor-pointer">
            <option value="">{t('selectGender')}</option>
            <option value="MALE">{t('male')}</option>
            <option value="FEMALE">{t('female')}</option>
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          className="flex-1 px-6 py-3 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-2xl font-medium border-2 border-teal-200 transition-all duration-300"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-2xl font-medium shadow-lg shadow-teal-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('saving') : t('save')}
        </button>
      </div>
    </form>
  );
}
```

---

# ✅ CHECKLIST PARA CLAUDE CODE

Antes de implementar cualquier componente UI, verificar:

```
□ Usa rounded-2xl o rounded-3xl (nunca sharp corners)
□ Cards tienen bg-white/70 backdrop-blur-sm
□ Botones primary tienen gradiente teal-cyan
□ Hover incluye -translate-y y shadow-xl
□ Transiciones son duration-300
□ Inputs tienen focus:ring-4 focus:ring-teal-500/20
□ Badges son rounded-full con colores pastel
□ Alertas tienen ícono, título y descripción
□ Responsive: mobile-first approach
□ Espaciado consistente (gap-4, gap-6)
□ Textos usan text-gray-800/600/500
□ Acciones usan text-teal-600
```

---

**Este archivo debe estar en la raíz del proyecto como `DESIGN-SYSTEM.md`**
