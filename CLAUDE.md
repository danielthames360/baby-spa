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
├── validations/        # Zod schemas
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

---

## ✅ Business Rules (IMPORTANT!)

### ⚠️ REGLAS CRÍTICAS - LEER SIEMPRE

```
1. PAQUETES:
   - Siempre se selecciona un paquete (NO existe "sesión a definir")
   - Default: Paquete Individual (1 sesión)
   - El paquete es PROVISIONAL hasta el checkout
   - Puede cambiarse en: detalle cita, iniciar sesión, checkout
   - Sesión se descuenta al COMPLETAR, NO al agendar

2. PAGOS:
   - Algunos paquetes requieren pago anticipado
   - Citas PENDING_PAYMENT no bloquean slot
   
   CUOTAS (configuradas POR PAQUETE):
   - Cada paquete define SI permite cuotas
   - El precio en cuotas puede ser MAYOR al precio único (financiamiento)
   - Se define EN QUÉ SESIONES se paga cada cuota (ej: sesiones 1, 3, 5)
   - El cliente NO elige cuántas cuotas, el paquete lo define
   - El sistema ALERTA pero NO BLOQUEA si hay pagos atrasados
   - Pagos flexibles: puede pagar más o menos de una cuota
   
   ALERTAS DE PAGO:
   - Se muestran basadas en la sesión actual vs sesiones de pago definidas
   - Ej: Si debe pagar en sesión 3 y está en sesión 4 sin pagar → ALERTA
   - Staff puede continuar a pesar de la alerta (no es bloqueo)

3. EVALUACIONES:
   - Solo THERAPIST puede evaluar
   - Cita puede completarse SIN evaluación
   - Una vez evaluada, no se puede modificar
   - Notas internas ≠ notas externas (padres solo ven externas)

4. SLOTS:
   - Staff: hasta 5 citas por slot de 30 min
   - Portal padres: hasta 2 citas por slot
   - Citas ocupan slots según duración del paquete
```

### Appointments
- Validate business hours (Mon: 9-17, Tue-Sat: 9-12 & 14:30-18:30)
- Check closed dates before allowing booking
- 1 baby = max 1 appointment per day
- PENDING_PAYMENT appointments don't block slots

### No-Show Penalty
```typescript
// When marking NO_SHOW:
parent.noShowCount += 1;
if (parent.noShowCount >= 3) {
  parent.requiresPrepayment = true;
}
// If advance payment was made → NOT refunded

// When baby attends (COMPLETED):
parent.noShowCount = 0;  // Reset!
```

### Sessions
- Only THERAPIST can submit evaluations
- Only RECEPTION/ADMIN can complete session (checkout)
- Session can be completed WITHOUT evaluation
- Products always deduct from inventory
- Products marked "isChargeable" add to total

### Packages
- Never expire (valid until baby turns 3)
- Sessions not transferable between babies
- Track: totalSessions, usedSessions, remainingSessions
- Can be paid in installments
- Session deducted at CHECKOUT, not at booking

### Portal Parents
- Login ONLY with access code (BSB-XXXXX)
- Can only see their own babies
- Can only see external notes (not internal)
- Block booking if requiresPrepayment = true
- Max 2 appointments per slot (vs 5 for staff)

---

## 🚫 Don'ts

