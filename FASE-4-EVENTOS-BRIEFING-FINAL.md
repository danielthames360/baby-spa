# 🎉 FASE 4: SISTEMA DE EVENTOS GRUPALES - BRIEFING FINAL

## 📋 Resumen Ejecutivo

El sistema de eventos grupales permite gestionar actividades donde múltiples participantes (bebés o padres) se inscriben para una fecha/horario específico. A diferencia de las citas individuales, los eventos tienen capacidad limitada, inscripciones, y pueden bloquear parcialmente el calendario.

---

## 🎯 Tipos de Eventos

| Tipo | Participantes | Frecuencia | Capacidad | Ejemplo |
|------|---------------|------------|-----------|---------|
| **Hora de Juego** | Bebés | Semanal | 5-15 | Juego libre grupal |
| **Evento Masivo** | Bebés | Ocasional | 30-45 | Babython, carreras de gateo |
| **Taller de Padres** | Padres (LEADS) | Mensual | 10-20 | Preparación prenatal |

---

## 📊 Modelo de Datos

### 1. Actualizar modelo Parent (para LEADS)

```prisma
// Agregar campos al modelo Parent existente

model Parent {
  // ... campos existentes ...
  
  // Para padres potenciales (LEADS)
  status              ParentStatus  @default(ACTIVE)
  pregnancyWeeks      Int?          // Semanas de embarazo al registrar
  leadSource          String?       // "EVENTO_TALLER", "INSTAGRAM", "REFERIDO", etc.
  leadNotes           String?       // Notas del lead
  convertedAt         DateTime?     // Fecha cuando se convirtió en cliente (tuvo bebé)
  
  // Relaciones
  eventParticipations EventParticipant[]
}

enum ParentStatus {
  LEAD      // Padre potencial (embarazada sin bebé aún)
  ACTIVE    // Cliente activo (tiene bebé registrado)
  INACTIVE  // Cliente inactivo
}
```

### 2. Modelo Event (NUEVO)

```prisma
model Event {
  id                  String        @id @default(cuid())
  
  // Información básica
  name                String        // "Hora de Juego - Sábado 15 Feb"
  description         String?       // Descripción para mostrar
  
  // Tipo de evento
  eventType           EventType     // BABIES | PARENTS
  
  // Fecha y horario
  date                DateTime      @db.Date
  startTime           String        // "10:00"
  endTime             String        // "12:00"
  
  // Capacidad
  maxParticipants     Int?          // null = ilimitado
  
  // Para eventos de bebés
  minAgeMonths        Int?          // Edad mínima en meses
  maxAgeMonths        Int?          // Edad máxima en meses
  
  // Precio
  basePrice           Decimal       @db.Decimal(10, 2)
  
  // Bloqueo de calendario
  blocksCalendar      Boolean       @default(false)
  blockedTherapists   Int           @default(0)  // 0 = ninguno, 1, 2, 3, 4 = todos
  
  // Estado
  status              EventStatus   @default(DRAFT)
  
  // Metadata
  notes               String?       // Notas internas para staff
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
  createdById         String
  
  // Relaciones
  createdBy           User          @relation(fields: [createdById], references: [id])
  participants        EventParticipant[]
  productUsages       EventProductUsage[]
}

enum EventType {
  BABIES    // Evento para bebés
  PARENTS   // Evento para padres (talleres prenatales)
}

enum EventStatus {
  DRAFT       // Borrador, no visible
  PUBLISHED   // Publicado, aceptando inscripciones
  IN_PROGRESS // En curso
  COMPLETED   // Finalizado
  CANCELLED   // Cancelado
}
```

### 3. Modelo EventParticipant (NUEVO)

