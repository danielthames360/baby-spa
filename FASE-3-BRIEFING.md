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

# 📦 MÓDULO 3.3: PAQUETES EN CUOTAS (ACTUALIZADO)

## Objetivo
Permitir que paquetes se vendan con plan de financiamiento configurado por paquete.

## ⚠️ REGLAS DE NEGOCIO IMPORTANTES

```
1. Las cuotas se configuran POR PAQUETE en el catálogo
   - El cliente NO elige cuántas cuotas
   - El paquete ya tiene definido: cantidad de cuotas, precio total, en qué sesiones se paga

2. El precio en cuotas puede ser MAYOR al precio de pago único
   - Ejemplo: Pago único = 2,640 Bs, En cuotas = 2,700 Bs (60 Bs de financiamiento)

3. Se define EN QUÉ SESIONES se paga cada cuota
   - Ejemplo: 8 sesiones, 3 cuotas → pagar en sesiones 1, 3 y 5

4. El sistema ALERTA pero NO BLOQUEA
   - Si el cliente está atrasado, el staff ve una alerta
   - El staff puede continuar con la sesión de todos modos

5. Los pagos son FLEXIBLES
   - Puede pagar más de una cuota a la vez
   - Puede pagar menos de una cuota (pago parcial)
   - Puede pagar todo el saldo pendiente en cualquier momento
```

## Ejemplos Reales del Negocio

| Paquete | Sesiones | Pago Único | Cuotas | Monto/Cuota | Total Cuotas | Pagar en Sesión |
|---------|----------|------------|--------|-------------|--------------|-----------------|
| Programa Inicial | 4 | 1,360 Bs | 2 | 700 Bs | 1,400 Bs | 1, 3 |
| Programa Continuidad | 8 | 2,640 Bs | 3 | 900 Bs | 2,700 Bs | 1, 3, 5 |
| Plan Integral | 20 | 6,200 Bs | 5 | 1,260 Bs | 6,300 Bs | 1, 3, 5, 7, 9 |

## Cambios en el Modelo

### Package (Catálogo) - Agregar campos

```prisma
model Package {
  // Campos existentes...
  
  // NUEVOS campos de cuotas:
  allowInstallments           Boolean   @default(false)  // ¿Permite cuotas?
  installmentsCount           Int?      // Cantidad de cuotas: 3
  installmentsTotalPrice      Decimal?  @db.Decimal(10, 2)  // Precio total en cuotas: 2,700 Bs
  installmentsPayOnSessions   String?   // En qué sesiones pagar: "1,3,5"
  
  // NOTA: installmentAmount se CALCULA: installmentsTotalPrice / installmentsCount
}
```

### PackagePurchase (Compra) - Asegurar campos

```prisma
model PackagePurchase {
  // Campos existentes...
  
  // Campos de financiamiento:
  paymentPlan                 String    @default("SINGLE")  // SINGLE | INSTALLMENTS
  installmentsCount           Int       @default(1)
  totalPrice                  Decimal   @db.Decimal(10, 2)  // Precio final (único o cuotas)
  installmentAmount           Decimal?  @db.Decimal(10, 2)  // Monto por cuota
  paidAmount                  Decimal   @default(0) @db.Decimal(10, 2)
  installmentsPayOnSessions   String?   // Copiado del Package al vender
  
  // pendingAmount = totalPrice - paidAmount (calculado)
}
```

### PackagePayment (Pagos) - Ya existe

```prisma
model PackagePayment {
  id                  String          @id @default(cuid())
  packagePurchaseId   String
  amount              Decimal         @db.Decimal(10, 2)
  paymentMethod       PaymentMethod
  reference           String?
  notes               String?
  
  paidAt              DateTime        @default(now())
  createdById         String
  
  packagePurchase     PackagePurchase @relation(...)
  createdBy           User            @relation(...)
}
```

## Lógica de Alertas

### ¿Cuándo mostrar alerta?

