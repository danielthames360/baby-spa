# 🚀 FASE 3: PAGOS Y FINANCIAMIENTO - BRIEFING PARA CLAUDE CODE

## 📋 Resumen Ejecutivo

**Fases 1 y 2 COMPLETADAS** ✅

Ahora implementaremos el sistema completo de pagos: anticipados, cuotas, alertas y auto-agendado masivo.

**Duración estimada:** 7-10 días

---

## ✅ Estado Actual (Fases 1-2 Completadas)

```
✅ Next.js 14 + TypeScript + Tailwind
✅ Prisma + PostgreSQL (schema completo)
✅ NextAuth.js (login staff)
✅ next-intl (ES/PT-BR)
✅ Layouts + Design System (glassmorphism)
✅ Bebés y Padres (CRUD completo)
✅ Link Registro Temporal
✅ Paquetes y Ventas
✅ Calendario y Agendamiento
✅ Inventario
✅ Sesiones y Evaluaciones (checkout)
```

---

## 🎯 Objetivos de la Fase 3

| Módulo | Descripción | Prioridad |
|--------|-------------|:---------:|
| 3.1 | Refactorización de Paquetes | 🔴 Alta |
| 3.2 | Sistema de Pagos Anticipados | 🔴 Alta |
| 3.3 | Paquetes en Cuotas | 🔴 Alta |
| 3.4 | Alertas de Deuda | 🟡 Media |
| 3.5 | Auto-Agendado Masivo | 🔴 Alta |

---

# 📦 MÓDULO 3.1: REFACTORIZACIÓN DE PAQUETES

## Objetivo
Eliminar el concepto de "sesión a definir" y mejorar el modelo de paquetes.

## Cambios en el Modelo

### Package (agregar campos)
```prisma
model Package {
  // Campos existentes...
  
  // NUEVOS CAMPOS:
  description             String?   // Descripción detallada para padres
  duration                Int       @default(60) // Duración en minutos
  requiresAdvancePayment  Boolean   @default(false)
  advancePaymentAmount    Decimal?  // Monto del anticipo requerido
}
```

### Migración
```bash
npx prisma migrate dev --name add_package_fields
```

## Cambios en UI

### 1. Selector de Paquetes Mejorado

Crear componente reutilizable:
```
components/
└── packages/
    └── package-selector.tsx   # Nuevo componente
```

**Características:**
- Mostrar categorías (tabs o filtros)
- Card por paquete con:
  - Nombre
  - Descripción
  - Sesiones
  - Duración
  - Precio
  - Badge si requiere pago anticipado
- Indicador visual si el padre ya tiene ese paquete con sesiones

**Uso:**
- Portal padres: al agendar
- Staff: al agendar, al iniciar sesión, al checkout
- Modal de venta de paquete

### 2. Eliminar "Sesión a Definir"

Buscar y eliminar en TODO el código:
```
- "sesión a definir"
- "session to define"
- "sessão a definir"
- selectedPackageId: null (cuando no se seleccionaba nada)
```

**Reemplazar por:**
- Default: primer paquete de categoría "Individual" (1 sesión)
- Siempre guardar un `selectedPackageId`

### 3. Mensaje para Padres

En el selector de paquetes del portal:
```
"Este paquete es provisional. Puedes cambiarlo cuando llegues al spa."
```

Traducir a ES y PT-BR.

### 4. Actualizar Calendario

El calendario debe respetar la duración del paquete:
- Paquete 60 min → ocupa 2 slots de 30 min
- Paquete 90 min → ocupa 3 slots de 30 min
- Paquete 120 min → ocupa 4 slots de 30 min

**Archivos a modificar:**
- `lib/services/appointment-service.ts`
- `components/calendar/` (varios)
- API de disponibilidad

---

# 📦 MÓDULO 3.2: SISTEMA DE PAGOS ANTICIPADOS

## Objetivo
Permitir que algunos paquetes requieran un pago antes de confirmar la cita.

## Cambios en el Modelo

### AppointmentStatus (agregar estado)
```prisma
enum AppointmentStatus {
  PENDING_PAYMENT  // NUEVO - Esperando pago anticipado
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}
```