```prisma
model EventParticipant {
  id                  String            @id @default(cuid())
  eventId             String
  
  // Participante: bebé O padre (según tipo de evento)
  babyId              String?           // Si eventType = BABIES
  parentId            String?           // Si eventType = PARENTS (leads)
  
  // Estado de inscripción
  status              ParticipantStatus @default(REGISTERED)
  
  // Pago
  originalPrice       Decimal           @db.Decimal(10, 2)
  discountType        DiscountType?     // COURTESY | FIXED
  discountAmount      Decimal           @default(0) @db.Decimal(10, 2)
  discountReason      String?           // "Amigo de María", "Cortesía gerencia"
  finalPrice          Decimal           @db.Decimal(10, 2)  // originalPrice - discountAmount
  
  paymentStatus       PaymentStatus     @default(PENDING)
  paidAmount          Decimal           @default(0) @db.Decimal(10, 2)
  paymentMethod       PaymentMethod?
  paidAt              DateTime?
  
  // Asistencia
  attended            Boolean?          // null = no marcado, true = asistió, false = no vino
  
  // Metadata
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

enum ParticipantStatus {
  REGISTERED    // Inscrito
  CONFIRMED     // Confirmado (pagado)
  CANCELLED     // Canceló inscripción
  NO_SHOW       // No asistió (sin penalización)
}

enum PaymentStatus {
  PENDING       // Pendiente de pago
  PAID          // Pagado
  PARTIAL       // Pago parcial
  WAIVED        // Exento (cortesía 100%)
}

enum DiscountType {
  COURTESY      // 100% gratis
  FIXED         // Monto fijo (ej: -20 Bs)
}
```

### 4. Modelo EventProductUsage (NUEVO - para inventario)

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

### 5. Agregar relación en Baby

```prisma
model Baby {
  // ... campos existentes ...
  
  eventParticipations EventParticipant[]
}
```

---

## 🖥️ Interfaces de Usuario

### 1. Lista de Eventos

**Ruta:** `/[locale]/admin/events`