```typescript
// Ejemplo: Paquete 8 sesiones, cuotas en sesiones [1, 3, 5]

Sesión 1: Debe haber pagado cuota 1 (900 Bs)
Sesión 3: Debe haber pagado cuota 2 (1,800 Bs total)
Sesión 5: Debe haber pagado cuota 3 (2,700 Bs total)

// Si va a usar sesión 4 y solo pagó 900 Bs:
// → ALERTA: "Tiene un pago pendiente de 900 Bs (Cuota 2)"
// → El staff puede continuar de todos modos
```

### Función de validación

```typescript
// lib/utils/installments.ts

function getPaymentStatus(purchase) {
  const payOnSessions = parsePayOnSessions(purchase.installmentsPayOnSessions);
  const currentSession = purchase.usedSessions + 1;
  const installmentAmount = Number(purchase.installmentAmount);
  
  // Calcular cuánto debería haber pagado para esta sesión
  const installmentsDue = payOnSessions.filter(s => s <= currentSession).length;
  const expectedAmount = installmentsDue * installmentAmount;
  
  const overdueAmount = Math.max(0, expectedAmount - purchase.paidAmount);
  
  return {
    isUpToDate: overdueAmount === 0,
    overdueAmount,
    message: overdueAmount > 0 
      ? `Tiene un pago pendiente de Bs. ${overdueAmount}` 
      : null
  };
}
```

## UI de Configuración de Paquete (Admin)

```
┌─────────────────────────────────────────────────────────────┐
│ 📦 Editar Paquete                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Nombre: [Programa Continuidad____]                          │
│ Sesiones: [8___]                                            │
│ Precio (pago único): [Bs.] [2640____]                       │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ ☑️ Permitir pago en cuotas                                  │
│                                                             │
│   Cantidad de cuotas: [3___]                                │
│   Precio total en cuotas: [Bs.] [2700____]                  │
│   Monto por cuota: Bs. 900 (calculado automáticamente)      │
│                                                             │
│   ¿En qué sesiones se cobra cada cuota?                     │
│   Selecciona 3 sesiones:                                    │
│                                                             │
│   [1̲] [2] [3̲] [4] [5̲] [6] [7] [8]                          │
│    ①      ②      ③                                          │
│                                                             │
│   Cronograma: Cuota 1 → Sesión 1, Cuota 2 → Sesión 3, ...   │
│                                                             │
│                                         [Cancelar] [Guardar]│
└─────────────────────────────────────────────────────────────┘
```

## UI de Venta de Paquete (Staff)

```
┌─────────────────────────────────────────────────────────────┐
│ 💰 Vender Paquete                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Paquete: Programa Continuidad (8 sesiones)                  │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ Forma de pago:                                              │
│                                                             │
│ ┌─────────────────────┐  ┌─────────────────────┐            │
│ │    Pago Único       │  │     3 Cuotas        │            │
│ │                     │  │                     │            │
│ │    Bs. 2,640        │  │   Bs. 900 c/u       │            │
│ │                     │  │   Total: 2,700      │            │
│ └─────────────────────┘  └─────────────────────┘            │
│                                ↑ seleccionado               │
│                                                             │
│ 📅 Se cobra en: Sesión 1, 3 y 5                             │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ Primera cuota hoy: Bs. 900                                  │
│ Método: [Efectivo ▼]                                        │
│ Referencia: [____________]                                  │
│                                                             │
│                              [Cancelar] [Confirmar Venta]   │
└─────────────────────────────────────────────────────────────┘
```

## UI Card de Paquete (Perfil del Bebé)

```
┌─────────────────────────────────────────────────────────────┐
│ 📦 Programa Continuidad                                     │
│                                                             │
│ Sesiones: ████████░░░░░░░░ 4/8                             │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ 💳 Plan de pagos (3 cuotas):                                │
│                                                             │
│ Cuota 1 (Sesión 1): ✅ Bs. 900 - 15/01/2026                │
│ Cuota 2 (Sesión 3): ⚠️ Bs. 900 - PENDIENTE                 │
│ Cuota 3 (Sesión 5): ⏳ Bs. 900 - Próxima                   │
│                                                             │
│ Total pagado: Bs. 900 / 2,700                               │
│ Saldo pendiente: Bs. 1,800                                  │
│                                                             │
│ ⚠️ Cuota 2 atrasada (debió pagarse en sesión 3)            │
│                                                             │
│ [Registrar Pago]                                            │
└─────────────────────────────────────────────────────────────┘
```