### Appointment (agregar campo)
```prisma
model Appointment {
  // Campos existentes...
  
  isPendingPayment    Boolean   @default(false) // Redundante pero útil para queries
}
```

### AppointmentPayment (nuevo modelo)
```prisma
model AppointmentPayment {
  id              String        @id @default(cuid())
  appointmentId   String
  amount          Decimal
  paymentMethod   PaymentMethod
  paymentType     String        // ADVANCE | COMPLETION | PARTIAL
  reference       String?       // Número de comprobante
  
  createdAt       DateTime      @default(now())
  createdById     String
  
  appointment     Appointment   @relation(fields: [appointmentId], references: [id])
  createdBy       User          @relation(fields: [createdById], references: [id])
}
```

## Flujo de Pago Anticipado

### Desde Portal de Padres

```
1. Padre selecciona paquete que requiere pago
2. Selecciona fecha y hora
3. Al confirmar:
   a. Se crea cita con status = PENDING_PAYMENT
   b. Se muestra pantalla de pago:
      - QR de pago (imagen estática de configuración)
      - Monto a pagar (advancePaymentAmount)
      - Botón "Enviar comprobante por WhatsApp"
      - Mensaje: "Tu cita quedará confirmada cuando verifiquemos tu pago"
4. Padre paga y envía comprobante por WhatsApp
5. Staff recibe, verifica el pago
6. Staff registra pago en sistema
7. Cita cambia a SCHEDULED
```

### Desde Staff

```
1. Staff selecciona paquete que requiere pago
2. Staff YA recibió el pago (o lo está recibiendo en persona)
3. Al agendar, puede:
   a. Marcar "Pago anticipado recibido" → SCHEDULED directo
   b. No marcar → PENDING_PAYMENT (raro desde staff)
```

## Componentes a Crear

### 1. Pantalla de Pago (Portal)
```
app/[locale]/(portal)/
└── payment/
    └── [appointmentId]/
        └── page.tsx
```

**Contenido:**
- QR de pago (desde configuración)
- Monto a pagar
- Instrucciones
- Botón WhatsApp: `wa.me/[número]?text=[mensaje]`
- Mensaje de confirmación pendiente

### 2. Modal Registrar Pago Anticipado (Staff)
```
components/
└── appointments/
    └── register-advance-payment-dialog.tsx
```

**Campos:**
- Monto (pre-llenado con advancePaymentAmount, editable)
- Método de pago (Cash, Transfer, Card, QR)
- Referencia/Comprobante (opcional)
- Botón: "Confirmar Pago"

### 3. Visualización en Calendario

Citas PENDING_PAYMENT:
- Color diferente (ej: naranja con patrón rayado)
- Badge: "⏳ Pendiente de pago"
- NO bloquean el slot (otros pueden agendar ahí)
- No se pueden iniciar hasta confirmar pago

**Modificar:**
- `components/calendar/appointment-card.tsx`
- `components/calendar/time-slot.tsx`
- API de disponibilidad (no contar PENDING_PAYMENT)

## API Endpoints

### POST /api/appointment-payments
```typescript
// Registrar pago anticipado
{
  appointmentId: string,
  amount: number,
  paymentMethod: 'CASH' | 'TRANSFER' | 'CARD' | 'QR',
  reference?: string
}

// Respuesta: confirma pago y cambia cita a SCHEDULED
```

### GET /api/appointments/pending-payment
```typescript
// Lista de citas pendientes de pago (para staff)
// Respuesta: lista de citas con status PENDING_PAYMENT
```

---

# 📦 MÓDULO 3.3: PAQUETES EN CUOTAS

## Objetivo
Permitir que paquetes grandes se paguen en cuotas.

## Cambios en el Modelo

### PackagePurchase (agregar campos)
```prisma
model PackagePurchase {
  // Campos existentes...
  
  // NUEVOS CAMPOS para financiamiento:
  installments      Int       @default(1)  // Número de cuotas
  installmentAmount Decimal?  // Monto por cuota
  paidAmount        Decimal   @default(0)  // Total pagado hasta ahora
  // pendingAmount se calcula: finalPrice - paidAmount
}
```