```
┌─────────────────────────────────────────────────────────────┐
│ 🎉 Eventos                                   [+ Nuevo Evento]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Próximos] [En Curso] [Pasados] [Todos]                    │
│                                                             │
│ Filtrar por tipo: [Todos ▼]                                │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ 📅 Sábado 15/02/2026                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👶 Hora de Juego                        10:00 - 11:00   │ │
│ │    8/15 inscritos • Bs. 50 • 🟢 PUBLICADO              │ │
│ │    Bloqueo: 2 terapeutas                               │ │
│ │                                         [Ver Detalles] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📅 Sábado 22/02/2026                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🤰 Taller Prenatal: Primeros Cuidados   15:00 - 17:00   │ │
│ │    12/20 inscritos • Bs. 80 • 🟢 PUBLICADO             │ │
│ │    Bloqueo: Ninguno                                    │ │
│ │                                         [Ver Detalles] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ 📅 Sábado 01/03/2026                                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 👶 Babython 2026                        09:00 - 13:00   │ │
│ │    28/45 inscritos • Bs. 100 • 🟡 BORRADOR             │ │
│ │    Bloqueo: Todo el equipo                             │ │
│ │                                [Publicar] [Ver Detalles]│ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Crear/Editar Evento

**Ruta:** `/[locale]/admin/events/new` o `/[locale]/admin/events/[id]/edit`

```
┌─────────────────────────────────────────────────────────────┐
│ 🎉 Nuevo Evento                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ── INFORMACIÓN BÁSICA ──────────────────────────────────── │
│                                                             │
│ Nombre del evento:                                          │
│ [Hora de Juego - Sábado 15 Feb_________________________]   │
│                                                             │
│ Descripción (visible para staff):                           │
│ [Actividad grupal de juego libre para bebés____________]   │
│ [Los padres deben estar presentes______________________]   │
│                                                             │
│ Tipo de evento:                                             │
│ ● 👶 Para bebés                                             │
│ ○ 🤰 Para padres (taller prenatal)                         │
│                                                             │
│ ── FECHA Y HORARIO ─────────────────────────────────────── │
│                                                             │
│ Fecha: [📅 15/02/2026]                                     │
│                                                             │
│ Hora inicio: [10:00 ▼]    Hora fin: [11:00 ▼]             │
│                                                             │
│ ── CAPACIDAD ───────────────────────────────────────────── │
│                                                             │
│ Máximo de participantes: [15__] (vacío = ilimitado)        │
│                                                             │
│ [Solo si tipo = BEBÉS]                                      │
│ Rango de edad:                                              │
│ De [3__] a [12_] meses (vacío = sin restricción)           │
│                                                             │
│ ── PRECIO ──────────────────────────────────────────────── │
│                                                             │
│ Precio por participante: Bs. [50____]                      │
│                                                             │
│ ── BLOQUEO DE CALENDARIO ───────────────────────────────── │
│                                                             │
│ Durante este evento, ¿cuántos terapeutas estarán ocupados? │
│                                                             │
│ ○ Ninguno (no afecta citas normales)                       │
│ ○ 1 terapeuta  (quedan 3 disponibles para citas)           │
│ ● 2 terapeutas (quedan 2 disponibles para citas)           │
│ ○ 3 terapeutas (queda 1 disponible para citas)             │
│ ○ Todo el equipo (no se pueden agendar citas)              │
│                                                             │
│ ── NOTAS INTERNAS ──────────────────────────────────────── │
│                                                             │
│ [Preparar: colchonetas, pelotas, música infantil_______]   │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│              [Cancelar] [Guardar Borrador] [Guardar y Publicar]│
└─────────────────────────────────────────────────────────────┘
```

### 3. Detalle del Evento (con participantes)

**Ruta:** `/[locale]/admin/events/[id]`

```
┌─────────────────────────────────────────────────────────────┐
│ 👶 Hora de Juego                                    [Editar]│
│ Sábado 15/02/2026 • 10:00 - 11:00                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────┬─────────────┬─────────────┬───────────────┐│
│ │   Estado    │ Participantes│   Precio   │    Bloqueo    ││
│ │ 🟢 PUBLICADO│    8/15     │   Bs. 50   │ 2 terapeutas  ││
│ └─────────────┴─────────────┴─────────────┴───────────────┘│
│                                                             │
│ ── PARTICIPANTES ───────────────────────── [+ Agregar] ─── │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ ☐ │ 👶 María García (8m)     │ ✅ Bs.50  │ ○ Asistió   ││
│ │ ☐ │ 👶 Pedro López (6m)      │ ✅ Bs.50  │ ○ Asistió   ││
│ │ ☐ │ 👶 Ana Ruiz (10m)        │ ⏳ Bs.50  │             ││
│ │ ☐ │ 👶 Carlos Paz (4m)       │ 🎁 Cortesía│ ○ Asistió   ││
│ │ ☐ │ 👶 Lucía Torres (9m)     │ ✅ Bs.30  │ ○ Asistió   ││
│ │   │    ↳ Descuento: -Bs.20 (Amigo de María)            ││
│ │ ☐ │ 👶 Diego Soto (7m)       │ ⏳ Bs.50  │             ││
│ │ ☐ │ 👶 Sofía Vega (11m)      │ ✅ Bs.50  │ ○ Asistió   ││
│ │ ☐ │ 👶 Mateo Cruz (5m)       │ ✅ Bs.50  │ ○ Asistió   ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ Resumen: 6 pagados (Bs.280) • 2 pendientes (Bs.100)        │
│                                                             │
│ [Cobrar Seleccionados] [Marcar Asistencia] [📋 Imprimir]   │
│                                                             │
│ ── PRODUCTOS USADOS ─────────────────────── [+ Agregar] ── │
│                                                             │
│ • 2x Pañales Huggies (-Bs.40 del inventario)               │
│ • 1x Toallitas húmedas (-Bs.15 del inventario)             │
│                                                             │
│ ── DESCRIPCIÓN ─────────────────────────────────────────── │
│                                                             │
│ Actividad grupal de juego libre para bebés.                │
│ Los padres deben estar presentes.                          │
│                                                             │
│ ── NOTAS INTERNAS ──────────────────────────────────────── │
│                                                             │
│ Preparar: colchonetas, pelotas, música infantil            │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ [Cancelar Evento]              [Iniciar Evento] [Finalizar]│
└─────────────────────────────────────────────────────────────┘
```

### 4. Modal: Agregar Participante (Bebé)

```
┌─────────────────────────────────────────────────────────────┐
│ ➕ Agregar Participante                              [X]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Buscar bebé:                                                │
│ [🔍 Nombre del bebé o padre_________________________]      │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 👶 Emma Rodríguez (9 meses)                             ││
│ │    👤 Juan Rodríguez • 📱 70012345                      ││
│ │                                        [Seleccionar]    ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ 👶 Emma García (7 meses)                                ││
│ │    👤 María García • 📱 70098765                        ││
│ │                                        [Seleccionar]    ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ─────────────── O ─────────────────────────────────────── │
│                                                             │
│ ¿Primera vez que viene? [+ Registrar Nuevo Cliente]        │
│                                                             │
│ ── PAGO ────────────────────────────────────────────────── │
│                                                             │
│ Precio: Bs. 50                                              │
│                                                             │
│ Descuento:                                                  │
│ ○ Sin descuento                                             │
│ ○ Cortesía (gratis)                                         │
│ ○ Descuento fijo: Bs. [____]  Razón: [________________]    │
│                                                             │
│ Precio final: Bs. 50                                        │
│                                                             │
│ Estado del pago:                                            │
│ ○ Pendiente (pagará después)                                │
│ ● Pagado ahora                                              │
│   Método: [Efectivo ▼]                                     │
│                                                             │
│                              [Cancelar] [Agregar Participante]│
└─────────────────────────────────────────────────────────────┘
```

**Flujo "Registrar Nuevo Cliente":**
Al hacer click en este botón, se abre el formulario estándar de registro de cliente (padre + bebé). Una vez registrado, el bebé aparece automáticamente seleccionado para agregarlo al evento. Esto asegura que:
- El bebé queda completamente registrado en el sistema
- El padre tiene acceso al portal desde el primer día
- El sistema de notificaciones puede contactarlo
- Es un cliente potencial importante identificado

### 5. Modal: Agregar Participante (Padre - Taller Prenatal)

```
┌─────────────────────────────────────────────────────────────┐
│ ➕ Agregar Participante (Taller Prenatal)            [X]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Buscar padre/madre registrado:                              │
│ [🔍 Nombre o teléfono__________________________]           │
│                                                             │
│ [Sin resultados o resultados aquí]                          │
│                                                             │
│ ─────────────── O ─────────────────────────────────────── │
│                                                             │
│ ☐ Registrar nuevo padre/madre (potencial cliente)          │
│                                                             │
│ [Si marca nuevo:]                                           │
│ Nombre: [María Fernández_________________________]          │
│ Teléfono: [70012345_____________________________]           │
│ Email (opcional): [maria@email.com_______________]          │
│                                                             │
│ Semanas de embarazo: [28__]                                 │
│                                                             │
│ ¿Cómo se enteró del taller?                                 │
│ [Instagram ▼]                                               │
│   • Instagram                                               │
│   • Facebook                                                │
│   • Referido por cliente                                    │
│   • Volante/Flyer                                           │
│   • Otro                                                    │
│                                                             │
│ Notas: [Primera vez que nos visita_______________]          │
│                                                             │
│ ── PAGO ────────────────────────────────────────────────── │
│                                                             │
│ [Mismas opciones que para bebés]                           │
│                                                             │
│                              [Cancelar] [Agregar Participante]│
└─────────────────────────────────────────────────────────────┘
```

### 6. Vista en Calendario

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 Febrero 2026                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│      Lun    Mar    Mié    Jue    Vie    Sáb    Dom         │
│       10     11     12     13     14    [15]    16         │
│       3      4      2      5      3     🎉      -          │
│      citas  citas  citas  citas  citas EVENTO             │
│                                                             │
│ ─────────────────────────────────────────────────────────── │
│                                                             │
│ Sábado 15 de Febrero                                        │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 🎉 EVENTO: Hora de Juego (10:00 - 11:00)               ││
│ │    8/15 participantes • Bloquea 2 terapeutas           ││
│ │    [Ver Evento]                                         ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ⚠️ Capacidad reducida: Solo 2 terapeutas disponibles       │
│    para citas durante el evento (10:00 - 11:00)            │
│                                                             │
│ Citas del día:                                              │
│ • 09:00 - Lucas Pérez (Hidroterapia)                       │
│ • 09:30 - Mía González (Hidroterapia)                      │
│ • 11:30 - Tomás Ruiz (Fisioterapia)                        │
│ • 14:30 - Valentina Cruz (Hidroterapia)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujos de Trabajo

### Flujo 1: Crear Evento de Bebés (Hora de Juego)

```
1. Admin va a /admin/events → Click "Nuevo Evento"
2. Selecciona tipo: "Para bebés"
3. Llena: nombre, fecha, horario, capacidad (15), precio (Bs.50)
4. Configura bloqueo: 2 terapeutas
5. Guarda como borrador o publica
6. Si publica → evento aparece en calendario
7. Durante el horario del evento → solo 2 slots disponibles para citas
```

### Flujo 2: Inscribir Bebé Registrado

```
1. Staff abre detalle del evento
2. Click "Agregar"
3. Busca al bebé por nombre
4. Selecciona el bebé
5. Configura pago:
   a. Sin descuento → Bs. 50
   b. Cortesía → Bs. 0
   c. Descuento fijo → Bs. 30 (razón: "Amigo de María")