```
❌ Don't use localStorage/sessionStorage for auth (use cookies)
❌ Don't expose internal notes to parents
❌ Don't allow more than 5 appointments per slot (staff) or 2 (portal)
❌ Don't delete data - use soft delete (isActive = false)
❌ Don't mix tenant data (always verify correct DB)
❌ Don't skip validation (use Zod schemas)
❌ Don't use "sesión a definir" - ALWAYS select a package

⚠️ TRADUCCIONES - MUY IMPORTANTE:
❌ Don't hardcode ANY user-visible text
❌ Don't forget to add keys to BOTH es.json AND pt-BR.json
❌ Don't use Spanish/Portuguese text directly in components
❌ Don't forget to translate Zod validation errors
❌ Don't hardcode date formats (use locale from getLocale())

⚠️ PERFORMANCE - MUY IMPORTANTE:
❌ Don't write inline auth checks - use lib/api-utils.ts withAuth()
❌ Don't use sequential awaits for independent queries - use Promise.all()
❌ Don't import heavy dialogs directly - use next/dynamic
❌ Don't define static objects/arrays inside components - move outside
❌ Don't fetch data twice - return from transaction
❌ Don't duplicate form helpers - use lib/form-utils.ts
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
✅ Always select a package when booking (default: Individual)
✅ Always deduct session at CHECKOUT, not at booking

✅ TRADUCCIONES:
✅ Always use t("key") for ALL user-visible text
✅ Always add translations to BOTH es.json AND pt-BR.json
✅ Always test in both /es/ and /pt-BR/ routes
✅ Always use getLocale() for date/number formatting
✅ Always use translateZodError() pattern for form errors

✅ PERFORMANCE:
✅ Always use lib/api-utils.ts for API route auth/validation/errors
✅ Always use Promise.all() for independent async operations
✅ Always use next/dynamic for heavy dialog components
✅ Always define static constants outside component functions
✅ Always return needed data from transactions (avoid extra fetches)
✅ Always use lib/form-utils.ts for form helper functions
✅ Always check Performance Checklist before committing
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

PERFORMANCE (OBLIGATORIO - vercel-react-best-practices):
□ API routes usan lib/api-utils.ts (withAuth, handleApiError)
□ Queries independientes usan Promise.all() (async-parallel)
□ Dialogs pesados usan next/dynamic (bundle-dynamic-imports)
□ Objetos/arrays estáticos están fuera de componentes (rerender-*)
□ No hay fetches redundantes (datos retornados de transacción)
□ Form helpers vienen de lib/form-utils.ts
□ Revisar reglas del skill vercel-react-best-practices si aplican
```

---

## 📚 Reference Files

When implementing new features, reference these existing files:
- API pattern: `app/api/babies/route.ts`
- Page pattern: `app/[locale]/(admin)/admin/clients/page.tsx`
- Form pattern: `components/babies/baby-form.tsx`
- Service pattern: `lib/services/baby-service.ts`
- Validation pattern: `lib/validations/baby.ts`
- **API utilities: `lib/api-utils.ts`** (auth, validation, error handling)
- **Form utilities: `lib/form-utils.ts`** (translateError, getStringValue, etc.)
- **Dynamic imports example: `app/[locale]/(admin)/admin/inventory/page.tsx`**
- **Parallel queries example: `lib/services/session-service.ts:getSessionsForTherapist`**
- **Installments utilities: `lib/utils/installments.ts`** (payment status, installment calculations)
- **Date utilities: `lib/utils/date-utils.ts`** (UTC noon, timezone-safe dates)

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

## 🗄️ Direct Database Queries (Claude)

Para consultar la base de datos directamente desde la terminal, usa este patrón con Node.js:

```bash
cd D:/projects/next/baby-spa && node -e "
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Tu query aquí
prisma.appointment.findFirst({
  orderBy: { createdAt: 'desc' },
  include: {
    baby: true,
    selectedPackage: true,
    therapist: true,
    session: true,
    packagePurchase: true
  }
}).then(data => {
  console.log(JSON.stringify(data, null, 2));
}).catch(err => {
  console.error('Error:', err.message);
}).finally(() => {
  prisma.\$disconnect();
});
"
```

### Puntos importantes:
- **Siempre** usar `require('dotenv').config()` para cargar variables de entorno
- **Siempre** usar `@prisma/adapter-pg` (PrismaPg) - el proyecto usa PostgreSQL adapter
- **Escapar** el `$` en `prisma.$disconnect()` como `prisma.\$disconnect()` en bash
- Consultar `prisma/schema.prisma` para ver los modelos y relaciones disponibles