### PackagePayment (nuevo modelo)
```prisma
model PackagePayment {
  id                  String          @id @default(cuid())
  packagePurchaseId   String
  installmentNumber   Int             // 1, 2, 3, 4...
  amount              Decimal
  paymentMethod       PaymentMethod
  reference           String?
  
  paidAt              DateTime        @default(now())
  createdById         String
  
  packagePurchase     PackagePurchase @relation(fields: [packagePurchaseId], references: [id])
  createdBy           User            @relation(fields: [createdById], references: [id])
}
```

## Lógica de Tramos

**Configuración:**
```typescript
// Cuántas sesiones habilita cada cuota
function getSessionsPerInstallment(totalSessions: number, installments: number): number {
  return Math.ceil(totalSessions / installments);
}

// Ejemplo: 20 sesiones en 4 cuotas = 5 sesiones por cuota
// Cuota 1 → sesiones 1-5
// Cuota 2 → sesiones 6-10
// Cuota 3 → sesiones 11-15
// Cuota 4 → sesiones 16-20
```

**Validación al usar sesión:**
```typescript
function canUseSession(purchase: PackagePurchase): { allowed: boolean; message?: string } {
  const sessionsPerInstallment = getSessionsPerInstallment(
    purchase.totalSessions, 
    purchase.installments
  );
  
  const nextSession = purchase.usedSessions + 1;
  const requiredInstallment = Math.ceil(nextSession / sessionsPerInstallment);
  
  // Contar cuotas pagadas
  const paidInstallments = Math.floor(purchase.paidAmount / purchase.installmentAmount);
  
  if (paidInstallments < requiredInstallment) {
    return {
      allowed: false,
      message: `Debe pagar la cuota ${requiredInstallment} para usar la sesión ${nextSession}`
    };
  }
  
  return { allowed: true };
}
```

## UI de Venta con Cuotas

### En el Checkout (sell-package-dialog.tsx)

**Agregar selector de cuotas:**
```
Paquete Premium (20 sesiones) - 2000 Bs

¿Cómo desea pagar?
○ 1 cuota: 2000 Bs (pago único)
○ 2 cuotas: 1000 Bs c/u
○ 4 cuotas: 500 Bs c/u

Primera cuota a pagar hoy: 500 Bs
```

**Flujo:**
1. Staff selecciona paquete
2. Staff selecciona número de cuotas
3. Sistema calcula monto por cuota
4. Staff registra pago de primera cuota
5. Se crea PackagePurchase con:
   - installments = 4
   - installmentAmount = 500
   - paidAmount = 500
6. Se crea PackagePayment (cuota 1)

Tabien deberiamos poder hacer la compra de un paquete en cuotas desde la pagina del bebe, donde ya vendemos paquetes actualmente 

### Vista de Paquete del Bebé

En el perfil del bebé, mostrar estado de pagos:
```
┌─────────────────────────────────────────────┐
│ 📦 Paquete Premium (20 sesiones)            │
│                                             │
│ Sesiones: ████████░░░░░░░░░░░░ 8/20        │
│                                             │
│ Pagos:                                      │
│ ├── Cuota 1: ✅ 500 Bs (15/01/2026)        │
│ ├── Cuota 2: ✅ 500 Bs (30/01/2026)        │
│ ├── Cuota 3: ⏳ 500 Bs (pendiente)         │
│ └── Cuota 4: ⏳ 500 Bs (pendiente)         │
│                                             │
│ Total: 1000 / 2000 Bs                       │
│ Saldo pendiente: 1000 Bs                    │
│                                             │
│ [Registrar Pago]                            │
└─────────────────────────────────────────────┘
```

### Modal Registrar Pago de Cuota
```
components/
└── packages/
    └── register-installment-payment-dialog.tsx
```

**Campos:**
- Cuota a pagar (auto-detecta la siguiente pendiente)
- Monto (pre-llenado, editable para pagos parciales 1x1)
- Método de pago
- Referencia

## API Endpoints

