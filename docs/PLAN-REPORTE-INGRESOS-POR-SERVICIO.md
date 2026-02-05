# Plan: Reporte de Ingresos por Concepto

## Resumen

Crear un nuevo reporte que muestre **ingresos desglosados por CONCEPTO**, contemplando TODAS las fuentes de ingresos de la empresa:

| Concepto | Fuente de Datos | Cómo obtener |
|----------|-----------------|--------------|
| **Servicios/Paquetes** | PaymentDetail (SESSION) - productos | Session → PackagePurchase → Package |
| **Productos Vendidos** | SessionProduct (isChargeable=true) | Session → SessionProduct → Product |
| **Baby Cards** | PaymentDetail (BABY_CARD) | BabyCardPurchase (monto fijo) |
| **Eventos** | PaymentDetail (EVENT_PARTICIPANT) | EventParticipant → Event |
| **Cuotas de Paquetes** | PaymentDetail (PACKAGE_INSTALLMENT) | PackagePayment → PackagePurchase → Package |
| **Anticipos de Citas** | PaymentDetail (APPOINTMENT) | Appointment → selectedPackage |

---

## 1. El Desafío Principal

### SESSION = Paquetes + Productos (mezclados)

Cuando se completa una sesión (checkout), el `PaymentDetail` de tipo `SESSION` incluye:
- Precio del paquete vendido (si aplica)
- Productos vendidos con cargo (isChargeable=true)

**Solución**: Calcular productos desde `SessionProduct` y restarlos del total de SESSION:

```
Ingresos por Servicios = PaymentDetail(SESSION).amount - SUM(SessionProduct.unitPrice * quantity WHERE isChargeable=true)
```

---

## 2. Estructura de Datos del Reporte

```typescript
interface IncomeByConceptReport {
  // Totales
  totalIncome: number;
  periodLabel: string;  // "Febrero 2026"

  // GRAN DESGLOSE POR CONCEPTO
  byConcept: {
    // 1. SERVICIOS (paquetes vendidos)
    services: {
      total: number;
      percentage: number;
      byPackage: {
        packageId: string;
        packageName: string;
        categoryName: string | null;
        serviceType: "BABY" | "PARENT";
        amount: number;
        count: number;  // transacciones
        percentage: number;
      }[];
      // Desglose adicional por categoría
      byCategory: {
        categoryId: string | null;
        categoryName: string;
        amount: number;
        percentage: number;
      }[];
    };

    // 2. PRODUCTOS
    products: {
      total: number;
      percentage: number;
      byProduct: {
        productId: string;
        productName: string;
        categoryName: string | null;
        amount: number;
        quantitySold: number;
        percentage: number;
      }[];
    };

    // 3. BABY CARDS
    babyCards: {
      total: number;
      percentage: number;
      count: number;  // cantidad vendidas
    };

    // 4. EVENTOS
    events: {
      total: number;
      percentage: number;
      byEvent: {
        eventId: string;
        eventName: string;
        eventType: "BABIES" | "PARENTS";
        amount: number;
        participantCount: number;
      }[];
    };

    // 5. CUOTAS DE PAQUETES
    installments: {
      total: number;
      percentage: number;
      byPackage: {
        packageId: string;
        packageName: string;
        amount: number;
        count: number;
      }[];
    };

    // 6. ANTICIPOS
    advances: {
      total: number;
      percentage: number;
      count: number;
    };
  };

  // Por método de pago (transversal)
  byPaymentMethod: {
    method: "CASH" | "QR" | "CARD" | "TRANSFER";
    amount: number;
    percentage: number;
  }[];

  // Tendencia diaria (opcional)
  trend?: {
    date: string;
    services: number;
    products: number;
    babyCards: number;
    events: number;
    total: number;
  }[];
}
```

---

## 3. Queries Optimizadas (Prisma con Promise.all)

