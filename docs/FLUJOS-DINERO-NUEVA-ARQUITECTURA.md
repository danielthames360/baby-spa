# Flujos de Dinero - Nueva Arquitectura

**Fecha**: 5 de febrero de 2026
**Propósito**: Explicar cómo cada flujo de dinero funcionará con la nueva estructura `Transaction`

---

## 1. MAPA VISUAL DE TODOS LOS FLUJOS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           💰 INGRESOS (INCOME)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📋 SESIONES                    📦 PAQUETES                                 │
│  ┌─────────────────────┐       ┌─────────────────────┐                     │
│  │ Checkout de sesión  │       │ Venta paquete nuevo │                     │
│  │ + Productos vendidos│       │ (contado o cuotas)  │                     │
│  │ - Descuentos        │       └─────────────────────┘                     │
│  └─────────────────────┘                                                   │
│                                                                             │
│  💳 CUOTAS                      🎫 BABY CARDS                               │
│  ┌─────────────────────┐       ┌─────────────────────┐                     │
│  │ Pago de cuota N     │       │ Venta de tarjeta    │                     │
│  │ (installments)      │       │ fidelización        │                     │
│  └─────────────────────┘       └─────────────────────┘                     │
│                                                                             │
│  🎉 EVENTOS                     📅 ANTICIPOS                                │
│  ┌─────────────────────┐       ┌─────────────────────┐                     │
│  │ Inscripción evento  │       │ Pago anticipado     │                     │
│  │ + Venta productos   │       │ de cita             │                     │
│  │ - Descuentos/cortesía│      └─────────────────────┘                     │
│  └─────────────────────┘                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           💸 EGRESOS (EXPENSE)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  👷 PAGOS A STAFF               🧾 GASTOS ADMIN                              │
│  ┌─────────────────────┐       ┌─────────────────────┐                     │
│  │ Salarios            │       │ Alquiler            │                     │
│  │ Comisiones          │       │ Servicios           │                     │
│  │ Bonos               │       │ Insumos             │                     │
│  │ Adelantos           │       │ Mantenimiento       │                     │
│  │ Liquidaciones       │       │ Marketing           │                     │
│  └─────────────────────┘       └─────────────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. COMPARACIÓN: ANTES vs DESPUÉS

### 2.1 Checkout de Sesión

#### ANTES (Actual)
```
┌─────────────────────────────────────────────────────────────┐
│ PROBLEMA: Todo mezclado en un solo monto                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Session                                                    │
│    └─> PackagePurchase (finalPrice = 800 - descuento)      │
│    └─> SessionProduct (productos, pero descuento NO guardado)
│    └─> PaymentDetail (amount = total mezclado)             │
│            └─> PaymentDetail (si split: 2do método)        │
│            └─> PaymentDetail (si split: 3er método)        │
│                                                             │
│  ❌ No se sabe cuánto fue por paquete vs productos         │
│  ❌ Descuento de productos calculado pero NO guardado      │
│  ❌ Múltiples PaymentDetail para un solo pago              │
└─────────────────────────────────────────────────────────────┘
```