### POST /api/package-payments
```typescript
{
  packagePurchaseId: string,
  installmentNumber: number,
  amount: number,
  paymentMethod: string,
  reference?: string
}
```

### GET /api/package-purchases/[id]/payments
```typescript
// Historial de pagos de un paquete
```

### GET /api/package-purchases/[id]/can-use-session
```typescript
// Validar si puede usar siguiente sesión
// Respuesta: { allowed: boolean, message?: string }
```

---

# 📦 MÓDULO 3.4: ALERTAS DE DEUDA

## Objetivo
Mostrar alertas cuando hay pagos pendientes y generar reportes.

## Alertas en UI

### 1. En Detalle de Cita

Si el bebé tiene paquete con saldo pendiente Y está por usar sesión que requiere pago:
```
⚠️ Este bebé debe pagar la cuota 3 (500 Bs) para continuar usando el paquete.
[Registrar Pago]
```

### 2. En Perfil del Bebé

Badge en la card de paquete:
```
🔴 Saldo pendiente: 1000 Bs
```

### 3. En Checkout

Antes de completar:
```
⚠️ Atención: El paquete tiene un saldo pendiente de 1000 Bs.
¿Desea registrar un pago adicional?

[Continuar sin pagar] [Registrar Pago]
```

### 4. Widget en Dashboard (opcional)

Card con resumen:
```
💰 Saldos Pendientes
├── 5 paquetes con saldo
├── Total: 4,500 Bs
└── [Ver detalle]
```

## Reportes

### Reporte: Paquetes con Saldo Pendiente

**Ruta:** `/admin/reports/pending-payments`

**Columnas:**
- Bebé
- Padre (teléfono)
- Paquete
- Total
- Pagado
- Pendiente
- Sesiones usadas / total
- Última actividad

**Filtros:**
- Rango de fechas
- Monto pendiente mínimo
- Ordenar por: monto, fecha, sesiones

### API

```typescript
// GET /api/reports/pending-payments
{
  purchases: [
    {
      id: string,
      baby: { name, id },
      parent: { name, phone },
      package: { name },
      totalPrice: number,
      paidAmount: number,
      pendingAmount: number,
      usedSessions: number,
      totalSessions: number,
      lastActivityAt: Date
    }
  ],
  summary: {
    totalPurchases: number,
    totalPending: number
  }
}
```

---

# 🔧 CONFIGURACIÓN DE QR DE PAGO

## Modelo

Agregar a Settings o crear nuevo modelo:
```prisma
model PaymentSettings {
  id              String    @id @default(cuid())
  qrImageUrl      String?   // URL de la imagen del QR
  whatsappNumber  String?   // Número de WhatsApp
  whatsappMessage String?   // Mensaje predeterminado
  
  updatedAt       DateTime  @updatedAt
}
```

## UI de Configuración

**Ruta:** `/admin/settings/payment`

**Campos:**
- Subir imagen QR (guardar en public o usar servicio de archivos)
- Número WhatsApp (con código de país)
- Mensaje predeterminado (con variables: {monto}, {fecha}, {bebe})

---

# 📝 TRADUCCIONES REQUERIDAS

Agregar a `messages/es.json` y `messages/pt-BR.json`:

```json
{
  "packages": {
    "description": "Descripción",
    "duration": "Duración",
    "durationMinutes": "{minutes} minutos",
    "requiresAdvancePayment": "Requiere pago anticipado",
    "advancePaymentAmount": "Monto del anticipo",
    "provisional": "Este paquete es provisional. Puedes cambiarlo en el spa.",
    "selectPackage": "Seleccionar paquete",
    "noPackageSelected": "Debe seleccionar un paquete"
  },
  "payments": {
    "pendingPayment": "Pendiente de pago",
    "advancePayment": "Pago anticipado",
    "registerPayment": "Registrar pago",
    "paymentConfirmed": "Pago confirmado",
    "waitingPayment": "Esperando confirmación de pago",
    "paymentInstructions": "Escanea el QR y envía tu comprobante por WhatsApp",
    "sendWhatsapp": "Enviar comprobante",
    "amount": "Monto",
    "method": "Método de pago",
    "reference": "Referencia/Comprobante"
  },
  "installments": {
    "title": "Cuotas",
    "payInInstallments": "Pagar en cuotas",
    "numberOfInstallments": "Número de cuotas",
    "installmentAmount": "Monto por cuota",
    "paidInstallments": "Cuotas pagadas",
    "pendingInstallments": "Cuotas pendientes",
    "installment": "Cuota {number}",
    "paid": "Pagada",
    "pending": "Pendiente",
    "payInstallment": "Pagar cuota",
    "mustPayInstallment": "Debe pagar la cuota {number} para continuar"
  },
  "debt": {
    "pendingBalance": "Saldo pendiente",
    "totalPending": "Total pendiente",
    "paymentRequired": "Pago requerido",
    "continueWithoutPaying": "Continuar sin pagar",
    "reportTitle": "Reporte de Saldos Pendientes"
  },
  "bulkScheduling": {
    "title": "Agendar Sesiones",
    "scheduleSessions": "Agendar Sesiones",
    "availableSessions": "{count} sesiones disponibles para agendar",
    "singleAppointment": "Una sola cita",
    "fixedSchedule": "Horario fijo (múltiples citas)",
    "goToCalendar": "Ir al calendario",
    "selectDays": "Seleccionar día(s)",
    "selectTime": "Seleccionar hora",
    "quantity": "Cantidad de citas",
    "preview": "Vista previa",
    "appointmentsUntil": "citas hasta",
    "conflictWarning": "{count} slots tienen conflictos (se agendarán igual)",
    "scheduleNow": "¿Agendar sesiones ahora?",
    "scheduleAfter": "No, el cliente agendará después",
    "scheduleFixed": "Sí, definir horario fijo",
    "confirmSchedule": "Agendar {count} Citas"
  }
}
```

---

# 📦 MÓDULO 3.5: AUTO-AGENDADO MASIVO

## Objetivo
Permitir al staff generar múltiples citas de una vez para paquetes con varias sesiones.

## Puntos de Acceso

El auto-agendado se puede activar desde **3 lugares**:

| # | Ubicación | Escenario | Componente |
|---|-----------|-----------|------------|
| 1 | Checkout de Sesión | Venta de paquete nuevo al completar cita | `complete-session-dialog.tsx` |
| 2 | Venta de Paquete (Perfil Bebé) | Padre paga anticipadamente sin cita | `sell-package-dialog.tsx` |
| 3 | Paquete Existente (Perfil Bebé) | Cliente decide cambiar a horario fijo | Card del paquete + nuevo modal |

## Componentes a Crear

### 1. BulkSchedulingDialog (Nuevo)
```
components/
└── appointments/
    └── bulk-scheduling-dialog.tsx
```

**Props:**
```typescript
interface BulkSchedulingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babyId: string;
  packagePurchaseId: string;
  availableSessions: number;  // Sesiones sin agendar
  onComplete: (appointments: Appointment[]) => void;
}
```

**UI:**
```
┌─────────────────────────────────────────────────────────────┐
│ 📅 Agendar Sesiones                                         │
│                                                             │
│ Bebé: María García                                          │
│ Paquete: Premium (20 sesiones)                              │
│ Disponibles para agendar: 12                                │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ Día(s) de la semana:                                        │
│ [ ] Lun  [✓] Mar  [ ] Mié  [✓] Jue  [ ] Vie  [ ] Sáb      │
│                                                             │
│ Hora: [10:00 ▼]                                            │
│                                                             │
│ Cantidad de citas: [12 ▼]                                  │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ Vista previa:                                               │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Mar 28/01/2026 - 10:00                                  ││
│ │ Jue 30/01/2026 - 10:00                                  ││
│ │ Mar 04/02/2026 - 10:00                                  ││
│ │ Jue 06/02/2026 - 10:00                                  ││
│ │ ... (12 citas hasta Jue 20/03/2026)                     ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ⚠️ 2 slots tienen conflictos (se agendarán igual)          │
│                                                             │
│                           [Cancelar] [Agendar 12 Citas]     │
└─────────────────────────────────────────────────────────────┘
```

### 2. Actualizar SellPackageDialog

