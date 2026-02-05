# Análisis Exhaustivo de Flujos de Dinero - Baby Spa

**Fecha**: 5 de febrero de 2026
**Objetivo**: Identificar TODAS las fuentes de ingreso/egreso y problemas de contabilización

---

## 1. MAPA COMPLETO DE FLUJOS DE DINERO

### Fuentes de INGRESOS

| # | Concepto | PaymentParentType | Modelo Relacionado | Campos de Dinero |
|---|----------|-------------------|-------------------|------------------|
| 1 | Checkout de Sesión | `SESSION` | Session | amount (incluye paquete + productos) |
| 2 | Baby Cards | `BABY_CARD` | BabyCardPurchase | pricePaid |
| 3 | Eventos | `EVENT_PARTICIPANT` | EventParticipant | amountPaid |
| 4 | Cuotas de Paquetes | `PACKAGE_INSTALLMENT` | PackagePayment | amount |
| 5 | Anticipos de Citas | `APPOINTMENT` | AppointmentPayment | amount |

### Fuentes de EGRESOS

| # | Concepto | PaymentParentType | Modelo Relacionado | Campos de Dinero |
|---|----------|-------------------|-------------------|------------------|
| 1 | Pagos a Staff | `STAFF_PAYMENT` | StaffPayment | netAmount |
| 2 | Gastos Admin | `EXPENSE` | Expense | amount |

### Costos Directos (NO son PaymentDetail)

| # | Concepto | Modelo | Campos |
|---|----------|--------|--------|
| 1 | Productos en Sesiones | SessionProduct | unitPrice * quantity (si isChargeable) |
| 2 | Productos en Eventos | EventProductUsage | unitPrice * quantity |

---

## 2. DESCUENTOS Y CORTESÍAS IDENTIFICADOS

### A. Descuentos en Compra de Paquete (PackagePurchase)
```
Campos: discountAmount, discountReason
Cálculo: finalPrice = basePrice - discountAmount
Estado: ✅ CORRECTO - Se registra y se usa en cálculos
```

### B. Descuento Primera Sesión Baby Card
```
Campos: BabyCard.firstSessionDiscount, BabyCardPurchase.firstSessionDiscountUsed
Cálculo: Se resta del subtotal en checkout de sesión
Estado: ✅ CORRECTO - Se aplica y registra apropiadamente
```

### C. Descuento Manual en Checkout de Sesión
```
Input: discountAmount, discountReason
Cálculo: totalAmount = subtotal - discountAmount - firstSessionDiscount
Estado: ✅ CORRECTO - Se resta antes de crear PaymentDetail
```

### D. Descuentos en Eventos (EventParticipant)
```
Campos: discountType (COURTESY | FIXED), discountAmount, discountReason
Cálculo:
  - COURTESY: amountDue = 0
  - FIXED: amountDue = basePrice - discountAmount
Estado: ⚠️ PROBLEMA - Ver sección de bugs
```

### E. Precios Especiales Baby Card (BabyCardSpecialPrice)
```
Campos: specialPrice
Cálculo: Se usa en lugar de basePrice si bebé tiene Baby Card activa
Estado: ✅ CORRECTO - Se aplica en checkout
```

### F. Productos Cortesía en Sesiones (SessionProduct)
```
Campo: isChargeable (true/false)
Cálculo: Solo se cobran si isChargeable = true
Estado: ⚠️ PROBLEMA - Ver sección de bugs
```

### G. Productos en Eventos (EventProductUsage)
```
Campo: NO EXISTE isChargeable
Estado: ❌ BUG - No hay forma de marcar productos gratis
```

---

## 3. BUGS Y PROBLEMAS IDENTIFICADOS

### 🔴 BUG CRÍTICO #1: P&L suma productos cortesía como costo

**Ubicación**: `lib/services/report-service.ts` líneas 643-650

**Problema**: La query NO filtra por `isChargeable`, sumando TODOS los productos como costo:
```typescript
// ACTUAL (incorrecto)
prisma.sessionProduct.findMany({
  where: {
    session: { completedAt: { gte: from, lte: to } },
  },
  select: { quantity: true, unitPrice: true },
})

// DEBERÍA SER
prisma.sessionProduct.findMany({
  where: {
    session: { completedAt: { gte: from, lte: to } },
    isChargeable: true,  // ← FALTA ESTE FILTRO
  },
  select: { quantity: true, unitPrice: true },
})
```

**Impacto**:
- Costos directos INFLADOS
- Margen bruto REDUCIDO artificialmente
- P&L muestra menos utilidad de la real

**Severidad**: 🔴 CRÍTICA - Afecta reportes financieros

---