### Modelos principales:
- `appointment` - Citas (include: baby, selectedPackage, therapist, session, packagePurchase, payments)
- `baby` - Bebés (include: parents, appointments, packagePurchases)
- `parent` - Padres (include: babies)
- `package` - Paquetes disponibles
- `packagePurchase` - Compras de paquetes
- `session` - Sesiones de terapia
- `user` - Usuarios del sistema (staff)

### Ejemplo: Ver últimas citas con formato legible
```bash
cd D:/projects/next/baby-spa && node -e "
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

prisma.appointment.findMany({
  orderBy: { createdAt: 'desc' },
  take: 5,
  select: {
    id: true,
    date: true,
    startTime: true,
    endTime: true,
    status: true,
    createdAt: true,
    baby: { select: { name: true } }
  }
}).then(data => {
  console.log('=== Últimas 5 citas ===');
  data.forEach(apt => {
    console.log('---');
    console.log('Baby:', apt.baby.name);
    console.log('Date stored:', apt.date.toISOString());
    console.log('Time:', apt.startTime, '-', apt.endTime);
    console.log('Status:', apt.status);
  });
}).catch(err => {
  console.error('Error:', err.message);
}).finally(() => {
  prisma.\$disconnect();
});
"
```

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

### 3. Build Verification
```bash
npm run build
```
- Must complete successfully

### Quick Verification Command
```bash
# Run all checks at once
npx tsc --noEmit && npx eslint . --ext .ts,.tsx --max-warnings 0 && npm run build
```

---

## 🎯 Code Standards & Skills

### Skill: `vercel-react-best-practices`

**SIEMPRE aplicar las mejores prácticas del skill `vercel-react-best-practices` instalado en `.agents/skills/`.**

Este skill contiene 57 reglas de optimización organizadas por prioridad:

| Prioridad | Categoría | Prefijo | Ejemplos |
|-----------|-----------|---------|----------|
| 1 - CRÍTICO | Eliminar Waterfalls | `async-` | Promise.all(), Suspense |
| 2 - CRÍTICO | Bundle Size | `bundle-` | next/dynamic, barrel imports |
| 3 - ALTO | Server Performance | `server-` | React.cache(), after() |
| 4 - MEDIO-ALTO | Client Data | `client-` | SWR, event listeners |
| 5 - MEDIO | Re-renders | `rerender-` | useMemo, useCallback |
| 6 - MEDIO | Rendering | `rendering-` | content-visibility |
| 7 - BAJO-MEDIO | JavaScript | `js-` | Set/Map lookups |
| 8 - BAJO | Advanced | `advanced-` | useLatest |

**Cuándo aplicar:**
- Al escribir componentes nuevos
- Al refactorizar código existente
- Al revisar código para issues de performance
- Al optimizar bundle size o tiempos de carga

**Referencia:** `.agents/skills/vercel-react-best-practices/AGENTS.md` para reglas detalladas.

---

## 🏗️ Architecture Best Practices

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

## ⚡ Performance Best Practices (MANDATORY)

### Utility Files - USE THESE

The project has shared utility files to avoid code duplication. **ALWAYS use these instead of writing inline code:**

```
lib/api-utils.ts     → API route helpers (auth, validation, error handling)
lib/form-utils.ts    → Form helpers (translateError, getStringValue, etc.)
```

### 1. API Routes - Use `lib/api-utils.ts`

```typescript
import { withAuth, validateRequest, handleApiError, ApiError } from "@/lib/api-utils";

export async function POST(request: Request) {
  try {
    // Auth check (throws ApiError if unauthorized)
    const session = await withAuth(["ADMIN", "RECEPTION"]);

    // Validation (throws ApiError if invalid)
    const body = await request.json();
    const data = validateRequest(body, mySchema);

    // Your logic here...
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "creating resource");
  }
}
```

### 2. Async Operations - Parallelize with Promise.all()

