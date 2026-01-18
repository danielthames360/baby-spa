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

### Colors (TailwindCSS)

```javascript
// tailwind.config.js - Custom colors
colors: {
  // Primary - Turquoise/Aqua (water theme)
  primary: {
    50:  '#f0fdfd',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',  // Main primary
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  // Secondary - Soft blue
  secondary: {
    50:  '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',  // Main secondary
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  // Accent - Warm yellow/gold
  accent: {
    50:  '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',  // Main accent
    500: '#f59e0b',
    600: '#d97706',
  },
}
```

### Typography

```css
/* Primary font for headings */
font-family: 'Nunito', sans-serif;

/* Body text */
font-family: 'Inter', sans-serif;
```

### Component Style Guidelines

```
BUTTONS:
├── Primary: bg-primary-500 hover:bg-primary-600 text-white
├── Secondary: bg-secondary-100 hover:bg-secondary-200 text-secondary-700
├── Outline: border-primary-500 text-primary-500 hover:bg-primary-50
└── Destructive: bg-red-500 hover:bg-red-600 text-white

CARDS:
├── Background: bg-white
├── Border: border border-gray-100
├── Shadow: shadow-sm hover:shadow-md
└── Radius: rounded-xl

INPUTS:
├── Border: border-gray-200 focus:border-primary-500
├── Focus ring: focus:ring-2 focus:ring-primary-500/20
└── Radius: rounded-lg

GENERAL:
├── Rounded corners (not sharp)
├── Soft shadows
├── Gentle transitions (duration-200)
└── Calm, professional feel
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

## 🌐 Internationalization

### Using translations
```typescript
import { useTranslations } from 'next-intl';

export function BabyForm() {
  const t = useTranslations('babies');
  
  return <h1>{t('title')}</h1>;  // "Registrar Bebé" or "Registrar Bebê"
}
```

### Translation file structure
```json
// messages/es.json
{
  "common": {
    "save": "Guardar",
    "cancel": "Cancelar"
  },
  "babies": {
    "title": "Registrar Bebé",
    "name": "Nombre completo"
  }
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
❌ Don't hardcode text (use translations)
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
```

---

## 🧪 Testing Checklist

Before committing any module:
```
□ No TypeScript errors
□ No console errors
□ npm run build succeeds
□ Feature works as expected
□ Translations work (ES & PT-BR)
□ Mobile responsive
□ Permissions work correctly
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