Agregar sección al final antes del botón confirmar:

```typescript
// En sell-package-dialog.tsx, después de seleccionar cuotas:

{selectedPackage?.sessionCount > 1 && (
  <div className="space-y-3">
    <Label>{t('bulkScheduling.scheduleNow')}</Label>
    <RadioGroup value={scheduleOption} onValueChange={setScheduleOption}>
      <RadioGroupItem value="later">
        {t('bulkScheduling.scheduleAfter')}
      </RadioGroupItem>
      <RadioGroupItem value="now">
        {t('bulkScheduling.scheduleFixed')}
      </RadioGroupItem>
    </RadioGroup>
    
    {scheduleOption === 'now' && (
      <Button variant="outline" onClick={() => setShowBulkScheduling(true)}>
        {t('bulkScheduling.configurar')}...
      </Button>
    )}
  </div>
)}
```

### 3. Actualizar Card de Paquete (Perfil Bebé)

```typescript
// En la card del paquete activo, agregar botón:

const unscheduledSessions = purchase.remainingSessions - scheduledAppointments.length;

{unscheduledSessions > 0 && (
  <Button 
    variant="outline" 
    size="sm"
    onClick={() => setShowBulkScheduling(true)}
  >
    <Calendar className="w-4 h-4 mr-2" />
    {t('bulkScheduling.scheduleSessions')} ({unscheduledSessions})
  </Button>
)}
```

## Lógica del Generador de Fechas

```typescript
// lib/utils/bulk-scheduling.ts

interface BulkSchedulingInput {
  startDate: Date;           // Fecha desde la cual empezar
  daysOfWeek: number[];      // 0=Dom, 1=Lun, 2=Mar, etc.
  time: string;              // "10:00"
  count: number;             // Cantidad de citas a generar
  packageDuration: number;   // Duración en minutos
}

interface GeneratedSlot {
  date: Date;
  startTime: string;
  endTime: string;
  hasConflict: boolean;      // Si el slot ya tiene citas
  conflictCount: number;     // Cuántas citas hay en ese slot
}

export function generateBulkSchedule(input: BulkSchedulingInput): GeneratedSlot[] {
  const slots: GeneratedSlot[] = [];
  let currentDate = new Date(input.startDate);
  
  while (slots.length < input.count) {
    // Saltar domingos (cerrado)
    if (currentDate.getDay() === 0) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }
    
    // Verificar si es un día seleccionado
    if (input.daysOfWeek.includes(currentDate.getDay())) {
      // Verificar que esté dentro del horario de trabajo
      if (isWithinBusinessHours(currentDate, input.time)) {
        const endTime = addMinutes(input.time, input.packageDuration);
        
        slots.push({
          date: new Date(currentDate),
          startTime: input.time,
          endTime: endTime,
          hasConflict: false,  // Se verificará después con API
          conflictCount: 0
        });
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return slots;
}
```

## API Endpoints

### POST /api/appointments/bulk
```typescript
// Crear múltiples citas de una vez
{
  babyId: string,
  packagePurchaseId: string,
  appointments: {
    date: string,      // "2026-01-28"
    startTime: string, // "10:00"
    endTime: string    // "11:00"
  }[]
}

// Respuesta
{
  created: number,
  appointments: Appointment[],
  conflicts: {
    date: string,
    existingCount: number
  }[]
}
```

### GET /api/appointments/check-conflicts
```typescript
// Verificar conflictos antes de crear
{
  dates: string[],
  time: string
}

// Respuesta
{
  conflicts: {
    date: string,
    count: number,    // Citas existentes
    available: number // Slots disponibles (5 - count)
  }[]
}
```

## Reglas de Negocio

1. **Slots llenos:** Se agenda igual, staff revisa después
2. **Domingos:** Se saltan automáticamente
3. **Horarios:** Solo dentro de horarios de trabajo
4. **Días cerrados:** Se saltan (consultar ClosedDate)
5. **Múltiples días:** Puede seleccionar Lun + Jue, por ejemplo
6. **Máximo:** No puede agendar más sesiones de las disponibles
7. **Paquete vinculado:** Todas las citas quedan con packagePurchaseId

