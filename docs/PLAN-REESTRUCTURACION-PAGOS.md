# Plan de Reestructuración del Sistema de Pagos - v3

**Fecha**: 5 de febrero de 2026
**Estado**: ✅ COMPLETADO
**Impacto**: 🔴 ALTO - Migración de datos y cambios en múltiples módulos

---

## RESUMEN DE IMPLEMENTACIÓN

| Fase | Estado | Notas |
|------|--------|-------|
| Fase 1: Schema de Prisma | ✅ COMPLETADO | Nuevos modelos Transaction + TransactionItem |
| Fase 2: Migración de BD | ✅ COMPLETADO | Migración `payment_restructure_v3` aplicada |
| Fase 3: Transaction Service | ✅ COMPLETADO | `lib/services/transaction-service.ts` creado |
| Fase 4: Servicios | ✅ COMPLETADO | 12 servicios actualizados |
| Fase 5: API Routes | ✅ COMPLETADO | 24 rutas actualizadas |
| Fase 6: Reportes | ✅ COMPLETADO | report-service.ts y income-summary.tsx |
| Fase 7: UI | ✅ COMPLETADO | ProductSaleDialog corregido |
| Fase 8: Validación | ✅ COMPLETADO | TypeScript + Build exitoso |

---

## 0. ALCANCE COMPLETO (Escaneo Exhaustivo A-Z)

### 0.1 Servicios Modificados (12) ✅

| Servicio | Estado | Cambios Realizados |
|----------|--------|-------------------|
| `lib/services/session-service.ts` | ✅ | Checkout → Transaction + TransactionItem |
| `lib/services/package-service.ts` | ✅ | Venta paquetes → Transaction |
| `lib/services/baby-card-service.ts` | ✅ | Venta Baby Cards → Transaction |
| `lib/services/event-participant-service.ts` | ✅ | Registro eventos → Transaction |
| `lib/services/staff-payment-service.ts` | ✅ | Pagos staff → Transaction (EXPENSE) |
| `lib/services/expense-service.ts` | ✅ | Gastos → Transaction (EXPENSE) |
| `lib/services/report-service.ts` | ✅ | Queries nuevos modelos |
| `lib/services/appointment-service.ts` | ✅ | Eliminar lógica AppointmentPayment |
| `lib/services/payment-detail-service.ts` | ✅ ELIMINADO | Reemplazado por transaction-service |
| `lib/services/cash-register-service.ts` | ✅ | Actualizar queries pagos |
| `lib/services/installments.ts` | ✅ | Usar Transaction |
| `lib/services/baby-service.ts` | ✅ | Eliminar ref a PackagePayment |

### 0.2 API Routes Modificadas (24) ✅

| Ruta | Estado |
|------|--------|
| `app/api/sessions/[id]/complete/route.ts` | ✅ |
| `app/api/package-payments/route.ts` | ✅ |
| `app/api/package-payments/[id]/route.ts` | ✅ |
| `app/api/baby-cards/purchases/route.ts` | ✅ |
| `app/api/events/[id]/participants/route.ts` | ✅ |
| `app/api/events/[id]/participants/[participantId]/sales/route.ts` | ✅ **CORREGIDO** |
| `app/api/staff-payments/route.ts` | ✅ |
| `app/api/staff-payments/[id]/route.ts` | ✅ |
| `app/api/expenses/route.ts` | ✅ |
| `app/api/expenses/[id]/route.ts` | ✅ |
| `app/api/appointment-payments/route.ts` | ✅ |
| `app/api/cash-register/route.ts` | ✅ |
| `app/api/cash-register/expenses/route.ts` | ✅ |
| `app/api/reports/income/route.ts` | ✅ |
| `app/api/reports/pnl/route.ts` | ✅ |
| `app/api/reports/cashflow/route.ts` | ✅ |
| `app/api/reports/receivables/route.ts` | ✅ |
| `app/api/reports/packages/route.ts` | ✅ |
| `app/api/reports/baby-cards/route.ts` | ✅ |
| `app/api/reports/events/route.ts` | ✅ |
| `app/api/reports/payroll/route.ts` | ✅ |
| `app/api/reports/dashboard/route.ts` | ✅ |
| `app/api/portal/packages/[id]/payments/route.ts` | ✅ |
| `app/api/portal/appointments/route.ts` | ✅ |