6. Marca si pagó ahora o queda pendiente
7. Bebé aparece en lista
```

### Flujo 3: Inscribir Bebé Nuevo (Primera Vez)

```
1. Durante el evento, llega un bebé que nunca ha venido
2. Staff abre el evento → "Agregar"
3. No lo encuentra en la búsqueda
4. Click "Registrar Nuevo Cliente"
5. Se abre el formulario estándar de registro:
   - Datos del padre (nombre, teléfono, email)
   - Datos del bebé (nombre, fecha nacimiento, género)
6. Al guardar:
   - Se crea el Parent y Baby completos
   - El bebé queda seleccionado automáticamente
7. Registra pago del evento
8. Resultado:
   - Bebé registrado como cliente completo
   - Padre con acceso al portal
   - Sistema de notificaciones lo detecta
   - Inscrito en el evento
```

### Flujo 4: Taller de Padres (Captar Leads)

```
1. Admin crea evento tipo "Para padres"
2. El día del taller, staff inscribe participantes:
   a. Si el padre ya existe → lo busca y selecciona
   b. Si es nuevo → lo registra con:
      - Nombre, teléfono
      - Semanas de embarazo
      - Cómo se enteró del taller
3. Sistema crea Parent con status = LEAD
4. Semanas después, cuando nazca el bebé:
   - Staff busca al padre
   - Crea el Baby
   - Vincula al Parent
   - Parent.status cambia a ACTIVE