```typescript
async getIncomeByConceptReport(from: Date, to: Date): Promise<IncomeByConceptReport> {
  const [
    // 1. Ingresos de SESSION (incluye servicios + productos)
    sessionPayments,
    // 2. Productos vendidos (para restar de SESSION)
    chargeableProducts,
    // 3. Baby Cards
    babyCardPayments,
    // 4. Eventos
    eventPayments,
    // 5. Cuotas de paquetes
    installmentPayments,
    // 6. Anticipos
    advancePayments,
    // Metadata: todos los packages
    packages,
    // Metadata: todos los products
    products,
  ] = await Promise.all([
    // 1. SESSION payments con Session → PackagePurchase → Package
    prisma.paymentDetail.findMany({
      where: {
        parentType: "SESSION",
        createdAt: { gte: from, lte: to },
      },
      select: {
        amount: true,
        parentId: true,
        paymentMethod: true,
      },
    }),

    // 2. Productos vendidos en sesiones completadas
    prisma.sessionProduct.findMany({
      where: {
        isChargeable: true,
        session: {
          completedAt: { gte: from, lte: to },
        },
      },
      select: {
        sessionId: true,
        productId: true,
        quantity: true,
        unitPrice: true,
      },
    }),

    // 3. Baby Card purchases
    prisma.paymentDetail.findMany({
      where: {
        parentType: "BABY_CARD",
        createdAt: { gte: from, lte: to },
      },
      select: {
        amount: true,
        paymentMethod: true,
      },
    }),

    // 4. Event payments with Event details
    prisma.paymentDetail.findMany({
      where: {
        parentType: "EVENT_PARTICIPANT",
        createdAt: { gte: from, lte: to },
      },
      select: {
        amount: true,
        parentId: true,
        paymentMethod: true,
      },
    }),

    // 5. Installment payments
    prisma.paymentDetail.findMany({
      where: {
        parentType: "PACKAGE_INSTALLMENT",
        createdAt: { gte: from, lte: to },
      },
      select: {
        amount: true,
        parentId: true,
        paymentMethod: true,
      },
    }),

    // 6. Advance payments
    prisma.paymentDetail.findMany({
      where: {
        parentType: "APPOINTMENT",
        createdAt: { gte: from, lte: to },
      },
      select: {
        amount: true,
        paymentMethod: true,
      },
    }),

    // Metadata: Packages
    prisma.package.findMany({
      select: {
        id: true,
        name: true,
        serviceType: true,
        categoryRef: { select: { id: true, name: true } },
      },
    }),

    // Metadata: Products
    prisma.product.findMany({
      select: {
        id: true,
        name: true,
        categoryRef: { select: { id: true, name: true } },
      },
    }),
  ]);

  // Ahora necesitamos resolver las relaciones:
  // Session → PackagePurchase para los sessionPayments
  // PackagePayment → PackagePurchase para installmentPayments
  // EventParticipant → Event para eventPayments

  // ... batch queries adicionales ...
}
```

### Queries Batch Adicionales (segundo round)

```typescript
// Obtener Sessions con su PackagePurchase
const sessionIds = sessionPayments.map(p => p.parentId);
const sessions = await prisma.session.findMany({
  where: { id: { in: sessionIds } },
  select: {
    id: true,
    packagePurchase: {
      select: {
        packageId: true,
      },
    },
  },
});

// Obtener PackagePayments con su PackagePurchase
const packagePaymentIds = installmentPayments.map(p => p.parentId);
const packagePayments = await prisma.packagePayment.findMany({
  where: { id: { in: packagePaymentIds } },
  select: {
    id: true,
    packagePurchase: {
      select: {
        packageId: true,
      },
    },
  },
});

// Obtener EventParticipants con su Event
const participantIds = eventPayments.map(p => p.parentId);
const participants = await prisma.eventParticipant.findMany({
  where: { id: { in: participantIds } },
  select: {
    id: true,
    event: {
      select: {
        id: true,
        name: true,
        participantType: true,
      },
    },
  },
});
```

---

## 4. Diseño de UI