### 0.3 Componentes UI Modificados (13) ✅

| Componente | Estado |
|------------|--------|
| `components/sessions/complete-session-dialog.tsx` | ✅ |
| `components/packages/sell-package-dialog.tsx` | ✅ |
| `components/baby-cards/sell-baby-card-dialog.tsx` | ✅ |
| `components/events/register-payment-dialog.tsx` | ✅ |
| `components/events/product-sale-dialog.tsx` | ✅ **CORREGIDO** |
| `components/packages/register-installment-payment-dialog.tsx` | ✅ |
| `components/staff-payments/staff-payment-dialog.tsx` | ✅ |
| `components/expenses/expense-dialog.tsx` | ✅ |
| `components/appointments/register-advance-dialog.tsx` | ✅ |
| `components/cash-register/cash-register-expense-dialog.tsx` | ✅ |
| `components/payments/split-payment-form.tsx` | ✅ Mantenido |
| `components/reports/income/income-summary.tsx` | ✅ **CORREGIDO** |
| `components/dashboard/*.tsx` | ✅ |

### 0.4 ✅ BUG CORREGIDO: ProductSaleDialog

**Archivo**: `components/events/product-sale-dialog.tsx`

**Problema anterior**:
- Usaba botones hardcodeados para solo 3 métodos de pago
- NO usaba SplitPaymentForm
- NO soportaba split payments
- NO incluía QR como método de pago
- Hardcodeaba "Bs." en lugar de usar formatCurrency

**Solución implementada**:
- ✅ Usa `SplitPaymentForm` (componente centralizado)
- ✅ Soporta split payments (múltiples métodos)
- ✅ Incluye los 4 métodos de pago (CASH, QR, CARD, TRANSFER)
- ✅ Usa `formatCurrency` y `getCurrencySymbol` de currency-utils
- ✅ API actualizada para aceptar `paymentMethods` array
- ✅ Crea `Transaction` con categoría `EVENT_PRODUCTS`

---

## 1. PROBLEMA RESUELTO

### 1.1 Nomenclatura ✅ CORREGIDO
- `PaymentDetail` eliminado
- Nuevo modelo `Transaction` con nombre claro

### 1.2 Line Items ✅ CORREGIDO
- `TransactionItem` permite desglose completo
- Descuentos por item soportados

### 1.3 Ventas de Productos en Eventos ✅ CORREGIDO
- Ahora crean `Transaction` con categoría `EVENT_PRODUCTS`
- Trazabilidad financiera completa

### 1.4 Split Payments ✅ CORREGIDO
- JSON array `paymentMethods` atómico
- Una sola `Transaction` por operación

---

## 2. ARQUITECTURA IMPLEMENTADA

### 2.1 Modelos Nuevos

```prisma
model Transaction {
  id              String              @id @default(cuid())
  type            TransactionType     // INCOME, EXPENSE
  category        TransactionCategory
  referenceType   String
  referenceId     String
  subtotal        Decimal             @db.Decimal(10, 2)
  discountTotal   Decimal             @default(0) @db.Decimal(10, 2)
  total           Decimal             @db.Decimal(10, 2)
  paymentMethods  Json                // [{ method, amount, reference? }]
  notes           String?
  createdById     String?
  createdBy       User?               @relation(...)
  createdAt       DateTime            @default(now())
  items           TransactionItem[]

  @@index([type])
  @@index([category])
  @@index([referenceType, referenceId])
  @@index([createdAt])
}

model TransactionItem {
  id              String      @id @default(cuid())
  transactionId   String
  transaction     Transaction @relation(...)
  itemType        ItemType
  referenceId     String?
  description     String
  quantity        Int         @default(1)
  unitPrice       Decimal     @db.Decimal(10, 2)
  discountAmount  Decimal     @default(0) @db.Decimal(10, 2)
  discountReason  String?
  finalPrice      Decimal     @db.Decimal(10, 2)
  createdAt       DateTime    @default(now())

  @@index([transactionId])
  @@index([itemType])
}
```

### 2.2 Enums Implementados

