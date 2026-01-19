# CLAUDE.md - Baby Spa Project Instructions

## 🎯 Project Overview

This is **Baby Spa** - A management system for a baby hydrotherapy spa operating in Bolivia and Brazil.

**Key Points:**
- Baby hydrotherapy and early stimulation center
- Babies aged 0-36 months
- Two separate databases (Bolivia & Brazil)
- Bilingual (Spanish & Portuguese-BR)

**ALWAYS read `BABY-SPA-SPEC.md` for complete specifications.**

---

## 🛠️ Tech Stack

```
Framework:    Next.js 14 (App Router)
Language:     TypeScript (strict mode)
Database:     PostgreSQL (2 separate DBs)
ORM:          Prisma
Auth:         NextAuth.js
UI:           shadcn/ui + TailwindCSS
i18n:         next-intl
```

---

## 📁 Project Structure

```
app/
├── [locale]/           # es | pt-BR
│   ├── (admin)/        # Admin & Reception routes
│   ├── (therapist)/    # Therapist routes
│   ├── (portal)/       # Parent portal routes
│   └── login/
├── registro/[token]/   # Public registration form
└── api/                # API routes

components/
├── ui/                 # shadcn/ui components
├── layout/             # Layouts, sidebars, headers
├── [feature]/          # Feature-specific components

lib/
├── db.ts               # Prisma client
├── auth.ts             # NextAuth config
├── utils.ts            # Helper functions
├── validations.ts      # Zod schemas
└── services/           # Business logic

messages/
├── es.json             # Spanish translations
└── pt-BR.json          # Portuguese translations
```

---

## 🎨 Design System

### Visual Identity

Baby Spa usa un estilo visual **suave, acuático y delicado** apropiado para una app de bebés:
- Colores agua/turquesa como tema principal
- Efectos glassmorphism (cristal esmerilado)
- Gradientes suaves
- Burbujas flotantes animadas
- Esquinas muy redondeadas
- Sombras sutiles con tonos de color

---

### 🎨 Color Palette

```javascript
// Colores definidos en globals.css
colors: {
  // Primary - Turquoise/Teal (tema agua)
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
  // Secondary - Cyan/Blue
  secondary: {
    50:  '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',  // ← Principal
    600: '#0284c7',
    700: '#0369a1',
  },
  // Accent - Warm yellow/gold (para detalles)
  accent: {
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',  // ← Principal
    500: '#f59e0b',
  },
  // Status colors
  success: 'emerald-500',
  warning: 'amber-500',
  error: 'rose-500',
  info: 'sky-500',
}
```

---

### 📐 Typography

```css
/* Headings - Nunito (suave, amigable) */
font-family: var(--font-nunito), 'Nunito', sans-serif;

/* Body text - Geist Sans (moderno, legible) */
font-family: var(--font-geist-sans), sans-serif;

/* Monospace - Geist Mono */
font-family: var(--font-geist-mono), monospace;
```

**Clases para headings:**
```html
<h1 class="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-4xl font-bold text-transparent">
<h2 class="text-2xl font-bold text-gray-800">
<h3 class="text-xl font-semibold text-gray-700">
<p class="text-gray-600">  <!-- texto normal -->
<p class="text-gray-500">  <!-- texto secundario -->
```

---

### 🖼️ Backgrounds & Layouts

**Background gradient principal (usar en todos los layouts):**
```html
<div class="bg-gradient-to-br from-cyan-50 via-teal-50 to-white">
```

**Decorative blur circles (usar en layouts):**
```html
<div class="pointer-events-none fixed inset-0 overflow-hidden">
  <div class="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl" />
  <div class="absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-cyan-200/25 blur-3xl" />
  <div class="absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-teal-100/40 blur-2xl" />
  <div class="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-cyan-100/30 blur-3xl" />
</div>
```

**Floating bubbles (importar componente):**
```tsx
import { FloatingBubbles } from "@/components/ui/floating-bubbles";

// En el layout, después de los blur circles:
<FloatingBubbles count={15} />
```

---

### 🃏 Cards (Glassmorphism)

**Card estándar con glassmorphism:**
```html
<div class="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
```

**Card hover effect:**
```html
<div class="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/20">
```

**Card con gradiente de borde:**
```html
<div class="rounded-2xl border border-teal-100 bg-white/80 p-6 shadow-lg backdrop-blur-md">
```