## UI Alerta al Iniciar Sesión

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Pago Pendiente                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ María García tiene un pago atrasado en su paquete.          │
│                                                             │
│ Paquete: Programa Continuidad                               │
│ Sesión actual: 4 de 8                                       │
│                                                             │
│ Cuota 2 (Sesión 3): Bs. 900 - NO PAGADA                    │
│                                                             │
│ Total pagado: Bs. 900 / 2,700                               │
│ Saldo pendiente: Bs. 1,800                                  │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ ¿Qué desea hacer?                                           │
│                                                             │
│ [Registrar Pago]  [Continuar sin Pagar]                     │
└─────────────────────────────────────────────────────────────┘
```

## Ejemplos de Pagos Flexibles

### Ejemplo 1: Pago Normal
```
Paquete: 8 sesiones, 3 cuotas de 900 Bs, pagar en sesiones 1,3,5

Sesión 1: Paga 900 Bs ✅
Sesión 2: Sin pago (OK, próxima cuota en sesión 3)
Sesión 3: Paga 900 Bs ✅
Sesión 4: Sin pago (OK)
Sesión 5: Paga 900 Bs ✅
Sesión 6-8: Sin pagos adicionales
```

### Ejemplo 2: Pago Adelantado
```
Sesión 1: Paga 2,700 Bs (todo de una vez) ✅
Sesión 2-8: Sin alertas (ya pagó todo)
```

### Ejemplo 3: Pago Atrasado
```
Sesión 1: Paga 900 Bs ✅
Sesión 3: NO paga ⚠️
Sesión 4: Sistema alerta "Cuota 2 pendiente (Bs. 900)"
         Staff decide continuar sin pagar
Sesión 5: Sistema alerta "Cuota 2 y 3 pendientes (Bs. 1,800)"
         Cliente paga 1,800 Bs ✅
```

### Ejemplo 4: Pago Irregular
```
Sesión 1: Paga 900 Bs ✅
Sesión 3: Paga 600 Bs (parcial) 
          → Sistema: "300 Bs faltantes para cuota 2"
Sesión 4: Paga 400 Bs 
          → Ahora está al día
Sesión 5: Paga 800 Bs 
          → Completado ✅
```

## API Endpoints

### POST /api/package-payments
```typescript
// Registrar pago de cuota (cualquier monto)
{
  packagePurchaseId: string,
  amount: number,
  paymentMethod: 'CASH' | 'TRANSFER' | 'CARD' | 'QR',
  reference?: string,
  notes?: string
}