```prisma
enum TransactionType {
  INCOME
  EXPENSE
}

enum TransactionCategory {
  SESSION
  PACKAGE_SALE
  PACKAGE_INSTALLMENT
  SESSION_PRODUCTS
  EVENT_PRODUCTS
  BABY_CARD
  EVENT_REGISTRATION
  APPOINTMENT_ADVANCE
  STAFF_PAYMENT
  ADMIN_EXPENSE
}

enum ItemType {
  PACKAGE
  PRODUCT
  EVENT_TICKET
  BABY_CARD
  INSTALLMENT
  ADVANCE
  DISCOUNT
  OTHER
}
```

### 2.3 Estructura de paymentMethods (JSON)

```typescript
interface PaymentMethodEntry {
  method: "CASH" | "QR" | "CARD" | "TRANSFER";
  amount: number;
  reference?: string;
}

// Ejemplo en BD
paymentMethods: [
  { method: "CASH", amount: 200 },
  { method: "QR", amount: 150, reference: "TXN-12345" }
]
```

---

## 3. MODELOS ELIMINADOS

| Modelo | Reemplazado por |
|--------|-----------------|
| `PaymentDetail` | `Transaction` |
| `AppointmentPayment` | `Transaction` (APPOINTMENT_ADVANCE) |
| `PackagePayment` | `Transaction` (PACKAGE_INSTALLMENT) |
| `PaymentParentType` enum | `TransactionCategory` enum |

---

## 4. TRADUCCIONES ACTUALIZADAS

### messages/es.json y messages/pt-BR.json

```json
"sources": {
  "SESSION": "Sesiones / Sessões",
  "PACKAGE_SALE": "Venta de Paquetes / Venda de Pacotes",
  "PACKAGE_INSTALLMENT": "Cuotas de Paquetes / Parcelas de Pacotes",
  "SESSION_PRODUCTS": "Productos en Sesiones / Produtos em Sessões",
  "EVENT_PRODUCTS": "Productos en Eventos / Produtos em Eventos",
  "BABY_CARD": "Baby Cards",
  "EVENT_REGISTRATION": "Inscripciones a Eventos / Inscrições em Eventos",
  "APPOINTMENT_ADVANCE": "Anticipos de Citas / Adiantamentos de Consultas"
}
```

---

## 5. VALIDACIÓN FINAL

### Pre-Migración ✅
- [x] Plan aprobado
- [x] BD vaciada (ambiente desarrollo)

### Implementación ✅
- [x] Fase 1: Schema (nuevos modelos + índices)
- [x] Fase 2: Migración BD aplicada
- [x] Fase 3: Transaction Service creado
- [x] Fase 4: 12 Servicios actualizados
- [x] Fase 5: 24 API Routes actualizadas
- [x] Fase 6: Reportes actualizados
- [x] Fase 7: UI actualizada (incluyendo ProductSaleDialog)
- [x] Fase 8: Validación completa

### Post-Migración ✅
- [x] `npx tsc --noEmit` sin errores
- [x] `npm run build` exitoso
- [x] Traducciones en ambos idiomas
- [ ] Seed con datos de prueba (PENDIENTE)
- [ ] Pruebas manuales de flujos (PENDIENTE)

---

## 6. BENEFICIOS LOGRADOS

| Aspecto | Antes | Después |
|---------|-------|---------|
| Split payments | Múltiples registros | 1 registro con JSON |
| Line items | No existía | Desglose completo |
| Descuentos | Solo total | Por item |
| Ventas en eventos | Solo InventoryMovement | Transaction completa |
| Reportes | Queries complejos | Queries directos |
| Trazabilidad | Limitada | Completa |
| Métodos de pago | 3 (faltaba QR en eventos) | 4 (CASH, QR, CARD, TRANSFER) |
| Consistencia UI | Botones hardcodeados | SplitPaymentForm unificado |

---

## 7. PRÓXIMOS PASOS

1. ⏳ **Seed de datos de prueba** - Generar datos para testear
2. ⏳ **Pruebas manuales** - Verificar todos los flujos de pago
3. ⏳ **Revisión de reportes** - Validar que muestran datos correctos

---

## 8. DOCUMENTOS RELACIONADOS

| Documento | Descripción |
|-----------|-------------|
| `docs/AUDITORIA-SCHEMA-COMPLETA.md` | Auditoría del schema (actualizado) |
| `docs/DATE-HANDLING.md` | Manejo de fechas UTC |

---

**Autor**: Claude Code
**Última actualización**: 5 de febrero de 2026 - v3 COMPLETADO