**Utility classes disponibles:**
```css
.glass-card {
  background-color: rgb(255 255 255 / 0.7);
  backdrop-filter: blur(4px);
  border-radius: 1.5rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  border: 1px solid rgb(255 255 255 / 0.5);
}

.glass-card-hover { /* Igual + hover effects */ }
```

---

### 🔘 Buttons

**Primary button (gradiente):**
```html
<button class="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600 hover:shadow-xl hover:shadow-teal-400/40">
```

**Secondary button (outline):**
```html
<button class="h-10 rounded-xl border-2 border-teal-200 px-4 font-medium text-teal-600 transition-all hover:bg-teal-50 hover:text-teal-700">
```

**Ghost button:**
```html
<button class="rounded-xl px-4 py-2 text-gray-600 transition-all hover:bg-teal-50 hover:text-teal-700">
```

**Destructive button:**
```html
<button class="rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-2 font-medium text-white shadow-md shadow-rose-200 transition-all hover:from-rose-600 hover:to-pink-600">
```

**Icon button:**
```html
<button class="flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:bg-teal-50">
  <Icon class="h-5 w-5 text-teal-600" />
</button>
```

---

### 📝 Inputs

**Input estándar:**
```html
<input class="h-12 w-full rounded-xl border-2 border-teal-100 px-4 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20 focus:outline-none" />
```

**Input con icono:**
```html
<div class="relative">
  <Icon class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-500" />
  <input class="h-12 w-full rounded-xl border-2 border-teal-100 pl-12 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20" />
</div>
```

**Select:**
```html
<select class="h-12 w-full rounded-xl border-2 border-teal-100 px-4 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20">
```

---

### 🏷️ Badges & Tags

**Badge success:**
```html
<span class="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
```

**Badge warning:**
```html
<span class="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
```

**Badge info (teal):**
```html
<span class="inline-flex items-center rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-700">
```

**Badge con gradiente:**
```html
<span class="inline-flex items-center rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-3 py-1 text-sm font-medium text-white shadow-sm">
```

---

### 🧭 Navigation

**Nav item activo:**
```html
<a class="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-teal-200">
```

**Nav item inactivo:**
```html
<a class="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-teal-50 hover:text-teal-700">
```

**Header/Navbar glassmorphism:**
```html
<header class="sticky top-0 z-50 border-b border-white/50 bg-white/70 backdrop-blur-md">
```

**Sidebar glassmorphism:**
```html
<aside class="flex h-full flex-col border-r border-white/50 bg-white/70 backdrop-blur-md">
```

---

### 🎭 Avatars & Icons

**Avatar con ring:**
```html
<div class="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 ring-2 ring-teal-200 ring-offset-2">
  <span class="flex h-full w-full items-center justify-center text-sm font-medium text-white">AB</span>
</div>
```

**Icon container (decorativo):**
```html
<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
  <Icon class="h-6 w-6 text-teal-600" />
</div>
```

**Logo container:**
```html
<div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md shadow-teal-200">
  <Image src="/images/logoBabySpa.png" alt="Baby Spa" width={36} height={36} class="h-9 w-9 object-contain" />
</div>
```

---

### 📏 Spacing & Layout

```
Padding cards:     p-4 (sm), p-6 (md), p-8 (lg)
Gap entre items:   gap-2 (tight), gap-4 (normal), gap-6 (loose)
Margin sections:   my-6, my-8
Max-width:         max-w-4xl (content), max-w-5xl (wide), max-w-md (forms)
Border radius:     rounded-xl (cards), rounded-2xl (large cards), rounded-full (pills)
```

---

### ✨ Animations

**Clases disponibles en globals.css:**
```css
.animate-float      /* Flotar suave arriba/abajo */
.animate-fadeIn     /* Fade in con slide up */
.animate-slideUp    /* Slide up */
.animate-softPulse  /* Pulso suave de opacidad */
.hover-lift         /* Levanta en hover */
.transition-smooth  /* Transición suave 300ms */
```

**Uso de FloatingBubbles:**
```tsx
// Burbujas glassmorphism que flotan hacia arriba
import { FloatingBubbles } from "@/components/ui/floating-bubbles";

<FloatingBubbles count={15} />  // Normal
<FloatingBubbles count={20} />  // Más burbujas (login pages)
<FloatingBubbles count={12} />  // Menos burbujas (areas pequeñas)
```

---

### 🎯 Component Examples