// El sistema:
// 1. Suma el monto a paidAmount
// 2. Crea registro PackagePayment
// 3. Retorna estado actualizado
```

### GET /api/package-purchases/[id]/payment-status
```typescript
// Obtener estado de pagos
// Respuesta:
{
  isUpToDate: boolean,
  isPaidInFull: boolean,
  paidAmount: number,
  pendingAmount: number,
  overdueAmount: number,
  installments: [
    { number: 1, amount: 900, payOnSession: 1, status: 'PAID', paidAt: '...' },
    { number: 2, amount: 900, payOnSession: 3, status: 'OVERDUE' },
    { number: 3, amount: 900, payOnSession: 5, status: 'PENDING' }
  ],
  message: 'Cuota 2 pendiente (Bs. 900)' | null
}
```

## Checklist Actualizado

```
□ Campos de cuotas en Package (allowInstallments, installmentsCount, etc.)
□ Campo installmentsPayOnSessions en Package
□ Migración de base de datos
□ Componente SessionPaymentSelector (para admin)
□ Actualizar package-form-dialog con configuración de cuotas
□ Actualizar sell-package-dialog con selector único/cuotas
□ Mostrar "se cobra en sesión X" en venta
□ PackageInstallmentsCard con estado de cada cuota
□ RegisterInstallmentPaymentDialog para pagos flexibles
□ Función getPaymentStatus() en lib/utils/installments.ts
□ Alertas en start-session-dialog (NO bloqueo)
□ Alertas en complete-session-dialog
□ API GET payment-status
□ API POST package-payments
□ Actualizar seed con paquetes reales
□ Traducciones ES y PT-BR
□ Probar pagos normales, adelantados, atrasados e irregulares
```

---

# FIN DE ACTUALIZACIÓN MÓDULO 3.3

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

# 📦 MÓDULO 3.5: AUTO-AGENDADO MASIVO (ACTUALIZADO)

## Objetivo

Permitir la generación masiva de citas para paquetes con múltiples sesiones, incluyendo:
1. **Padres** pueden indicar su preferencia de horario al agendar
2. **Staff** puede generar las citas usando la preferencia del padre o definiendo una nueva

## Flujo Completo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FLUJO DEL PADRE (Portal)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Padre selecciona paquete de 8+ sesiones                                │
│  2. Sistema pregunta: "¿Cómo quieres agendar tus sesiones?"                │
│     ○ Cita única (decidiré las demás después)                              │
│     ● Definir horario fijo para todas mis sesiones                         │
│  3. Si elige "Horario fijo":                                               │
│     - Define 1 o más horarios (ej: Lunes 9am, Jueves 3pm)                  │
│  4. Agenda su PRIMERA cita (fecha específica)                              │
│  5. Se guarda la PREFERENCIA pero NO se crean las demás citas              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DEL STAFF (Admin)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Padre llega al spa para su primera sesión                              │
│  2. Staff ve la cita con indicación:                                       │
│     "🗓️ Preferencia: Lunes 9:00, Jueves 15:00"                             │
│  3. En checkout, después de confirmar pago:                                │
│     "¿Generar las citas restantes?"                                        │
│     ○ Usar preferencia del padre                                           │
│     ○ Definir horario diferente                                            │
│  4. Staff ve preview de todas las fechas                                   │
│  5. Confirma → Se crean todas las citas                                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Modelo de Datos

### Agregar campo en PackagePurchase

```prisma
model PackagePurchase {
  // ... campos existentes ...
  
  // Preferencia de horario del padre (JSON)
  // Formato: [{"dayOfWeek": 1, "time": "09:00"}, {"dayOfWeek": 4, "time": "15:00"}]
  schedulePreferences  String?  @db.Text
  
  // Campos existentes que podemos deprecar o mantener como fallback:
  // visitPattern    String?
  // fixedDay        Int?
  // frequencyDays   Int?
}
```

### Estructura de SchedulePreference

```typescript
interface SchedulePreference {
  dayOfWeek: number;  // 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
  time: string;       // "09:00", "15:00"
}

// Ejemplos:

// Caso simple: "Lunes 9am"
[{ dayOfWeek: 1, time: "09:00" }]

// Caso múltiple: "Lunes 9am Y Jueves 3pm"
[
  { dayOfWeek: 1, time: "09:00" },
  { dayOfWeek: 4, time: "15:00" }
]

// Caso complejo: "Lunes, Miércoles y Viernes a las 10am"
[
  { dayOfWeek: 1, time: "10:00" },
  { dayOfWeek: 3, time: "10:00" },
  { dayOfWeek: 5, time: "10:00" }
]

// Caso extremo: "Lunes a Sábado 9am" (niño que va todos los días)
[
  { dayOfWeek: 1, time: "09:00" },
  { dayOfWeek: 2, time: "09:00" },
  { dayOfWeek: 3, time: "09:00" },
  { dayOfWeek: 4, time: "09:00" },
  { dayOfWeek: 5, time: "09:00" },
  { dayOfWeek: 6, time: "09:00" }
]
```

## Componentes a Crear/Modificar

### 1. SchedulePreferenceSelector (NUEVO)

```
components/
└── appointments/
    └── schedule-preference-selector.tsx
