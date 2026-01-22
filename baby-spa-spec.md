# 🏊 BABY SPA - ESPECIFICACIÓN TÉCNICA COMPLETA
## Sistema de Gestión para Spa de Bebés (Bolivia & Brasil)

**Última actualización:** Enero 2026  
**Versión:** 3.0

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
- Eventos grupales

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
3. ⏳ Notificaciones inteligentes (mesversarios automáticos)
4. ✅ Seguimiento desarrollo bebés (historial + evaluaciones)
5. ⏳ Portal para padres (ver progreso, agendar citas)
6. ✅ Inventario productos
7. ✅ Multiidioma (Español + Portugués Brasil)
8. ✅ Multi-base de datos (Bolivia y Brasil separadas)
9. ✅ Sistema de penalización por no-shows
10. ⏳ Pagos anticipados y financiamiento
11. ⏳ Eventos grupales
12. ⏳ Auto-agendado masivo

## 1.3 Operación

### Capacidad:
- **Hasta 5 citas por slot de 30 min** (para staff)
- **2 citas por slot** (para padres en portal)
- **2 terapeutas simultáneos**

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

| Categoría | Paquete | Sesiones | Duración | Notas |
|-----------|---------|----------|----------|-------|
| Hidroterapia | Individual | 1 | 60 min | Default |
| Hidroterapia | Mini | 4 | 60 min | - |
| Hidroterapia | Estándar | 8 | 60 min | - |
| Hidroterapia | Plus | 10 | 60 min | - |
| Hidroterapia | Premium | 20 | 60 min | Casos terapéuticos |
| Cumple Mes | Individual | 1 | 90 min | Incluye decoración |
| Vacunas | Individual | 1 | 30 min | Requiere pago anticipado |

**Reglas de Paquetes:**
- Los paquetes **NO vencen** (válidos hasta que bebé cumpla 3 años)
- Sesiones **NO transferibles** entre bebés
- Pueden pagarse en **cuotas** (financiamiento)
- Algunos requieren **pago anticipado**

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
│   Package   │◄──────│ PackagePurchase │──────►│    Baby     │
│  (catálogo) │       │   (compra)      │       │             │
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
```

## 4.2 Modelos Clave

### Package (Catálogo de Paquetes)
```prisma
model Package {
  id                      String    @id @default(cuid())
  name                    String
  description             String?   // Descripción detallada
  category                String?   // HIDROTERAPIA, CUMPLE_MES, VACUNAS, etc.
  sessionCount            Int       // Número de sesiones
  basePrice               Decimal   // Precio base
  duration                Int       @default(60) // Duración en minutos
  
  // Pago anticipado
  requiresAdvancePayment  Boolean   @default(false)
  advancePaymentAmount    Decimal?  // Monto del anticipo requerido
  
  isActive                Boolean   @default(true)
  sortOrder               Int       @default(0)
  
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
}
```

### PackagePurchase (Compra de Paquete)
```prisma
model PackagePurchase {
  id                String    @id @default(cuid())
  babyId            String
  packageId         String
  
  // Precios
  basePrice         Decimal
  discountAmount    Decimal   @default(0)
  discountReason    String?
  finalPrice        Decimal
  
  // Financiamiento
  installments      Int       @default(1)  // Número de cuotas
  installmentAmount Decimal?  // Monto por cuota
  paidAmount        Decimal   @default(0)  // Total pagado
  pendingAmount     Decimal   // Saldo pendiente (calculado)
  
  // Sesiones
  totalSessions     Int
  usedSessions      Int       @default(0)
  remainingSessions Int
  
  isActive          Boolean   @default(true)
  purchaseDate      DateTime  @default(now())
  
  // Relaciones
  baby              Baby      @relation(fields: [babyId], references: [id])
  package           Package   @relation(fields: [packageId], references: [id])
  payments          PackagePayment[]
  sessions          Session[]
  appointments      Appointment[]
}
```

### Appointment (Cita)
```prisma
model Appointment {
  id                  String            @id @default(cuid())
  babyId              String
  date                DateTime          @db.Date
  startTime           String            // "09:00"
  endTime             String            // "10:00"
  
  // Paquete provisional (puede cambiar hasta el checkout)
  selectedPackageId   String?           // Paquete seleccionado (provisional)
  packagePurchaseId   String?           // Si usa paquete existente
  
  // Estado
  status              AppointmentStatus @default(SCHEDULED)
  isPendingPayment    Boolean           @default(false) // Esperando pago anticipado
  
  // Asignación
  therapistId         String?
  
  notes               String?
  cancellationReason  String?
  
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
  createdById         String?
  
  // Relaciones
  baby                Baby              @relation(fields: [babyId], references: [id])
  therapist           User?             @relation(fields: [therapistId], references: [id])
  selectedPackage     Package?          @relation(fields: [selectedPackageId], references: [id])
  packagePurchase     PackagePurchase?  @relation(fields: [packagePurchaseId], references: [id])
  session             Session?
  payments            AppointmentPayment[]
}