```typescript
// ❌ BAD - Sequential (slow)
const users = await prisma.user.findMany();
const products = await prisma.product.findMany();
const orders = await prisma.order.findMany();

// ✅ GOOD - Parallel (fast)
const [users, products, orders] = await Promise.all([
  prisma.user.findMany(),
  prisma.product.findMany(),
  prisma.order.findMany(),
]);
```

### 3. Heavy Dialogs - Use `next/dynamic`

Modal/dialog components should be dynamically imported to reduce initial bundle:

```typescript
import dynamic from "next/dynamic";

// ✅ GOOD - Lazy loaded when needed
const HeavyDialog = dynamic(
  () => import("@/components/dialogs/heavy-dialog").then((mod) => mod.HeavyDialog),
  { ssr: false }
);

// ❌ BAD - Loaded on page load even if never opened
import { HeavyDialog } from "@/components/dialogs/heavy-dialog";
```

**Apply to:** Any dialog/modal with forms, complex UI, or >10KB size.

### 4. Constants - Move Outside Components

Static objects, arrays, and config should be defined OUTSIDE component functions:

```typescript
// ✅ GOOD - Created once at module level
const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

const WEEK_DAYS: Record<string, string[]> = {
  es: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  "pt-BR": ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
};

export function MyComponent() {
  const locale = useLocale();
  const weekDays = WEEK_DAYS[locale] || WEEK_DAYS["es"];
  // ...
}

// ❌ BAD - Recreated on every render
export function MyComponent() {
  const statusStyles = {  // Creates new object every render!
    PENDING: "bg-amber-100",
    COMPLETED: "bg-emerald-100",
  };
}
```

### 5. Form Helpers - Use `lib/form-utils.ts`

```typescript
import { translateError, getStringValue, getDateValue } from "@/lib/form-utils";

// In your form component:
<FormMessage>{translateError(fieldState.error?.message, t, "babyForm.errors")}</FormMessage>
<Input value={getStringValue(field.value)} />
```

### 6. Database Queries - Avoid Redundant Fetches

```typescript
// ❌ BAD - Fetching same data twice
const result = await prisma.$transaction(async (tx) => {
  await tx.appointment.update({ where: { id }, data: {...} });
  return { success: true };
});
const updated = await prisma.appointment.findUnique({ where: { id } }); // Extra query!

// ✅ GOOD - Return data from transaction
const result = await prisma.$transaction(async (tx) => {
  const updated = await tx.appointment.update({
    where: { id },
    data: {...},
    include: { baby: true, therapist: true }, // Include what you need
  });
  return updated;
});
// Use result directly, no extra fetch needed
```

### 7. Shared Include Objects

When multiple queries need the same includes, define once and reuse:

```typescript
// ✅ GOOD - Define once, use multiple times
const appointmentInclude = {
  baby: { include: { parents: true } },
  therapist: { select: { id: true, name: true } },
  session: true,
} as const;

const [scheduled, completed] = await Promise.all([
  prisma.appointment.findMany({ where: { status: "SCHEDULED" }, include: appointmentInclude }),
  prisma.appointment.findMany({ where: { status: "COMPLETED" }, include: appointmentInclude }),
]);
```

---

### Performance Checklist (Before Committing)

```
□ API routes use lib/api-utils.ts helpers
□ Multiple independent queries use Promise.all()
□ Heavy dialogs use next/dynamic
□ Static objects/arrays are outside components
□ No redundant database fetches
□ Form helpers from lib/form-utils.ts are used
```

---

### When to Run Verification

✅ After completing any coding task
✅ Before creating a git commit
✅ After resolving merge conflicts
✅ When preparing for deployment
✅ After upgrading dependencies

---

## 📱 Mobile UX Best Practices

### Modal Viewport Auto-Adjustment (MANDATORY)

All modals/dialogs MUST auto-adjust their height based on the visual viewport to handle iOS Safari toolbar behavior. When the toolbar appears/disappears, the modal content must remain visible and accessible.