```

**Componente reutilizable para seleccionar horarios preferidos.**

**Props:**
```typescript
interface SchedulePreferenceSelectorProps {
  value: SchedulePreference[];
  onChange: (preferences: SchedulePreference[]) => void;
  maxPreferences?: number;  // Default: ilimitado
  showDayNames?: boolean;   // Mostrar nombres de días
  compact?: boolean;        // Versión compacta para móvil
}
```

**UI:**
```
┌─────────────────────────────────────────────────────────────┐
│ Mis horarios preferidos:                                    │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Horario 1:  [Lunes ▼]  a las  [09:00 ▼]    [🗑️]        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Horario 2:  [Jueves ▼]  a las  [15:00 ▼]   [🗑️]        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [+ Agregar otro horario]                                    │
└─────────────────────────────────────────────────────────────┘
```

### 2. Actualizar Wizard del Portal (portal-appointments.tsx)

**Agregar paso después de seleccionar paquete (si sessionCount > 1):**

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 ¿Cómo quieres agendar tus 8 sesiones?                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ○ Cita única                                                │
│   Agendaré las demás sesiones después                       │
│                                                             │
│ ● Definir horario fijo                                      │
│   Quiero venir siempre los mismos días y horarios           │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ [SchedulePreferenceSelector aquí]                           │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ 💡 Esto es solo una indicación. Las citas se confirmarán    │
│    cuando llegues a tu primera sesión y confirmes el pago.  │
│                                                             │
│                                              [Continuar →]  │
└─────────────────────────────────────────────────────────────┘
```

**Lógica:**
- Si elige "Cita única" → flujo normal, solo agenda 1 cita
- Si elige "Horario fijo" → guarda preferencias en la cita/paquete
- Las citas NO se generan hasta que el staff confirme

### 3. BulkSchedulingDialog (NUEVO/ACTUALIZADO)

```
components/
└── appointments/
    └── bulk-scheduling-dialog.tsx
```

**Props actualizadas:**
```typescript
interface BulkSchedulingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babyId: string;
  packagePurchaseId: string;
  availableSessions: number;
  // NUEVO: Preferencia del padre (si existe)
  parentPreferences?: SchedulePreference[];
  onComplete: (appointments: Appointment[]) => void;
}
```

**UI con preferencia del padre:**
```
┌─────────────────────────────────────────────────────────────┐
│ 📅 Generar Citas Masivas                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Bebé: María García                                          │
│ Paquete: Premium (20 sesiones)                              │
│ Disponibles: 19 sesiones                                    │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ 💡 Preferencia del padre:                                   │
│    • Lunes a las 09:00                                      │
│    • Jueves a las 15:00                                     │
│                                                             │
│ ○ Usar preferencia del padre                                │
│ ○ Definir horario diferente                                 │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ Sesiones a agendar: [19 ▼]                                  │
│                                                             │
│ Vista previa:                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✓ Lun 03/02 - 09:00                                     │ │
│ │ ✓ Jue 06/02 - 15:00                                     │ │
│ │ ✓ Lun 10/02 - 09:00                                     │ │
│ │ ⚠️ Jue 13/02 - 15:00 (2 citas en este horario)          │ │
│ │ ✓ Lun 17/02 - 09:00                                     │ │
│ │ ... (19 citas)                                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ⚠️ 1 slot tiene conflicto (se agendará igual)              │
│                                                             │
│                         [Cancelar] [Generar 19 Citas]       │
└─────────────────────────────────────────────────────────────┘
```

**Si elige "Definir horario diferente":**
- Muestra el SchedulePreferenceSelector
- Staff puede definir nuevos horarios
- Actualiza la preferencia en el paquete

### 4. Actualizar Appointment Details (Badge de Preferencia)

**Archivo:** `components/calendar/appointment-details.tsx`

Si la cita tiene un paquete con preferencia definida, mostrar:

```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Detalles de la Cita                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 👶 María García (8 meses)                                   │
│ 📦 Paquete Premium (1/20 sesiones)                          │
│                                                             │
│ 🗓️ Preferencia de horario:                                 │
│    Lunes 09:00, Jueves 15:00                                │
│                                                             │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

### 5. Actualizar Complete Session Dialog (Checkout)

**Archivo:** `components/sessions/complete-session-dialog.tsx`

Después de confirmar pago de un paquete nuevo con múltiples sesiones:

```
┌─────────────────────────────────────────────────────────────┐
│ ✅ Pago confirmado                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Paquete: Premium (20 sesiones)                              │
│ Sesiones restantes: 19                                      │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ 📅 ¿Desea agendar las sesiones restantes?                   │
│                                                             │
│ 💡 El padre indicó preferencia:                             │
│    Lunes 09:00, Jueves 15:00                                │
│                                                             │
│ [Agendar Después]  [Generar Citas Ahora]                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Si hace click en "Generar Citas Ahora" → Abre BulkSchedulingDialog

## Lógica del Generador de Fechas

### Función actualizada

```typescript
// lib/utils/bulk-scheduling.ts

interface BulkSchedulingInput {
  startDate: Date;
  preferences: SchedulePreference[];  // NUEVO: array de preferencias
  count: number;
  packageDuration: number;
}

interface GeneratedSlot {
  date: Date;
  startTime: string;
  endTime: string;
  preferenceIndex: number;  // NUEVO: cuál preferencia usó
  hasConflict: boolean;
  conflictCount: number;
}

export function generateBulkSchedule(input: BulkSchedulingInput): GeneratedSlot[] {
  const slots: GeneratedSlot[] = [];
  let currentDate = new Date(input.startDate);
  
  // Ordenar preferencias por día de la semana
  const sortedPrefs = [...input.preferences].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  
  while (slots.length < input.count) {
    const dayOfWeek = currentDate.getDay();
    
    // Saltar domingos (cerrado)
    if (dayOfWeek === 0) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }
    
    // Buscar si hay una preferencia para este día
    const prefIndex = sortedPrefs.findIndex(p => p.dayOfWeek === dayOfWeek);
    
    if (prefIndex !== -1) {
      const pref = sortedPrefs[prefIndex];
      
      // Verificar horario de trabajo
      if (isWithinBusinessHours(currentDate, pref.time)) {
        const endTime = addMinutes(pref.time, input.packageDuration);
        
        slots.push({
          date: new Date(currentDate),
          startTime: pref.time,
          endTime,
          preferenceIndex: prefIndex,
          hasConflict: false,
          conflictCount: 0
        });
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return slots;
}
```

### Ejemplo de generación

```
Preferencias: Lunes 9:00, Jueves 15:00
Paquete: 8 sesiones
Primera cita ya agendada: Lunes 03/02

Generación (empezando después de la primera):
1. Jue 06/02 - 15:00 (pref 2)
2. Lun 10/02 - 09:00 (pref 1)
3. Jue 13/02 - 15:00 (pref 2)
4. Lun 17/02 - 09:00 (pref 1)
5. Jue 20/02 - 15:00 (pref 2)
6. Lun 24/02 - 09:00 (pref 1)
7. Jue 27/02 - 15:00 (pref 2)

Total: 7 citas generadas (+ 1 ya existente = 8)
```

## Puntos de Acceso (3 lugares)

| # | Ubicación | Escenario | Tiene Preferencia? |
|---|-----------|-----------|-------------------|
| 1 | **Checkout** | Después de confirmar pago de paquete nuevo | Sí, si padre la definió |
| 2 | **Venta de Paquete** (Perfil) | Staff vende paquete directamente | No, staff la define |
| 3 | **Paquete Existente** (Perfil) | Agendar sesiones restantes | Sí, si existe |

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
// Query params: dates=2026-01-28,2026-01-30&times=09:00,15:00