enum AppointmentStatus {
  SCHEDULED      // Agendada, esperando
  PENDING_PAYMENT // Esperando pago anticipado (no bloquea slot)
  IN_PROGRESS    // En curso
  COMPLETED      // Completada
  CANCELLED      // Cancelada
  NO_SHOW        // No asistió
}
```

### Session (Sesión)
```prisma
model Session {
  id                String        @id @default(cuid())
  appointmentId     String        @unique
  babyId            String
  therapistId       String
  packagePurchaseId String?       // Paquete final confirmado
  
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
}

enum SessionStatus {
  PENDING    // Iniciada, esperando evaluación
  EVALUATED  // Terapeuta completó evaluación
  COMPLETED  // Recepción cobró y cerró
}
```

### Event (Eventos Grupales)
```prisma
model Event {
  id                      String    @id @default(cuid())
  name                    String
  description             String?
  date                    DateTime  @db.Date
  startTime               String
  endTime                 String
  location                String?
  
  maxParticipants         Int
  pricePerBaby            Decimal
  
  requiresAdvancePayment  Boolean   @default(false)
  advancePaymentAmount    Decimal?
  
  status                  EventStatus @default(DRAFT)
  
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt
  createdById             String
  
  // Relaciones
  participants            EventParticipant[]
}

enum EventStatus {
  DRAFT       // Borrador
  OPEN        // Abierto para inscripciones
  CLOSED      // Cerrado (completo o fecha pasada)
  COMPLETED   // Finalizado
  CANCELLED   // Cancelado
}