### Layout Principal

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Volver    Ingresos por Concepto                                  │
│              Desglose completo de todas las fuentes de ingreso      │
├─────────────────────────────────────────────────────────────────────┤
│  [Desde: ___________]  [Hasta: ___________]  [Aplicar]              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐│
│  │  💰 TOTAL INGRESOS         Febrero 2026                        ││
│  │  Bs 58,500                                                      ││
│  └────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌───────────────────────── DISTRIBUCIÓN ─────────────────────────┐│
│  │                                                                 ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               ││
│  │  │ 🏊 SERVICIOS│ │ 🛒 PRODUCTOS│ │ 💳 BABY CARD│               ││
│  │  │  Bs 35,200  │ │  Bs 8,500   │ │  Bs 6,200   │               ││
│  │  │    60%      │ │    15%      │ │    11%      │               ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘               ││
│  │                                                                 ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               ││
│  │  │ 🎉 EVENTOS  │ │ 💵 CUOTAS   │ │ 📅 ANTICIPOS│               ││
│  │  │  Bs 4,800   │ │  Bs 2,800   │ │  Bs 1,000   │               ││
│  │  │     8%      │ │     5%      │ │     1%      │               ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘               ││
│  │                                                                 ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                     │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐   │
│  │  TOP SERVICIOS              │ │  TOP PRODUCTOS VENDIDOS     │   │
│  │  ┌───────────────────────┐  │ │  ┌───────────────────────┐  │   │
│  │  │1. Hidroterapia Básica │  │ │  │1. Aceite para masajes │  │   │
│  │  │   Bs 12,500 • 45 ses  │  │ │  │   Bs 3,200 • 85 uds   │  │   │
│  │  │2. Masaje Prenatal     │  │ │  │2. Crema hidratante    │  │   │
│  │  │   Bs 8,200 • 28 ses   │  │ │  │   Bs 2,100 • 42 uds   │  │   │
│  │  │3. Paquete Familiar    │  │ │  │3. Pañales premium     │  │   │
│  │  │   Bs 7,800 • 15 ses   │  │ │  │   Bs 1,800 • 60 uds   │  │   │
│  │  └───────────────────────┘  │ │  └───────────────────────┘  │   │
│  └─────────────────────────────┘ └─────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────┐ ┌─────────────────────────────┐   │
│  │  EVENTOS DEL PERÍODO        │ │  POR MÉTODO DE PAGO         │   │
│  │  ┌───────────────────────┐  │ │  ┌───────────────────────┐  │   │
│  │  │ Taller Porteo         │  │ │  │ 💵 Efectivo    45%    │  │   │
│  │  │ Bs 2,400 • 12 part.   │  │ │  │ 📱 QR          30%    │  │   │
│  │  │ Baby Shower Spa       │  │ │  │ 💳 Tarjeta     20%    │  │   │
│  │  │ Bs 2,400 • 8 part.    │  │ │  │ 🏦 Transfer     5%    │  │   │
│  │  └───────────────────────┘  │ │  └───────────────────────┘  │   │
│  └─────────────────────────────┘ └─────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Componentes a Crear

```
components/reports/income-by-concept/
├── concept-summary-cards.tsx      # 6 tarjetas de conceptos
├── services-breakdown.tsx         # Top servicios + categorías
├── products-breakdown.tsx         # Top productos vendidos
├── events-breakdown.tsx           # Lista de eventos
├── payment-methods-chart.tsx      # Gráfico por método
└── income-concept-page.tsx        # Componente contenedor (opcional)

app/[locale]/(admin)/admin/reports/income-by-concept/
└── page.tsx                       # Página del reporte
```

---

## 6. Archivos a Modificar

```
lib/services/report-service.ts     # Agregar getIncomeByConceptReport()
messages/es.json                   # Traducciones
messages/pt-BR.json                # Traducciones
app/.../reports/page.tsx           # Agregar link al nuevo reporte
```

---

## 7. Traducciones

