# Manejo de Fechas en Baby Spa

## Resumen Ejecutivo

Baby Spa usa la estrategia **UTC Noon** para almacenar fechas:
- Todas las fechas se guardan a las **12:00:00 UTC**
- Las horas se guardan como **strings** separados ("09:00", "16:30")
- En el backend, SIEMPRE usar métodos **UTC** (`getUTCDay()`, `getUTCDate()`, etc.)

---

## ¿Por qué UTC Noon?

```
Problema sin UTC Noon:
┌─────────────────────────────────────────────────────────────┐
│ Usuario en Bolivia (UTC-4) agenda cita para "6 de febrero" │
│                           ↓                                 │
│ Si guardamos: 2026-02-06T00:00:00Z (medianoche UTC)        │
│                           ↓                                 │
│ Al leer con getDay(): 2026-02-05 20:00 local = DÍA 5! ❌   │
└─────────────────────────────────────────────────────────────┘

Solución con UTC Noon:
┌─────────────────────────────────────────────────────────────┐
│ Usuario en Bolivia (UTC-4) agenda cita para "6 de febrero" │
│                           ↓                                 │
│ Guardamos: 2026-02-06T12:00:00Z (mediodía UTC)             │
│                           ↓                                 │
│ Al leer con getUTCDay(): 2026-02-06 = DÍA 6! ✅            │
└─────────────────────────────────────────────────────────────┘
```

---

## Flujo Completo: Agendar una Cita

### Paso 1: Usuario selecciona fecha en UI (Brasil, UTC-3)

```tsx
// components/calendar/appointment-dialog.tsx
// Usuario hace clic en "6 de febrero, 16:00"

const handleSubmit = () => {
  // Extraer fecha LOCAL del usuario
  const dateStr = formatLocalDateString(selectedDate); // "2026-02-06"

  fetch('/api/appointments', {
    method: 'POST',
    body: JSON.stringify({
      date: dateStr,      // "2026-02-06" (string, sin hora)
      startTime: "16:00", // Hora como string
      babyId: "...",
    })
  });
};
```

### Paso 2: API recibe y convierte a UTC Noon

```typescript
// app/api/appointments/route.ts

export async function POST(request: NextRequest) {
  const { date, startTime, babyId } = await request.json();

  // Convertir string a Date UTC Noon
  const [year, month, day] = date.split("-").map(Number);
  const dateObj = parseDateToUTCNoon(year, month, day);
  // dateObj = 2026-02-06T12:00:00.000Z

  const appointment = await prisma.appointment.create({
    data: {
      date: dateObj,        // 2026-02-06T12:00:00.000Z
      startTime: startTime, // "16:00"
      babyId: babyId,
    }
  });
}
```

### Paso 3: Base de datos almacena

```sql
-- PostgreSQL
INSERT INTO appointments (date, start_time, baby_id)
VALUES ('2026-02-06 12:00:00+00', '16:00', '...');

-- Almacenado como:
-- date: 2026-02-06 12:00:00+00 (timestamp with time zone)
-- start_time: "16:00" (varchar)
```

### Paso 4: Leer y mostrar en calendario

```typescript
// lib/services/appointment-service.ts

async getByDate(date: Date) {
  // Crear rango para el día completo
  const start = getStartOfDayUTC(date);  // 2026-02-06T00:00:00Z
  const end = getEndOfDayUTC(date);      // 2026-02-06T23:59:59Z

  return prisma.appointment.findMany({
    where: {
      date: { gte: start, lte: end }
    }
  });
}
```

```tsx
// components/calendar/day-view.tsx

function DayView({ appointments, date }) {
  return (
    <div>
      <h2>{formatDateForDisplay(date, "es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long"
      })}</h2>
      {/* "viernes, 6 de febrero" */}

      {appointments.map(apt => (
        <AppointmentCard
          key={apt.id}
          time={apt.startTime}  // "16:00" - ya es string
          baby={apt.baby.name}
        />
      ))}
    </div>
  );
}
```

---

## Flujo Completo: Reporte de Ocupación

### Backend: Calcular día de la semana

```typescript
// lib/services/report-service.ts

async getOccupancyReport(from: Date, to: Date) {
  const appointments = await prisma.appointment.findMany({
    where: { date: { gte: from, lte: to } }
  });

  // ✅ CORRECTO: Usar getUTCDay() para fechas de BD
  for (const apt of appointments) {
    const dayOfWeek = apt.date.getUTCDay();  // 0=Dom, 1=Lun, etc.
    // ...
  }

  // ❌ INCORRECTO: getDay() convertiría a hora local
  // const dayOfWeek = apt.date.getDay();  // ¡Puede dar día incorrecto!
}
```

### Frontend: Mostrar heatmap