model EventParticipant {
  id                String    @id @default(cuid())
  eventId           String
  babyId            String
  
  registeredAt      DateTime  @default(now())
  paidAmount        Decimal   @default(0)
  isPaid            Boolean   @default(false)
  paymentMethod     String?
  paymentReference  String?
  
  attended          Boolean   @default(false)
  notes             String?
  
  // Relaciones
  event             Event     @relation(fields: [eventId], references: [id])
  baby              Baby      @relation(fields: [babyId], references: [id])
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
2. Sistema muestra:
   - Paquetes existentes con sesiones disponibles
   - Opción "Seleccionar otro paquete" → muestra catálogo completo
3. Padre selecciona paquete (provisional)
4. Padre puede guardar preferencia de horario (opcional, para auto-agenda futura)
5. Padre selecciona fecha y hora
6. Si paquete requiere pago anticipado:
   - Se muestra QR de pago + botón WhatsApp
   - Cita queda en estado PENDING_PAYMENT
   - NO bloquea el slot
7. Si no requiere pago → se crea cita SCHEDULED

**Desde Staff:**
1. Staff busca bebé
2. Selecciona paquete (existente o nuevo del catálogo)
3. Si requiere pago anticipado → staff ya recibió el pago, marca como pagado
4. Se crea cita SCHEDULED

### 5.1.2 Paquete Provisional

El paquete seleccionado puede cambiar en cualquier momento:
- En el detalle de la cita (botón "Cambiar paquete")
- En el modal de iniciar sesión
- En el checkout (última oportunidad)

**Ejemplo:**
```
Padre agenda: Individual (1 sesión) 
    ↓
Staff inicia: Puede cambiar a Premium (20 sesiones) 
    ↓
Checkout: Confirma Premium → Se crea PackagePurchase → Se descuenta 1 sesión
```

### 5.1.3 Inicio de Sesión (Staff)

1. Staff abre cita SCHEDULED
2. Asigna terapeuta
3. Puede cambiar paquete si es necesario
4. Marca como IN_PROGRESS
5. Se crea registro Session
6. La cita aparece en la lista del terapeuta

### 5.1.4 Evaluación (Terapeuta)

1. Terapeuta ve sus citas del día (SCHEDULED asignadas, IN_PROGRESS, COMPLETED)
2. NO ve: NO_SHOW, CANCELLED
3. Puede evaluar citas IN_PROGRESS o COMPLETED (si no evaluadas)
4. Completa formulario de evaluación
5. Una vez evaluada → No puede modificar
6. Badge: 🟡 "Pendiente" / 🟢 "Evaluada"

**Campos de Evaluación:**
- Actividades: hidroterapia, masaje, estimulación motora/sensorial, relajación
- Desarrollo sensorial: seguimiento visual, contacto visual, respuesta auditiva
- Tono muscular: bajo/normal/tenso
- Hitos: se sienta, gatea, camina
- Estado de ánimo: tranquilo/irritable
- Notas internas (solo staff)
- Notas externas (visibles para padres)

### 5.1.5 Checkout (Staff/Recepción)

1. Staff abre sesión IN_PROGRESS
2. Ve evaluación (si existe) - solo informativo
3. Puede cambiar paquete (última oportunidad)
4. Agrega productos usados
5. Sistema calcula:
   - Si paquete nuevo → precio del paquete
   - Si paquete existente → $0 por sesión
   - + Productos cobrables
   - - Pagos anticipados ya realizados
6. Registra pago
7. Se descuenta sesión del paquete
8. Se descuenta inventario
9. Cambia a COMPLETED
10. Resetea noShowCount del padre = 0

### 5.1.6 No-Show

1. Staff marca cita como NO_SHOW
2. parent.noShowCount += 1
3. Si noShowCount >= 3 → parent.requiresPrepayment = true
4. Si había paquete existente → devuelve sesión al paquete
5. Si había pago anticipado → NO se reembolsa (se pierde)

## 5.2 Flujo de Pagos

### 5.2.1 Pagos Anticipados (Por Cita)

Algunos paquetes requieren pago anticipado:
```
Package {
  requiresAdvancePayment: true
  advancePaymentAmount: 100  // Bs o R$
}
```

**Flujo:**
1. Padre selecciona paquete que requiere pago
2. Sistema muestra QR + botón WhatsApp
3. Padre paga (mínimo o más) y envía comprobante
4. Staff recibe comprobante, verifica
5. Staff registra pago anticipado en sistema
6. Cita cambia de PENDING_PAYMENT → SCHEDULED
7. En checkout: el anticipo se descuenta del total

**Opciones de pago anticipado:**
- Monto mínimo requerido
- Monto mayor al mínimo (abono extra)
- Pago completo

### 5.2.2 Paquetes en Cuotas (Financiamiento)

**Configuración al vender:**
```
Paquete Premium (20 sesiones) = 2000 Bs
├── 1 cuota: 2000 Bs (pago único)
├── 2 cuotas: 1000 Bs c/u
├── 4 cuotas: 500 Bs c/u
└── Personalizado
```

**Lógica de tramos:**
```
Paquete 20 sesiones en 4 cuotas:
├── Cuota 1 (500 Bs) → Habilita sesiones 1-5
├── Cuota 2 (500 Bs) → Habilita sesiones 6-10
├── Cuota 3 (500 Bs) → Habilita sesiones 11-15
└── Cuota 4 (500 Bs) → Habilita sesiones 16-20
```

**Alertas:**
- Si intenta usar sesión #6 sin pagar cuota 2 → Alerta: "Debe pagar cuota 2"
- Staff puede permitir pago 1x1 como excepción
- Reporte de deudas pendientes

### 5.2.3 QR de Pago

**Configuración (Settings):**
```
PaymentSettings {
  qrImageUrl: string        // Imagen del QR
  whatsappNumber: string    // "+591..."
  whatsappMessage: string   // Mensaje predeterminado
}
```

- QR estático (se actualiza manualmente en configuración)
- Un QR por base de datos (Bolivia ≠ Brasil)
- Al pagar, padre envía comprobante por WhatsApp
- Staff registra número de referencia (no imagen)

## 5.3 Auto-Agendado Masivo

**Cuándo se usa:**
- Paquetes de múltiples sesiones (4, 8, 10, 20)
- Cliente quiere horario fijo
- Cliente paga anticipadamente y quiere dejar todo agendado

### 5.3.1 Puntos de Acceso al Auto-Agendado

El staff puede generar múltiples citas desde **3 lugares diferentes**:

| # | Ubicación | Escenario |
|---|-----------|-----------|
| 1 | **Checkout de Sesión** | Cliente compra paquete al completar su primera cita |
| 2 | **Venta de Paquete (Perfil Bebé)** | Cliente paga anticipadamente (sin cita inmediata) |
| 3 | **Paquete Existente (Perfil Bebé)** | Cliente con paquete activo decide cambiar a horario fijo |

### 5.3.2 Flujo desde Checkout

1. Staff confirma venta de paquete con N sesiones
2. Sistema pregunta: "¿Horario fijo o agenda después?"
3. Si horario fijo → abre configurador de auto-agenda
4. Se crean N citas de una vez

### 5.3.3 Flujo desde Venta de Paquete (Perfil Bebé)

**Escenario:** Padre llama, paga por transferencia un paquete de 20 sesiones, y quiere dejar agendados todos los jueves.

1. Staff va al perfil del bebé
2. Click en "Vender Paquete"
3. Selecciona paquete, cuotas, registra pago
4. Opción: "¿Agendar sesiones ahora?"
   - No → Solo crea el paquete
   - Sí → Abre configurador de auto-agenda
5. Se crean las N citas con el paquete vinculado

### 5.3.4 Flujo desde Paquete Existente (Perfil Bebé)

**Escenario:** Cliente con paquete de 20 sesiones (8 usadas, 12 restantes) que venía esporádicamente, ahora quiere venir todos los martes.

1. Staff va al perfil del bebé → Tab Paquetes
2. En la card del paquete activo, click en "Agendar Sesiones"
3. Sistema muestra: "12 sesiones disponibles para agendar"
4. Opciones:
   - "Una sola cita" → Ir al calendario normal
   - "Horario fijo (múltiples citas)" → Configurador
5. Configurador permite agendar las 12 sesiones restantes

### 5.3.5 Configurador de Auto-Agenda

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 Agendar Sesiones - Paquete Premium (12 disponibles)     │
│                                                             │
│ Día(s): [✓] Lunes [ ] Martes [✓] Jueves [ ] Viernes       │
│ Hora: [10:00 ▼]                                            │
│ Cantidad: [12 ▼]                                           │
│                                                             │
│ Vista previa:                                               │
│ ├── Lun 27/01 10:00                                        │
│ ├── Jue 30/01 10:00                                        │
│ ├── Lun 03/02 10:00                                        │
│ └── ... (12 citas hasta Mar 20/03)                         │
│                                                             │
│ ⚠️ 2 slots tienen conflictos (se agendarán igual)          │
│                                                             │
│                              [Cancelar] [Agendar 12 Citas]  │
└─────────────────────────────────────────────────────────────┘
```

### 5.3.6 Reglas del Auto-Agendado

- Puede seleccionar múltiples días (ej: Lunes y Jueves)
- Si un slot está lleno → agenda igual (staff revisa después)
- Respeta horarios de trabajo (no agenda domingos ni fuera de horario)
- Todas las citas quedan con el paquete vinculado
- Las citas son provisionales (pueden reagendarse individualmente)

### 5.3.7 Preferencia del Padre (Portal)

- En portal, padre puede guardar preferencia: "Viernes 10:00"
- Esto NO crea citas, solo guarda la preferencia
- Cuando staff vende/agenda, ve la preferencia como sugerencia

## 5.4 Eventos Grupales

**Concepto:**
- Eventos masivos (Babyton, talleres, etc.)
- 15-30 bebés participantes
- Duración de varias horas
- Cada bebé paga individualmente
- NO tienen evaluaciones (solo asistencia + pago)

**Flujo:**
1. Admin crea evento (nombre, fecha, horario, precio, max participantes)
2. Evento aparece en pantalla de Eventos y en calendario como bloque
3. El día del evento se bloquea para citas normales
4. Staff registra bebés participantes:
   - Busca bebé existente o crea nuevo
   - Registra pago (anticipado o en el momento)
5. Día del evento: marcar asistencia
6. Al finalizar: completar evento

**Vista en Calendario:**
- Card especial que muestra el evento
- Click → ir a pantalla de detalle del evento
- El día completo queda bloqueado para citas normales

---

# 6. REGLAS DE NEGOCIO

## 6.1 Bebés
- Solo bebés ≤36 meses aparecen en notificaciones activas
- Después de 3 años → isActive = false (no borrar)
- Código acceso portal generado automático: BSB-XXXXX
- Un bebé puede tener múltiples padres/tutores

## 6.2 Padres
- Identificables por teléfono (único)
- Login portal SOLO con código BSB-XXXXX
- noShowCount se resetea cuando asiste a cita
- requiresPrepayment = true si noShowCount >= 3
- Padres con requiresPrepayment → solo staff puede agendar

## 6.3 Paquetes
- **NO vencen** (válidos hasta bebé cumpla 3 años)
- Sesiones **NO transferibles** entre bebés
- Siempre se selecciona paquete al agendar (no existe "sesión a definir")
- El paquete es **provisional** hasta el checkout
- Sesión se **descuenta al completar**, NO al agendar
- Pueden pagarse en **cuotas** (financiamiento)
- Algunos requieren **pago anticipado**
- Tienen **duración configurable** (30, 60, 90, 120 min)

## 6.4 Agendamiento
- Máximo 5 citas por slot de 30 min (staff)
- Máximo 2 citas por slot (portal padres)
- Citas ocupan slots según duración del paquete
- 1 bebé solo 1 cita por día
- Citas PENDING_PAYMENT no bloquean slot
- Padres con requiresPrepayment no pueden agendar desde portal

## 6.5 Sesiones
- Solo **THERAPIST** puede registrar evaluaciones
- Solo **RECEPTION/ADMIN** puede completar sesión (checkout)
- Una cita puede completarse **sin evaluación** (el terapeuta puede evaluar después)
- Evaluación solo se puede hacer **una vez** por cita
- Productos siempre descuentan inventario
- Productos con isChargeable suman al cobro

## 6.6 Evaluaciones
- Notas internas: solo staff ve
- Notas externas: visibles en portal padres
- Campo isEvaluated en Appointment indica si ya se evaluó

## 6.7 Eventos
- Bloquean el día completo para citas normales
- No tienen evaluaciones (solo asistencia + pago)
- Bebés deben estar registrados en sistema
- Pagos son individuales por participante

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
- [x] Módulo 2: Link Registro Temporal (formulario público)
- [x] Módulo 3: Paquetes y Ventas
- [x] Módulo 4: Calendario y Agendamiento
- [x] Módulo 5: Inventario
- [x] Módulo 6: Sesiones y Evaluaciones (checkout)

## ⏳ Fase 3: Pagos y Financiamiento (PENDIENTE)
- [ ] Módulo 3.1: Refactorización de Paquetes
- [ ] Módulo 3.2: Sistema de Pagos Anticipados
- [ ] Módulo 3.3: Paquetes en Cuotas
- [ ] Módulo 3.4: Alertas de Deuda
- [ ] Módulo 3.5: Auto-Agendado Masivo

## ⏳ Fase 4: Eventos y Portal (PENDIENTE)
- [ ] Módulo 4.1: Sistema de Eventos Grupales
- [ ] Módulo 4.2: Preferencias de Horario (Padres)
- [ ] Módulo 4.3: Portal de Padres Completo

## ⏳ Fase 5: Configuración y Reportes (PENDIENTE)
- [ ] Módulo 5.1: Configuración del Sistema
- [ ] Módulo 5.2: QR de Pago
- [ ] Módulo 5.3: Reportes Financieros

## ⏳ Fase 6: Secundarios (PENDIENTE)
- [ ] Notificaciones + Cron Jobs
- [ ] Staff Payments

---

# 8. PLAN DE IMPLEMENTACIÓN

## Fase 1: Fundamentos ✅ COMPLETADA
## Fase 2: Core ✅ COMPLETADA

## Fase 3: Pagos y Financiamiento (7-10 días)

### Módulo 3.1: Refactorización de Paquetes
```
□ Eliminar concepto "sesión a definir" de todo el sistema
□ Agregar campo description a Package
□ Agregar campo duration a Package (minutos)
□ Actualizar calendario para respetar duración
□ Agregar campos de pago anticipado:
  - requiresAdvancePayment: boolean
  - advancePaymentAmount: Decimal
□ UI: Selector de paquetes mejorado (con descripción)
□ UI: Badge "Requiere pago anticipado" en paquetes
□ Mensaje para padres: "Este paquete es provisional"
□ Default al agendar: Paquete Individual
```

### Módulo 3.2: Sistema de Pagos Anticipados
```
□ Nuevo estado de cita: PENDING_PAYMENT
□ Modelo AppointmentPayment (pagos por cita)
□ UI: Modal de pago anticipado (staff)
□ UI: Pantalla QR + WhatsApp (portal padres)
□ Configuración: QR image upload
□ Lógica: Cita no bloquea slot si PENDING_PAYMENT
□ UI: Visualización en calendario (estilo diferente)
□ Flujo: confirmar pago → cambiar a SCHEDULED
```

### Módulo 3.3: Paquetes en Cuotas
```
□ Campos en PackagePurchase:
  - installments, installmentAmount
  - paidAmount, pendingAmount
□ Modelo PackagePayment (pagos por paquete)
□ Lógica de tramos (cuota X habilita sesiones Y-Z)
□ UI: Venta con cuotas (seleccionar cantidad)
□ UI: Historial de pagos del paquete
□ UI: En checkout, ver si hay pago pendiente
```

### Módulo 3.4: Alertas de Deuda
```
□ Alerta inteligente (según tramo de sesiones)
□ Badge en perfil del bebé
□ Badge en detalle de cita
□ Opción pago 1x1 (excepciones)
□ Reporte: Bebés con saldo pendiente
□ Reporte: Paquetes con cuotas atrasadas
```

### Módulo 3.5: Auto-Agendado Masivo
```
□ Componente BulkSchedulingDialog
□ Función generateBulkSchedule
□ API POST /api/appointments/bulk
□ API GET /api/appointments/check-conflicts
□ Integrar en SellPackageDialog (perfil bebé)
□ Integrar en CompleteSessionDialog (checkout)
□ Botón "Agendar Sesiones" en card de paquete existente
□ Verificar conflictos en tiempo real
□ Saltar domingos y días cerrados
□ Soportar múltiples días (ej: Lunes y Jueves)
```

## Fase 4: Eventos y Portal (5-7 días)

### Módulo 4.1: Sistema de Eventos Grupales
```
□ Modelo Event
□ Modelo EventParticipant
□ UI: Pantalla de eventos (lista/timeline)
□ UI: Crear/editar evento
□ UI: Detalle de evento con participantes
□ UI: Agregar bebé al evento
□ UI: Registrar pago por participante
□ UI: Marcar asistencia
□ Lógica: Bloquear día en calendario normal
□ UI: Card de evento en calendario del staff
```

### Módulo 4.2: Preferencias de Horario (Padres)
```
□ Campo preferredSchedule en Baby o Parent
□ UI: En portal, guardar preferencia de día/hora
□ UI: En staff, ver preferencia como sugerencia
□ Lógica: Usar preferencia para auto-agenda
```

## Fase 5: Portal Padres + Configuración (4-5 días)

### Módulo 5.1: Portal de Padres Completo
```
□ Login con código BSB-XXXXX
□ Dashboard con bebés y paquetes
□ Ver saldo pendiente de paquetes
□ Agendar cita:
  - Mostrar paquetes existentes
  - Opción "Seleccionar otro paquete"
  - Guardar preferencia de horario (opcional)
  - Mostrar QR si requiere pago anticipado
□ Ver citas (con estado de pago)
□ Historial de sesiones (notas externas)
□ Mensaje si requiresPrepayment = true
```

### Módulo 5.2: Configuración del Sistema
```
□ Horarios de trabajo
□ Días cerrados
□ Gestión de usuarios
□ Categorías de paquetes
```

### Módulo 5.3: QR de Pago
```
□ UI: Subir imagen de QR
□ UI: Configurar número WhatsApp
□ UI: Configurar mensaje predeterminado
□ Lógica: Servir QR en portal de padres
```

## Fase 6: Secundarios (4-5 días)

### Módulo 6.1: Notificaciones
```
□ Mesversarios automáticos
□ Recordatorio de cita 24h antes
□ Cron jobs
```

### Módulo 6.2: Reportes
```
□ Ingresos por período
□ Deudas pendientes
□ Ocupación
□ No-shows
□ Sesiones por terapeuta
```

### Módulo 6.3: Staff Payments
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
- Multiidioma (ES/PT-BR) - cada BD tiene su idioma
- 4 roles: Admin, Reception, Therapist, Parent

## 9.2 Reglas Críticas

```
⚠️ IMPORTANTE - LEER SIEMPRE:

1. PAQUETES:
   - Siempre se selecciona un paquete (no existe "sesión a definir")
   - Default: Paquete Individual (1 sesión)
   - Es provisional hasta el checkout
   - Sesión se descuenta al COMPLETAR, no al agendar

2. PAGOS:
   - Algunos paquetes requieren pago anticipado
   - Citas PENDING_PAYMENT no bloquean slot
   - Paquetes pueden pagarse en cuotas
   - Alertas según tramo de sesiones

3. EVALUACIONES:
   - Solo terapeuta evalúa
   - Cita puede completarse sin evaluación
   - Una vez evaluada, no se puede modificar
   - Notas internas ≠ notas externas

4. EVENTOS:
   - Bloquean día completo
   - No tienen evaluaciones
   - Pagos individuales por participante
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

### Componentes
```typescript
// components/[feature]/[component].tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface Props {
  // ...
}

export function ComponentName({ ...props }: Props) {
  const t = useTranslations('namespace');
  // ...
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