### 🔴 BUG CRÍTICO #2: EventProductUsage sin campo isChargeable

**Ubicación**: `prisma/schema.prisma` líneas 1294-1308

**Problema**: El modelo NO tiene campo para marcar productos como cortesía:
```prisma
model EventProductUsage {
  id          String    @id @default(cuid())
  eventId     String
  productId   String
  quantity    Int       @default(1)
  unitPrice   Decimal   @db.Decimal(10, 2)
  notes       String?
  // ❌ FALTA: isChargeable Boolean @default(true)
}
```

**Impacto**:
- No se pueden registrar productos gratis en eventos
- Todos los productos en eventos se cuentan como costo
- Costos de eventos INFLADOS

**Severidad**: 🔴 CRÍTICA - Limita funcionalidad + afecta reportes

---

### 🟠 BUG ALTO #3: Cortesías en eventos NO crean PaymentDetail

**Ubicación**: `lib/services/event-participant-service.ts` líneas 202-215, 322-336

**Problema**: Cuando `discountType = COURTESY`:
```typescript
// Se pone amountPaid = amountDue (que es 0)
amountPaid: input.discountType === "COURTESY" ? amountDue : 0,
// PERO no se crea PaymentDetail
```

**Comportamiento actual**:
1. Participante con COURTESY tiene `amountDue = 0` y `amountPaid = 0`
2. Status se cambia a CONFIRMED automáticamente
3. **NO** se crea registro en PaymentDetail

**¿Es esto un bug?**
- **Técnicamente NO** - No hay ingreso real, no debería haber PaymentDetail
- **El reporte de eventos busca PaymentDetail** - ✅ Correcto, no contaría cortesías como ingreso

**Severidad**: 🟢 OK - El comportamiento es correcto

---

### 🟠 BUG ALTO #4: Cambio a COURTESY después de pago

**Ubicación**: `lib/services/event-participant-service.ts` líneas 378-398

**Problema**: Si un participante YA PAGÓ y luego se cambia a COURTESY:
```typescript
if (discountType === "COURTESY") {
  data.status = "CONFIRMED";
  data.amountPaid = data.amountDue;  // amountDue es 0
  data.paidAt = new Date();
  // ❌ NO SE BORRA el PaymentDetail existente
  // ❌ NO SE HACE REEMBOLSO
}
```

**Impacto**:
- PaymentDetail existente queda huérfano
- Dinero cobrado pero no reembolsado
- Inconsistencia entre BD y pagos

**Severidad**: 🟠 ALTA - Pero caso de uso raro

---

### 🟡 BUG MEDIO #5: Ingresos de SESSION mezclados

**Ubicación**: Sistema completo de checkout

**Problema**: Un PaymentDetail de tipo SESSION incluye:
1. Precio del paquete vendido
2. Productos con cargo

**No hay forma de separar** cuánto fue por servicio vs cuánto por productos.

**Impacto**:
- Reportes no pueden desglosar ingresos por concepto exacto
- Hay que calcular productos desde SessionProduct y restar

**Severidad**: 🟡 MEDIA - Diseño, no bug. Se puede calcular.

---

## 4. FLUJO DETALLADO POR TIPO DE INGRESO

### FLUJO 1: Checkout de Sesión (SESSION)

```
Input: sessionId, packageId?, paymentMethod, discountAmount?, useFirstSessionDiscount?
│
├─ 1. Calcular productos con cargo
│     SELECT SUM(unitPrice * quantity) FROM SessionProduct WHERE isChargeable = true
│     → productsAmount
│
├─ 2. Calcular paquete (si se vende nuevo)
│     package.basePrice
│     - Aplicar BabyCardSpecialPrice si existe
│     → packageAmount
│
├─ 3. Subtotal
│     subtotalAmount = productsAmount + packageAmount
│
├─ 4. Aplicar descuentos
│     - discountAmount (manual)
│     - firstSessionDiscount (Baby Card, si aplica)
│     totalDiscounts = discountAmount + firstSessionDiscount
│
├─ 5. Total final
│     totalAmount = subtotalAmount - totalDiscounts
│
├─ 6. Crear PackagePurchase (si se vendió paquete)
│     finalPrice = packageAmount - (packageAmount / subtotalAmount * totalDiscounts)
│
├─ 7. Crear PaymentDetail
│     parentType: "SESSION"
│     parentId: sessionId
│     amount: totalAmount  ← INCLUYE productos + paquete - descuentos
│
└─ 8. Actualizar Baby Card progress (si aplica)
```

### FLUJO 2: Compra de Paquete con Cuotas (PACKAGE_INSTALLMENT)