**Required Pattern:**
```tsx
// 1. Use this hook for iOS Safari compatible viewport handling
function useMobileViewport() {
  const [styles, setStyles] = useState<{ height?: number; isMobile: boolean }>({ isMobile: false });

  useLayoutEffect(() => {
    function update() {
      const isMobile = window.innerWidth < 640;
      const height = window.visualViewport?.height ?? window.innerHeight;
      setStyles({ height, isMobile });
    }

    update();

    const viewport = window.visualViewport;
    if (viewport) {
      viewport.addEventListener('resize', update);
      viewport.addEventListener('scroll', update);
    }
    window.addEventListener('orientationchange', update);

    return () => {
      if (viewport) {
        viewport.removeEventListener('resize', update);
        viewport.removeEventListener('scroll', update);
      }
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return styles;
}

// 2. Apply in component
const { height: viewportHeight, isMobile } = useMobileViewport();

// 3. Use in DialogContent
<DialogContent
  className="flex w-full max-w-full flex-col gap-0 rounded-none border-0 p-0 sm:h-auto sm:max-h-[85vh] sm:max-w-lg sm:rounded-2xl sm:border"
  style={viewportHeight && isMobile ? { height: viewportHeight, maxHeight: viewportHeight } : undefined}
>
  {/* Header - shrink-0 */}
  <div className="shrink-0 border-b ...">...</div>

  {/* Content - flex-1 overflow-y-auto */}
  <div className="flex-1 overflow-y-auto">...</div>

  {/* Footer - shrink-0 */}
  <div className="shrink-0 border-t bg-white ...">...</div>
</DialogContent>
```

**Key Requirements:**
- ✅ Use `visualViewport` API (more reliable than `innerHeight` on iOS)
- ✅ Full height on mobile (`rounded-none border-0`), contained on desktop (`sm:max-h-[85vh] sm:rounded-2xl`)
- ✅ Flex layout with `shrink-0` header/footer and `flex-1 overflow-y-auto` content
- ✅ Dynamic height style only applied on mobile

### Web Share API for Images (Mobile Only)

When offering image download, use Web Share API **only on mobile** to allow saving to photo gallery. On desktop, use direct download to avoid Windows share dialog:

```tsx
const handleDownload = async () => {
  try {
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();
    const file = new File([blob], "image.png", { type: "image/png" });

    // IMPORTANT: Only use Web Share API on mobile (avoid Windows share dialog on desktop)
    const isMobileDevice = window.innerWidth < 640 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobileDevice && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Image Title" });
      return;
    }
  } catch (error) {
    console.log("Share cancelled or failed, using download fallback");
  }

  // Fallback: direct download (used on desktop or when share fails)
  const link = document.createElement("a");
  link.href = imageDataUrl;
  link.download = "image.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
```

## 📅 Date Handling (MANDATORY)

### UTC Noon Strategy

ALL dates in the system are stored at **12:00:00 UTC** to avoid timezone issues:
```typescript
// ❌ WRONG - Will shift days in different timezones
const date = new Date("2026-02-06");
const date = someDate.toISOString();

// ✅ CORRECT - Use date utilities
import { parseDateToUTCNoon, formatDateForDisplay, fromDateOnly } from '@/lib/utils/date-utils';

// Saving to DB:
const dateForDb = parseDateToUTCNoon(2026, 2, 6); // → 2026-02-06T12:00:00Z

// Reading from DB:
const dateString = fromDateOnly(dbDate); // → "2026-02-06"

// Displaying to user:
const formatted = formatDateForDisplay(dbDate, locale, options); // → "viernes, 6 de febrero"
```

**Golden Rules:**
1. NEVER use `toISOString()` for user-selected dates
2. NEVER use `new Date(string)` without specifying time
3. ALWAYS send dates as "YYYY-MM-DD" strings to API
4. ALWAYS convert to UTC noon when saving to DB
5. ALWAYS use `formatDateForDisplay()` for showing dates from DB