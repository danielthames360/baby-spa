# 🏊 BABY SPA - ESPECIFICACIÓN TÉCNICA COMPLETA
## Sistema de Gestión para Spa de Bebés (Bolivia & Brasil)

**Última actualización:** Enero 2026  
**Versión:** 5.0

---

# 📋 ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Modelo de Base de Datos](#4-modelo-de-base-de-datos)
5. [Flujos de Negocio](#5-flujos-de-negocio)
6. [Reglas de Negocio](#6-reglas-de-negocio)
7. [Módulos Implementados](#7-módulos-implementados)
8. [Plan de Implementación](#8-plan-de-implementación)
9. [Arqueo de Caja (Fase Final)](#fase-9-arqueo-de-caja)
10. [Instrucciones para Claude Code](#10-instrucciones-para-claude-code)

---

# 1. RESUMEN EJECUTIVO

## 1.1 Descripción del Negocio

**Baby Spa** es un centro de hidroterapia y estimulación temprana para bebés de 0-36 meses. Ofrece servicios de:
- Hidroterapia
- Psicomotricidad  
- Fisioterapia infantil
- Vacunas
- Cumple Mes (celebraciones)
- Eventos grupales (Hora de Juego, Babython, Talleres)
- **Servicios para padres** (Masaje Prenatal, Masaje Postparto)

### Ubicaciones:
- **Bolivia** (existente) - Dominio: `bo.babyspa.online`
- **Brasil - São Paulo** (expansión) - Dominio: `br.babyspa.online`

### Perfil de Clientes:
- **65-70%**: Clientes esporádicos (1 sesión única)
- **30-35%**: Clientes recurrentes (paquetes 4-20 sesiones)
- **Casos especiales**: Bebés con condiciones terapéuticas (hipotonía, retraso psicomotor, prematuros)
- **Padres LEAD**: Madres embarazadas que asisten a talleres prenatales (potenciales clientes)

## 1.2 Objetivos del Sistema

1. ✅ Automatizar agendamiento (admin + portal padres)
2. ✅ Control financiero completo (ingresos/egresos/inventario)
3. ✅ Notificaciones en tiempo real para recepción
4. ✅ Seguimiento desarrollo bebés (historial + evaluaciones)
5. ✅ Portal para padres (ver progreso, agendar, cancelar, reagendar citas)
6. ✅ Inventario productos
7. ✅ Multiidioma (Español + Portugués Brasil)
8. ✅ Multi-base de datos (Bolivia y Brasil separadas)
9. ✅ Sistema de penalización por no-shows
10. ✅ Pagos anticipados y financiamiento
11. ✅ Eventos grupales
12. ✅ Auto-agendado masivo
13. ✅ Servicios para padres (masajes prenatales/postparto)
14. ✅ Sistema Baby Card (fidelización)
15. ✅ Pagos divididos (múltiples métodos de pago)
16. ✅ Arqueo de caja y control de turnos
17. ✅ Registro de gastos administrativos
18. ✅ Pagos a staff con control de adelantos
19. ✅ Actividad reciente (registro de operaciones)
20. ✅ Portal de padres mejorado (cancelar/reagendar, saldo, perfil, mesversarios)

## 1.3 Operación

### Capacidad:
- **Hasta 5 citas por slot de 30 min** (para staff)
- **2 citas por slot** (para padres en portal)
- **4 terapeutas simultáneos** (configurable para eventos)

### Horarios:
```
LUNES: 9:00 AM - 5:00 PM (continuo)

MARTES a SÁBADO:
├── Mañana: 9:00 AM - 12:00 PM
└── Tarde: 2:30 PM - 6:30 PM

DOMINGO: Cerrado
```

### Personal:
- 4 Terapeutas
- 1 Recepcionista
- 3 Administradores


## 1.4 Paquetes y Servicios

### Servicios para Bebés (ServiceType = BABY)

| Categoría | Paquete | Sesiones | Duración | Pago Único | Cuotas | Precio Cuotas |
|-----------|---------|----------|----------|------------|--------|---------------|
| Hidroterapia | Individual | 1 | 60 min | 350 Bs | - | - |
| Hidroterapia | Programa Inicial | 4 | 60 min | 1,360 Bs | 2 | 1,400 Bs |
| Hidroterapia | Programa Continuidad | 8 | 60 min | 2,640 Bs | 3 | 2,700 Bs |
| Hidroterapia | Plan Integral | 20 | 60 min | 6,200 Bs | 5 | 6,300 Bs |
| Cumple Mes | Individual | 1 | 90 min | 250 Bs | - | Requiere anticipo |
| Vacunas | Individual | 1 | 30 min | 180 Bs | - | Requiere anticipo |

### Servicios para Padres (ServiceType = PARENT)

| Categoría | Paquete | Sesiones | Duración | Precio |
|-----------|---------|----------|----------|--------|
| Servicios Maternos | Masaje Prenatal | 1 | 60 min | 200 Bs |
| Servicios Maternos | Masaje Postparto | 1 | 60 min | 180 Bs |

**Reglas de Paquetes:**
- Los paquetes **NO vencen** (válidos hasta que bebé cumpla 3 años)
- Sesiones **NO transferibles** entre bebés
- Cuotas **configuradas por paquete** (el cliente no elige cuántas)
- Precio en cuotas puede ser **mayor** al pago único (financiamiento)
- Se define **en qué sesiones** se paga cada cuota
- Algunos requieren **pago anticipado** para confirmar cita


# 2. STACK TECNOLÓGICO

## 2.1 Core

| Componente | Tecnología | Versión |
|------------|------------|---------|
| Framework | Next.js (App Router) | 14.x |
| Lenguaje | TypeScript | 5.x |
| Base de Datos | PostgreSQL | 16.x |
| ORM | Prisma | 5.x |
| Autenticación | NextAuth.js | 4.x |
| UI Components | shadcn/ui | latest |
| Estilos | TailwindCSS | 3.x |
| Multiidioma | next-intl | 3.x |

## 2.2 Servidor y Deployment

| Componente | Tecnología |
|------------|------------|
| OS | Ubuntu 24.04 LTS |
| Web Server | Nginx |
| Process Manager | PM2 |
| SSL | Let's Encrypt |
| VPS | DigitalOcean/Contabo |

## 2.3 Dominio

- **Dominio principal:** `babyspa.online`
- **Subdominios:**
  - `bo.babyspa.online` → Bolivia (Español)
  - `br.babyspa.online` → Brasil (Portugués)

---

# 3. ARQUITECTURA DEL SISTEMA

## 3.1 Diagrama General

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     VPS (Ubuntu)                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                      NGINX                              │ │
│  │   bo.babyspa.online ──┐                                 │ │
│  │                       ├──► localhost:3000 (Next.js)     │ │
│  │   br.babyspa.online ──┘                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
│              ┌───────────────┴───────────────┐               │
│              ▼                               ▼               │
│  ┌─────────────────────┐         ┌─────────────────────┐   │
│  │  babyspa_bolivia    │         │   babyspa_brazil    │   │
│  │    (PostgreSQL)     │         │    (PostgreSQL)     │   │
│  └─────────────────────┘         └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 3.2 Separación por País (2 Bases de Datos)

⚠️ **CRÍTICO: El sistema usa 2 bases de datos completamente separadas (NO usa tenant_id)**

- Cada país tiene su **propia base de datos independiente**
- Cada país tiene su propia configuración, paquetes, precios
- Las descripciones de paquetes se escriben en el idioma local
- QR de pago diferente por país
- **NO existe modelo Tenant ni campo tenantId en ninguna tabla**

## 3.3 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **ADMIN** | Acceso total a todo el sistema |
| **RECEPTION** | Calendario, agendar, iniciar/completar sesiones, cobrar, inventario, arqueo de caja |
| **THERAPIST** | Ver citas asignadas del día, registrar evaluaciones |
| **PARENT** | Portal: ver historial, agendar/cancelar/reagendar citas (solo sus bebés) |

---

# 4. MODELO DE BASE DE DATOS

## 4.1 Entidades Principales

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│   Package   │◄──────│ PackagePurchase │──────►│  Baby/Parent│
│  (catálogo) │       │   (compra)      │       │  (cliente)  │
└─────────────┘       └────────┬────────┘       └──────┬──────┘
                               │                       │
                               │                       │
                               ▼                       ▼
                      ┌────────────────┐      ┌───────────────┐
                      │    Session     │◄─────│  Appointment  │
                      │  (ejecución)   │      │   (agenda)    │
                      └───────┬────────┘      └───────────────┘
                              │                       
              ┌───────────────┼───────────────┐       
              ▼               ▼               ▼       
        ┌──────────┐   ┌────────────┐   ┌─────────┐  
        │Evaluation│   │SessionProd.│   │ Payment │  
        └──────────┘   └────────────┘   └─────────┘  


┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│  BabyCard   │◄──────│BabyCardPurchase │──────►│    Baby     │
│ (plantilla) │       │   (compra)      │       │             │
└─────────────┘       └────────┬────────┘       └─────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
     ┌──────────────┐  ┌─────────────┐  ┌────────────────┐
     │SpecialPrice  │  │   Reward    │  │  SessionLog    │
     └──────────────┘  └─────────────┘  └────────────────┘
```

## 4.2 Enums del Sistema

```prisma
enum ServiceType {
  BABY      // Servicio para bebés (hidroterapia, vacunas, etc.)
  PARENT    // Servicio para padres (masaje prenatal, postparto, etc.)
}

enum ParentStatus {
  LEAD      // Padre potencial (embarazada sin bebé aún)
  ACTIVE    // Cliente activo (tiene bebé registrado)
  INACTIVE  // Cliente inactivo
}

enum EventType {
  BABIES    // Evento para bebés
  PARENTS   // Taller para padres (leads)
}

enum EventStatus {
  DRAFT
  PUBLISHED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum ParticipantStatus {
  REGISTERED
  CONFIRMED
  CANCELLED
  NO_SHOW
}

enum DiscountType {
  COURTESY      // 100% gratis
  FIXED         // Monto fijo
}

enum AppointmentStatus {
  SCHEDULED      // Agendada, esperando
  PENDING_PAYMENT // Esperando pago anticipado (no bloquea slot)
  IN_PROGRESS    // En curso
  COMPLETED      // Completada
  CANCELLED      // Cancelada
  NO_SHOW        // No asistió
}

enum SessionStatus {
  PENDING    // Iniciada, esperando evaluación
  EVALUATED  // Terapeuta completó evaluación
  COMPLETED  // Recepción cobró y cerró
}

enum RewardType {
  SERVICE   // Un paquete/servicio gratis
  PRODUCT   // Un producto físico gratis
  EVENT     // Acceso gratis a evento
  CUSTOM    // Premio personalizado (solo texto/diploma/etc.)
}

enum BabyCardStatus {
  ACTIVE      // En progreso
  COMPLETED   // Completó todas las sesiones
  REPLACED    // Fue reemplazada por otra card
  CANCELLED   // Cancelada/reembolsada
}

enum PaymentMethod {
  CASH      // Efectivo / Dinheiro
  QR        // QR Bolivia / PIX Brasil (pago instantáneo)
  CARD      // Tarjeta POS / Cartão
  TRANSFER  // Transferencia / TED-DOC
}

enum PaymentStatus {
  PENDING
  PARTIAL
  PAID
}

// ==========================================
// ENUMS NUEVOS (Fase 5-8)
// ==========================================

enum PaymentParentType {
  SESSION              // Pago de sesión (checkout)
  BABY_CARD            // Venta de Baby Card
  EVENT_PARTICIPANT    // Pago de evento
  APPOINTMENT          // Anticipo de cita
  PACKAGE_INSTALLMENT  // Cuota de paquete
  STAFF_PAYMENT        // Pago a empleado
  EXPENSE              // Gasto administrativo
}

enum NotificationType {
  NEW_APPOINTMENT           // Cita agendada desde portal
  CANCELLED_APPOINTMENT     // Cita cancelada desde portal
  RESCHEDULED_APPOINTMENT   // Cita reagendada desde portal
  CASH_REGISTER_DIFFERENCE  // Arqueo cerrado con diferencia
}

enum CashRegisterStatus {
  OPEN              // Caja abierta
  CLOSED            // Cerrada, pendiente revisión (si diferencia ≠ 0)
  APPROVED          // Aprobada (diferencia = 0 o admin aprobó)
  FORCE_CLOSED      // Cerrada forzadamente por admin
}

enum CashExpenseCategory {
  SUPPLIES      // Insumos
  FOOD          // Comida/Refrigerios
  TRANSPORT     // Transporte (taxi, delivery)
  BANK_DEPOSIT  // Depósito a banco / Entrega a dueño
  OTHER         // Otro (descripción obligatoria)
}

enum StaffPaymentType {
  SALARY          // Sueldo (consolida movimientos del período)
  COMMISSION      // Comisión (movimiento que acumula)
  BONUS           // Bono (movimiento que acumula)
  ADVANCE         // Adelanto (pago real, aumenta deuda)
  ADVANCE_RETURN  // Devolución de adelanto (pago real, reduce deuda)
  DEDUCTION       // Descuento (movimiento que acumula)
  BENEFIT         // Aguinaldo / Beneficios (movimiento que acumula)
  SETTLEMENT      // Liquidación (pago final)
}

enum StaffPaymentStatus {
  PENDING   // Movimiento registrado, pendiente de incluir en salario
  PAID      // Pago realizado o movimiento incluido en salario
}

enum PayFrequency {
  DAILY     // Pago diario
  WEEKLY    // Pago semanal (lunes a domingo)
  BIWEEKLY  // Pago quincenal (1-15 y 16-fin de mes)
  MONTHLY   // Pago mensual (default)
}

enum ExpenseCategory {
  RENT            // Alquiler
  UTILITIES       // Servicios (agua, luz, internet)
  SUPPLIES        // Insumos
  MAINTENANCE     // Mantenimiento / Reparaciones
  MARKETING       // Marketing / Publicidad
  TAXES           // Impuestos / Contabilidad
  INSURANCE       // Seguros
  EQUIPMENT       // Equipos / Mobiliario
  OTHER           // Otros
}

enum ActivityType {
  SESSION_COMPLETED
  DISCOUNT_APPLIED
  APPOINTMENT_CREATED
  APPOINTMENT_CREATED_PORTAL
  APPOINTMENT_CANCELLED
  APPOINTMENT_CANCELLED_PORTAL
  APPOINTMENT_RESCHEDULED
  APPOINTMENT_RESCHEDULED_PORTAL
  BABY_CARD_SOLD
  BABY_CARD_REWARD_DELIVERED
  INSTALLMENT_PAID
  CASH_REGISTER_OPENED
  CASH_REGISTER_CLOSED
  CASH_REGISTER_EXPENSE_ADDED
  CASH_REGISTER_FORCE_CLOSED
  CASH_REGISTER_REVIEWED
  EVENT_REGISTRATION
  BABY_CREATED
  PACKAGE_ASSIGNED
  CLIENT_UPDATED
}
```

## 4.3 Modelos Clave

### Package (Catálogo de Paquetes)

```prisma
model Package {
  id                      String      @id @default(cuid())
  name                    String
  description             String?     // Descripción detallada
  categoryId              String?     // Relación con Category
  sessionCount            Int         // Número de sesiones
  basePrice               Decimal     // Precio pago único
  duration                Int         @default(60) // Duración en minutos

  // Tipo de servicio
  serviceType             ServiceType @default(BABY)  // BABY | PARENT
  
  // Pago anticipado
  requiresAdvancePayment  Boolean     @default(false)
  advancePaymentAmount    Decimal?    // Monto del anticipo requerido
  
  // Configuración de cuotas
  allowInstallments           Boolean   @default(false)
  installmentsCount           Int?
  installmentsTotalPrice      Decimal?
  installmentsPayOnSessions   String?   // "1,3,5"
  
  isActive                Boolean     @default(true)
  sortOrder               Int         @default(0)
  
  createdAt               DateTime    @default(now())
  updatedAt               DateTime    @updatedAt
  
  // Relaciones
  category                Category?   @relation(fields: [categoryId], references: [id])
  babyCardSpecialPrices   BabyCardSpecialPrice[]
  babyCardRewards         BabyCardReward[]
}
```

### PackagePurchase (Compra de Paquete)

```prisma
model PackagePurchase {
  id                String    @id @default(cuid())
  
  // Cliente: bebé O padre (uno u otro, nunca ambos)
  babyId            String?   // Para paquetes de bebés
  parentId          String?   // Para paquetes de padres
  
  packageId         String
  
  // Precios
  basePrice         Decimal
  discountAmount    Decimal   @default(0)
  discountReason    String?
  finalPrice        Decimal   // Precio sin financiamiento
  
  // Plan de pago
  paymentPlan               String    @default("SINGLE")  // SINGLE | INSTALLMENTS
  installmentsCount         Int       @default(1)
  totalPrice                Decimal   // Precio final a pagar
  installmentAmount         Decimal?
  paidAmount                Decimal   @default(0)
  installmentsPayOnSessions String?
  
  // Preferencia de horario del padre (para auto-agendado)
  schedulePreferences       String?   @db.Text
  
  // Sesiones
  totalSessions     Int
  usedSessions      Int       @default(0)
  remainingSessions Int       // Calculado
  
  isActive          Boolean   @default(true)
  purchaseDate      DateTime  @default(now())
  
  // Relaciones
  baby              Baby?     @relation(fields: [babyId], references: [id])
  parent            Parent?   @relation(fields: [parentId], references: [id])
  package           Package   @relation(fields: [packageId], references: [id])
  payments          PackagePayment[]
  sessions          Session[]
  appointments      Appointment[]
}
```

### Parent (Padre/Madre)

```prisma
model Parent {
  id                  String        @id @default(cuid())
  name                String
  email               String?
  phone               String
  
  // Para padres potenciales (LEADS de talleres prenatales)
  status              ParentStatus  @default(ACTIVE)
  pregnancyWeeks      Int?          // Semanas de embarazo al registrar
  leadSource          String?       // "EVENTO_TALLER", "INSTAGRAM", "REFERIDO", etc.
  leadNotes           String?       // Notas del lead
  convertedAt         DateTime?     // Fecha cuando se convirtió en cliente
  
  // Control de no-shows
  noShowCount         Int           @default(0)
  requiresPrepayment  Boolean       @default(false)
  
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
  
  // Relaciones
  babies              Baby[]
  eventParticipations EventParticipant[]
  appointments        Appointment[]
  packagePurchases    PackagePurchase[]
}
```

### Baby (Bebé)

```prisma
model Baby {
  id                  String    @id @default(cuid())
  name                String
  birthDate           DateTime  @db.Date
  gender              String    // M | F
  
  // Datos adicionales
  birthWeeks          Int?      // Semanas de gestación
  birthWeight         Decimal?  // Peso al nacer
  currentWeight       Decimal?  // Peso actual
  medicalNotes        String?   @db.Text
  
  // Código de acceso al portal
  accessCode          String    @unique  // BSB-XXXXX
  
  isActive            Boolean   @default(true)
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  // Relaciones
  parents             Parent[]
  appointments        Appointment[]
  sessions            Session[]
  packagePurchases    PackagePurchase[]
  eventParticipations EventParticipant[]
  babyCardPurchases   BabyCardPurchase[]
}
```

### Appointment (Cita)

```prisma
model Appointment {
  id                  String            @id @default(cuid())
  
  // Cliente: bebé O padre (uno u otro según serviceType del paquete)
  babyId              String?           // Para servicios de bebés
  parentId            String?           // Para servicios de padres
  
  date                DateTime          @db.Date
  startTime           String            // "09:00"
  endTime             String            // "10:00"
  
  // Paquete provisional (puede cambiar hasta el checkout)
  selectedPackageId   String?
  packagePurchaseId   String?
  
  // Estado
  status              AppointmentStatus @default(SCHEDULED)
  isPendingPayment    Boolean           @default(false)
  
  // Asignación
  therapistId         String?
  
  notes               String?
  cancellationReason  String?
  
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
  createdById         String?
  
  // Relaciones
  baby                Baby?             @relation(fields: [babyId], references: [id])
  parent              Parent?           @relation(fields: [parentId], references: [id])
  therapist           User?             @relation(fields: [therapistId], references: [id])
  selectedPackage     Package?          @relation(fields: [selectedPackageId], references: [id])
  packagePurchase     PackagePurchase?  @relation(fields: [packagePurchaseId], references: [id])
  session             Session?
  payments            AppointmentPayment[]
}
```

### Session (Sesión)

```prisma
model Session {
  id                String        @id @default(cuid())
  appointmentId     String        @unique
  babyId            String
  therapistId       String
  packagePurchaseId String?
  
  status            SessionStatus @default(PENDING)
  isEvaluated       Boolean       @default(false)
  
  startTime         DateTime?
  endTime           DateTime?
  
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  // Relaciones
  appointment       Appointment   @relation(fields: [appointmentId], references: [id])
  baby              Baby          @relation(fields: [babyId], references: [id])
  therapist         User          @relation(fields: [therapistId], references: [id])
  packagePurchase   PackagePurchase? @relation(fields: [packagePurchaseId], references: [id])
  evaluation        Evaluation?
  products          SessionProduct[]
  payment           Payment?
  babyCardSessionLog BabyCardSessionLog?
}
```

### Event (Evento Grupal)

```prisma
model Event {
  id                  String        @id @default(cuid())
  name                String
  description         String?       @db.Text
  eventType           EventType     // BABIES | PARENTS
  
  date                DateTime      @db.Date
  startTime           String
  endTime             String
  
  maxParticipants     Int?
  minAgeMonths        Int?          // Solo para BABIES
  maxAgeMonths        Int?          // Solo para BABIES
  
  basePrice           Decimal       @db.Decimal(10, 2)
  
  // Bloqueo de calendario
  blockedTherapists   Int           @default(0)  // 0, 1, 2, 3, o 4
  
  status              EventStatus   @default(DRAFT)
  notes               String?       @db.Text
  
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
  createdById         String
  
  // Relaciones
  createdBy           User          @relation(fields: [createdById], references: [id])
  participants        EventParticipant[]
  productUsages       EventProductUsage[]
}
```

### EventParticipant (Inscripción a Evento)

```prisma
model EventParticipant {
  id                  String            @id @default(cuid())
  eventId             String
  babyId              String?           // Si eventType = BABIES
  parentId            String?           // Si eventType = PARENTS (leads)
  
  status              ParticipantStatus @default(REGISTERED)
  
  // Pago
  originalPrice       Decimal           @db.Decimal(10, 2)
  discountType        DiscountType?
  discountAmount      Decimal           @default(0) @db.Decimal(10, 2)
  discountReason      String?
  finalPrice          Decimal           @db.Decimal(10, 2)
  
  paymentStatus       PaymentStatus     @default(PENDING)
  paidAmount          Decimal           @default(0) @db.Decimal(10, 2)
  paymentMethod       PaymentMethod?
  paidAt              DateTime?
  
  attended            Boolean?
  notes               String?
  
  registeredAt        DateTime          @default(now())
  registeredById      String
  
  // Relaciones
  event               Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
  baby                Baby?             @relation(fields: [babyId], references: [id])
  parent              Parent?           @relation(fields: [parentId], references: [id])
  registeredBy        User              @relation(fields: [registeredById], references: [id])
  
  @@unique([eventId, babyId])
  @@unique([eventId, parentId])
}
```

### EventProductUsage (Productos usados en evento)

```prisma
model EventProductUsage {
  id          String    @id @default(cuid())
  eventId     String
  productId   String
  quantity    Int
  notes       String?
  createdAt   DateTime  @default(now())
  
  event       Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  product     Product   @relation(fields: [productId], references: [id])
}
```

## 4.4 Modelos Baby Card

### BabyCard (Plantilla/Catálogo)

```prisma
model BabyCard {
  id                    String    @id @default(cuid())
  name                  String    // "Baby Spa Card Premium"
  description           String?   @db.Text
  
  // Precio y configuración
  price                 Decimal   @db.Decimal(10, 2)  // 600 Bs
  totalSessions         Int       // 24 sesiones para completar
  includesFirstFree     Boolean   @default(true)  // Primera sesión gratis
  
  // Estado
  isActive              Boolean   @default(true)
  sortOrder             Int       @default(0)
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Relaciones
  specialPrices         BabyCardSpecialPrice[]
  rewards               BabyCardReward[]
  purchases             BabyCardPurchase[]
}
```

### BabyCardSpecialPrice (Precios Especiales)

```prisma
model BabyCardSpecialPrice {
  id              String    @id @default(cuid())
  babyCardId      String
  packageId       String    // Paquete al que aplica (ej: Sesión Individual)
  specialPrice    Decimal   @db.Decimal(10, 2)  // 290 Bs en lugar de 350
  
  babyCard        BabyCard  @relation(fields: [babyCardId], references: [id], onDelete: Cascade)
  package         Package   @relation(fields: [packageId], references: [id])
  
  @@unique([babyCardId, packageId])
}
```

### BabyCardReward (Premios Configurados)

```prisma
model BabyCardReward {
  id              String          @id @default(cuid())
  babyCardId      String
  sessionNumber   Int             // En qué sesión se desbloquea (3, 7, 10, etc.)
  
  // Tipo de premio
  rewardType      RewardType      // SERVICE | PRODUCT | EVENT | CUSTOM
  
  // Referencias según tipo
  packageId       String?         // Si rewardType = SERVICE
  productId       String?         // Si rewardType = PRODUCT
  
  // Para premios personalizados (CUSTOM)
  customName      String?
  customDescription String?       @db.Text
  
  // Display
  displayName     String          // "📸 Sesión de Fotos Gratis"
  displayIcon     String?
  
  createdAt       DateTime        @default(now())
  
  babyCard        BabyCard        @relation(fields: [babyCardId], references: [id], onDelete: Cascade)
  package         Package?        @relation(fields: [packageId], references: [id])
  product         Product?        @relation(fields: [productId], references: [id])
  
  usages          BabyCardRewardUsage[]
  
  @@unique([babyCardId, sessionNumber])
}
```

### BabyCardPurchase (Compra/Asignación a Bebé)

```prisma
model BabyCardPurchase {
  id                    String          @id @default(cuid())
  babyCardId            String
  babyId                String
  
  // Pago
  pricePaid             Decimal         @db.Decimal(10, 2)
  paymentMethod         PaymentMethod?
  paymentReference      String?
  
  // Progreso
  completedSessions     Int             @default(0)
  
  // Estado
  status                BabyCardStatus  @default(ACTIVE)
  
  // Primera sesión gratis
  firstFreeSessionUsed  Boolean         @default(false)
  firstFreeSessionId    String?
  firstFreeSessionDate  DateTime?
  
  // Fechas
  purchaseDate          DateTime        @default(now())
  completedDate         DateTime?
  replacedDate          DateTime?
  replacedByPurchaseId  String?
  
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt
  createdById           String?
  
  // Relaciones
  babyCard              BabyCard        @relation(fields: [babyCardId], references: [id])
  baby                  Baby            @relation(fields: [babyId], references: [id])
  createdBy             User?           @relation(fields: [createdById], references: [id])
  
  rewardUsages          BabyCardRewardUsage[]
  sessionLogs           BabyCardSessionLog[]
}
```

### BabyCardSessionLog (Registro de Sesiones Completadas)

```prisma
model BabyCardSessionLog {
  id                  String    @id @default(cuid())
  babyCardPurchaseId  String
  sessionId           String    @unique
  sessionNumber       Int       // Número de sesión en la card (1, 2, 3...)
  
  createdAt           DateTime  @default(now())
  
  babyCardPurchase    BabyCardPurchase @relation(fields: [babyCardPurchaseId], references: [id], onDelete: Cascade)
  session             Session          @relation(fields: [sessionId], references: [id])
}
```

### BabyCardRewardUsage (Uso de Premios)

```prisma
model BabyCardRewardUsage {
  id                  String    @id @default(cuid())
  babyCardPurchaseId  String
  babyCardRewardId    String
  
  usedAt              DateTime  @default(now())
  usedById            String
  
  appointmentId       String?
  eventParticipantId  String?
  productSaleId       String?
  
  notes               String?
  
  babyCardPurchase    BabyCardPurchase @relation(fields: [babyCardPurchaseId], references: [id], onDelete: Cascade)
  babyCardReward      BabyCardReward   @relation(fields: [babyCardRewardId], references: [id])
  usedBy              User             @relation(fields: [usedById], references: [id])
  
  @@unique([babyCardPurchaseId, babyCardRewardId])
}
```

## 4.5 Modelos Nuevos (Fase 5-8)

### PaymentDetail (Pagos Divididos)

```prisma
model PaymentDetail {
  id              String            @id @default(cuid())
  
  parentType      PaymentParentType
  parentId        String
  
  amount          Decimal           @db.Decimal(10, 2)
  paymentMethod   PaymentMethod
  reference       String?
  
  createdById     String
  createdBy       User              @relation(fields: [createdById], references: [id])
  createdAt       DateTime          @default(now())
  
  @@index([parentType, parentId])
  @@index([createdAt])
  @@index([paymentMethod, createdAt])
}
```

### Notification (Notificaciones en Tiempo Real)

```prisma
model Notification {
  id            String           @id @default(cuid())
  
  type          NotificationType
  title         String
  message       String
  
  entityType    String?
  entityId      String?
  
  isRead        Boolean          @default(false)
  readAt        DateTime?
  readById      String?
  readBy        User?            @relation(fields: [readById], references: [id])
  
  forRole       Role             @default(RECEPTION)
  
  createdAt     DateTime         @default(now())
  expiresAt     DateTime
  
  @@index([isRead, forRole])
  @@index([expiresAt])
  @@index([createdAt])
}
```

### CashRegister (Arqueo de Caja)

```prisma
model CashRegister {
  id                String              @id @default(cuid())

  // Apertura
  openedById        String
  openedBy          User                @relation("CashRegisterOpenedBy", fields: [openedById], references: [id])
  openedAt          DateTime            @default(now())
  initialFund       Decimal             @db.Decimal(10, 2) @default(0)

  // Cierre (arqueo ciego)
  closedAt          DateTime?
  declaredAmount    Decimal?            @db.Decimal(10, 2)  // Lo que contó recepción
  expectedAmount    Decimal?            @db.Decimal(10, 2)  // Calculado por sistema
  difference        Decimal?            @db.Decimal(10, 2)  // declaredAmount - expectedAmount
  closingNotes      String?             @db.Text

  // Estado
  status            CashRegisterStatus  @default(OPEN)

  // Revisión (solo si hay diferencia)
  reviewedById      String?
  reviewedBy        User?               @relation("CashRegisterReviewedBy", fields: [reviewedById], references: [id])
  reviewedAt        DateTime?
  reviewNotes       String?             @db.Text

  // Forzar cierre (si recepción olvidó cerrar)
  forcedCloseById   String?
  forcedCloseBy     User?               @relation("CashRegisterForcedBy", fields: [forcedCloseById], references: [id])
  forcedCloseNotes  String?             @db.Text

  // Relaciones
  expenses          CashRegisterExpense[]

  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt

  @@index([openedById, openedAt])
  @@index([status])
  @@index([openedAt])
}
```

### CashRegisterExpense (Gastos de Caja)

```prisma
model CashRegisterExpense {
  id                String              @id @default(cuid())

  cashRegisterId    String
  cashRegister      CashRegister        @relation(fields: [cashRegisterId], references: [id], onDelete: Cascade)

  amount            Decimal             @db.Decimal(10, 2)
  category          CashExpenseCategory
  description       String

  createdById       String
  createdBy         User                @relation("CashRegisterExpenseCreatedBy", fields: [createdById], references: [id])
  createdAt         DateTime            @default(now())

  @@index([cashRegisterId])
  @@index([createdAt])
}
```

### StaffPayment (Pagos a Empleados)

```prisma
model StaffPayment {
  id              String              @id @default(cuid())

  staffId         String
  staff           User                @relation("StaffPayments", fields: [staffId], references: [id])

  type            StaffPaymentType
  status          StaffPaymentStatus  @default(PENDING)  // PENDING = movimiento, PAID = pagado

  grossAmount     Decimal             @db.Decimal(10, 2)
  netAmount       Decimal             @db.Decimal(10, 2)
  advanceDeducted Decimal?            @db.Decimal(10, 2)

  description     String

  // Período flexible (soporta diario, semanal, quincenal, mensual)
  periodStart     DateTime?           // Inicio del período
  periodEnd       DateTime?           // Fin del período
  periodMonth     Int?                // Mes (legacy, para compatibilidad)
  periodYear      Int?                // Año (legacy, para compatibilidad)

  // Fechas
  movementDate    DateTime?           // Fecha del movimiento (para bonos, deducciones)
  paidAt          DateTime?           // Fecha de pago efectivo (null si PENDING)

  // Consolidación de salario
  includedInSalaryId String?          // Si es movimiento, referencia al SALARY que lo incluyó
  includedInSalary   StaffPayment?    @relation("MovementsIncludedInSalary", fields: [includedInSalaryId], references: [id])
  includedMovements  StaffPayment[]   @relation("MovementsIncludedInSalary")

  // Auditoría
  createdById     String
  createdBy       User                @relation("StaffPaymentCreator", fields: [createdById], references: [id])
  createdAt       DateTime            @default(now())

  // Soft delete
  deletedAt       DateTime?
  deletedById     String?
  deletedBy       User?               @relation("StaffPaymentDeleter", fields: [deletedById], references: [id])

  @@index([staffId])
  @@index([status])
  @@index([paidAt])
  @@index([type])
  @@index([periodStart, periodEnd])
}
```

**Tipos de Movimiento vs Pago:**

| Tipo | Categoría | Status Inicial | Descripción |
|------|-----------|----------------|-------------|
| BONUS | Movimiento | PENDING | Se acumula hasta el pago de salario |
| COMMISSION | Movimiento | PENDING | Se acumula hasta el pago de salario |
| BENEFIT | Movimiento | PENDING | Se acumula hasta el pago de salario |
| DEDUCTION | Movimiento | PENDING | Se acumula (monto negativo) |
| SALARY | Pago Real | PAID | Consolida todos los movimientos PENDING del período |
| ADVANCE | Pago Real | PAID | Dinero entregado al empleado (aumenta deuda) |
| ADVANCE_RETURN | Pago Real | PAID | Empleado devuelve adelanto (reduce deuda) |
| SETTLEMENT | Pago Real | PAID | Liquidación final |

### StaffAdvanceBalance (Control de Adelantos)

```prisma
model StaffAdvanceBalance {
  id              String    @id @default(cuid())
  
  staffId         String    @unique
  staff           User      @relation(fields: [staffId], references: [id])
  
  currentBalance  Decimal   @db.Decimal(10, 2) @default(0)
  
  updatedAt       DateTime  @updatedAt
}
```

### Expense (Gastos Administrativos)

```prisma
model Expense {
  id              String          @id @default(cuid())
  
  category        ExpenseCategory
  description     String
  amount          Decimal         @db.Decimal(10, 2)
  reference       String?
  
  expenseDate     DateTime        @default(now())
  
  createdById     String
  createdBy       User            @relation(fields: [createdById], references: [id])
  createdAt       DateTime        @default(now())
  
  @@index([expenseDate])
  @@index([category])
}
```

### Activity (Registro de Actividad)

```prisma
model Activity {
  id            String         @id @default(cuid())
  
  type          ActivityType
  title         String
  description   String?
  
  entityType    String?
  entityId      String?
  
  metadata      Json?
  
  performedById String?
  performedBy   User?          @relation(fields: [performedById], references: [id])
  
  createdAt     DateTime       @default(now())
  
  @@index([createdAt])
  @@index([type, createdAt])
  @@index([performedById, createdAt])
}
```

---

# 5. FLUJOS DE NEGOCIO

## 5.1 Flujo de Citas (IMPORTANTE)

### Estados de Cita
```
SCHEDULED ──────────► IN_PROGRESS ──────────► COMPLETED
    │                      │
    │                      └──► (terapeuta evalúa, opcional)
    │
    ├──► PENDING_PAYMENT (si requiere pago anticipado)
    │         │
    │         └──► SCHEDULED (cuando se confirma pago)
    │
    ├──► CANCELLED (cancelación)
    │
    └──► NO_SHOW (no asistió)
```

### 5.1.1 Agendamiento

**REGLA CLAVE: Siempre se selecciona un paquete**
- NO existe "sesión a definir"
- Si el padre/staff no está seguro → selecciona "Individual" (1 sesión)
- El paquete es **provisional** hasta el checkout

**Desde Portal de Padres:**
1. Padre selecciona bebé
2. Sistema muestra paquetes existentes + catálogo
3. Padre selecciona paquete (provisional)
4. Padre selecciona fecha y hora
5. Si paquete requiere pago anticipado → muestra QR + WhatsApp
6. Si no requiere pago → cita SCHEDULED

**Desde Staff:**
1. Staff busca bebé o padre (según tipo de servicio)
2. Selecciona paquete
3. Si requiere pago anticipado → registra pago
4. Se crea cita SCHEDULED

### 5.1.2 Agendamiento para Padres (Servicios PARENT)

Cuando el paquete tiene `serviceType = PARENT`:
1. Staff selecciona padre/madre en lugar de bebé
2. El padre puede ser LEAD (sin bebés) o cliente activo
3. Resto del flujo igual
4. En calendario se muestra con icono diferente:
   - 👶 = Cita de bebé
   - 👩 = Cita de padre activo
   - 🤰 = Cita de padre LEAD

### 5.1.3 Checkout

1. Staff abre sesión IN_PROGRESS
2. Ve evaluación (si existe)
3. Puede cambiar paquete (última oportunidad)
4. Agrega productos usados
5. **Si bebé tiene Baby Card activa:**
   - Aplica precio especial automáticamente
   - Muestra premios disponibles
   - Incrementa contador de sesiones
   - Verifica si desbloqueó nuevo premio
6. Registra pago
7. Se descuenta sesión del paquete
8. Cambia a COMPLETED

## 5.2 Flujo de Eventos Grupales

### Tipos de Eventos

| Tipo | Participantes | Ejemplo |
|------|---------------|---------|
| BABIES | Bebés registrados | Hora de Juego, Babython |
| PARENTS | Padres (pueden ser LEADS) | Taller Prenatal |

### Estados del Evento
```
DRAFT ──► PUBLISHED ──► IN_PROGRESS ──► COMPLETED
                │
                └──► CANCELLED
```

### Flujo Completo

1. **Admin crea evento:**
   - Nombre, descripción, tipo
   - Fecha, horario
   - Capacidad máxima, rango de edad (si aplica)
   - Precio base
   - Terapeutas bloqueados (0-4)

2. **Staff inscribe participantes:**
   - Busca bebé/padre existente
   - O registra nuevo cliente completo
   - Configura descuento si aplica (cortesía o fijo)
   - Registra pago

3. **Día del evento:**
   - Marca asistencia
   - Registra productos usados
   - Finaliza evento

### Bloqueo de Calendario

- `blockedTherapists = 0` → No afecta citas normales
- `blockedTherapists = 2` → Solo 2 terapeutas disponibles para citas
- `blockedTherapists = 4` → No se pueden agendar citas durante el evento

## 5.3 Flujo Baby Card (Fidelización)

### Concepto

La **Baby Card** es una tarjeta de beneficios prepagada que incluye:
1. **Primera sesión GRATIS**
2. **Precio preferencial** en sesiones individuales (ej: 290 Bs en lugar de 350)
3. **Premios desbloqueables** al completar cierta cantidad de sesiones

### Flujo de Venta

```
1. Staff vende Baby Card al padre
2. Cobra precio de la card (ej: 600 Bs)
3. Opcionalmente agenda primera sesión gratis
4. Sistema crea BabyCardPurchase con status ACTIVE
5. Bebé tiene Baby Card activa
```

### Flujo de Progreso

```
1. Bebé completa cualquier sesión (hidro, vacunas, etc.)
2. Al completar (checkout):
   - Sistema detecta Baby Card activa
   - Incrementa contador de sesiones
   - Crea registro en BabyCardSessionLog
   - Verifica si desbloqueó premio
3. Si desbloqueó premio → alerta al staff
4. Premios quedan disponibles para usar
```

### Flujo de Uso de Premio

```
1. Staff ve que bebé tiene premio disponible
2. Click "Usar Premio"
3. Premio aplica 100% descuento en:
   - Servicio (si tipo = SERVICE)
   - Producto (si tipo = PRODUCT)
   - Evento (si tipo = EVENT)
4. Se marca premio como usado
5. No se puede usar dos veces
```

### Reglas de Baby Card

```
1. PROGRESO:
   - Contador incrementa al COMPLETAR sesión (checkout)
   - TODAS las sesiones cuentan (hidro, vacunas, cumple mes, etc.)
   - Primera sesión gratis cuenta como sesión #1

2. CARDS POR BEBÉ:
   - Solo UNA card activa a la vez
   - Si activa nueva → anterior se marca REPLACED
   - El contador se reinicia

3. PRECIO ESPECIAL:
   - Aplica SOLO a sesiones individuales
   - NO aplica a paquetes múltiples
   - Se acumula con otros descuentos

4. PREMIOS:
   - Son ACUMULATIVOS (no expiran)
   - Se usan cuando el padre quiera
   - Al usar → 100% descuento

5. DURACIÓN:
   - La card es INDEFINIDA (no expira)
   - Precios especiales aplican hasta completar todas las sesiones
```

---

# 6. REGLAS DE NEGOCIO

## 6.1 Bebés
- Solo bebés ≤36 meses aparecen en notificaciones activas
- Después de 3 años → isActive = false (no borrar)
- Código acceso portal generado automático: BSB-XXXXX
- Un bebé puede tener múltiples padres/tutores

## 6.2 Padres
- Identificables por teléfono (único)
- Login portal SOLO con código BSB-XXXXX del bebé
- noShowCount se resetea cuando asiste a cita
- requiresPrepayment = true si noShowCount >= 3
- Padres con status = LEAD no tienen acceso al portal
- Padres LEAD se convierten en ACTIVE cuando registran bebé

## 6.3 Servicios para Padres
- Paquetes con `serviceType = PARENT` son para padres, no bebés
- Si `serviceType = BABY` → cita requiere `babyId`
- Si `serviceType = PARENT` → cita requiere `parentId`
- Una cita es para UN bebé O para UN padre (nunca ambos)
- Ejemplos: Masaje Prenatal, Masaje Postparto

## 6.4 Paquetes
- **NO vencen** (válidos hasta bebé cumpla 3 años)
- Sesiones **NO transferibles** entre bebés
- Siempre se selecciona paquete al agendar
- El paquete es **provisional** hasta el checkout
- Sesión se **descuenta al completar**, NO al agendar
- Tienen **duración configurable** (30, 60, 90, 120 min)

## 6.5 Eventos
- Tipos: BABIES (para bebés) o PARENTS (para padres/leads)
- Bloqueo configurable: 0, 1, 2, 3, o 4 terapeutas
- No tienen evaluaciones (solo asistencia + pago)
- Descuentos: COURTESY (gratis) o FIXED (monto fijo)
- Sin penalización por no-show en eventos

## 6.6 Baby Card
- Solo UNA card activa por bebé
- Precios especiales solo para sesiones individuales
- Contador incrementa al COMPLETAR sesión
- TODAS las sesiones cuentan para el progreso
- Primera sesión gratis cuenta como #1
- Premios son acumulativos (no expiran)
- Card es indefinida (no expira)

## 6.7 Cuotas (Financiamiento)
- Configuradas POR PAQUETE (cliente no elige cantidad)
- Precio en cuotas puede ser MAYOR al pago único
- Se define EN QUÉ SESIONES se paga cada cuota
- Sistema ALERTA pero NO BLOQUEA por pagos atrasados
- Pagos flexibles (cualquier monto en cualquier momento)

## 6.8 Pagos a Personal (Staff Payments)

### Conceptos Clave
- **Movimientos**: Registros que se acumulan (BONUS, COMMISSION, BENEFIT, DEDUCTION) - status=PENDING
- **Pagos Reales**: Transferencias de dinero (SALARY, ADVANCE, ADVANCE_RETURN) - status=PAID
- **Frecuencia de Pago**: Cada empleado tiene su frecuencia (DAILY, WEEKLY, BIWEEKLY, MONTHLY)
- **Período**: Rango de fechas calculado según frecuencia del empleado

### Flujo de Nómina
```
1. DURANTE EL PERÍODO:
   - Registrar bonos, comisiones → status=PENDING
   - Registrar deducciones → status=PENDING (monto negativo)
   - Dar adelantos si necesario → status=PAID, aumenta advanceBalance

2. FIN DEL PERÍODO:
   - Sistema muestra preview: salario base + movimientos + adelanto pendiente
   - Staff confirma pago de SALARY
   - Movimientos PENDING → se marcan PAID + se vinculan al salario
   - Se descuenta adelanto si se indica

3. SI HAY ERROR:
   - Eliminar el SALARY
   - Movimientos vuelven a PENDING automáticamente
   - Balance de adelanto se restaura
   - Corregir y volver a pagar
```

### Reglas de Negocio
- **Un período = Un salario**: No se puede pagar el mismo período dos veces
- **Movimientos protegidos**: No se puede crear movimiento en período ya pagado
- **Movimientos vinculados**: No se puede eliminar movimiento ya incluido en salario
- **Adelantos controlados**: No se puede devolver/descontar más del balance disponible
- **Soft delete**: Los pagos eliminados mantienen historial de auditoría
- **Empleado sin salario base**: Permitido (para comisionistas puros)

### Frecuencias de Pago
| Frecuencia | Período | Ejemplo |
|------------|---------|---------|
| DAILY | Mismo día | 15 ene → 15 ene |
| WEEKLY | Lunes a Domingo | 13 ene (lun) → 19 ene (dom) |
| BIWEEKLY | 1-15 o 16-fin de mes | 1 ene → 15 ene |
| MONTHLY | Mes completo | 1 ene → 31 ene |

---

# 7. MÓDULOS IMPLEMENTADOS

## ✅ Fase 1: Fundamentos (COMPLETADA)
- [x] Setup Next.js + TypeScript + Tailwind
- [x] Prisma + PostgreSQL (schema completo)
- [x] NextAuth.js (login staff)
- [x] next-intl (ES/PT-BR)
- [x] Layouts base (Admin, Therapist, Portal)
- [x] Design System (glassmorphism, burbujas)
- [x] 15+ componentes shadcn/ui personalizados

## ✅ Fase 2: Core (COMPLETADA)
- [x] Módulo 1: Bebés y Padres (CRUD completo)
- [x] Módulo 2: Link Registro Temporal
- [x] Módulo 3: Paquetes y Ventas
- [x] Módulo 4: Calendario y Agendamiento
- [x] Módulo 5: Inventario
- [x] Módulo 6: Sesiones y Evaluaciones

## ✅ Fase 3: Pagos y Financiamiento (COMPLETADA)
- [x] Módulo 3.1: Refactorización de Paquetes
- [x] Módulo 3.2: Sistema de Pagos Anticipados
- [x] Módulo 3.3: Paquetes en Cuotas
- [x] Módulo 3.4: Alertas de Deuda
- [x] Módulo 3.5: Auto-Agendado Masivo

## ✅ Fase 4: Eventos y Servicios (COMPLETADA)
- [x] Módulo 4.1: Sistema de Eventos Grupales
- [x] Módulo 4.5: Servicios para Padres

## ✅ Fase 5: Baby Card y Pagos Divididos (COMPLETADA)
- [x] Módulo 5.1: Sistema Baby Card
- [x] Módulo 5.2: Pagos Divididos (Split Payments)

## ✅ Fase 6: Operaciones (COMPLETADA)
- [x] Módulo 6.1: Notificaciones en Tiempo Real (COMPLETADO)
- [x] Módulo 6.2: Actividad Reciente (COMPLETADO)

## ✅ Fase 7: Finanzas (COMPLETADA)
- [x] Módulo 7.1: Staff Payments (COMPLETADO)
- [x] Módulo 7.2: Gastos Administrativos (COMPLETADO)

## ✅ Fase 8: Portal Padres Mejorado (COMPLETADA)
- [x] Módulo 8.1: Cancelar/Reagendar Citas
- [x] Módulo 8.2: Saldo Financiero
- [x] Módulo 8.3: Perfil del Padre
- [x] Módulo 8.4: Mesversarios
- [x] Módulo 8.5: Dashboard Mejorado
- [x] Módulo 8.6: Navegación Rediseñada (tabs desktop, bottom bar mobile)
- [x] Módulo 8.7: Welcome Guide (primera visita)

## ✅ Fase 9: Reportes (COMPLETADA)

Dashboard centralizado con KPIs y 16 módulos de reportes organizados en 3 tiers.
Ver documentación completa en: `REPORTES-CONSOLIDADOS.md`

### TIER 1 - Críticos (6 módulos) ✅ COMPLETADO
| Módulo | Ruta | Permiso |
|--------|------|---------|
| Dashboard | `/admin/reports` | ADMIN, RECEPTION |
| Ingresos | `/admin/reports/income` | ADMIN |
| Cuentas por Cobrar | `/admin/reports/receivables` | ADMIN |
| Asistencia/No-Shows | `/admin/reports/attendance` | ADMIN, RECEPTION |
| Inventario | `/admin/reports/inventory` | ADMIN, RECEPTION |
| Evaluaciones Pendientes | `/admin/reports/evaluations` | ADMIN |

### TIER 2 - Importantes (6 módulos) ✅ COMPLETADO
| Módulo | Ruta | Permiso |
|--------|------|---------|
| P&L | `/admin/reports/pnl` | ADMIN |
| Terapeutas | `/admin/reports/therapists` | ADMIN |
| Cartera Clientes | `/admin/reports/clients` | ADMIN |
| Paquetes | `/admin/reports/packages` | ADMIN |
| Adquisición | `/admin/reports/acquisition` | ADMIN |
| Ocupación | `/admin/reports/occupancy` | ADMIN |

### TIER 3 - Avanzados (4 módulos) ✅ COMPLETADO
| Módulo | Ruta | Permiso |
|--------|------|---------|
| Baby Cards | `/admin/reports/baby-cards` | ADMIN |
| Eventos | `/admin/reports/events` | ADMIN |
| Nómina | `/admin/reports/payroll` | ADMIN |
| Flujo de Caja | `/admin/reports/cashflow` | ADMIN |

**Pendiente:** Exportación PDF/Excel (Fase futura)

## ✅ Fase 10: Arqueo de Caja (COMPLETADA)
- [x] Módulo 10.1: Arqueo de Caja Ciego para RECEPTION
- [x] Módulo 10.2: Revisión de Arqueos para ADMIN
- [x] Resumen del Turno con todos los métodos de pago
- [x] Migración de métodos de pago: OTHER → QR (Bolivia) / PIX (Brasil)

## 🔮 Fase 11: Exportación y Extras (FUTURO)
- [ ] Exportación PDF/Excel de Reportes
- [ ] Cron Jobs (limpieza, recordatorios)
- [ ] Notificaciones Push
- [ ] Configuración del Sistema
- [ ] QR de Pago
- Ver planificación de exportación en: `PlanificacionesBabySpa/PLANIFICACION-EXPORTACION-PDF-EXCEL.md`

---

# 8. PLAN DE IMPLEMENTACIÓN

## Fase 6: Operaciones

### Módulo 6.1: Notificaciones en Tiempo Real ✅ COMPLETADO
```
MODELOS:
✅ Enum StaffNotificationType (NEW_APPOINTMENT, CANCELLED_APPOINTMENT, RESCHEDULED_APPOINTMENT)
✅ Modelo Notification (con metadata JSON, forRole, expiresAt)
✅ Campos en SystemSettings: notificationPollingInterval, notificationExpirationDays
✅ Migración ejecutada

BACKEND:
✅ NotificationService (create, list, getCount, markAsRead, markAllAsRead, deleteExpired)
✅ GET /api/notifications (con filtro por rol: ADMIN ve todas, RECEPTION solo las suyas)
✅ GET /api/notifications/count (lightweight para polling)
✅ GET /api/notifications/config (polling interval desde settings)
✅ PATCH /api/notifications/:id/read
✅ PATCH /api/notifications/read-all
✅ Integración en portal appointments (crea notificación al agendar)

FRONTEND:
✅ Zustand store (notification-store.ts) para estado global
✅ Hook useNotifications (polling configurable 1-30 min)
✅ Hook useNotificationSound (reproducción de sonido)
✅ NotificationBell (campana en header con badge animado)
✅ NotificationPanel (dropdown con portal, responsive mobile)
✅ NotificationToast + NotificationToastContainer (glassmorphism, max 3 visibles)
✅ Sonido notification.mp3
✅ Integrado en admin layout

CONFIGURACIÓN (Settings > Admin):
✅ Intervalo de polling: 1-30 minutos (default 5)
✅ Días de expiración: 1-30 días (default 7)
✅ Solo ADMIN puede modificar

UX FEATURES:
✅ Click en "Ver" → Navega al calendario con fecha correcta + abre modal del appointment
✅ Optimistic updates para marcar como leído
✅ Agrupación por fecha (Hoy, Ayer, Esta Semana, Anteriores)
✅ Panel responsive (full-width en mobile con botón cerrar)
✅ Toasts compactos con glassmorphism

TRADUCCIONES:
✅ es.json completo
✅ pt-BR.json completo
```

### Módulo 6.2: Actividad Reciente ✅ COMPLETADO
```
MODELOS:
✅ Enum ActivityType (19 tipos incluyendo EVALUATION_SAVED)
✅ Modelo Activity
✅ Migración ejecutada

BACKEND:
✅ ActivityService con helpers por tipo
✅ GET /api/activity (filtros: tipo, usuario, rango de fechas)
✅ Integrar en servicios existentes:
  - session-service (SESSION_COMPLETED, DISCOUNT_APPLIED)
  - appointment-service (APPOINTMENT_CREATED, CANCELLED, RESCHEDULED)
  - portal appointments (APPOINTMENT_CREATED_PORTAL)
  - baby-card-service (BABY_CARD_SOLD, BABY_CARD_REWARD_DELIVERED)
  - event-participant-service (EVENT_REGISTRATION)
  - babies route (BABY_CREATED)
  - evaluate route (EVALUATION_SAVED) - actividad de terapeutas

CRON JOB (Fase 10):
□ Limpieza mensual de registros > 1 año
□ Retención: ~3.5 MB/año estimado

FRONTEND:
✅ Página /admin/activity (solo ADMIN)
✅ ActivityFilters (grupos: citas, sesiones, babyCards, clientes, paquetes, eventos, evaluaciones)
✅ ActivityList con paginación y agrupación por día
✅ ActivityCard con botón "Ver" (navega a calendario con date+appointmentId)
✅ Link en sidebar (icono History)

NOTAS:
- Títulos usan keys de traducción + metadata (no texto fijo)
- Navegación "Ver" reutiliza patrón de notificaciones (date + appointmentId)
- CASH_REGISTER_* se integrarán en Fase 9
- INSTALLMENT_PAID, PACKAGE_ASSIGNED, CLIENT_UPDATED pendientes de integración

TRADUCCIONES:
✅ es.json completo
✅ pt-BR.json completo
```

## Fase 7: Finanzas

### Módulo 7.1: Staff Payments ✅ COMPLETADO
```
MODELOS:
✅ Enum StaffPaymentType (SALARY, COMMISSION, BONUS, ADVANCE, ADVANCE_RETURN, DEDUCTION, BENEFIT, SETTLEMENT)
✅ Enum StaffPaymentStatus (PENDING, PAID) - Nuevo para diferenciar movimientos vs pagos
✅ Enum PayFrequency (DAILY, WEEKLY, BIWEEKLY, MONTHLY) - Frecuencia de pago por empleado
✅ Modelo StaffPayment (con status, periodStart/End, movementDate, includedInSalaryId, soft delete)
✅ Modelo StaffAdvanceBalance
✅ Campo payFrequency en User
✅ Migración ejecutada

BACKEND:
✅ StaffPaymentService con métodos separados:
  - createMovement() - Para BONUS, COMMISSION, BENEFIT, DEDUCTION (status=PENDING)
  - createAdvance() - Para adelantos (status=PAID, aumenta balance)
  - createAdvanceReturn() - Para devoluciones (status=PAID, reduce balance)
  - createSalaryPayment() - Consolida movimientos PENDING, los marca PAID
  - getSalaryPreview() - Pre-calcula salario con movimientos pendientes
  - getPendingMovements() - Obtiene movimientos PENDING del período
  - getStaffStats() - Estadísticas (sesiones, días trabajados, baby cards)
  - calculatePeriodDates() - Calcula período según frecuencia de pago
  - getSalaryPerPeriod() - Divide salario base según frecuencia
  - delete() - Soft delete con reversión de balance y liberación de movimientos
✅ GET/POST /api/staff-payments
✅ DELETE /api/staff-payments/[id]
✅ GET /api/staff-payments/stats (con salaryPreview)
✅ GET /api/staff-payments/staff-with-balances

VALIDACIONES (Edge Cases):
✅ No permitir pagar mismo período 2 veces (SALARY_ALREADY_PAID_FOR_PERIOD)
✅ No permitir crear movimiento en período ya pagado (PERIOD_ALREADY_PAID)
✅ No permitir eliminar movimiento incluido en salario (CANNOT_DELETE_MOVEMENT_INCLUDED_IN_SALARY)
✅ No permitir devolver más adelanto del debido (ADVANCE_RETURN_EXCEEDS_BALANCE)
✅ No permitir descontar más adelanto del disponible (ADVANCE_DEDUCTION_EXCEEDS_BALANCE)
✅ Al eliminar SALARY → movimientos vuelven a PENDING
✅ Al eliminar ADVANCE → balance se reduce
✅ Al eliminar SALARY con descuento → balance se restaura

FRONTEND:
✅ Página /admin/staff-payments
✅ StaffPaymentDialog (diferencia movimientos vs pagos, muestra preview de salario)
✅ StaffPaymentList (con badges de status PENDING/PAID, colores por tipo)
✅ StaffPaymentFilters (por staff, tipo, status, fechas)
✅ Selector de tipo agrupado (Ingresos verde / Egresos rojo)
✅ Preview de salario con movimientos pendientes
✅ Alerta de adelanto pendiente
✅ Split payments para SALARY y ADVANCE

FLUJO DE NÓMINA:
1. Durante el período: Registrar bonos, comisiones, deducciones → status=PENDING
2. Dar adelanto: Pago real → status=PAID, aumenta advanceBalance
3. Fin del período: Pagar SALARY → consolida movimientos, los marca PAID
4. Si error: Eliminar SALARY → movimientos vuelven a PENDING, corregir, volver a pagar

TRADUCCIONES:
✅ es.json completo
✅ pt-BR.json completo
```

### Módulo 7.2: Gastos Administrativos ✅ COMPLETADO
```
MODELOS:
✅ Enum ExpenseCategory (RENT, UTILITIES, SUPPLIES, MAINTENANCE, MARKETING, TAXES, INSURANCE, EQUIPMENT, OTHER)
✅ Modelo Expense (con soft delete)
✅ Migración ejecutada

BACKEND:
✅ ExpenseService (CRUD completo)
  - create() - Con split payments
  - list() - Con filtros y paginación
  - getById() - Con payment details
  - getSummaryByCategory() - Resumen por categoría
  - getTotal() - Total del período
  - update()
  - delete() - Soft delete
✅ GET/POST /api/expenses
✅ GET /api/expenses/[id]
✅ DELETE /api/expenses/[id]
✅ GET /api/expenses/summary

FRONTEND:
✅ Página /admin/expenses
✅ ExpenseDialog (con split payments)
✅ ExpenseList (con acciones)
✅ ExpenseFilters (categoría, fechas)
✅ ExpenseSummary (resumen visual por categoría)

TRADUCCIONES:
✅ es.json completo
✅ pt-BR.json completo
```

## Fase 8: Portal Padres Mejorado ✅ COMPLETADO

### Módulo 8.1-8.7: Portal Completo
```
CANCELAR/REAGENDAR:
✅ POST /api/portal/appointments/:id/cancel
✅ POST /api/portal/appointments/:id/reschedule
✅ Validación de 24h de anticipación
✅ Modal de cancelación con motivo obligatorio
✅ Modal de reagendar con selector fecha/hora
✅ Integrar con notificaciones (genera notif al staff)

SALDO FINANCIERO:
✅ Página /portal/account
✅ GET /api/portal/financial-summary
✅ GET /api/portal/packages/:id/payments
✅ Resumen de deuda total por paquete
✅ Historial de pagos expandible

PERFIL DEL PADRE:
✅ Página /portal/profile
✅ GET/PATCH /api/portal/profile
✅ Editar info del padre (nombre, teléfono, email)
✅ Editar info de bebés (datos médicos, autorizaciones)
✅ Cerrar sesión desde perfil

MESVERSARIOS:
✅ Función isMessiversary() en age.ts
✅ MessiversaryBanner en dashboard
✅ Botón "Agendar" que lleva a wizard de citas

DASHBOARD MEJORADO:
✅ Banner mesversario destacado
✅ Próxima cita con acciones (cancelar/reagendar)
✅ Alerta de prepago si aplica
✅ Baby Card promo integrada
✅ Sección resumen con estadísticas
✅ Accesos rápidos actualizados
✅ Welcome Guide de una sola vez (localStorage)

NAVEGACIÓN REDISEÑADA:
✅ Desktop: Tabs horizontales centrados + logout
✅ Mobile: Barra inferior fija estilo Instagram (5 iconos)
✅ Iconos: Dashboard, Citas, Historial, Cuenta, Perfil

TOASTS:
✅ Estilo pastel consistente con design system
✅ Colores: success (verde), error (rosa), warning (amber), info (cyan)

TRADUCCIONES:
✅ es.json completo
✅ pt-BR.json completo
```

## Fase 10: Arqueo de Caja ✅ COMPLETADO

### Módulo 10.1: Arqueo de Caja Ciego
```
CONCEPTO:
- Solo RECEPTION debe abrir/cerrar caja
- Arqueo CIEGO: recepción NO ve cuánto debería tener
- Solo cuenta el efectivo y declara el monto
- ADMIN revisa diferencias después

MODELOS:
✅ Enum CashRegisterStatus (OPEN, CLOSED, APPROVED, FORCE_CLOSED)
✅ Enum CashExpenseCategory (SUPPLIES, FOOD, TRANSPORT, BANK_DEPOSIT, OTHER)
✅ Modelo CashRegister
✅ Modelo CashRegisterExpense
✅ Nuevos tipos en NotificationType (CASH_REGISTER_DIFFERENCE)
✅ Nuevos tipos en ActivityType (CASH_REGISTER_*)
✅ Migración ejecutada

BACKEND:
✅ CashRegisterService (lib/services/cash-register-service.ts)
✅ GET /api/cash-register (lista para admin)
✅ GET /api/cash-register/current (caja actual del usuario)
✅ POST /api/cash-register (abrir caja)
✅ POST /api/cash-register/[id]/close (cerrar caja)
✅ POST /api/cash-register/[id]/review (aprobar/revisar)
✅ POST /api/cash-register/[id]/force-close (admin fuerza cierre)
✅ POST /api/cash-register/[id]/expenses (registrar gasto)

FRONTEND RECEPTION:
✅ Indicador en header (caja abierta/cerrada)
✅ Warning si no hay caja abierta
✅ Modal abrir caja (con fondo inicial)
✅ Modal cerrar caja (CIEGO - solo pide monto)
✅ Modal registrar gasto de caja
✅ Bloqueo en session start/complete si no hay caja

FRONTEND ADMIN:
✅ Página /admin/cash-register
✅ Lista de arqueos (pendientes, aprobados)
✅ Detalle con Resumen del Turno (todos los métodos de pago)
✅ Modal aprobar / aprobar con nota
✅ Modal forzar cierre

REFACTOR MÉTODOS DE PAGO:
✅ Eliminado OTHER del enum PaymentMethod
✅ Agregado QR (Bolivia) / PIX (Brasil) para pagos instantáneos
✅ Orden por frecuencia: CASH → QR → CARD → TRANSFER
✅ Actualizado en 17+ archivos (services, validations, components)
✅ Migración de BD: 2 registros OTHER → QR
✅ Traducciones actualizadas (es.json, pt-BR.json)

DECISIONES FINALES:
✓ Solo RECEPTION necesita caja para cobrar (ADMIN no)
✓ Arqueo 100% ciego (sin emoji ni feedback)
✓ Fondo inicial editable
✓ Múltiples turnos por día (cada persona su caja)
✓ Auto-aprobación si diferencia = 0
✓ Notificación a admin si hay diferencia
✓ Admin puede forzar cierre si olvidan cerrar
✓ Sin límite en gastos de caja
✓ Sin fotos de comprobantes (por ahora)

TRADUCCIONES:
✅ es.json completo
✅ pt-BR.json completo
```

## Fase 11: Exportación y Automatización (FUTURO)

> Ver planificación: `PlanificacionesBabySpa/PLANIFICACION-EXPORTACION-PDF-EXCEL.md`

```
□ Módulo 11.1: Exportación PDF de Reportes
□ Módulo 11.2: Exportación Excel de Reportes
□ Módulo 11.3: Cron Jobs (limpieza, recordatorios)
□ Módulo 11.4: Notificaciones Push
□ Módulo 11.5: Configuración del Sistema
□ Módulo 11.6: QR de Pago
```

---

# 10. INSTRUCCIONES PARA CLAUDE CODE

## 10.1 Contexto del Proyecto

Al iniciar cada sesión, Claude Code debe entender:
- Sistema de gestión para spa de bebés
- Next.js 14 App Router + TypeScript
- 2 bases de datos separadas (Bolivia/Brasil)
- Multiidioma (ES/PT-BR)
- 4 roles: Admin, Reception, Therapist, Parent

## 10.2 Reglas Críticas

```
⚠️ IMPORTANTE - LEER SIEMPRE:

1. ARQUITECTURA:
   - 2 bases de datos separadas por país
   - NO existe tenant_id en ningún modelo
   - NO crear modelo Tenant ni relaciones con Tenant

2. PAQUETES:
   - Siempre se selecciona un paquete (no existe "sesión a definir")
   - Default: Paquete Individual (1 sesión)
   - Es provisional hasta el checkout
   - Sesión se descuenta al COMPLETAR, no al agendar

3. SERVICIOS:
   - Package.serviceType = BABY → cita requiere babyId
   - Package.serviceType = PARENT → cita requiere parentId
   - Una cita es para UN bebé O para UN padre (nunca ambos)

4. PAGOS:
   - Algunos paquetes requieren pago anticipado
   - Citas PENDING_PAYMENT no bloquean slot
   - Cuotas configuradas POR PAQUETE
   - Sistema ALERTA pero NO BLOQUEA por pagos atrasados
   - Pagos pueden ser divididos (múltiples métodos)

5. EVENTOS:
   - Tipos: BABIES o PARENTS
   - Bloqueo configurable: 0-4 terapeutas
   - No tienen evaluaciones
   - Sin penalización por no-show

6. BABY CARD:
   - Solo UNA card activa por bebé
   - Contador incrementa al COMPLETAR sesión
   - TODAS las sesiones cuentan
   - Premios son acumulativos (no expiran)
   - Precio especial solo para sesiones individuales

7. ARQUEO DE CAJA:
   - Solo RECEPTION necesita caja abierta para cobrar
   - ADMIN puede cobrar sin caja abierta
   - Arqueo CIEGO: recepción no ve el monto esperado
   - Solo EFECTIVO cuenta para el arqueo
   - Auto-aprobación si diferencia = 0
   - Notificación a admin si hay diferencia
   - Múltiples turnos por día permitidos

8. PORTAL DE PADRES:
   - Cancelar/reagendar solo con 24h de anticipación
   - Genera notificación a recepción

9. PAGOS A PERSONAL:
   - Movimientos (BONUS, COMMISSION, BENEFIT, DEDUCTION) → status=PENDING
   - Pagos reales (SALARY, ADVANCE, ADVANCE_RETURN) → status=PAID
   - Al pagar SALARY → consolida movimientos PENDING del período
   - No se puede pagar el mismo período dos veces
   - No se puede crear movimiento en período ya pagado
   - Al eliminar SALARY → movimientos vuelven a PENDING
   - Empleado tiene payFrequency (DAILY/WEEKLY/BIWEEKLY/MONTHLY)
   - Puede ver saldo financiero pero no pagar online
```

## 10.3 Convenciones de Código

```typescript
// Archivos: kebab-case
appointment-service.ts
baby-form.tsx

// Componentes: PascalCase
BabyForm.tsx
CalendarView.tsx

// Variables/funciones: camelCase
const getBabyById = async (id: string) => {}

// Constantes: UPPER_SNAKE_CASE
const MAX_SLOTS_PER_HOUR = 5;

// Tipos: PascalCase
interface BabyCreateInput {}
type AppointmentStatus = 'SCHEDULED' | 'COMPLETED';
```

## 10.4 Patrones de Código

### API Routes
```typescript
// app/api/[resource]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Lógica...
  
  return NextResponse.json(data);
}
```

### Services
```typescript
// lib/services/[service]-service.ts
import { prisma } from '@/lib/db';

export const serviceNameService = {
  async method(params) {
    // Lógica de negocio
  },
};
```

## 10.5 Checklist de Verificación

Antes de cada commit:
```
□ npx tsc --noEmit → 0 errores
□ npx eslint . --ext .ts,.tsx → 0 errores
□ npm run build → éxito
□ Traducciones en es.json Y pt-BR.json
□ Probar en /es/ y /pt-BR/
□ Mobile responsive
□ Permisos por rol verificados
□ Actividad registrada (si aplica)
□ Notificación creada (si aplica)
□ NO usar tenantId en ningún modelo
```

## 10.6 Archivos de Referencia

Cuando implementes nuevas funcionalidades, revisa estos patrones:
- API: `app/api/babies/route.ts`
- Página: `app/[locale]/(admin)/clients/page.tsx`
- Formulario: `components/babies/baby-form.tsx`
- Service: `lib/services/baby-service.ts`
- Validación: `lib/validations/baby.ts`

### Módulo de Notificaciones (Referencia)
- Service: `lib/services/notification-service.ts`
- Store (Zustand): `lib/stores/notification-store.ts`
- Hook principal: `hooks/use-notifications.ts`
- Hook de sonido: `hooks/use-notification-sound.ts`
- API endpoints: `app/api/notifications/` (route, count, config, read-all, [id]/read)
- Componentes UI: `components/notifications/` (bell, panel, toast, toast-container, item)
- Sonido: `public/sounds/notification.mp3`
- Integración: `app/api/portal/appointments/route.ts` (crea notificación al agendar)