#### DESPUÉS (Nueva Arquitectura)
```
┌─────────────────────────────────────────────────────────────┐
│ SOLUCIÓN: Transaction con items desglosados                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Session                                                    │
│    └─> Transaction (UNO solo)                              │
│            ├─ type: INCOME                                  │
│            ├─ category: SESSION                             │
│            ├─ subtotal: 850.00                              │
│            ├─ discountTotal: 100.00                         │
│            ├─ total: 750.00                                 │
│            ├─ paymentMethods: [                             │
│            │     {method: "CASH", amount: 500},             │
│            │     {method: "QR", amount: 250}                │
│            │   ]                                            │
│            │                                                │
│            └─> TransactionItem (paquete)                   │
│            │     ├─ itemType: PACKAGE                       │
│            │     ├─ unitPrice: 800.00                       │
│            │     ├─ discountAmount: 94.12                   │
│            │     └─ finalPrice: 705.88                      │
│            │                                                │
│            └─> TransactionItem (producto)                  │
│                  ├─ itemType: PRODUCT                       │
│                  ├─ unitPrice: 50.00                        │
│                  ├─ discountAmount: 5.88                    │
│                  └─ finalPrice: 44.12                       │
│                                                             │
│  ✅ Desglose completo por concepto                         │
│  ✅ Descuento por item con razón                           │
│  ✅ Split payment en JSON atómico                          │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.2 Cuotas de Paquete

#### ANTES
```
┌─────────────────────────────────────────────────────────────┐
│ PackagePurchase                                             │
│   └─> PackagePayment (cuota 1)                             │
│   └─> PackagePayment (cuota 2)                             │
│   └─> PackagePayment (cuota 3)                             │
│                                                             │
│ + PaymentDetail (parentType=PACKAGE_INSTALLMENT)           │
│                                                             │
│ ❌ DOS modelos para lo mismo                               │
│ ❌ Redundancia de datos                                    │
└─────────────────────────────────────────────────────────────┘
```

#### DESPUÉS
```
┌─────────────────────────────────────────────────────────────┐
│ PackagePurchase                                             │
│   └─> Transaction (cuota 1)                                │
│         ├─ category: PACKAGE_INSTALLMENT                    │
│         ├─ total: 166.67                                    │
│         └─> TransactionItem                                │
│               ├─ itemType: INSTALLMENT                      │
│               ├─ description: "Cuota 1/3 - Paquete 8 ses"  │
│               └─ finalPrice: 166.67                         │
│                                                             │
│   └─> Transaction (cuota 2)                                │
│   └─> Transaction (cuota 3)                                │
│                                                             │
│ ✅ UN solo modelo para todos los pagos                     │
│ ✅ Elimina PackagePayment                                  │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.3 Anticipos de Cita

#### ANTES
```
┌─────────────────────────────────────────────────────────────┐
│ Appointment                                                 │
│   └─> AppointmentPayment (anticipo)                        │
│                                                             │
│ + PaymentDetail (parentType=APPOINTMENT)                   │
│                                                             │
│ ❌ DOS modelos para lo mismo                               │
│ ❌ AppointmentPayment es redundante                        │
└─────────────────────────────────────────────────────────────┘
```

#### DESPUÉS
```
┌─────────────────────────────────────────────────────────────┐
│ Appointment                                                 │
│   └─> Transaction                                          │
│         ├─ category: APPOINTMENT_ADVANCE                    │
│         ├─ total: 50.00                                     │
│         └─> TransactionItem                                │
│               ├─ itemType: ADVANCE                          │
│               └─ finalPrice: 50.00                          │
│                                                             │
│ ✅ Elimina AppointmentPayment                              │
│ ✅ Consistente con todo el sistema                         │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.4 Venta de Productos en Eventos

#### ANTES
```
┌─────────────────────────────────────────────────────────────┐
│ EventParticipant                                            │
│   └─> InventoryMovement (type=SALE)                        │
│                                                             │
│ ❌ NO crea registro de ingreso                             │
│ ❌ Solo mueve inventario, no contabiliza $$$               │
│ ❌ BUG CRÍTICO: Dinero perdido en reportes                 │
└─────────────────────────────────────────────────────────────┘
```

#### DESPUÉS
```
┌─────────────────────────────────────────────────────────────┐
│ EventParticipant                                            │
│   └─> Transaction                                          │
│         ├─ category: EVENT_PRODUCTS                         │
│         ├─ total: 80.00                                     │
│         └─> TransactionItem (crema)                        │
│         │     ├─ itemType: PRODUCT                          │
│         │     └─ finalPrice: 50.00                          │
│         └─> TransactionItem (pañales)                      │
│               ├─ itemType: PRODUCT                          │
│               └─ finalPrice: 30.00                          │
│                                                             │
│   └─> InventoryMovement (sigue igual, para stock)          │
│                                                             │
│ ✅ Ingreso registrado correctamente                        │
│ ✅ Desglose por producto                                   │
│ ✅ Aparece en reportes                                     │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.5 Pagos a Staff

