# CLAUDE.md - Baby Spa Development Guide

> **Para reglas de negocio completas, ver `baby-spa-spec.md`**

---

## 🔄 WORKFLOW OBLIGATORIO

```
┌─────────────────────────────────────────────────────────────────┐
│  1. PLANIFICAR  →  2. BEST PRACTICES  →  3. IMPLEMENTAR  →  4. VERIFICAR  │
└─────────────────────────────────────────────────────────────────┘
```

### Antes de escribir código:
1. **Planificar** - Entender el alcance y archivos afectados
2. **Revisar Best Practices** - Aplicar `vercel-react-best-practices` skill
3. **Implementar** - Seguir patrones existentes
4. **Verificar** - TypeScript + ESLint + Build + Traducciones

---

## ⚡ VERCEL-REACT-BEST-PRACTICES (OBLIGATORIO)

**SIEMPRE aplicar estas reglas al escribir código:**

| Prioridad | Categoría | Regla Clave |
|-----------|-----------|-------------|
| CRÍTICO | Async | `Promise.all()` para queries independientes |
| CRÍTICO | Bundle | `next/dynamic` para dialogs pesados |
| ALTO | Re-renders | Constantes FUERA de componentes |
| ALTO | Iterations | Combinar múltiples `.filter()/.map()` en uno |
| MEDIO | Server | Retornar datos de transacciones (no re-fetch) |

### Ejemplos rápidos:

```typescript
// ❌ MAL - Sequential
const users = await prisma.user.findMany();
const products = await prisma.product.findMany();

// ✅ BIEN - Parallel (async-parallel)
const [users, products] = await Promise.all([
  prisma.user.findMany(),
  prisma.product.findMany(),
]);
```

```typescript
// ❌ MAL - Import directo de dialog pesado
import { HeavyDialog } from "@/components/dialogs/heavy-dialog";

// ✅ BIEN - Dynamic import (bundle-dynamic-imports)
const HeavyDialog = dynamic(
  () => import("./heavy-dialog").then((m) => m.HeavyDialog),
  { ssr: false }
);
```

```typescript
// ❌ MAL - Múltiples iteraciones
const active = items.filter(i => i.status === "ACTIVE");
const total = items.reduce((sum, i) => sum + i.amount, 0);

// ✅ BIEN - Single iteration (js-combine-iterations)
const { active, total } = items.reduce((acc, i) => {
  if (i.status === "ACTIVE") acc.active.push(i);
  acc.total += i.amount;
  return acc;
}, { active: [], total: 0 });
```

**Referencia completa:** `.claude/skills/vercel-react-best-practices/AGENTS.md`

---

## 🛠️ Tech Stack

```
Next.js 14 (App Router) | TypeScript | PostgreSQL | Prisma
NextAuth.js | shadcn/ui | TailwindCSS | next-intl | Zustand
```

---

## 📁 Estructura

```
app/[locale]/(admin)/     # Admin & Reception
app/[locale]/(therapist)/ # Therapist
app/[locale]/(portal)/    # Portal Padres
app/api/                  # API routes
components/[feature]/     # Por feature
lib/services/             # Business logic
lib/validations/          # Zod schemas
lib/utils/                # Helpers
messages/es.json          # Español
messages/pt-BR.json       # Portugués
```

---

## 🎨 Design System (Quick Reference)

```html
<!-- Background gradient -->
<div class="bg-gradient-to-br from-cyan-50 via-teal-50 to-white">

<!-- Card glassmorphism -->
<div class="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">

<!-- Primary button -->
<button class="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 font-semibold text-white shadow-lg shadow-teal-300/50">

<!-- Heading gradient -->
<h1 class="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-3xl font-bold text-transparent">
```

---

## 📚 Archivos de Referencia

| Patrón | Archivo |
|--------|---------|
| API route | `app/api/babies/route.ts` |
| Service | `lib/services/baby-service.ts` |
| Validation | `lib/validations/baby.ts` |
| Form | `components/babies/baby-form.tsx` |
| Page | `app/[locale]/(admin)/admin/clients/page.tsx` |
| **API utils** | `lib/api-utils.ts` (withAuth, handleApiError) |
| **Form utils** | `lib/form-utils.ts` (translateError) |
| **Date utils** | `lib/utils/date-utils.ts` (UTC noon) |
| **Dynamic import** | `app/[locale]/(admin)/admin/inventory/page.tsx` |