5. Sistema de notificaciones puede enviar recordatorio
   basado en semanas de embarazo → fecha estimada de parto
```

### Flujo 5: El Día del Evento

```
1. Staff abre el evento
2. Cambia estado a "En Curso" (opcional)
3. Conforme llegan los participantes:
   - Marca asistencia ✓
   - Cobra a los que tienen pago pendiente
4. Si llegan espontáneos → los agrega
5. Si usaron productos → los registra
6. Al terminar → "Finalizar Evento"
7. Sistema marca no-shows (sin penalización)
```

### Flujo 6: Registrar Productos Usados

```
1. En detalle del evento → "Productos Usados" → "Agregar"
2. Busca el producto (ej: Pañales Huggies)
3. Indica cantidad usada (ej: 2)
4. Sistema descuenta del inventario
5. Nota: Esto es para productos del evento, no cobros individuales
   - Cobros individuales se hacen como venta normal
```

---

## 📡 API Endpoints

### Eventos

```typescript
// CRUD de eventos
GET    /api/events                    // Lista eventos (con filtros)
POST   /api/events                    // Crear evento
GET    /api/events/[id]               // Detalle de evento
PUT    /api/events/[id]               // Actualizar evento
DELETE /api/events/[id]               // Eliminar evento

// Acciones de evento
PUT    /api/events/[id]/status        // Cambiar estado (publish, start, complete, cancel)
```

### Participantes

```typescript
// Participantes de un evento
GET    /api/events/[id]/participants                    // Lista participantes
POST   /api/events/[id]/participants                    // Agregar participante
PUT    /api/events/[id]/participants/[participantId]    // Actualizar (pago, asistencia)
DELETE /api/events/[id]/participants/[participantId]    // Remover participante

// Acciones masivas
PUT    /api/events/[id]/participants/mark-attendance    // Marcar asistencia masiva
PUT    /api/events/[id]/participants/register-payments  // Registrar pagos masivos
```

### Productos del Evento

```typescript
GET    /api/events/[id]/products      // Productos usados
POST   /api/events/[id]/products      // Agregar producto usado
DELETE /api/events/[id]/products/[usageId]  // Remover
```

### Calendario

```typescript
// El endpoint existente debe incluir eventos
GET    /api/calendar/day?date=2026-02-15
// Respuesta incluye: appointments[] + events[]
```

---

## 🔒 Lógica de Bloqueo de Calendario

### Concepto

El sistema tiene **4 terapeutas**. Cada evento puede bloquear 0, 1, 2, 3, o 4 terapeutas.

```
Slots por hora normalmente: 5 citas máximo (pero depende de terapeutas)