// Respuesta
{
  conflicts: {
    date: string,
    time: string,
    count: number,
    available: number
  }[]
}
```

### PUT /api/package-purchases/[id]/preferences
```typescript
// Actualizar preferencia de horario
{
  schedulePreferences: SchedulePreference[]
}
```

## Reglas de Negocio

1. **Padre define preferencia (opcional):** Solo indicación, no genera citas
2. **Citas se generan cuando:** Staff confirma en checkout o manualmente
3. **Slots llenos:** Se agenda igual, staff revisa después
4. **Domingos:** Se saltan automáticamente
5. **Días cerrados:** Se saltan (consultar ClosedDate)
6. **Múltiples horarios:** Sistema alterna entre ellos
7. **Máximo:** No puede agendar más sesiones de las disponibles
8. **Sin preferencia:** Staff define desde cero en BulkSchedulingDialog
9. **Paquetes existentes:** Sin preferencia, staff define manualmente

## Traducciones Requeridas

```json
{
  "bulkScheduling": {
    "title": "Agendar Sesiones",
    "howToSchedule": "¿Cómo quieres agendar tus sesiones?",
    "singleAppointment": "Cita única",
    "singleAppointmentDesc": "Agendaré las demás sesiones después",
    "fixedSchedule": "Definir horario fijo",
    "fixedScheduleDesc": "Quiero venir siempre los mismos días y horarios",
    "preferredSchedules": "Mis horarios preferidos",
    "addSchedule": "Agregar otro horario",
    "scheduleNumber": "Horario {number}",
    "dayOfWeek": "Día",
    "time": "Hora",
    "preferenceNote": "Esto es solo una indicación. Las citas se confirmarán cuando llegues a tu primera sesión.",
    "parentPreference": "Preferencia del padre",
    "useParentPreference": "Usar preferencia del padre",
    "defineDifferent": "Definir horario diferente",
    "sessionsToSchedule": "Sesiones a agendar",
    "preview": "Vista previa",
    "conflictWarning": "{count} slot(s) tienen conflicto",
    "generateAppointments": "Generar {count} Citas",
    "scheduleNow": "¿Desea agendar las sesiones restantes?",
    "scheduleLater": "Agendar Después",
    "scheduleNowButton": "Generar Citas Ahora",
    "noPreference": "Sin preferencia definida"
  },
  "days": {
    "sunday": "Domingo",
    "monday": "Lunes",
    "tuesday": "Martes",
    "wednesday": "Miércoles",
    "thursday": "Jueves",
    "friday": "Viernes",
    "saturday": "Sábado"
  }
}
```

## Checklist Actualizado

```
MODELO DE DATOS:
□ Agregar campo schedulePreferences a PackagePurchase
□ Migración de base de datos

COMPONENTES:
□ SchedulePreferenceSelector (nuevo)
□ BulkSchedulingDialog (nuevo)
□ Actualizar portal-appointments.tsx (paso de preferencia)
□ Actualizar appointment-details.tsx (badge de preferencia)
□ Actualizar complete-session-dialog.tsx (generar citas después del pago)
□ Actualizar sell-package-dialog.tsx (opción de agendar)
□ Botón "Agendar Sesiones" en card de paquete

UTILIDADES:
□ lib/utils/bulk-scheduling.ts (generateBulkSchedule)
□ Función para verificar horarios de trabajo
□ Función para saltar domingos y días cerrados

APIS:
□ POST /api/appointments/bulk
□ GET /api/appointments/check-conflicts
□ PUT /api/package-purchases/[id]/preferences

TRADUCCIONES:
□ Agregar claves a es.json
□ Agregar claves a pt-BR.json

PRUEBAS:
□ Padre define preferencia en portal
□ Staff ve preferencia en detalle de cita
□ Staff genera citas usando preferencia del padre
□ Staff genera citas con horario diferente
□ Generar citas desde checkout
□ Generar citas desde perfil (venta nueva)
□ Generar citas desde paquete existente
□ Manejo de conflictos
□ Múltiples horarios (Lunes 9am + Jueves 3pm)
□ Caso extremo: Lunes a Sábado
```

---

# FIN DE ACTUALIZACIÓN MÓDULO 3.5
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