## Flujo Completo

### Desde Venta de Paquete (Perfil Bebé)

```
1. Staff abre perfil del bebé
2. Click "Vender Paquete"
3. Selecciona: Premium (20 sesiones)
4. Selecciona: 4 cuotas
5. Marca: "Sí, definir horario fijo"
6. Click: "Configurar..."
7. Se abre BulkSchedulingDialog:
   - Selecciona: Martes y Jueves
   - Selecciona: 10:00
   - Cantidad: 20
   - Ve vista previa
8. Click: "Agendar 20 Citas"
9. Vuelve al dialog de venta
10. Registra pago de primera cuota
11. Click: "Confirmar Venta"
12. Sistema crea:
    - PackagePurchase
    - PackagePayment (cuota 1)
    - 20 Appointments
```

### Desde Paquete Existente

```
1. Staff abre perfil del bebé
2. Ve paquete: Premium (8 usadas, 12 restantes)
3. Ve: "9 citas sin agendar"
4. Click: "Agendar Sesiones"
5. Se abre BulkSchedulingDialog
6. Configura horario
7. Click: "Agendar 9 Citas"
8. Sistema crea 9 Appointments vinculados al paquete
```

---

# ✅ CHECKLIST POR MÓDULO

## Módulo 3.1: Refactorización de Paquetes
```
□ Migración: agregar campos a Package
□ Eliminar "sesión a definir" de todo el código
□ Componente PackageSelector mejorado
□ Default al agendar: Individual
□ Mensaje provisional para padres
□ Calendario respeta duración
□ Traducciones ES y PT-BR
□ Probar en ambos idiomas
```

## Módulo 3.2: Pagos Anticipados
```
□ Agregar estado PENDING_PAYMENT
□ Modelo AppointmentPayment
□ Migración de base de datos
□ Pantalla de pago (portal)
□ Modal registrar pago (staff)
□ Visualización en calendario
□ API de pagos anticipados
□ Citas PENDING_PAYMENT no bloquean slot
□ Traducciones
□ Probar flujo completo
```

## Módulo 3.3: Paquetes en Cuotas
```
□ Campos de financiamiento en PackagePurchase
□ Modelo PackagePayment
□ Migración de base de datos
□ Lógica de tramos
□ UI venta con cuotas
□ Vista de pagos en perfil bebé
□ Modal registrar pago de cuota
□ Validación al usar sesión
□ APIs
□ Traducciones
□ Probar flujo completo
```

## Módulo 3.4: Alertas de Deuda
```
□ Alerta en detalle de cita
□ Badge en perfil de bebé
□ Alerta en checkout
□ Página de reporte
□ API de reporte
□ Traducciones
```

## Módulo 3.5: Auto-Agendado Masivo
```
□ Componente BulkSchedulingDialog
□ Función generateBulkSchedule
□ API POST /api/appointments/bulk
□ API GET /api/appointments/check-conflicts
□ Integrar en SellPackageDialog
□ Integrar en CompleteSessionDialog (checkout)
□ Botón "Agendar Sesiones" en card de paquete
□ Verificar conflictos en tiempo real
□ Saltar domingos y días cerrados
□ Traducciones ES y PT-BR
□ Probar los 3 flujos de acceso
```

---

# 🚀 COMENZAR

Para iniciar la Fase 3, decirle a Claude Code:

> "Vamos a comenzar la Fase 3: Pagos y Financiamiento.
> 
> Lee BABY-SPA-SPEC.md y CLAUDE.md para el contexto completo.
> 
> Empezamos con el **Módulo 3.1: Refactorización de Paquetes**.
> 
> Tareas:
> 1. Agregar campos a Package (description, duration, requiresAdvancePayment, advancePaymentAmount)
> 2. Crear migración
> 3. Eliminar concepto 'sesión a definir' de todo el código
> 4. Crear componente PackageSelector mejorado
> 5. Actualizar el calendario para respetar duración
> 
> Sigue el Design System (glassmorphism) y las convenciones del proyecto."

---

¡Buena suerte con la Fase 3! 🎉