Si evento bloquea 2 terapeutas:
→ Durante el horario del evento, solo quedan 2 terapeutas
→ Máximo 2 citas simultáneas en ese horario

Si evento bloquea 4 (todos):
→ No se pueden agendar citas durante el evento
```

### Implementación

```typescript
// Al verificar disponibilidad de un slot
function getAvailableSlots(date: Date, time: string) {
  const baseCapacity = 5; // O la que sea
  const totalTherapists = 4;
  
  // Buscar eventos que coincidan con fecha/hora
  const overlappingEvent = await prisma.event.findFirst({
    where: {
      date: date,
      startTime: { lte: time },
      endTime: { gt: time },
      status: { in: ['PUBLISHED', 'IN_PROGRESS'] },
    },
  });
  
  if (overlappingEvent) {
    const availableTherapists = totalTherapists - overlappingEvent.blockedTherapists;
    if (availableTherapists <= 0) {
      return 0; // No hay slots disponibles
    }
    // Reducir capacidad proporcionalmente
    return Math.min(baseCapacity, availableTherapists);
  }
  
  return baseCapacity;
}
```

---

## 📝 Traducciones Requeridas

```json
{
  "events": {
    "title": "Eventos",
    "newEvent": "Nuevo Evento",
    "editEvent": "Editar Evento",
    "eventDetails": "Detalles del Evento",
    
    "types": {
      "babies": "Para bebés",
      "parents": "Para padres (taller prenatal)"
    },
    
    "status": {
      "draft": "Borrador",
      "published": "Publicado",
      "inProgress": "En Curso",
      "completed": "Finalizado",
      "cancelled": "Cancelado"
    },
    
    "form": {
      "name": "Nombre del evento",
      "description": "Descripción",
      "eventType": "Tipo de evento",
      "date": "Fecha",
      "startTime": "Hora de inicio",
      "endTime": "Hora de fin",
      "maxParticipants": "Máximo de participantes",
      "maxParticipantsHint": "Dejar vacío para ilimitado",
      "ageRange": "Rango de edad",
      "minAge": "Edad mínima (meses)",
      "maxAge": "Edad máxima (meses)",
      "price": "Precio por participante",
      "blockedTherapists": "Terapeutas ocupados durante el evento",
      "blockNone": "Ninguno (no afecta citas)",
      "blockOne": "1 terapeuta",
      "blockTwo": "2 terapeutas",
      "blockThree": "3 terapeutas",
      "blockAll": "Todo el equipo (no hay citas)",
      "notes": "Notas internas"
    },
    
    "participants": {
      "title": "Participantes",
      "add": "Agregar",
      "search": "Buscar bebé o padre",
      "registerNew": "Registrar Nuevo Cliente",
      "firstTimeVisit": "¿Primera vez que viene?",
      "noParticipants": "No hay participantes inscritos",
      "registered": "Inscrito",
      "confirmed": "Confirmado",
      "cancelled": "Cancelado",
      "noShow": "No asistió"
    },
    
    "payment": {
      "price": "Precio",
      "discount": "Descuento",
      "noDiscount": "Sin descuento",
      "courtesy": "Cortesía (gratis)",
      "fixedDiscount": "Descuento fijo",
      "discountReason": "Razón del descuento",
      "finalPrice": "Precio final",
      "pending": "Pendiente",
      "paid": "Pagado",
      "payNow": "Pagar ahora",
      "payLater": "Pendiente (pagará después)"
    },
    
    "attendance": {
      "title": "Asistencia",
      "markAttendance": "Marcar Asistencia",
      "attended": "Asistió",
      "notAttended": "No asistió",
      "notMarked": "Sin marcar"
    },
    
    "products": {
      "title": "Productos usados",
      "add": "Agregar producto",
      "quantity": "Cantidad"
    },
    
    "actions": {
      "saveDraft": "Guardar Borrador",
      "savePublish": "Guardar y Publicar",
      "publish": "Publicar",
      "start": "Iniciar Evento",
      "complete": "Finalizar Evento",
      "cancel": "Cancelar Evento",
      "print": "Imprimir Lista"
    },
    
    "calendar": {
      "eventDay": "Día con Evento",
      "reducedCapacity": "Capacidad reducida",
      "noAppointments": "No se pueden agendar citas"
    },
    
    "leads": {
      "pregnancyWeeks": "Semanas de embarazo",
      "leadSource": "¿Cómo se enteró?",
      "sources": {
        "instagram": "Instagram",
        "facebook": "Facebook",
        "referral": "Referido por cliente",
        "flyer": "Volante/Flyer",
        "other": "Otro"
      }
    }
  }
}
```

---

## ✅ Checklist de Implementación

### Base de Datos
```
□ Agregar campos LEAD a modelo Parent
□ Crear modelo Event
□ Crear modelo EventParticipant
□ Crear modelo EventProductUsage
□ Agregar relaciones a Baby y Parent
□ Migración: npx prisma migrate dev --name add_events_system
```

### Servicios
```
□ lib/services/event-service.ts
□ lib/services/event-participant-service.ts
```

### APIs
```
□ app/api/events/route.ts (GET, POST)
□ app/api/events/[id]/route.ts (GET, PUT, DELETE)
□ app/api/events/[id]/status/route.ts (PUT)
□ app/api/events/[id]/participants/route.ts (GET, POST)
□ app/api/events/[id]/participants/[participantId]/route.ts (PUT, DELETE)
□ app/api/events/[id]/products/route.ts (GET, POST)
□ app/api/events/[id]/products/[usageId]/route.ts (DELETE)
```

### UI - Páginas
```
□ app/[locale]/(admin)/admin/events/page.tsx (lista)
□ app/[locale]/(admin)/admin/events/new/page.tsx (crear)
□ app/[locale]/(admin)/admin/events/[id]/page.tsx (detalle)
□ app/[locale]/(admin)/admin/events/[id]/edit/page.tsx (editar)
```

### UI - Componentes
```
□ components/events/event-list.tsx
□ components/events/event-card.tsx
□ components/events/event-form.tsx
□ components/events/event-details.tsx
□ components/events/participant-list.tsx
□ components/events/add-participant-dialog.tsx
□ components/events/add-parent-lead-dialog.tsx
□ components/events/mark-attendance-dialog.tsx
□ components/events/event-products.tsx
□ components/events/event-calendar-card.tsx
```

### Integración Calendario
```
□ Mostrar eventos en el calendario
□ Indicador visual de días con evento
□ Lógica de bloqueo parcial de slots
□ Card de evento en vista de día
```

### Traducciones
```
□ messages/es.json - sección "events"
□ messages/pt-BR.json - sección "events"
```

### Navegación
```
□ Agregar enlace "Eventos" en sidebar del admin
□ Icono: Calendar o PartyPopper de lucide-react
```

---

## 🚀 Orden de Implementación Sugerido

1. **Modelos y Migración** - Base de datos
2. **Servicios** - Lógica de negocio
3. **APIs** - Endpoints
4. **Lista de Eventos** - Página principal
5. **Crear/Editar Evento** - Formulario
6. **Detalle de Evento** - Vista con participantes
7. **Agregar Participante** - Modales (bebé y padre)
8. **Pagos y Asistencia** - Funcionalidades
9. **Productos del Evento** - Inventario
10. **Integración Calendario** - Visualización y bloqueo
11. **Traducciones** - ES y PT-BR
12. **Pruebas** - Todos los flujos

---

## 📋 Notas Finales

### Sobre Leads (Padres Potenciales)
- Los padres registrados en talleres quedan con `status = LEAD`
- El campo `pregnancyWeeks` permite estimar fecha de parto
- El sistema de notificaciones (Fase 6) puede usar esto para follow-up
- Cuando el bebé nace y se registra, el Parent cambia a `status = ACTIVE`
- **Reporte futuro:** Lista de leads para campañas de marketing

### Sobre Nuevos Clientes en Eventos
- Si un bebé viene por primera vez a un evento, se registra completo
- Esto asegura que tenga acceso al portal desde el día 1
- El sistema de notificaciones lo detecta como cliente potencial importante
- Es una excelente oportunidad de captación de clientes

### Sobre Bloqueo de Calendario
- El bloqueo es por número de terapeutas, no por slots fijos
- Permite flexibilidad: un evento puede usar 1, 2, 3, o todos los terapeutas
- El calendario debe mostrar claramente la capacidad reducida

---

¡Listo para implementar! 🎉