**Stat Card:**
```html
<div class="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
  <div class="flex items-center gap-4">
    <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
      <Icon class="h-7 w-7 text-teal-600" />
    </div>
    <div>
      <p class="text-sm text-gray-500">Label</p>
      <p class="text-3xl font-bold text-gray-800">123</p>
    </div>
  </div>
</div>
```

**Empty State:**
```html
<div class="flex flex-col items-center justify-center py-12 text-center">
  <div class="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
    <Icon class="h-8 w-8 text-teal-400" />
  </div>
  <h3 class="mt-4 text-lg font-medium text-gray-600">No hay datos</h3>
  <p class="mt-1 text-sm text-gray-400">Descripción aquí</p>
</div>
```

**Login Page Structure:**
```html
<div class="flex min-h-screen flex-col bg-gradient-to-br from-cyan-50 via-teal-50 to-white">
  <!-- Background blurs -->
  <div class="pointer-events-none fixed inset-0 overflow-hidden">
    <div class="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl" />
    <!-- más circles... -->
  </div>

  <!-- Floating bubbles -->
  <FloatingBubbles count={20} />

  <!-- Content -->
  <div class="relative z-10 flex flex-1 items-center justify-center p-4">
    <!-- Card con glassmorphism -->
  </div>
</div>
```

---

### 🚫 Anti-Patterns (NO USAR)

```
❌ Colores planos sin gradientes en CTAs principales
❌ Bordes duros (usar siempre rounded-xl mínimo)
❌ Sombras negras (usar shadow-teal-xxx/xx)
❌ Backgrounds sólidos en layouts (usar gradientes + blur circles)
❌ Cards sin backdrop-blur en layouts con gradiente
❌ Hover states sin transición
❌ Colores saturados fuertes (mantener suave y delicado)
```

---

## 📝 Coding Conventions

### File Naming
```
components/babies/baby-form.tsx     ✅ kebab-case
lib/services/appointment-service.ts ✅ kebab-case
```

### Component Naming
```typescript
// PascalCase for components
export function BabyForm() {}
export function CalendarView() {}
```

### Variables & Functions
```typescript
// camelCase
const getBabyById = async (id: string) => {}
const isValidAppointment = true;
```

### Constants
```typescript
// UPPER_SNAKE_CASE
const MAX_SLOTS_PER_HOUR = 2;
const SESSION_DURATION_MINUTES = 60;
```

### Types & Interfaces
```typescript
// PascalCase, descriptive suffixes
interface BabyCreateInput {}
interface AppointmentWithBaby {}
type SessionStatus = 'PENDING' | 'COMPLETED';
```

---

## 🔐 Authentication & Authorization

### Roles
```typescript
enum UserRole {
  ADMIN      // Full access
  RECEPTION  // Calendar, appointments, payments, inventory
  THERAPIST  // Today's sessions, evaluations only
}

// Parent role is separate (portal access via code)
```

### Protected Routes
```typescript
// Always check session in API routes
const session = await getServerSession(authOptions);
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Check role for specific actions
if (session.user.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## 🗄️ Database Patterns

### Multi-tenant (2 Databases)
```typescript
// Middleware detects subdomain and sets correct DB
// bo.babyspa.online → babyspa_bolivia
// br.babyspa.online → babyspa_brazil
```

### Common Queries
```typescript
// Always include necessary relations
const baby = await prisma.baby.findUnique({
  where: { id },
  include: {
    parents: { include: { parent: true } },
    packagePurchases: { where: { isActive: true } },
  },
});

// Use transactions for related operations
await prisma.$transaction([
  prisma.appointment.update({ ... }),
  prisma.packagePurchase.update({ ... }),
]);
```

---

## 🌐 Internationalization (i18n)

### ⚠️ REGLA CRÍTICA: NO TEXTOS HARDCODEADOS

**NUNCA escribas texto visible al usuario directamente en el código.**
Todo texto debe venir de los archivos de traducción.

```typescript
// ❌ MAL - Texto hardcodeado
<h1>Bienvenido</h1>
<p>Cargando...</p>
<button>Guardar</button>

// ✅ BIEN - Usando traducciones
<h1>{t("auth.welcome")}</h1>
<p>{t("common.loading")}</p>
<button>{t("common.save")}</button>
```

---

### Uso en Client Components
```typescript
'use client';
import { useTranslations } from 'next-intl';