---

## 📅 Fechas (UTC Noon Strategy)

> **Documentación completa:** `docs/DATE-HANDLING.md`

**TODAS las fechas se almacenan a las 12:00:00 UTC. Las horas son strings separados.**

### 🚨 REGLA CRÍTICA: Backend SIEMPRE usa métodos UTC

```typescript
// ✅ CORRECTO - En lib/services/ y app/api/
const dayOfWeek = date.getUTCDay();        // Día de semana
const day = date.getUTCDate();              // Día del mes
const month = date.getUTCMonth();           // Mes (0-11)
const year = date.getUTCFullYear();         // Año
date.setUTCDate(date.getUTCDate() + 1);    // Avanzar día

// ❌ INCORRECTO - NUNCA en backend para fechas de BD
const dayOfWeek = date.getDay();    // ¡BUG! Convierte a hora local
const day = date.getDate();         // ¡BUG! Puede dar día incorrecto
```

**¿Por qué?** Las fechas se guardan en UTC. En timezone negativo (ej: Bolivia UTC-4),
`2026-02-06T12:00:00Z` con `getDay()` retorna día 5 (incorrecto) en vez de día 6.

### Utilidades principales

```typescript
import {
  parseDateToUTCNoon,      // Crear fecha para guardar
  formatDateForDisplay,     // Mostrar fecha de BD
  formatLocalDateString,    // Enviar fecha desde frontend
  getStartOfDayUTC,         // Inicio de día para queries
  getEndOfDayUTC            // Fin de día para queries
} from '@/lib/utils/date-utils';

// Guardar en DB:
const date = parseDateToUTCNoon(2026, 2, 6); // → 2026-02-06T12:00:00Z

// Query por rango:
const from = getStartOfDayUTC(date);  // 2026-02-06T00:00:00Z
const to = getEndOfDayUTC(date);      // 2026-02-06T23:59:59Z

// Mostrar al usuario:
formatDateForDisplay(dbDate, "es-ES"); // → "viernes, 6 de febrero"

// Enviar desde frontend:
formatLocalDateString(selectedDate);   // → "2026-02-06"
```

### Reglas rápidas

| Contexto | Usar |
|----------|------|
| Backend procesando fechas BD | `getUTCDay()`, `getUTCDate()`, `setUTCDate()` |
| Crear fecha para guardar | `parseDateToUTCNoon(year, month, day)` |
| Mostrar fecha de BD | `formatDateForDisplay(date, locale)` |
| Frontend enviando a API | `formatLocalDateString(date)` → "YYYY-MM-DD" |
| Frontend UI (calendario) | Métodos locales OK (es interacción del usuario) |

---

## 🚫 Don'ts

```
❌ Hardcode textos - usar t("key")
❌ Olvidar traducciones en es.json Y pt-BR.json
❌ Sequential awaits - usar Promise.all()
❌ Import directo de dialogs - usar next/dynamic
❌ Constantes dentro de componentes
❌ Re-fetch después de transaction
❌ Exponer notas internas a padres
❌ Más de 5 citas/slot (staff) o 2 (portal)
❌ Borrar datos - usar soft delete
❌ Duplicar lógica - revisar lib/utils/ primero
```

---

## ✅ Do's

```
✅ Validar con Zod
✅ Usar lib/api-utils.ts en API routes
✅ Usar Promise.all() para queries independientes
✅ Usar next/dynamic para dialogs pesados
✅ Constantes FUERA de componentes
✅ Retornar datos de transactions
✅ Usar lib/form-utils.ts para formularios
✅ Traducciones en AMBOS idiomas
✅ Probar en /es/ y /pt-BR/
```

---

## 🔄 DRY - Reutilización de Código

**ANTES de escribir código, verificar si ya existe una utilidad:**

```
lib/utils/date-utils.ts    → Fechas (formatLocalDateString, formatDateForDisplay, toDateOnly, fromDateOnly, extractDateString)
lib/utils/age.ts           → Edad (calculateExactAge, formatAge, isMesversario)
lib/utils/currency-utils.ts → Moneda (getCurrencySymbol, formatCurrency)
lib/utils/gender-utils.ts  → Género (getGenderGradient)
lib/form-utils.ts          → Forms (getStringValue, getDateValue, getTodayDateString)
lib/api-utils.ts           → APIs (withAuth, handleApiError)
lib/stores/                → Zustand stores (notification-store, cash-register-store)
```