```
Input: packageId, babyId, paymentPlan, discount?
│
├─ 1. Calcular precio final
│     finalPrice = basePrice - discountAmount
│
├─ 2. Si INSTALLMENTS:
│     totalPrice = package.installmentsTotalPrice (puede ser > finalPrice)
│     installmentAmount = totalPrice / installments
│
├─ 3. Crear PackagePurchase
│
├─ 4. Crear PackagePayment (primera cuota)
│     amount: installmentAmount
│
└─ 5. Crear PaymentDetail
      parentType: "PACKAGE_INSTALLMENT"
      parentId: packagePaymentId
      amount: installmentAmount
```

### FLUJO 3: Evento (EVENT_PARTICIPANT)

```
Input: eventId, babyId/parentId, discountType?, paymentMethod
│
├─ 1. Calcular monto a pagar
│     if COURTESY: amountDue = 0
│     if FIXED: amountDue = basePrice - discountAmount
│     else: amountDue = basePrice
│
├─ 2. Crear EventParticipant
│     status: COURTESY ? "CONFIRMED" : "REGISTERED"
│     amountPaid: COURTESY ? amountDue : 0
│
├─ 3. Si NO es cortesía y paga:
│     Crear PaymentDetail
│       parentType: "EVENT_PARTICIPANT"
│       parentId: participantId
│       amount: amountPaid
│
└─ 4. Productos usados en evento
      EventProductUsage (siempre con costo, sin opción cortesía)
```

### FLUJO 4: Baby Card (BABY_CARD)

```
Input: babyCardId, babyId, paymentMethod
│
├─ 1. Crear BabyCardPurchase
│     pricePaid: babyCard.price
│     firstSessionDiscountUsed: false
│
└─ 2. Crear PaymentDetail
      parentType: "BABY_CARD"
      parentId: purchaseId
      amount: pricePaid
```

---

## 5. CÁLCULO CORRECTO DE INGRESOS POR CONCEPTO

### Fórmula para nuevo reporte:

```typescript
// 1. SERVICIOS (paquetes)
const serviciosIncome =
  PaymentDetail(SESSION).sum(amount)
  - SessionProduct(isChargeable=true).sum(unitPrice * quantity)
  + PaymentDetail(PACKAGE_INSTALLMENT).sum(amount);

// 2. PRODUCTOS
const productosIncome =
  SessionProduct(isChargeable=true).sum(unitPrice * quantity);

// 3. BABY CARDS
const babyCardsIncome =
  PaymentDetail(BABY_CARD).sum(amount);

// 4. EVENTOS
const eventosIncome =
  PaymentDetail(EVENT_PARTICIPANT).sum(amount);

// 5. ANTICIPOS
const anticiposIncome =
  PaymentDetail(APPOINTMENT).sum(amount);

// VALIDACIÓN
const total = serviciosIncome + productosIncome + babyCardsIncome + eventosIncome + anticiposIncome;
// DEBE IGUALAR:
const totalPaymentDetails = PaymentDetail(INCOME_SOURCES).sum(amount);
```

---

## 6. PLAN DE CORRECCIONES

### Corrección #1: Filtrar isChargeable en P&L (URGENTE)
```typescript
// report-service.ts línea 643
prisma.sessionProduct.findMany({
  where: {
    session: { completedAt: { gte: from, lte: to } },
    isChargeable: true,  // ← AGREGAR
  },
  ...
})
```

### Corrección #2: Agregar isChargeable a EventProductUsage
```prisma
// schema.prisma
model EventProductUsage {
  ...
  isChargeable Boolean @default(true)  // ← AGREGAR
}

// Y luego en report-service.ts
WHERE isChargeable = true
```

### Corrección #3: (Opcional) Manejar cambio a COURTESY después de pago
```typescript
// event-participant-service.ts
if (discountType === "COURTESY" && existingPaymentDetail) {
  // Marcar el PaymentDetail como anulado o crear nota de crédito
  // O simplemente advertir que hay pago existente
}
```

---

## 7. RESUMEN EJECUTIVO

### ✅ Funciona Correctamente:
- Cálculo de descuentos en sesiones
- Descuento primera sesión Baby Card
- Precios especiales Baby Card
- Productos con cargo vs gratis en sesiones
- Cuotas de paquetes
- Anticipos de citas

### ❌ Requiere Corrección Inmediata:
1. **P&L suma productos gratis como costo** - Afecta reportes financieros
2. **EventProductUsage sin isChargeable** - No permite cortesías en eventos

### ⚠️ Considerar para Futuro:
1. Separar PaymentDetail de servicios vs productos
2. Manejar reembolsos cuando cambia a COURTESY

---

**Autor**: Claude Code
**Última actualización**: 5 de febrero de 2026