export function BabyForm() {
  const t = useTranslations();

  return (
    <div>
      <h1>{t('baby.title')}</h1>
      <label>{t('baby.name')}</label>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

### Uso en Server Components
```typescript
import { getTranslations, getLocale } from 'next-intl/server';

export default async function BabyPage() {
  const t = await getTranslations();
  const locale = await getLocale();

  // Para formatear fechas según el locale
  const dateLocale = locale === 'pt-BR' ? 'pt-BR' : 'es-ES';
  const formattedDate = new Date().toLocaleDateString(dateLocale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return <h1>{t('baby.title')}</h1>;
}
```

---

### Estructura de archivos de traducción

```
messages/
├── es.json      # Español (Bolivia)
└── pt-BR.json   # Portugués (Brasil)
```

**Organización por secciones:**
```json
{
  "common": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "loading": "Cargando...",
    "error": "Error"
  },
  "auth": {
    "login": "Iniciar sesión",
    "logout": "Cerrar sesión",
    "errors": {
      "INVALID_CREDENTIALS": "Credenciales inválidas"
    }
  },
  "baby": {
    "title": "Bebés",
    "name": "Nombre"
  },
  "appointment": {
    "title": "Citas"
  }
}
```

---

### Validaciones con Zod (Traducidas)

Las validaciones usan claves que se traducen automáticamente:

```typescript
// lib/validations/auth.ts
export const staffLoginSchema = z.object({
  username: z
    .string()
    .min(1, "USERNAME_REQUIRED")      // ← Clave de traducción
    .min(3, "USERNAME_TOO_SHORT"),
  password: z
    .string()
    .min(1, "PASSWORD_REQUIRED")
    .min(6, "PASSWORD_TOO_SHORT"),
});
```

```json
// messages/es.json
{
  "auth": {
    "errors": {
      "USERNAME_REQUIRED": "El nombre de usuario es requerido",
      "USERNAME_TOO_SHORT": "El usuario debe tener al menos 3 caracteres",
      "PASSWORD_REQUIRED": "La contraseña es requerida",
      "PASSWORD_TOO_SHORT": "La contraseña debe tener al menos 6 caracteres"
    }
  }
}
```

**En el formulario, traducir errores de Zod:**
```tsx
const translateZodError = (error: string | undefined): string => {
  if (!error) return "";
  if (error.includes("_")) {
    return t(`auth.errors.${error}`);
  }
  return error;
};

// En FormMessage, pasar el error traducido como children:
<FormMessage>
  {translateZodError(fieldState.error?.message)}
</FormMessage>
```

---

### 📋 Checklist para NUEVAS FEATURES

Cuando crees un nuevo módulo o feature, sigue estos pasos:

#### 1. Identificar todos los textos
```
□ Títulos de página
□ Labels de formularios
□ Placeholders de inputs
□ Textos de botones
□ Mensajes de error
□ Mensajes de éxito
□ Estados vacíos
□ Tooltips
□ Breadcrumbs
□ Mensajes de confirmación
```

#### 2. Agregar claves a AMBOS archivos
```bash
# Editar messages/es.json Y messages/pt-BR.json
# Agregar las mismas claves en ambos
```

#### 3. Usar convención de nombres
```json
{
  "moduleName": {
    "title": "...",
    "subtitle": "...",
    "form": {
      "fieldName": "...",
      "placeholder": "..."
    },
    "actions": {
      "create": "...",
      "edit": "...",
      "delete": "..."
    },
    "messages": {
      "success": "...",
      "error": "...",
      "empty": "..."
    }
  }
}
```

#### 4. Verificar
```
□ Probar en español (/es/...)
□ Probar en portugués (/pt-BR/...)
□ Verificar que no hay claves sin traducir (aparecen como la clave misma)
```

---

### Claves comunes reutilizables

Usa estas claves existentes antes de crear nuevas:

```typescript
// Acciones comunes
t("common.save")      // Guardar / Salvar
t("common.cancel")    // Cancelar / Cancelar
t("common.delete")    // Eliminar / Excluir
t("common.edit")      // Editar / Editar
t("common.add")       // Agregar / Adicionar
t("common.create")    // Crear / Criar
t("common.update")    // Actualizar / Atualizar
t("common.search")    // Buscar / Buscar
t("common.close")     // Cerrar / Fechar
t("common.confirm")   // Confirmar / Confirmar
t("common.back")      // Volver / Voltar

// Estados
t("common.loading")   // Cargando... / Carregando...
t("common.error")     // Error / Erro
t("common.success")   // Éxito / Sucesso

// Navegación
t("nav.dashboard")    // Panel Principal
t("nav.calendar")     // Calendario
t("nav.settings")     // Configuración

// Tiempo
t("common.today")     // Hoy / Hoje
t("common.yesterday") // Ayer / Ontem
t("common.tomorrow")  // Mañana / Amanhã
```

---

### Ejemplo completo: Nuevo módulo

```typescript
// 1. Agregar traducciones
// messages/es.json
{
  "inventory": {
    "title": "Inventario",
    "addProduct": "Agregar Producto",
    "form": {
      "name": "Nombre del producto",
      "quantity": "Cantidad",
      "price": "Precio"
    },
    "messages": {
      "created": "Producto creado exitosamente",
      "empty": "No hay productos en el inventario"
    }
  }
}

// 2. Usar en componente
export function InventoryPage() {
  const t = useTranslations();

  return (
    <div>
      <h1>{t("inventory.title")}</h1>
      <Button>{t("inventory.addProduct")}</Button>

      {products.length === 0 && (
        <p>{t("inventory.messages.empty")}</p>
      )}
    </div>
  );
}
```

---

## ✅ Business Rules (IMPORTANT!)

### Appointments
- **Maximum 2 appointments per hour** (2 therapists)
- Validate business hours (Mon: 9-17, Tue-Sat: 9-12 & 14:30-18:30)
- Check closed dates before allowing booking
- Deduct session from package when booking
- Return session to package when cancelling

### No-Show Penalty
```typescript
// When marking NO_SHOW:
parent.noShowCount += 1;
if (parent.noShowCount >= 3) {
  parent.requiresPrepayment = true;
}

// When baby attends (COMPLETED):
parent.noShowCount = 0;  // Reset!
```

### Sessions
- Only THERAPIST can submit evaluations
- Only RECEPTION can complete session (payment)
- Products always deduct from inventory
- Products marked "chargeable" add to total

### Packages
- Never expire (valid until baby turns 3)
- Sessions not transferable between babies
- Track: totalSessions, usedSessions, remainingSessions

### Portal Parents
- Login ONLY with access code (BSB-XXXXX)
- Can only see their own babies
- Can only see external notes (not internal)
- Block booking if requiresPrepayment = true

---

## 🚫 Don'ts

```
❌ Don't use localStorage/sessionStorage for auth (use cookies)
❌ Don't expose internal notes to parents
❌ Don't allow more than 2 appointments per hour
❌ Don't delete data - use soft delete (isActive = false)
❌ Don't mix tenant data (always verify correct DB)
❌ Don't skip validation (use Zod schemas)

⚠️ TRADUCCIONES - MUY IMPORTANTE:
❌ Don't hardcode ANY user-visible text
❌ Don't forget to add keys to BOTH es.json AND pt-BR.json
❌ Don't use Spanish/Portuguese text directly in components
❌ Don't forget to translate Zod validation errors
❌ Don't hardcode date formats (use locale from getLocale())
```

---

## ✅ Do's

```
✅ Always validate inputs with Zod
✅ Always check authentication in API routes
✅ Always use transactions for related updates
✅ Always handle errors gracefully
✅ Always use TypeScript types
✅ Always follow the established patterns
✅ Always test after implementing
✅ Always commit working code

✅ TRADUCCIONES:
✅ Always use t("key") for ALL user-visible text
✅ Always add translations to BOTH es.json AND pt-BR.json
✅ Always test in both /es/ and /pt-BR/ routes
✅ Always use getLocale() for date/number formatting
✅ Always use translateZodError() pattern for form errors
```

---

## 🧪 Testing Checklist

Before committing any module:
```
□ No TypeScript errors
□ No console errors
□ npm run build succeeds
□ Feature works as expected
□ Mobile responsive
□ Permissions work correctly

TRADUCCIONES (OBLIGATORIO):
□ Todos los textos usan t("clave") - NO textos hardcodeados
□ Claves agregadas a messages/es.json
□ Claves agregadas a messages/pt-BR.json
□ Probar en /es/... - textos en español
□ Probar en /pt-BR/... - textos en portugués
□ Errores de validación se muestran traducidos
□ Fechas formateadas según locale (es-ES o pt-BR)
```

---

## 📚 Reference Files

When implementing new features, reference these existing files:
- API pattern: `app/api/babies/route.ts`
- Page pattern: `app/[locale]/(admin)/clients/page.tsx`
- Form pattern: `components/babies/baby-form.tsx`
- Service pattern: `lib/services/appointment-service.ts`

---

## 🆘 Common Issues

### "Module not found"
→ Check import path, run `npm install`

### "Prisma client not generated"
→ Run `npx prisma generate`

### "Database connection failed"
→ Check DATABASE_URL in .env

### "Type errors with Prisma"
→ Run `npx prisma generate` after schema changes

### "Hydration mismatch"
→ Check for browser-only code, use 'use client' properly

---

## 🔍 Code Verification Guidelines (Post-Implementation)

After completing any implementation phase, run these verification steps to ensure code quality.

### 1. TypeScript Verification
```bash
npx tsc --noEmit
```
- Must complete with 0 errors
- Fixes: Check types, imports, and interface definitions

### 2. ESLint Verification
```bash
npx eslint . --ext .ts,.tsx --max-warnings 0
```
- Must complete with 0 errors AND 0 warnings
- Common issues to check:
  - Unused imports/variables → Remove or use them
  - `any` types → Add proper TypeScript interfaces
  - React hooks rules → Ensure proper dependencies and order
  - `<img>` tags → Use `<Image>` from next/image
  - setState in useEffect → Add eslint-disable comment if intentional (hydration patterns)

### 3. Build Verification
```bash
npm run build
```
- Must complete successfully
- Checks for:
  - Server/client component boundaries
  - Dynamic imports
  - Missing exports
  - SSR compatibility

### 4. Translations Verification
```
□ All visible text uses t("key") - NO hardcoded text
□ Keys exist in BOTH messages/es.json AND messages/pt-BR.json
□ Test /es/... route - all text in Spanish
□ Test /pt-BR/... route - all text in Portuguese
□ Form validation errors show translated messages
□ Dates formatted according to locale
```

### 5. Visual/UX Verification
```
□ Design follows Baby Spa style (glassmorphism, teal gradients, floating bubbles)
□ Responsive on mobile, tablet, desktop
□ No console errors in browser DevTools
□ Loading states display correctly
□ Error states handled gracefully
□ Empty states have appropriate messages
```

### 6. Security Verification
```
□ API routes check session authentication
□ Role-based access enforced where needed
□ No sensitive data exposed to unauthorized roles
□ Input validation with Zod schemas
□ No SQL injection vulnerabilities (using Prisma)
□ No XSS vulnerabilities (React escapes by default)
```

---

### Quick Verification Command
```bash
# Run all checks at once
npx tsc --noEmit && npx eslint . --ext .ts,.tsx --max-warnings 0 && npm run build
```

### Common ESLint Fixes

**Unused variables:**
```typescript
// Before: const foo = getValue();  // foo never used
// After: Remove the line, or use _ prefix if intentional
const _foo = getValue();
```

**Missing hook dependencies:**
```typescript
// Before
useEffect(() => {
  doSomething(value);
}, []);  // Missing 'value'

// After
useEffect(() => {
  doSomething(value);
}, [value]);
```

**setState in useEffect (for hydration patterns):**
```typescript
// eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: hydration-safe initialization
setState(localStorageValue);
```

**Any types:**
```typescript
// Before
const data: any = response;

// After - Define proper interface
interface ResponseData {
  id: string;
  name: string;
}
const data: ResponseData = response;
```

**Using img instead of Image:**
```typescript
// Before
<img src="/logo.png" alt="Logo" />

// After
import Image from 'next/image';
<Image src="/logo.png" alt="Logo" width={100} height={100} />
```

---

### Architecture Best Practices Verified

The project follows these Next.js App Router best practices:

1. **Route Groups**: `(admin)`, `(therapist)`, `(portal)` for logical organization
2. **Locale Routing**: `[locale]` segment with next-intl middleware
3. **Server/Client Separation**:
   - Default to Server Components
   - Use 'use client' only for interactivity (hooks, event handlers)
4. **Authentication**: NextAuth.js with session checks in API routes
5. **Layouts**: Proper nested layouts with providers at root level
6. **Internationalization**:
   - Middleware handles locale detection
   - Server: `getTranslations()`, `getLocale()`
   - Client: `useTranslations()`
7. **Form Validation**: Zod schemas with translated error messages
8. **Database**: Prisma with proper TypeScript types

---

### When to Run Verification

✅ After completing any coding task
✅ Before creating a git commit
✅ After resolving merge conflicts
✅ When preparing for deployment
✅ After upgrading dependencies
