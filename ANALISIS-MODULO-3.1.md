# ANÁLISIS MÓDULO 3.1 - Refactorización de Paquetes

**Fecha:** 22 de Enero de 2026
**Preparado por:** Claude Code
**Estado:** Análisis pre-implementación

---

## 1. MODELO DE DATOS ACTUAL

### 1.1 Package (Catálogo de Paquetes)

**Ubicación:** `prisma/schema.prisma:274-290`

```prisma
model Package {
  id             String  @id @default(cuid())
  name           String
  description    String?          // ✅ YA EXISTE
  category       String?          // HIDROTERAPIA, CUMPLE_MES, GRUPAL
  sessionCount   Int
  basePrice      Decimal @db.Decimal(10, 2)
  isActive       Boolean @default(true)
  sortOrder      Int     @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  purchases PackagePurchase[]
}
```

**Campos FALTANTES para Módulo 3.1:**
| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `duration` | Int | 60 | Duración en minutos |
| `requiresAdvancePayment` | Boolean | false | Si requiere pago anticipado |
| `advancePaymentAmount` | Decimal? | null | Monto del anticipo |

---

### 1.2 Appointment (Citas)

**Ubicación:** `prisma/schema.prisma:335-372`

```prisma
model Appointment {
  id     String @id @default(cuid())
  babyId String
  baby   Baby   @relation(fields: [babyId], references: [id])

  // Paquete pre-seleccionado al agendar (null = sesión a definir)  ⚠️ PROBLEMA AQUÍ
  packagePurchaseId String?
  packagePurchase   PackagePurchase? @relation(fields: [packagePurchaseId], references: [id])

  date      DateTime @db.Date
  startTime String   // HH:mm format
  endTime   String   // HH:mm format

  status AppointmentStatus @default(SCHEDULED)
  // ... más campos
}
```

**Observaciones:**
- ❌ NO existe campo `selectedPackageId` - solo hay `packagePurchaseId`
- `packagePurchaseId` es **OPCIONAL** (permite null = "sesión a definir")
- El comentario en línea 340 dice explícitamente: `(null = sesión a definir)`

---

### 1.3 Session (Sesiones)

**Ubicación:** `prisma/schema.prisma:424-449`

```prisma
model Session {
  id                String           @id @default(cuid())
  appointmentId     String           @unique
  appointment       Appointment      @relation(fields: [appointmentId], references: [id])
  babyId            String
  therapistId       String
  packagePurchaseId String?          // ⚠️ TAMBIÉN OPCIONAL
  packagePurchase   PackagePurchase? @relation(fields: [packagePurchaseId], references: [id])

  sessionNumber Int
  status        SessionStatus @default(PENDING)
  // ... más campos
}
```

**Observaciones:**
- `packagePurchaseId` también es **OPCIONAL** en Session
- Permite "trial sessions" (sesiones sin paquete vinculado)

---

### 1.4 PackagePurchase (Compras de Paquetes)

**Ubicación:** `prisma/schema.prisma:296-329`

```prisma
model PackagePurchase {
  id        String  @id @default(cuid())
  babyId    String
  packageId String

  basePrice      Decimal  @db.Decimal(10, 2)
  discountAmount Decimal  @default(0)
  discountReason String?
  finalPrice     Decimal  @db.Decimal(10, 2)

  totalSessions     Int
  usedSessions      Int @default(0)
  remainingSessions Int

  // Patrón de visitas (existente, pero no se usa mucho)
  visitPattern  String?
  fixedDay      Int?
  frequencyDays Int?

  isActive Boolean @default(true)
  // ... relaciones
}
```

**Campos FALTANTES para Fase 3 (módulos 3.3):**
| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `installments` | Int | 1 | Número de cuotas |
| `installmentAmount` | Decimal? | null | Monto por cuota |
| `paidAmount` | Decimal | 0 | Total pagado |

---

## 2. BÚSQUEDA DE "SESIÓN A DEFINIR"

### 2.1 Archivos con Referencias Directas

| Archivo | Línea | Contenido |
|---------|-------|-----------|
| `prisma/schema.prisma` | 340 | `// Paquete pre-seleccionado al agendar (null = sesión a definir)` |
| `lib/services/session-service.ts` | 77 | `* - If both are null/undefined, it's a trial session ("sesión a definir")` |
| `lib/services/session-service.ts` | 115 | `// 3. If both are null, it's a trial session ("sesión a definir")` |
| `app/api/portal/appointments/route.ts` | 177 | `// If no package provided, it's a "session to define"` |
| `app/api/portal/appointments/route.ts` | 198 | `// If no packagePurchaseId, appointment will be created as "session to define"` |
| `app/api/portal/appointments/route.ts` | 272 | `packagePurchaseId: validPackagePurchaseId, // null = "session to define"` |

### 2.2 Traducciones (messages/*.json)

**messages/es.json:**
```json
{
  "session": {
    "trialSession": "Sesión a definir",                    // línea 199
    "trialSessionDescription": "El bebé no tiene paquetes..."  // línea 200
  },
  "calendar": {
    "sessionToDefine": "Sesión a definir"                  // línea 540
  },
  "portal": {
    "appointments": {
      "sessionToDefine": "Sesión a definir"                // línea 1096
    }
  }
}
```