```json
{
  "reports": {
    "incomeByConcept": {
      "title": "Ingresos por Concepto",
      "description": "Desglose completo de todas las fuentes de ingreso",
      "totalIncome": "Total Ingresos",
      "distribution": "Distribución por Concepto",

      "concepts": {
        "services": "Servicios",
        "products": "Productos",
        "babyCards": "Baby Cards",
        "events": "Eventos",
        "installments": "Cuotas",
        "advances": "Anticipos"
      },

      "topServices": "Top Servicios",
      "topProducts": "Top Productos Vendidos",
      "eventsList": "Eventos del Período",
      "byPaymentMethod": "Por Método de Pago",

      "sessions": "sesiones",
      "units": "unidades",
      "participants": "participantes",
      "transactions": "transacciones",

      "noData": "No hay datos para el período seleccionado"
    }
  }
}
```

---

## 8. Plan de Implementación

### Paso 1: Backend
1. Crear interfaz `IncomeByConceptReport` en report-service.ts
2. Implementar función `getIncomeByConceptReport(from, to)`
3. Optimizar con Promise.all para queries paralelas

### Paso 2: Componentes UI
1. `concept-summary-cards.tsx` - 6 tarjetas resumen
2. `services-breakdown.tsx` - Top servicios
3. `products-breakdown.tsx` - Top productos
4. `events-breakdown.tsx` - Eventos
5. `payment-methods-chart.tsx` - Métodos de pago

### Paso 3: Página
1. Crear `app/.../reports/income-by-concept/page.tsx`
2. Integrar DateRangeFilter
3. Integrar todos los componentes

### Paso 4: Navegación
1. Agregar a página principal de reportes
2. Categoría: "finance" (junto a income, receivables, pnl)

### Paso 5: Traducciones
1. es.json
2. pt-BR.json

### Paso 6: Testing
1. Verificar cálculos con datos conocidos
2. Verificar que suma de conceptos = total
3. Performance con datos masivos

---

## 9. Validación de Datos

**Importante**: La suma de todos los conceptos DEBE igualar el total de PaymentDetail con INCOME_SOURCES:

```typescript
// Validación
const sumByConcept =
  services.total +
  products.total +
  babyCards.total +
  events.total +
  installments.total +
  advances.total;

// Debe ser igual a:
const totalFromPaymentDetails = await prisma.paymentDetail.aggregate({
  where: {
    parentType: { in: INCOME_SOURCES },
    createdAt: { gte: from, lte: to },
  },
  _sum: { amount: true },
});

assert(sumByConcept === totalFromPaymentDetails._sum.amount);
```

---

## 10. Notas Técnicas

### Cálculo de Ingresos por Servicios

```typescript
// Total SESSION payments
const totalSessionPayments = sessionPayments.reduce((sum, p) => sum + Number(p.amount), 0);

// Total productos vendidos (ya calculado de SessionProduct)
const totalProductsSold = chargeableProducts.reduce(
  (sum, p) => sum + (p.quantity * Number(p.unitPrice)),
  0
);

// Ingresos por servicios = SESSION - Productos
const servicesIncome = totalSessionPayments - totalProductsSold;
```

### Mapeo de Session a Package

```typescript
// Crear mapa sessionId → packageId
const sessionToPackage = new Map<string, string>();
for (const session of sessions) {
  if (session.packagePurchase?.packageId) {
    sessionToPackage.set(session.id, session.packagePurchase.packageId);
  }
}

// Ahora podemos agrupar ingresos por package
const incomeByPackage = new Map<string, number>();
for (const payment of sessionPayments) {
  const packageId = sessionToPackage.get(payment.parentId);
  if (packageId) {
    const current = incomeByPackage.get(packageId) || 0;
    // Necesitamos restar los productos de esta sesión específica
    const productsForSession = chargeableProducts
      .filter(p => p.sessionId === payment.parentId)
      .reduce((sum, p) => sum + (p.quantity * Number(p.unitPrice)), 0);
    incomeByPackage.set(packageId, current + Number(payment.amount) - productsForSession);
  }
}
```

---

**Fecha de creación**: 5 de febrero de 2026
**Autor**: Claude Code
**Última actualización**: 5 de febrero de 2026
