# 🏊 BABY SPA - ESPECIFICACIÓN TÉCNICA COMPLETA
## Sistema de Gestión para Spa de Bebés (Bolivia & Brasil)

---

# 📋 ÍNDICE

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Modelo de Base de Datos](#4-modelo-de-base-de-datos)
5. [Módulos y Funcionalidades](#5-módulos-y-funcionalidades)
6. [Reglas de Negocio](#6-reglas-de-negocio)
7. [Estructura de Carpetas](#7-estructura-de-carpetas)
8. [Plan de Implementación](#8-plan-de-implementación)
9. [Instrucciones para Claude Code](#9-instrucciones-para-claude-code)

---

# 1. RESUMEN EJECUTIVO

## 1.1 Descripción del Negocio

**Baby Spa** es un centro de hidroterapia y estimulación temprana para bebés de 0-36 meses. Ofrece servicios de:
- Hidroterapia
- Psicomotricidad  
- Fisioterapia infantil

### Ubicaciones:
- **Bolivia** (existente) - Dominio: `bo.babyspa.online`
- **Brasil - São Paulo** (expansión) - Dominio: `br.babyspa.online`

### Perfil de Clientes:
- **65-70%**: Clientes esporádicos (1 sesión única)
- **30-35%**: Clientes recurrentes (paquetes 4-20 sesiones)
- **Casos especiales**: Bebés con condiciones terapéuticas (hipotonía, retraso psicomotor, prematuros)

## 1.2 Objetivos del Sistema

1. ✅ Automatizar agendamiento (admin + portal padres)
2. ✅ Control financiero completo (ingresos/egresos/inventario)
3. ✅ Notificaciones inteligentes (mesversarios automáticos)
4. ✅ Seguimiento desarrollo bebés (historial + gráficas)
5. ✅ Portal para padres (ver progreso, agendar citas)
6. ✅ Inventario productos
7. ✅ Multiidioma (Español + Portugués Brasil)
8. ✅ Multi-base de datos (Bolivia y Brasil separadas)
9. ✅ Sistema de penalización por no-shows
10. ✅ Lista de espera para horarios llenos

## 1.3 Operación

### Capacidad:
- **2 terapeutas simultáneos** = 2 slots por hora
- **1 terapeuta por bebé**

### Horarios:
```
LUNES: 9:00 AM - 5:00 PM (continuo)

MARTES a SÁBADO:
├── Mañana: 9:00 AM - 12:00 PM
└── Tarde: 2:30 PM - 6:30 PM
```

### Personal:
- 4 Terapeutas
- 1 Recepcionista
- 3 Administradores

## 1.4 Paquetes Disponibles

| Paquete | Sesiones | Notas |
|---------|----------|-------|
| Individual | 1 | Pago post-sesión |
| Mini | 4 | - |
| Estándar | 8 | - |
| Plus | 10 | - |
| Premium | 20 | Casos terapéuticos |

**Importante:** Los paquetes NO vencen (válidos hasta que bebé cumpla 3 años).

---

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

## 2.3 Servicios Externos

| Servicio | Uso | Costo |
|----------|-----|-------|
| SendGrid | Emails automáticos | Gratis (100/día) |
| WhatsApp | Manual via wa.me links | $0 |

## 2.4 Dominio

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
│                              ▼                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    NEXT.JS APP                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │   FRONTEND   │  │     API      │  │    CRON      │  │ │
│  │  │    React     │  │   Routes     │  │    Jobs      │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │ │
│  │                            │                            │ │
│  │                            ▼                            │ │
│  │                    ┌──────────────┐                     │ │
│  │                    │    PRISMA    │                     │ │
│  │                    └──────────────┘                     │ │
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

El sistema usa **2 bases de datos separadas** (NO tenant_id):

```javascript
// Detección por subdominio en middleware.ts
const host = request.headers.get('host');

if (host.startsWith('bo.')) {
  // Conectar a babyspa_bolivia
  process.env.DATABASE_URL = process.env.DATABASE_URL_BOLIVIA;
} else if (host.startsWith('br.')) {
  // Conectar a babyspa_brazil
  process.env.DATABASE_URL = process.env.DATABASE_URL_BRAZIL;
}
```

## 3.3 Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **ADMIN** | Acceso total a todo el sistema |
| **RECEPTION** | Calendario, agendar, cobrar, notificar, inventario |
| **THERAPIST** | Ver agenda del día, registrar evaluaciones |
| **PARENT** | Portal: ver historial, agendar citas (solo su bebé) |

---

# 4. MODELO DE BASE DE DATOS

## 4.1 Schema Prisma Completo

```prisma
// ============================================================
// ENUMS
// ============================================================

enum UserRole {
  ADMIN
  RECEPTION
  THERAPIST
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum BirthType {
  NATURAL
  CESAREAN
}

enum AppointmentStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum SessionStatus {
  PENDING
  EVALUATED
  COMPLETED
}

enum PaymentMethod {
  CASH
  TRANSFER
  CARD
  OTHER
}

enum PaymentType {
  SALARY
  ADVANCE
  BONUS
  DEDUCTION
  OTHER
}

enum MovementType {
  PURCHASE
  SALE
  USAGE
  ADJUSTMENT
}

enum MuscleTone {
  LOW
  NORMAL
  TENSE
}

enum Mood {
  CALM
  IRRITABLE
}

enum NotificationType {
  MESVERSARY
  BIRTHDAY
  APPOINTMENT_24H
  PATTERN_REMINDER
  INACTIVE_CLIENT
}

// ============================================================
// USUARIOS DEL SISTEMA (Staff)
// ============================================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String
  role          UserRole
  phone         String?
  isActive      Boolean   @default(true)
  
  // Para control de sueldos
  baseSalary    Decimal?  @db.Decimal(10, 2)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?
  
  sessionsAsTherapist  Session[]
  registrationLinks    RegistrationLink[]
  babyNotes           BabyNote[]
  staffPayments       StaffPayment[]
  
  @@map("users")
}

// ============================================================
// PADRES / TUTORES
// ============================================================

model Parent {
  id            String    @id @default(cuid())
  
  // Identificadores únicos (cualquiera sirve para buscar)
  documentId    String    @unique  // CI (Bolivia) o CPF (Brasil)
  documentType  String    @default("CI")
  phone         String    @unique  // También único para búsqueda
  
  name          String
  email         String?
  birthDate     DateTime?
  
  // Acceso al portal
  accessCode    String    @unique  // BSB-XXXXX
  
  // Sistema de penalización
  noShowCount       Int       @default(0)
  requiresPrepayment Boolean  @default(false)
  lastNoShowDate    DateTime?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  babies        BabyParent[]
  waitlistItems Waitlist[]
  
  @@map("parents")
}

// ============================================================
// BEBÉS
// ============================================================

model Baby {
  id            String    @id @default(cuid())
  
  name          String
  birthDate     DateTime
  gender        Gender
  
  // Datos de nacimiento
  birthWeeks    Int?
  birthWeight   Decimal?  @db.Decimal(4, 2)
  birthType     BirthType?
  
  // Datos médicos
  birthDifficulty       Boolean   @default(false)
  birthDifficultyDesc   String?
  pregnancyIssues       Boolean   @default(false)
  pregnancyIssuesDesc   String?
  priorStimulation      Boolean   @default(false)
  priorStimulationType  String?
  developmentDiagnosis  Boolean   @default(false)
  developmentDiagnosisDesc String?
  diagnosedIllness      Boolean   @default(false)
  diagnosedIllnessDesc  String?
  recentMedication      Boolean   @default(false)
  recentMedicationDesc  String?
  allergies             String?
  specialObservations   String?
  
  // Autorizaciones
  socialMediaConsent    Boolean   @default(false)
  instagramHandle       String?
  
  // Marketing
  referralSource        String?
  
  isActive      Boolean   @default(true)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  parents            BabyParent[]
  packagePurchases   PackagePurchase[]
  appointments       Appointment[]
  sessions           Session[]
  notifications      NotificationLog[]
  notes              BabyNote[]
  
  @@map("babies")
}

// ============================================================
// RELACIÓN BEBÉ - PADRE (N:M)
// ============================================================

model BabyParent {
  id           String   @id @default(cuid())
  babyId       String
  baby         Baby     @relation(fields: [babyId], references: [id], onDelete: Cascade)
  parentId     String
  parent       Parent   @relation(fields: [parentId], references: [id], onDelete: Cascade)
  relationship String   @default("MOTHER")
  isPrimary    Boolean  @default(false)
  createdAt    DateTime @default(now())
  
  @@unique([babyId, parentId])
  @@map("baby_parents")
}

// ============================================================
// NOTAS INTERNAS DEL BEBÉ
// ============================================================

model BabyNote {
  id        String   @id @default(cuid())
  babyId    String
  baby      Baby     @relation(fields: [babyId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  note      String
  createdAt DateTime @default(now())
  
  @@map("baby_notes")
}

// ============================================================
// LINK REGISTRO TEMPORAL
// ============================================================

model RegistrationLink {
  id          String    @id @default(cuid())
  token       String    @unique
  expiresAt   DateTime
  isUsed      Boolean   @default(false)
  usedAt      DateTime?
  createdById String
  createdBy   User      @relation(fields: [createdById], references: [id])
  babyId      String?
  parentId    String?
  createdAt   DateTime  @default(now())
  
  @@map("registration_links")
}

// ============================================================
// CATÁLOGO DE PAQUETES
// ============================================================

model Package {
  id              String    @id @default(cuid())
  name            String
  namePortuguese  String?
  description     String?
  sessionCount    Int
  basePrice       Decimal   @db.Decimal(10, 2)
  isActive        Boolean   @default(true)
  sortOrder       Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  purchases       PackagePurchase[]
  
  @@map("packages")
}

// ============================================================
// COMPRA DE PAQUETE
// ============================================================

model PackagePurchase {
  id                String    @id @default(cuid())
  babyId            String
  baby              Baby      @relation(fields: [babyId], references: [id])
  packageId         String
  package           Package   @relation(fields: [packageId], references: [id])
  
  basePrice         Decimal   @db.Decimal(10, 2)
  discountAmount    Decimal   @default(0) @db.Decimal(10, 2)
  discountReason    String?
  finalPrice        Decimal   @db.Decimal(10, 2)
  
  totalSessions     Int
  usedSessions      Int       @default(0)
  remainingSessions Int
  
  // Patrón de visitas
  visitPattern      String?   // FIXED_DAY, FREQUENCY, IRREGULAR
  fixedDay          Int?      // 0-6 si FIXED_DAY
  frequencyDays     Int?      // Cada X días si FREQUENCY
  
  isActive          Boolean   @default(true)
  
  paymentId         String?   @unique
  payment           Payment?  @relation(fields: [paymentId], references: [id])
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  
  sessions          Session[]
  
  @@map("package_purchases")
}

// ============================================================
// CITAS (Agendamiento)
// ============================================================

model Appointment {
  id              String            @id @default(cuid())
  babyId          String
  baby            Baby              @relation(fields: [babyId], references: [id])
  
  date            DateTime          @db.Date
  startTime       DateTime          @db.Time
  endTime         DateTime          @db.Time
  
  status          AppointmentStatus @default(SCHEDULED)
  
  reminder24hSent   Boolean   @default(false)
  reminder24hSentAt DateTime?
  
  notes           String?
  cancelReason    String?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  session         Session?
  history         AppointmentHistory[]
  
  @@map("appointments")
}

// ============================================================
// HISTORIAL DE CAMBIOS DE CITA
// ============================================================

model AppointmentHistory {
  id            String      @id @default(cuid())
  appointmentId String
  appointment   Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
  
  action        String      // CREATED, RESCHEDULED, CANCELLED, COMPLETED, NO_SHOW
  performedBy   String      // user_id o parent_id
  performerType String      // USER o PARENT
  performerName String
  
  oldValue      Json?
  newValue      Json?
  reason        String?
  
  createdAt     DateTime    @default(now())
  
  @@map("appointment_history")
}

// ============================================================
// LISTA DE ESPERA
// ============================================================

model Waitlist {
  id           String   @id @default(cuid())
  babyId       String
  parentId     String
  parent       Parent   @relation(fields: [parentId], references: [id])
  
  desiredDate  DateTime @db.Date
  desiredTime  DateTime @db.Time
  
  notified     Boolean  @default(false)
  notifiedAt   DateTime?
  expiresAt    DateTime
  
  createdAt    DateTime @default(now())
  
  @@map("waitlist")
}

// ============================================================
// SESIONES (Ejecución)
// ============================================================

model Session {
  id                String         @id @default(cuid())
  appointmentId     String         @unique
  appointment       Appointment    @relation(fields: [appointmentId], references: [id])
  babyId            String
  baby              Baby           @relation(fields: [babyId], references: [id])
  therapistId       String
  therapist         User           @relation(fields: [therapistId], references: [id])
  packagePurchaseId String?
  packagePurchase   PackagePurchase? @relation(fields: [packagePurchaseId], references: [id])
  
  sessionNumber     Int
  status            SessionStatus  @default(PENDING)
  
  startedAt         DateTime?
  evaluatedAt       DateTime?
  completedAt       DateTime?
  
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  
  evaluation        Evaluation?
  products          SessionProduct[]
  payment           Payment?
  
  @@map("sessions")
}

// ============================================================
// EVALUACIÓN DE SESIÓN
// ============================================================

model Evaluation {
  id              String    @id @default(cuid())
  sessionId       String    @unique
  session         Session   @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  
  babyAgeMonths   Int
  babyWeight      Decimal?  @db.Decimal(4, 2)
  
  // Evaluación sensorial
  visualTracking    Boolean?
  eyeContact        Boolean?
  auditoryResponse  Boolean?
  
  // Desarrollo muscular
  muscleTone        MuscleTone?
  cervicalControl   Boolean?
  headUp            Boolean?
  
  // Hitos
  sits              Boolean?
  crawls            Boolean?
  walks             Boolean?
  
  // Estado
  mood              Mood?
  
  // Comentarios
  internalNotes     String?  // Solo visible para staff
  externalNotes     String?  // Visible para padres
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@map("evaluations")
}

// ============================================================
// PRODUCTOS (Inventario)
// ============================================================

model Product {
  id              String    @id @default(cuid())
  name            String
  namePortuguese  String?
  description     String?
  category        String?
  costPrice       Decimal   @db.Decimal(10, 2)
  salePrice       Decimal   @db.Decimal(10, 2)
  currentStock    Int       @default(0)
  minStock        Int       @default(5)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  movements       InventoryMovement[]
  sessionUsages   SessionProduct[]
  
  @@map("products")
}

// ============================================================
// MOVIMIENTOS DE INVENTARIO
// ============================================================

model InventoryMovement {
  id          String       @id @default(cuid())
  productId   String
  product     Product      @relation(fields: [productId], references: [id])
  type        MovementType
  quantity    Int
  unitPrice   Decimal      @db.Decimal(10, 2)
  totalAmount Decimal      @db.Decimal(10, 2)
  notes       String?
  stockAfter  Int
  createdAt   DateTime     @default(now())
  
  @@map("inventory_movements")
}

// ============================================================
// PRODUCTOS USADOS EN SESIÓN
// ============================================================

model SessionProduct {
  id           String   @id @default(cuid())
  sessionId    String
  session      Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  productId    String
  product      Product  @relation(fields: [productId], references: [id])
  quantity     Int      @default(1)
  unitPrice    Decimal  @db.Decimal(10, 2)
  isChargeable Boolean  @default(false)
  createdAt    DateTime @default(now())
  
  @@map("session_products")
}

// ============================================================
// PAGOS
// ============================================================

model Payment {
  id              String           @id @default(cuid())
  sessionId       String?          @unique
  session         Session?         @relation(fields: [sessionId], references: [id])
  packagePurchase PackagePurchase?
  amount          Decimal          @db.Decimal(10, 2)
  method          PaymentMethod
  notes           String?
  createdAt       DateTime         @default(now())
  
  @@map("payments")
}

// ============================================================
// PAGOS AL PERSONAL
// ============================================================

model StaffPayment {
  id        String      @id @default(cuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id])
  type      PaymentType
  amount    Decimal     @db.Decimal(10, 2)
  period    String?     // "2026-01" para sueldos/adelantos
  notes     String?
  date      DateTime    @db.Date
  createdAt DateTime    @default(now())
  
  @@map("staff_payments")
}

// ============================================================
// GASTOS OPERATIVOS
// ============================================================

model Expense {
  id          String   @id @default(cuid())
  description String
  category    String?
  amount      Decimal  @db.Decimal(10, 2)
  date        DateTime @db.Date
  notes       String?
  createdAt   DateTime @default(now())
  
  @@map("expenses")
}

// ============================================================
// LOG DE NOTIFICACIONES
// ============================================================

model NotificationLog {
  id                  String           @id @default(cuid())
  babyId              String
  baby                Baby             @relation(fields: [babyId], references: [id])
  type                NotificationType
  emailSent           Boolean          @default(false)
  emailSentAt         DateTime?
  whatsappContacted   Boolean          @default(false)
  whatsappContactedAt DateTime?
  metadata            Json?
  createdAt           DateTime         @default(now())
  
  @@map("notification_logs")
}

// ============================================================
// CONFIGURACIÓN DEL SISTEMA
// ============================================================

model SystemConfig {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String
  description String?
  updatedAt   DateTime @updatedAt
  
  @@map("system_config")
}

// ============================================================
// HORARIOS DE ATENCIÓN
// ============================================================

model BusinessHours {
  id              String    @id @default(cuid())
  dayOfWeek       Int       // 0=Dom, 1=Lun, ..., 6=Sab
  morningOpen     DateTime? @db.Time
  morningClose    DateTime? @db.Time
  afternoonOpen   DateTime? @db.Time
  afternoonClose  DateTime? @db.Time
  isOpen          Boolean   @default(true)
  
  @@unique([dayOfWeek])
  @@map("business_hours")
}

// ============================================================
// DÍAS CERRADOS
// ============================================================

model ClosedDate {
  id     String   @id @default(cuid())
  date   DateTime @db.Date
  reason String?
  
  @@unique([date])
  @@map("closed_dates")
}
```

---

# 5. MÓDULOS Y FUNCIONALIDADES

## 5.1 Módulo: Gestión de Bebés y Padres

### API Routes:
- `POST /api/babies` - Crear bebé
- `GET /api/babies` - Listar bebés (búsqueda por nombre, CI, teléfono)
- `GET /api/babies/[id]` - Detalle bebé
- `PUT /api/babies/[id]` - Actualizar bebé
- `POST /api/parents` - Crear padre
- `GET /api/parents/search?phone=X` - Buscar padre por teléfono
- `POST /api/babies/[id]/notes` - Agregar nota interna
- `GET /api/babies/[id]/notes` - Listar notas

### Páginas:
- `/admin/clients` - Lista bebés
- `/admin/clients/new` - Registrar bebé+padres
- `/admin/clients/[id]` - Ficha completa
- `/admin/clients/[id]/edit` - Editar

### Lógica especial:
- Búsqueda padre por teléfono con popup confirmación "¿Eres [Nombre]?"
- Generación automática código acceso (BSB-XXXXX)
- Cálculo automático edad bebé
- Soporte múltiples bebés por padre (mellizos)

## 5.2 Módulo: Link Registro Temporal

### API Routes:
- `POST /api/registration-links` - Generar link (expira 48h)
- `GET /api/registration-links/[token]` - Validar token
- `POST /api/registration-links/[token]/complete` - Completar registro

### Páginas:
- `/admin/registration-links` - Lista links generados
- `/registro/[token]` - Formulario público para padres
- `/registro/[token]/success` - Confirmación + mostrar código

### Flujo:
1. Recepción genera link
2. Envía por WhatsApp al padre
3. Padre llena formulario
4. Si teléfono existe → popup "¿Eres [Nombre]?"
5. Al completar → auto-login + mostrar código portal

## 5.3 Módulo: Paquetes y Ventas

### API Routes:
- `GET /api/packages/catalog` - Catálogo
- `POST /api/packages/sell` - Vender paquete
- `GET /api/babies/[id]/packages` - Paquetes de un bebé

### Páginas:
- `/admin/packages` - Gestión catálogo
- `/admin/packages/sell` - Vender paquete

### Lógica:
- Descuentos: porcentaje, monto fijo, o código
- Definir patrón visitas (día fijo/frecuencia/irregular)
- Registro de pago al vender

## 5.4 Módulo: Calendario y Agendamiento

### API Routes:
- `GET /api/appointments` - Listar citas (filtros)
- `GET /api/appointments/available?date=X` - Slots disponibles
- `POST /api/appointments` - Crear cita
- `PUT /api/appointments/[id]` - Reagendar
- `DELETE /api/appointments/[id]` - Cancelar
- `PUT /api/appointments/[id]/status` - Cambiar estado

### Páginas:
- `/admin/calendar` - Calendario visual (día/semana/mes)
- `/admin/appointments/new` - Agendar cita

### Validaciones:
- Máximo 2 citas por hora
- Verificar horarios según día
- Verificar días cerrados
- Verificar penalización padre (prepago obligatorio si noShowCount >= 3)
- Descontar sesión del paquete al agendar
- Devolver sesión al cancelar

### Historial de cambios:
- Guardar automáticamente cada cambio en appointment_history
- Mostrar quién hizo qué y cuándo

## 5.5 Módulo: Sesiones y Evaluaciones

### API Routes:
- `GET /api/sessions/today` - Sesiones del día
- `POST /api/sessions/[id]/start` - Iniciar
- `POST /api/sessions/[id]/evaluate` - Guardar evaluación
- `POST /api/sessions/[id]/products` - Agregar productos
- `POST /api/sessions/[id]/complete` - Completar + pago

### Páginas Terapeuta:
- `/therapist/today` - Lista sesiones del día
- `/therapist/session/[id]/evaluate` - Formulario evaluación

### Páginas Recepción:
- `/admin/sessions/[id]/complete` - Completar y cobrar

### Campos Evaluación:
- Seguimiento visual (sí/no)
- Contacto visual (sí/no)
- Respuesta auditiva (sí/no)
- Tono muscular (bajo/normal/tenso)
- Control cervical (sí/no)
- Mantiene cabeza (sí/no)
- Se sienta (sí/no)
- Gatea (sí/no)
- Camina (sí/no)
- Estado ánimo (tranquilo/irritable)
- Comentarios internos (solo staff)
- Comentarios externos (visible padres)

### Productos en sesión:
- Terapeuta puede agregar productos (pañales, aceites, etc.)
- Marcar si es cobrable o no
- Descuenta del inventario siempre
- Suma al total si es cobrable

### Penalización:
- Si padre no asiste (NO_SHOW) → noShowCount += 1
- Si asiste → noShowCount = 0 (reset)
- Si noShowCount >= 3 → requiresPrepayment = true

## 5.6 Módulo: Portal Padres

### Páginas:
- `/portal/login` - Login con código (BSB-XXXXX)
- `/portal/dashboard` - Resumen
- `/portal/appointments` - Ver/agendar citas
- `/portal/appointments/new` - Agendar nueva
- `/portal/history` - Historial sesiones

### Funcionalidades:
- Sesión persistente (cookies)
- Ver solo sus bebés
- Ver sesiones restantes del paquete
- Ver evaluaciones (solo comentarios externos)
- Mensaje recordatorio si tiene no-shows previos
- Bloquear agendamiento si requiere prepago

## 5.7 Módulo: Lista de Espera

### API Routes:
- `POST /api/waitlist` - Agregar a lista
- `GET /api/waitlist` - Ver lista
- `DELETE /api/waitlist/[id]` - Quitar

### Flujo:
1. Padre ve slot lleno → click "Avisarme"
2. Sistema guarda en waitlist
3. Alguien cancela → Sistema notifica al primero en lista
4. Tiene X horas para agendar
5. Si no agenda → pasa al siguiente

## 5.8 Módulo: Notificaciones

### Cron Jobs:
- **7:00 AM diario**: Mesversarios (bebés que cumplen mes en 5 días)
- **Cada hora**: Recordatorio 24h antes de citas
- **8:00 AM diario**: Cumpleaños
- **3:00 AM diario**: Limpieza + marcar bebés >3 años como inactivos

### API Routes:
- `GET /api/notifications/pending` - Pendientes de contactar
- `POST /api/notifications/mark-contacted` - Marcar enviado
- `GET /api/notifications/birthdays` - Cumpleaños hoy

### WhatsApp:
- Generar link `wa.me/[phone]?text=[mensaje]`
- Mensaje pre-llenado según tipo
- Admin envía manualmente

## 5.9 Módulo: Inventario

### API Routes:
- CRUD `/api/products`
- `POST /api/inventory/purchase` - Entrada
- `POST /api/inventory/sale` - Salida venta
- `GET /api/inventory/low-stock` - Alertas

### Páginas:
- `/admin/inventory` - Lista productos
- `/admin/inventory/movements` - Historial

## 5.10 Módulo: Finanzas

### Staff Payments:
- `POST /api/staff-payments` - Registrar pago
- `GET /api/staff-payments?userId=X` - Historial empleado
- `GET /api/staff-payments/summary?period=2026-01` - Resumen mes

### Gastos:
- CRUD `/api/expenses`

### Reportes:
- Ingresos por período
- Gastos por categoría
- Balance
- Tasa ocupación
- No-shows

## 5.11 Módulo: Configuración

### Páginas:
- `/admin/settings` - General
- `/admin/settings/hours` - Horarios
- `/admin/settings/holidays` - Días cerrados
- `/admin/users` - Gestión usuarios

---

# 6. REGLAS DE NEGOCIO

## 6.1 Bebés
- Solo bebés ≤36 meses aparecen en notificaciones
- Después de 3 años → isActive = false (no borrar)
- Código acceso portal generado automático: BSB-XXXXX

## 6.2 Padres
- Identificables por CI/CPF O por teléfono (ambos únicos)
- Login portal SOLO con código (no teléfono)
- noShowCount se resetea cuando asiste a cita
- requiresPrepayment = true si noShowCount >= 3

## 6.3 Paquetes
- NO vencen (válidos hasta bebé cumpla 3 años)
- Sesiones NO transferibles entre bebés
- Al agendar → descuenta sesión
- Al cancelar → devuelve sesión

## 6.4 Agendamiento
- Máximo 2 bebés por hora
- 1 terapeuta por bebé
- 1 bebé solo 1 cita por día
- Padres con prepago requerido → solo recepción puede agendar

## 6.5 Sesiones
- Solo terapeuta registra evaluación
- Solo recepción completa sesión (cobra)
- Productos descuentan inventario siempre
- Productos cobrables suman al total

## 6.6 Evaluaciones
- Comentarios internos: solo staff
- Comentarios externos: visible en portal padres

---

# 7. ESTRUCTURA DE CARPETAS

```
baby-spa/
├── app/
│   ├── [locale]/                    # es / pt-BR
│   │   ├── (admin)/                 # Rutas admin
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── calendar/page.tsx
│   │   │   ├── clients/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── packages/
│   │   │   ├── sessions/
│   │   │   ├── inventory/
│   │   │   ├── notifications/
│   │   │   ├── reports/
│   │   │   ├── staff-payments/
│   │   │   └── settings/
│   │   ├── (therapist)/
│   │   │   ├── layout.tsx
│   │   │   ├── today/page.tsx
│   │   │   └── session/[id]/evaluate/page.tsx
│   │   ├── (portal)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── appointments/
│   │   │   └── history/page.tsx
│   │   ├── login/page.tsx
│   │   └── page.tsx
│   ├── registro/
│   │   └── [token]/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── babies/
│   │   ├── parents/
│   │   ├── appointments/
│   │   ├── sessions/
│   │   ├── packages/
│   │   ├── notifications/
│   │   ├── inventory/
│   │   ├── staff-payments/
│   │   ├── expenses/
│   │   ├── reports/
│   │   ├── registration-links/
│   │   └── waitlist/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                          # shadcn/ui
│   ├── layout/
│   ├── calendar/
│   ├── babies/
│   ├── sessions/
│   ├── notifications/
│   └── charts/
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── utils.ts
│   ├── validations.ts
│   └── services/
│       ├── appointmentService.ts
│       ├── sessionService.ts
│       ├── notificationService.ts
│       ├── packageService.ts
│       └── reportService.ts
├── messages/
│   ├── es.json
│   └── pt-BR.json
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── cron/
│   └── jobs.ts
├── types/
│   └── index.ts
├── middleware.ts
├── .env.example
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

# 8. PLAN DE IMPLEMENTACIÓN

## Fase 1: Fundamentos (2-3 días)
1. Setup Next.js + TypeScript + Tailwind
2. Configurar Prisma + PostgreSQL
3. Implementar NextAuth (login staff + portal)
4. Configurar next-intl (ES/PT-BR)
5. Crear layouts base

## Fase 2: Core (5-7 días)
1. Módulo Bebés y Padres
2. Link Registro Temporal
3. Paquetes y Ventas
4. Calendario y Agendamiento
5. Sesiones y Evaluaciones
6. Portal Padres (básico)

## Fase 3: Secundarios (3-4 días)
1. Notificaciones + Cron Jobs
2. Lista de Espera
3. Inventario
4. Notas Internas + Historial Citas
5. Staff Payments
6. Gastos

## Fase 4: Final (3-4 días)
1. Reportes
2. Portal Padres (avanzado)
3. Configuración
4. Testing
5. Deployment

---

# 9. INSTRUCCIONES PARA CLAUDE CODE

## 9.1 Contexto Inicial

Al iniciar cada sesión, asegúrate de que Claude Code entienda:
- Este es un sistema de gestión para spa de bebés
- Usa Next.js 14 App Router + TypeScript
- 2 bases de datos separadas (Bolivia/Brasil)
- Multiidioma (ES/PT-BR)
- 4 roles: Admin, Reception, Therapist, Parent

## 9.2 Convenciones de Código

```typescript
// Nombres de archivos: kebab-case
appointment-service.ts
baby-form.tsx

// Componentes: PascalCase
BabyForm.tsx
CalendarView.tsx

// Variables/funciones: camelCase
const getBabyById = async (id: string) => {}

// Constantes: UPPER_SNAKE_CASE
const MAX_SLOTS_PER_HOUR = 2;

// Tipos: PascalCase con suffix
interface BabyCreateInput {}
type AppointmentStatus = 'SCHEDULED' | 'COMPLETED';
```

## 9.3 Patrones a Seguir

### API Routes:
```typescript
// app/api/babies/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // ... lógica
  
  return NextResponse.json(data);
}
```

### Componentes:
```typescript
// components/babies/baby-form.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface BabyFormProps {
  initialData?: Baby;
  onSubmit: (data: BabyInput) => Promise<void>;
}

export function BabyForm({ initialData, onSubmit }: BabyFormProps) {
  const t = useTranslations('babies');
  // ...
}
```

### Services:
```typescript
// lib/services/appointment-service.ts
import { prisma } from '@/lib/db';

export const appointmentService = {
  async checkAvailability(date: Date, time: string) {
    const count = await prisma.appointment.count({
      where: { date, startTime: time, status: 'SCHEDULED' }
    });
    return count < 2; // MAX_SLOTS_PER_HOUR
  },
  
  async create(data: AppointmentInput) {
    // ... lógica
  }
};
```

## 9.4 Variables de Entorno

```bash
# .env.example
DATABASE_URL_BOLIVIA="postgresql://postgres:Passw0rd@localhost:5432/babyspa_bolivia"
DATABASE_URL_BRAZIL="postgresql://postgres:Passw0rd@localhost:5432/babyspa_brazil"

NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

SENDGRID_API_KEY="SG.xxxxx"
EMAIL_FROM="hola@babyspa.online"
```

## 9.5 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Base de datos
npx prisma migrate dev
npx prisma db seed
npx prisma studio

# Build
npm run build
npm start
```