**Reglas:**
1. **BUSCAR PRIMERO** - Antes de escribir lógica inline, revisar si existe en `lib/utils/`
2. **CREAR SI ES REUTILIZABLE** - Si la lógica puede usarse en 2+ lugares, crear una función en utils
3. **NO DUPLICAR** - Si ves código similar en otro archivo, extraerlo a un util compartido

```typescript
// ❌ MAL - Lógica inline que ya existe
const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

// ✅ BIEN - Usar el util existente
import { formatLocalDateString } from "@/lib/utils/date-utils";
const todayStr = formatLocalDateString(now);
```

```typescript
// ❌ MAL - Duplicar lógica de color por género
const getGenderColor = (gender: string) => {
  switch (gender) { case "MALE": return "from-sky-400..."; }
};

// ✅ BIEN - Usar el util existente
import { getGenderGradient } from "@/lib/utils/gender-utils";
```

---

## 🧪 Checklist de Verificación

```bash
# Ejecutar ANTES de cada commit:
npx tsc --noEmit && npm run build
```

```
□ TypeScript sin errores
□ Build exitoso
□ Textos usan t("key") - no hardcodeados
□ Traducciones en es.json Y pt-BR.json
□ Fechas formateadas según locale
□ Promise.all() para queries independientes
□ Dialogs pesados usan next/dynamic
□ Constantes fuera de componentes
□ Mobile responsive
```

---

## 🆘 Problemas Comunes

| Error | Solución |
|-------|----------|
| Module not found | `npm install`, verificar imports |
| Prisma client error | `npx prisma generate` |
| Hydration mismatch | Verificar 'use client', código browser-only |
| Decimal to Client | Serializar con `Number()` antes de pasar a componentes |
| DB query `prisma.` is not a function | **CRÍTICO:** Escapar `$` como `\$` → `prisma.\$disconnect()` |

---

## 🗄️ Database Queries (Claude)

> ⚠️ **IMPORTANTE:** En Windows/bash, el símbolo `$` debe escaparse como `\$`.
> Si ves error `prisma. is not a function`, verifica que uses `prisma.\$disconnect()` (con backslash).

```bash
cd D:/projects/next/baby-spa && node -e "
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Tu query aquí
prisma.appointment.findMany({
  take: 5,
  orderBy: { createdAt: 'desc' },
  select: { id: true, date: true, status: true, baby: { select: { name: true } } }
}).then(data => {
  console.log(JSON.stringify(data, null, 2));
}).finally(() => prisma.\$disconnect());
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

**Modelos principales:** `appointment`, `baby`, `parent`, `package`, `packagePurchase`, `session`, `event`, `eventParticipant`

---

## 📱 Mobile UX

### Modal Viewport (iOS Safari)

```tsx
// Hook para manejar viewport en iOS
function useMobileViewport() {
  const [styles, setStyles] = useState<{ height?: number; isMobile: boolean }>({ isMobile: false });

  useLayoutEffect(() => {
    function update() {
      const isMobile = window.innerWidth < 640;
      const height = window.visualViewport?.height ?? window.innerHeight;
      setStyles({ height, isMobile });
    }
    update();
    window.visualViewport?.addEventListener('resize', update);
    return () => window.visualViewport?.removeEventListener('resize', update);
  }, []);

  return styles;
}

// Aplicar en DialogContent
const { height, isMobile } = useMobileViewport();
<DialogContent style={isMobile ? { height, maxHeight: height } : undefined}>
```

---

## ⚠️ Reglas de Negocio Críticas

> **Ver `baby-spa-spec.md` para detalles completos**

```
PAQUETES:
- Siempre se selecciona paquete (no "sesión a definir")
- Default: Individual (1 sesión)
- Es PROVISIONAL hasta checkout
- Sesión se descuenta al COMPLETAR

CUOTAS:
- Configuradas POR PAQUETE (cliente no elige)
- Sistema ALERTA pero NO BLOQUEA
- Pagos flexibles

EVENTOS:
- BABIES (bebés) o PARENTS (leads)
- blockedTherapists: 0-4
- Sin penalización no-show

SLOTS:
- Staff: 5/slot, Portal: 2/slot
- PENDING_PAYMENT no bloquea slot
```