```tsx
// components/reports/occupancy/occupancy-heatmap.tsx

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// Los datos vienen del backend con dayOfWeek correcto (0-6)
// El frontend solo renderiza
{data.heatmap.map(slot => (
  <td>{DAY_NAMES[slot.dayOfWeek]} {slot.time}</td>
))}
```

---

## ¿Qué pasa si alguien de Bolivia ve datos de Brasil?

### Escenario: Admin en Bolivia accede a br.babyspa.online

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Admin en Bolivia (UTC-4) abre br.babyspa.online         │
│                           ↓                                 │
│ 2. Nginx rutea a la base de datos de BRASIL                │
│                           ↓                                 │
│ 3. Lee cita: 2026-02-06T12:00:00.000Z, startTime="16:00"   │
│                           ↓                                 │
│ 4. formatDateForDisplay() extrae componentes UTC:          │
│    - getUTCFullYear() = 2026                               │
│    - getUTCMonth() = 1 (febrero)                           │
│    - getUTCDate() = 6                                      │
│                           ↓                                 │
│ 5. Muestra: "6 de febrero a las 16:00" ✅                  │
└─────────────────────────────────────────────────────────────┘
```

**La fecha se ve IGUAL desde cualquier ubicación** porque:
1. Los datos se guardan en UTC (universal)
2. Al mostrar, extraemos componentes UTC (no locales)
3. La hora "16:00" es string, no se convierte

### Importante: Cada país tiene su propia BD

```
Bolivia accede a bo.babyspa.online → BD Bolivia
Brasil accede a br.babyspa.online → BD Brasil

NO hay cruce de datos. Si un admin boliviano quiere ver
datos de Brasil, debe acceder a br.babyspa.online con
credenciales de Brasil.
```

---

## Reglas de Oro

### En el BACKEND (lib/services/, app/api/)

```typescript
// ✅ SIEMPRE usar métodos UTC para fechas de BD
const day = date.getUTCDate();
const month = date.getUTCMonth();
const year = date.getUTCFullYear();
const dayOfWeek = date.getUTCDay();
date.setUTCDate(date.getUTCDate() + 1);

// ❌ NUNCA usar métodos locales para fechas de BD
const day = date.getDate();      // ¡INCORRECTO!
const dayOfWeek = date.getDay(); // ¡INCORRECTO!
```

### En el FRONTEND (components/)

```typescript
// Para enviar fechas a la API:
const dateStr = formatLocalDateString(userSelectedDate);
// Envía: "2026-02-06"

// Para mostrar fechas de la BD:
const display = formatDateForDisplay(apt.date, locale, options);
// Muestra: "6 de febrero"

// Para UI local (calendario, picker):
// Usar métodos locales está OK porque son fechas del usuario
const month = currentMonth.getMonth();
const day = selectedDate.getDate();
```

### Crear fechas para queries

```typescript
// ✅ CORRECTO: Usar utilidades
import { parseDateToUTCNoon, getStartOfDayUTC, getEndOfDayUTC } from '@/lib/utils/date-utils';

const date = parseDateToUTCNoon(2026, 2, 6);  // 2026-02-06T12:00:00Z
const from = getStartOfDayUTC(date);           // 2026-02-06T00:00:00Z
const to = getEndOfDayUTC(date);               // 2026-02-06T23:59:59Z

// ❌ INCORRECTO: new Date() con componentes locales
const date = new Date(2026, 1, 6);  // Crea en hora LOCAL, no UTC
```

---

## Ejemplos por Módulo

### Calendario (calendar-view.tsx)
- **Navegación**: Usa fechas locales (OK - es UI del usuario)
- **Mostrar citas**: Usa `formatDateForDisplay()` para fechas de BD
- **Enviar al API**: Usa `formatLocalDateString()`

### Página del Terapeuta (therapist-today-list.tsx)
- **"Hoy"**: Comparar con `formatLocalDateString(new Date())`
- **Mostrar citas**: Las fechas vienen del servidor ya procesadas

### Reportes (report-service.ts)
- **Agrupar por día**: Usar `getUTCDay()`, `getUTCDate()`
- **Calcular rangos**: Usar `getStartOfDayUTC()`, `getEndOfDayUTC()`

### Pagos de Personal (staff-payment-service.ts)
- **Calcular días laborables**: Usar `getUTCDay()` para día de semana
- **Períodos quincenales**: Usar `getUTCDate()` para día del mes

---

## Checklist para Nuevas Funcionalidades

- [ ] ¿Estoy procesando fechas de la BD? → Usar métodos `getUTC*()`
- [ ] ¿Estoy creando fechas para queries? → Usar `parseDateToUTCNoon()`
- [ ] ¿Estoy mostrando fechas al usuario? → Usar `formatDateForDisplay()`
- [ ] ¿Estoy enviando fechas desde frontend? → Usar `formatLocalDateString()`
- [ ] ¿Estoy iterando días? → Usar `setUTCDate(getUTCDate() + 1)`