#### ANTES
```
┌─────────────────────────────────────────────────────────────┐
│ StaffPayment                                                │
│   ├─ type: SALARY                                          │
│   ├─ netAmount: 3500                                       │
│   └─> PaymentDetail (método de pago)                       │
│                                                             │
│ ✓ Funciona, pero inconsistente con otros flujos            │
└─────────────────────────────────────────────────────────────┘
```

#### DESPUÉS
```
┌─────────────────────────────────────────────────────────────┐
│ StaffPayment (sigue existiendo para lógica de nómina)      │
│   └─> Transaction                                          │
│         ├─ type: EXPENSE                                    │
│         ├─ category: STAFF_PAYMENT                          │
│         ├─ total: 3500.00                                   │
│         └─> TransactionItem                                │
│               ├─ itemType: OTHER                            │
│               ├─ description: "Salario Enero 2026"         │
│               └─ finalPrice: 3500.00                        │
│                                                             │
│ ✅ Consistente con todo el sistema                         │
│ ✅ Un solo lugar para reportes                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. CÓMO LOS REPORTES CONSUMIRÁN LA NUEVA ESTRUCTURA

### 3.1 ANTES: Queries Complejos

```typescript
// Reporte de Ingresos - ANTES
const sessionIncome = await prisma.paymentDetail.aggregate({
  where: { parentType: "SESSION" },
  _sum: { amount: true }
});

const babyCardIncome = await prisma.paymentDetail.aggregate({
  where: { parentType: "BABY_CARD" },
  _sum: { amount: true }
});

const eventIncome = await prisma.paymentDetail.aggregate({
  where: { parentType: "EVENT_PARTICIPANT" },
  _sum: { amount: true }
});

// ❌ Problema: Productos en eventos NO están aquí
// ❌ Problema: No se puede desglosar servicios vs productos
// ❌ Problema: 3+ queries separados
```

### 3.2 DESPUÉS: Queries Directos

```typescript
// Reporte de Ingresos - DESPUÉS
const income = await prisma.transaction.aggregate({
  where: {
    type: "INCOME",
    createdAt: { gte: from, lte: to }
  },
  _sum: { total: true }
});

// ✅ UN query para todo

// Desglose por categoría
const byCategory = await prisma.transaction.groupBy({
  by: ["category"],
  where: { type: "INCOME", createdAt: { gte: from, lte: to } },
  _sum: { total: true }
});
// Resultado: SESSION: 5000, BABY_CARD: 800, EVENT_PRODUCTS: 300...

// Desglose por tipo de item (servicios vs productos)
const byItemType = await prisma.transactionItem.groupBy({
  by: ["itemType"],
  where: {
    transaction: { type: "INCOME", createdAt: { gte: from, lte: to } }
  },
  _sum: { finalPrice: true }
});
// Resultado: PACKAGE: 4500, PRODUCT: 1200, BABY_CARD: 800...

// Descuentos otorgados
const discounts = await prisma.transactionItem.aggregate({
  where: {
    transaction: { type: "INCOME", createdAt: { gte: from, lte: to } },
    discountAmount: { gt: 0 }
  },
  _sum: { discountAmount: true }
});
```

### 3.3 Comparación de Queries

| Reporte | Queries ANTES | Queries DESPUÉS |
|---------|---------------|-----------------|
| Total Ingresos | 4-5 queries | 1 query |
| Ingresos por Categoría | 6+ queries | 1 groupBy |
| Servicios vs Productos | Imposible directo | 1 groupBy |
| Descuentos | Imposible | 1 query |
| P&L Completo | 10+ queries | 3-4 queries |

---

## 4. ANÁLISIS DE PERFORMANCE: ¿ES BUENO CENTRALIZAR TODO?

### 4.1 Tabla de Crecimiento Estimado

| Concepto | Registros/Mes | Registros/Año | Registros/5 Años |
|----------|---------------|---------------|------------------|
| Sesiones | 400 | 4,800 | 24,000 |
| Cuotas | 100 | 1,200 | 6,000 |
| Baby Cards | 30 | 360 | 1,800 |
| Eventos | 50 | 600 | 3,000 |
| Anticipos | 80 | 960 | 4,800 |
| Staff Payments | 20 | 240 | 1,200 |
| Gastos | 50 | 600 | 3,000 |
| **TOTAL Transaction** | ~730 | ~8,760 | ~43,800 |
| **TOTAL TransactionItem** | ~1,200 | ~14,400 | ~72,000 |

### 4.2 ¿Es Problema de Performance?

**NO**, por estas razones:

1. **Volumen moderado**: 43K transacciones en 5 años es pequeño para PostgreSQL
2. **Índices correctos**: Con los índices propuestos, queries son O(log n)
3. **Particionamiento futuro**: Si crece, PostgreSQL soporta particiones por fecha

### 4.3 Índices Clave para Performance

```prisma
model Transaction {
  // Índices críticos
  @@index([type])                      // Filtrar INCOME vs EXPENSE
  @@index([category])                  // Filtrar por tipo de operación
  @@index([referenceType, referenceId]) // Buscar por entidad
  @@index([createdAt])                 // Rangos de fecha (reportes)
}

