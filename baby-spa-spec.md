# 🏊 BABY SPA - ESPECIFICACIÓN TÉCNICA COMPLETA
## Sistema de Gestión para Spa de Bebés (Bolivia & Brasil)

**Última actualización:** Enero 2026  
**Versión:** 4.0

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
9. [Instrucciones para Claude Code](#9-instrucciones-para-claude-code)

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
3. ⏳ Notificaciones inteligentes (mesversarios automáticos)
4. ✅ Seguimiento desarrollo bebés (historial + evaluaciones)
5. ✅ Portal para padres (ver progreso, agendar citas)
6. ✅ Inventario productos
7. ✅ Multiidioma (Español + Portugués Brasil)
8. ✅ Multi-base de datos (Bolivia y Brasil separadas)
9. ✅ Sistema de penalización por no-shows
10. ✅ Pagos anticipados y financiamiento
11. ✅ Eventos grupales
12. ✅ Auto-agendado masivo
13. ✅ Servicios para padres (masajes prenatales/postparto)
14. ⏳ Sistema Baby Card (fidelización)

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

## 3.2 Multi-Tenant (2 Bases de Datos)

El sistema usa **2 bases de datos completamente separadas** (NO tenant_id):
- Cada país tiene su propia configuración, paquetes, precios
- Las descripciones de paquetes se escriben en el idioma local
- QR de pago diferente por país

## 3.3 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **ADMIN** | Acceso total a todo el sistema |
| **RECEPTION** | Calendario, agendar, iniciar/completar sesiones, cobrar, inventario |
| **THERAPIST** | Ver citas asignadas del día, registrar evaluaciones |
| **PARENT** | Portal: ver historial, agendar citas (solo sus bebés) |

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

## ⏳ Fase 5: Baby Card (EN PROGRESO)
- [ ] Módulo 5.1: Sistema Baby Card

## ⏳ Fase 6: Portal y Configuración (PENDIENTE)
- [ ] Módulo 6.1: Portal de Padres Completo
- [ ] Módulo 6.2: Configuración del Sistema
- [ ] Módulo 6.3: QR de Pago

## ⏳ Fase 7: Secundarios (PENDIENTE)
- [ ] Módulo 7.1: Notificaciones + Cron Jobs
- [ ] Módulo 7.2: Reportes Financieros
- [ ] Módulo 7.3: Staff Payments

---

# 8. PLAN DE IMPLEMENTACIÓN

## Fase 5: Sistema Baby Card

### Módulo 5.1: Sistema Baby Card
```
MODELOS:
□ Enum RewardType (SERVICE, PRODUCT, EVENT, CUSTOM)
□ Enum BabyCardStatus (ACTIVE, COMPLETED, REPLACED, CANCELLED)
□ Modelo BabyCard
□ Modelo BabyCardSpecialPrice
□ Modelo BabyCardReward
□ Modelo BabyCardPurchase
□ Modelo BabyCardSessionLog
□ Modelo BabyCardRewardUsage
□ Relaciones en Baby, Package, Product, Session, User
□ Migración ejecutada

SERVICIOS:
□ lib/services/baby-card-service.ts completo

APIS:
□ CRUD /api/baby-cards
□ GET/POST /api/baby-cards/purchases
□ GET /api/baby-cards/purchases/by-baby/[babyId]
□ POST /api/baby-cards/purchases/[id]/rewards/[rewardId]/use
□ GET /api/checkout/baby-card-info/[babyId]

UI - ADMIN BABY CARDS:
□ Página lista /admin/baby-cards
□ Página crear /admin/baby-cards/new
□ Página editar /admin/baby-cards/[id]/edit
□ Formulario con precios especiales dinámicos
□ Formulario con premios dinámicos
□ Vista previa de tarjeta (grid de círculos)

UI - VENTA DE BABY CARD:
□ Modal de venta desde perfil del bebé
□ Modal de venta desde checkout
□ Selector de Baby Card
□ Resumen de beneficios
□ Opción de agendar primera sesión

UI - PERFIL DEL BEBÉ:
□ Sección Baby Card con visualización tipo tarjeta
□ Grid de círculos con progreso
□ Lista de premios con estados
□ Botón "Usar Premio"
□ Historial de sesiones
□ Historial de cards anteriores

UI - PORTAL DEL PADRE:
□ Página /portal/baby-card/[babyId]
□ Visualización de tarjeta
□ Lista de premios con estados
□ Información de precio especial

UI - CHECKOUT:
□ Sección Baby Card si tiene activa
□ Mostrar premios disponibles
□ Mostrar "casi premio" si aplica
□ Mostrar precio especial aplicado
□ Botón "Usar Premio"
□ Ofrecer Baby Card si no tiene

INTEGRACIÓN CON SESIONES:
□ Al completar sesión → incrementar contador
□ Verificar si desbloqueó premio
□ Mostrar alerta de nuevo premio

INTEGRACIÓN CON PRECIOS:
□ Detectar precio especial en checkout
□ Aplicar automáticamente si aplica
□ Mostrar ahorro

NAVEGACIÓN:
□ Link "Baby Cards" en sidebar admin
□ Icono apropiado

TRADUCCIONES:
□ es.json completo
□ pt-BR.json completo
```

## Fase 6: Portal y Configuración

### Módulo 6.1: Portal de Padres Completo
```
□ Login con código BSB-XXXXX
□ Dashboard con bebés y paquetes
□ Ver saldo pendiente de paquetes
□ Ver Baby Card y premios
□ Agendar cita
□ Ver citas (con estado de pago)
□ Historial de sesiones (notas externas)
```

### Módulo 6.2: Configuración del Sistema
```
□ Horarios de trabajo
□ Días cerrados
□ Gestión de usuarios
□ Categorías de paquetes
```

### Módulo 6.3: QR de Pago
```
□ UI: Subir imagen de QR
□ UI: Configurar número WhatsApp
□ UI: Configurar mensaje predeterminado
□ Lógica: Servir QR en portal de padres
```

## Fase 7: Secundarios

### Módulo 7.1: Notificaciones
```
□ Mesversarios automáticos
□ Recordatorio de cita 24h antes
□ Alerta de premio desbloqueado (Baby Card)
□ Cron jobs
```

### Módulo 7.2: Reportes
```
□ Ingresos por período
□ Deudas pendientes
□ Ocupación
□ No-shows
□ Sesiones por terapeuta
□ Baby Cards vendidas/activas/completadas
```

### Módulo 7.3: Staff Payments
```
□ Registro de pagos a empleados
□ Historial por empleado
```

---

# 9. INSTRUCCIONES PARA CLAUDE CODE

## 9.1 Contexto del Proyecto

Al iniciar cada sesión, Claude Code debe entender:
- Sistema de gestión para spa de bebés
- Next.js 14 App Router + TypeScript
- 2 bases de datos separadas (Bolivia/Brasil)
- Multiidioma (ES/PT-BR)
- 4 roles: Admin, Reception, Therapist, Parent

## 9.2 Reglas Críticas

```
⚠️ IMPORTANTE - LEER SIEMPRE:

1. PAQUETES:
   - Siempre se selecciona un paquete (no existe "sesión a definir")
   - Default: Paquete Individual (1 sesión)
   - Es provisional hasta el checkout
   - Sesión se descuenta al COMPLETAR, no al agendar

2. SERVICIOS:
   - Package.serviceType = BABY → cita requiere babyId
   - Package.serviceType = PARENT → cita requiere parentId
   - Una cita es para UN bebé O para UN padre (nunca ambos)

3. PAGOS:
   - Algunos paquetes requieren pago anticipado
   - Citas PENDING_PAYMENT no bloquean slot
   - Cuotas configuradas POR PAQUETE
   - Sistema ALERTA pero NO BLOQUEA por pagos atrasados

4. EVENTOS:
   - Tipos: BABIES o PARENTS
   - Bloqueo configurable: 0-4 terapeutas
   - No tienen evaluaciones
   - Sin penalización por no-show

5. BABY CARD:
   - Solo UNA card activa por bebé
   - Contador incrementa al COMPLETAR sesión
   - TODAS las sesiones cuentan
   - Premios son acumulativos (no expiran)
   - Precio especial solo para sesiones individuales
```

## 9.3 Convenciones de Código

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

## 9.4 Patrones de Código

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

## 9.5 Checklist de Verificación

Antes de cada commit:
```
□ npx tsc --noEmit → 0 errores
□ npx eslint . --ext .ts,.tsx → 0 errores
□ npm run build → éxito
□ Traducciones en es.json Y pt-BR.json
□ Probar en /es/ y /pt-BR/
□ Mobile responsive
□ Permisos por rol verificados
```

## 9.6 Archivos de Referencia

Cuando implementes nuevas funcionalidades, revisa estos patrones:
- API: `app/api/babies/route.ts`
- Página: `app/[locale]/(admin)/clients/page.tsx`
- Formulario: `components/babies/baby-form.tsx`
- Service: `lib/services/baby-service.ts`
- Validación: `lib/validations/baby.ts`