**messages/pt-BR.json:**
```json
{
  "session": {
    "trialSession": "Sessão a definir",                    // línea 199
  },
  "calendar": {
    "sessionToDefine": "Sessão a definir"                  // línea 540
  },
  "portal": {
    "appointments": {
      "sessionToDefine": "Sessão a definir"                // línea 1096
    }
  }
}
```

### 2.3 Lógica que Permite Citas Sin Paquete

| Archivo | Función/Componente | Descripción |
|---------|-------------------|-------------|
| `components/portal/portal-appointments.tsx:137` | `canScheduleBabies` | `// All active babies can schedule (even without packages - "session to define")` |
| `components/portal/portal-appointments.tsx:410` | `handleSubmit` | `// Package is optional - empty string means "session to define"` |
| `components/portal/portal-appointments.tsx:420` | `handleSubmit` | `packagePurchaseId: selectedPackage \|\| null, // null = session to define` |
| `components/sessions/start-session-dialog.tsx:75` | estado | `const [selectedPackage, setSelectedPackage] = useState<string>(""); // "" = auto, "trial" = trial session` |
| `components/sessions/start-session-dialog.tsx:161-162` | `handleSubmit` | `// If trial or no packages, packagePurchaseId stays null` |
| `components/sessions/complete-session-dialog.tsx:329` | `handleComplete` | `const sessionIsTrialSession = !session?.packagePurchaseId;` |
| `lib/services/appointment-service.ts:502-504` | `create` | `// Note: We no longer require a package to book an appointment` |
| `app/api/sessions/start/route.ts:10` | validación | `packagePurchaseId: z.string().optional().nullable(), // null or undefined = trial session` |

---

## 3. FLUJO DE AGENDAMIENTO ACTUAL

### 3.1 Desde Portal de Padres

**Archivo:** `components/portal/portal-appointments.tsx`

**Flujo:**
1. Padre selecciona bebé (paso 1)
2. Si bebé tiene 1 paquete → se auto-selecciona
3. Si bebé tiene múltiples paquetes → selector dropdown
4. **Si bebé NO tiene paquetes → muestra mensaje "Sesión a definir"** ⚠️
5. Padre selecciona fecha y hora
6. Se crea cita con `packagePurchaseId: null`

**¿Se requiere seleccionar paquete?** ❌ NO - permite `null`

```typescript
// línea 420
packagePurchaseId: selectedPackage || null, // null = session to define
```

### 3.2 Desde Staff (Calendario Admin)

**Archivos:**
- `components/calendar/appointment-dialog.tsx`
- `components/appointments/schedule-appointment-dialog.tsx`

**Flujo:**
1. Staff selecciona slot en calendario
2. Busca bebé por nombre/teléfono
3. Selecciona paquete existente del bebé **O** deja sin paquete
4. **Si no hay paquetes → muestra info "trial session"** ⚠️
5. Se crea cita

**¿Se requiere seleccionar paquete?** ❌ NO

### 3.3 Al Iniciar Sesión (Staff)

**Archivo:** `components/sessions/start-session-dialog.tsx`

**Flujo:**
1. Staff abre cita SCHEDULED
2. Selecciona terapeuta
3. **Si bebé tiene paquetes → selecciona uno O elige "trial"**
4. **Si bebé NO tiene paquetes → auto-selecciona "trial"**
5. Se crea sesión (con o sin paquete)

**Opciones actuales:**
- Paquetes existentes del bebé
- "Sesión a definir" (trial) → siempre disponible

### 3.4 Resumen: ¿Dónde se permite "sin paquete"?

| Ubicación | Permite sin paquete | Comportamiento |
|-----------|---------------------|----------------|
| Portal Padres - Agendar | ✅ SÍ | Muestra advertencia, pero permite agendar |
| Staff - Agendar | ✅ SÍ | Muestra info "trial session" |
| Staff - Iniciar Sesión | ✅ SÍ | Opción "Sesión a definir" |
| Staff - Checkout | ⚠️ REQUIERE | Si es trial, DEBE seleccionar paquete para cobrar |

---

## 4. COMPONENTES DE SELECCIÓN DE PAQUETES

### 4.1 ¿Existe un Componente Reutilizable?

❌ **NO existe** un componente `PackageSelector` reutilizable.

Cada lugar implementa su propia UI de selección:

### 4.2 Implementaciones Actuales

| Archivo | Tipo de UI | Contexto |
|---------|-----------|----------|
| `components/portal/portal-appointments.tsx:566-584` | Select dropdown | Portal - agendar |
| `components/sessions/start-session-dialog.tsx:276-326` | RadioGroup | Iniciar sesión |
| `components/sessions/complete-session-dialog.tsx:441-525` | Cards clickeables | Checkout (vender paquete nuevo) |
| `components/packages/sell-package-dialog.tsx:274-290` | Cards clickeables | Vender paquete (perfil bebé) |
| `components/calendar/appointment-dialog.tsx:295-320` | Select dropdown | Agendar desde calendario |