model TransactionItem {
  @@index([transactionId])             // JOIN con Transaction
  @@index([itemType])                  // Filtrar PACKAGE vs PRODUCT
}
```

### 4.4 Benchmarks Esperados

| Operación | Sin índices | Con índices |
|-----------|-------------|-------------|
| Insertar Transaction | 2-5ms | 2-5ms |
| Reporte mensual (1K registros) | 50-100ms | 5-15ms |
| Reporte anual (12K registros) | 200-500ms | 20-50ms |
| Búsqueda por referencia | 100-200ms | 1-5ms |

### 4.5 Ventajas de Centralizar

| Aspecto | Múltiples Tablas | Una Tabla Centralizada |
|---------|------------------|------------------------|
| Queries reportes | Múltiples JOINs | Una tabla |
| Consistencia | Difícil mantener | Garantizada |
| Mantenimiento | Código duplicado | Un servicio |
| Auditoría | Dispersa | Centralizada |
| Backup/Restore | Complejo | Simple |

### 4.6 Desventajas y Mitigación

| Desventaja | Mitigación |
|------------|------------|
| Tabla "grande" | Particionamiento por año si necesario |
| JSON no indexable (paymentMethods) | Solo se usa para detalle, no filtros |
| Cambios afectan todo | Buenas pruebas, TypeScript strict |

---

## 5. TABLA RESUMEN: CADA FLUJO DE DINERO

### 5.1 INGRESOS

| Flujo | Category | Items | Descuentos | Split Payment |
|-------|----------|-------|------------|---------------|
| Checkout sesión | `SESSION` | PACKAGE + PRODUCT | Proporcional por item | ✅ JSON |
| Venta paquete | `PACKAGE_SALE` | PACKAGE | En PackagePurchase | ✅ JSON |
| Cuota paquete | `PACKAGE_INSTALLMENT` | INSTALLMENT | N/A | ✅ JSON |
| Baby Card | `BABY_CARD` | BABY_CARD | firstSessionDiscount | ✅ JSON |
| Evento inscripción | `EVENT_REGISTRATION` | EVENT_TICKET | COURTESY/FIXED | ✅ JSON |
| Evento productos | `EVENT_PRODUCTS` | PRODUCT (múltiples) | Por item (futuro) | ✅ JSON |
| Anticipo cita | `APPOINTMENT_ADVANCE` | ADVANCE | N/A | ✅ JSON |

### 5.2 EGRESOS

| Flujo | Category | Items | Notas |
|-------|----------|-------|-------|
| Pago salario | `STAFF_PAYMENT` | OTHER | Referencia a StaffPayment |
| Pago adelanto | `STAFF_PAYMENT` | OTHER | Afecta StaffAdvanceBalance |
| Gasto admin | `ADMIN_EXPENSE` | OTHER | Categorizado (RENT, UTILITIES...) |

### 5.3 MODELOS QUE DESAPARECEN

| Modelo Actual | Reemplazado Por |
|---------------|-----------------|
| `PaymentDetail` | `Transaction` |
| `AppointmentPayment` | `Transaction` (APPOINTMENT_ADVANCE) |
| `PackagePayment` | `Transaction` (PACKAGE_INSTALLMENT) |

### 5.4 MODELOS QUE SE MANTIENEN

| Modelo | Razón |
|--------|-------|
| `StaffPayment` | Lógica de nómina compleja (movimientos, adelantos, períodos) |
| `Expense` | Metadatos específicos (categoría, expenseDate) |
| `InventoryMovement` | Control de stock (separado de dinero) |
| `SessionProduct` | Tracking de productos usados + descuentos individuales |
| `EventProductUsage` | Productos usados en eventos (costo interno) |

---

## 6. FLUJO DE DATOS COMPLETO

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         OPERACIÓN DE NEGOCIO                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Usuario realiza acción (checkout, venta, pago, etc.)                 │
│                              │                                          │
│                              ▼                                          │
│   ┌─────────────────────────────────────────────────────┐              │
│   │              SERVICIO (lib/services/)               │              │
│   │                                                     │              │
│   │   sessionService.completeSession()                  │              │
│   │   packageService.sellPackage()                      │              │
│   │   babyCardService.purchase()                        │              │
│   │   eventParticipantService.registerPayment()         │              │
│   │   etc.                                              │              │
│   └─────────────────────────────────────────────────────┘              │
│                              │                                          │
│                              ▼                                          │
│   ┌─────────────────────────────────────────────────────┐              │
│   │            transactionService.create()              │              │
│   │                                                     │              │
│   │   {                                                 │              │
│   │     type: "INCOME",                                 │              │
│   │     category: "SESSION",                            │              │
│   │     referenceType: "Session",                       │              │
│   │     referenceId: "session_xxx",                     │              │
│   │     subtotal: 850.00,                               │              │
│   │     discountTotal: 100.00,                          │              │
│   │     total: 750.00,                                  │              │
│   │     paymentMethods: [{...}, {...}],                 │              │
│   │     items: [                                        │              │
│   │       { itemType: "PACKAGE", ... },                 │              │
│   │       { itemType: "PRODUCT", ... }                  │              │
│   │     ]                                               │              │
│   │   }                                                 │              │
│   └─────────────────────────────────────────────────────┘              │
│                              │                                          │
│                              ▼                                          │
│   ┌─────────────────────────────────────────────────────┐              │
│   │                   BASE DE DATOS                     │              │
│   │                                                     │              │
│   │   Transaction (1 registro)                          │              │
│   │      └─> TransactionItem (N registros)             │              │
│   │                                                     │              │
│   └─────────────────────────────────────────────────────┘              │
│                              │                                          │
│                              ▼                                          │
│   ┌─────────────────────────────────────────────────────┐              │
│   │              REPORTES (report-service)              │              │
│   │                                                     │              │
│   │   prisma.transaction.aggregate({ type: "INCOME" }) │              │
│   │   prisma.transactionItem.groupBy({ by: ["itemType"]})│             │
│   │                                                     │              │
│   └─────────────────────────────────────────────────────┘              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. CONCLUSIÓN

### ¿Es buena idea centralizar?

**SÍ**, porque:

1. ✅ **Performance**: Volumen moderado, índices adecuados
2. ✅ **Mantenibilidad**: Un servicio, una lógica
3. ✅ **Reportes**: Queries simples y directos
4. ✅ **Consistencia**: Todos los flujos siguen el mismo patrón
5. ✅ **Auditoría**: Todo en un lugar
6. ✅ **Escalabilidad**: PostgreSQL maneja esto sin problemas

### ¿Qué ganamos?

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Modelos de pago | 4 | 1 | 75% menos |
| Queries para P&L | 10+ | 3-4 | 60% menos |
| Código duplicado | Alto | Mínimo | ~70% menos |
| Bugs potenciales | 4 lugares | 1 lugar | 75% menos |

---

**Autor**: Claude Code
**Última actualización**: 5 de febrero de 2026