### 4.3 Campos Mostrados en Cada Lugar

| Componente | Nombre | Sesiones | Precio | Categoría | Descripción |
|------------|--------|----------|--------|-----------|-------------|
| Portal appointments | ✅ | ✅ (restantes) | ❌ | ❌ | ❌ |
| Start session | ✅ | ✅ (X/Y) | ❌ | ❌ | ❌ |
| Complete session | ✅ | ✅ | ✅ | ✅ (tabs) | ❌ |
| Sell package | ✅ | ✅ | ✅ | ✅ (tabs) | ❌ |
| Calendar dialog | ✅ | ✅ (restantes) | ❌ | ❌ | ❌ |

**Conclusión:** Se necesita un componente unificado que muestre:
- Nombre
- Descripción *(nuevo)*
- Sesiones
- Duración *(nuevo)*
- Precio
- Badge "Requiere pago anticipado" *(nuevo)*
- Categorías/Tabs

---

## 5. DURACIÓN DE SESIONES

### 5.1 ¿Cómo se Calcula Actualmente?

**Duración FIJA de 60 minutos** - hardcodeada en varios lugares.

### 5.2 Ubicaciones del Hardcode

| Archivo | Línea | Código |
|---------|-------|--------|
| `lib/services/appointment-service.ts` | 96-97 | `const SESSION_DURATION_MINUTES = 60;` |
| `lib/services/appointment-service.ts` | 99-106 | `function calculateEndTime(startTime: string): string { ... + SESSION_DURATION_MINUTES }` |
| `app/api/portal/appointments/route.ts` | 225 | `// A 60-min session occupies two 30-min slots` |
| `app/api/portal/appointments/availability/route.ts` | 107 | `// A 60-min appointment occupies 2 consecutive 30-min slots` |

### 5.3 Flujo de Cálculo de endTime

```typescript
// lib/services/appointment-service.ts:99-106
const SESSION_DURATION_MINUTES = 60;

function calculateEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + SESSION_DURATION_MINUTES;  // ⚠️ SIEMPRE +60
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours}:${endMinutes}`;
}
```

### 5.4 Slots y Disponibilidad

**Configuración en** `lib/constants/business-hours.ts`:

```typescript
export const SLOT_DURATION_MINUTES = 30;  // Cada slot = 30 min
export const SLOT_HEIGHT_PX = 80;          // Para renderizado
```

**Cálculo de slots ocupados:**
```typescript
// Una cita de 60 min ocupa 2 slots de 30 min
// Una cita de 90 min ocuparía 3 slots de 30 min
// Una cita de 30 min ocuparía 1 slot
```

### 5.5 Impacto del Cambio

Para que la duración sea variable por paquete:

1. **Leer duración del paquete** al agendar
2. **Calcular endTime** basado en duración del paquete
3. **Verificar disponibilidad** para todos los slots que ocupe
4. **Renderizar en calendario** con altura proporcional

**Funciones existentes que ya soportan esto:**
- `getAppointmentHeight(startTime, endTime)` - ya calcula altura basada en duración
- `getAppointmentSlotSpan(startTime, endTime)` - ya calcula slots ocupados
- `checkAvailabilityForTimeRange(date, startTime, endTime)` - ya verifica rango completo

**Lo que falta:**
- Pasar `duration` del paquete al crear cita
- Modificar `calculateEndTime()` para recibir duración como parámetro

---

## 6. RESUMEN DE CAMBIOS NECESARIOS

### 6.1 Migraciones de Base de Datos

```prisma
// Agregar a Package:
duration                Int       @default(60)
requiresAdvancePayment  Boolean   @default(false)
advancePaymentAmount    Decimal?  @db.Decimal(10, 2)
```

### 6.2 Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `prisma/schema.prisma` | Agregar campos a Package |
| `lib/services/appointment-service.ts` | Parametrizar duración |
| `app/api/portal/appointments/route.ts` | Usar duración del paquete |
| `app/api/portal/appointments/availability/route.ts` | Considerar duración |
| Todos los componentes de selección de paquetes | Mostrar duración |

### 6.3 Nuevo Componente a Crear

```
components/
└── packages/
    └── package-selector.tsx   # NUEVO - componente reutilizable
```

### 6.4 Traducciones a Actualizar

- Cambiar "Sesión a definir" → "Individual" (o eliminar concepto)
- Agregar: duration, durationMinutes, requiresAdvancePayment, provisional, etc.

### 6.5 Lógica de Negocio

- Eliminar opción de agendar sin paquete
- Default: Paquete "Individual" (1 sesión)
- El paquete es provisional hasta el checkout

---

## 7. PREGUNTAS PENDIENTES

1. **¿Crear paquete "Individual" automáticamente?** - Para ser el default cuando no hay paquetes
2. **¿Qué pasa con citas existentes sin paquete?** - Migración de datos
3. **¿El portal de padres debería poder agendar sin paquetes?** - Actualmente sí puede
4. **¿Mantener opción "trial" en start-session o eliminarla?**

---

*Fin del análisis*
