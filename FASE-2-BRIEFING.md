# 🚀 FASE 2: CORE - BRIEFING PARA CLAUDE CODE

## 📋 Resumen Ejecutivo

La **Fase 1 está completada** ✅. Ahora implementaremos el **core del sistema**.

**Duración estimada:** 5-7 días

---

## ✅ Estado Actual (Fase 1 Completada)

```
✅ Next.js 14 + TypeScript + Tailwind
✅ Prisma + PostgreSQL (Schema completo con 25+ modelos)
✅ NextAuth.js (Login staff + portal padres)
✅ next-intl (ES/PT-BR configurado)
✅ Layouts base (Admin, Therapist, Portal)
✅ 15+ componentes shadcn/ui con glassmorphism
✅ FloatingBubbles para efecto visual
✅ Design System definido en CLAUDE.md
```

---

## 🎯 Objetivos de la Fase 2

### Módulos a Implementar (en orden)

| # | Módulo | Prioridad | Descripción |
|---|--------|-----------|-------------|
| 1 | **Bebés y Padres** | 🔴 Alta | CRUD completo, búsqueda, perfiles |
| 2 | **Link Registro Temporal** | 🔴 Alta | Formulario público para padres |
| 3 | **Paquetes y Ventas** | 🔴 Alta | Venta, control de sesiones |
| 4 | **Calendario y Agendamiento** | 🔴 Alta | Agenda visual, reservas |
| 5 | **Sesiones y Evaluaciones** | 🟡 Media | Flujo terapeuta, evaluaciones |
| 6 | **Portal Padres (básico)** | 🟡 Media | Ver historial, agendar |

---

# 📦 MÓDULO 1: BEBÉS Y PADRES

## 1.1 Estructura de Archivos

```
app/
├── [locale]/
│   └── (admin)/
│       └── clients/
│           ├── page.tsx              # Lista de bebés/clientes
│           ├── new/page.tsx          # Crear nuevo bebé + padre
│           └── [id]/
│               ├── page.tsx          # Detalle del bebé
│               └── edit/page.tsx     # Editar bebé
├── api/
│   ├── babies/
│   │   ├── route.ts                  # GET (list), POST (create)
│   │   └── [id]/
│   │       └── route.ts              # GET, PUT, DELETE (single)
│   ├── parents/
│   │   ├── route.ts                  # GET (list), POST (create)
│   │   ├── search/route.ts           # GET (buscar por CI/teléfono)
│   │   └── [id]/
│   │       └── route.ts              # GET, PUT, DELETE
│   └── babies/[id]/
│       └── parents/route.ts          # Vincular padres a bebé

components/
├── babies/
│   ├── baby-form.tsx                 # Formulario crear/editar
│   ├── baby-card.tsx                 # Card para listados
│   ├── baby-profile.tsx              # Vista detallada
│   └── baby-search.tsx               # Búsqueda
├── parents/
│   ├── parent-form.tsx               # Formulario padre
│   ├── parent-search.tsx             # Buscar padre existente
│   └── parent-selector.tsx           # Selector/vinculador

lib/
└── services/
    ├── baby-service.ts               # Lógica de negocio bebés
    └── parent-service.ts             # Lógica de negocio padres
```

## 1.2 Funcionalidades

### Página: Lista de Clientes (`/clients`)
- Tabla/grid de bebés con foto, nombre, edad, paquete activo
- Búsqueda por nombre de bebé, nombre de padre, CI, teléfono
- Filtros: edad, paquete activo, estado
- Ordenar por: nombre, edad, última visita
- Paginación
- Botón "Nuevo Bebé"

### Página: Crear Bebé (`/clients/new`)
- **Paso 1:** Buscar padre existente (por CI o teléfono)
  - Si existe → seleccionar
  - Si no existe → formulario para crear padre
- **Paso 2:** Datos del bebé
  - Nombre completo*
  - Fecha de nacimiento*
  - Género*
  - Foto (opcional)
  - Tipo de parto (natural/cesárea)
  - Semanas de gestación
  - Peso al nacer
  - Talla al nacer
  - Condiciones especiales (textarea)
- **Paso 3:** Vincular padre(s)
  - Padre/Madre principal (requerido)
  - Segundo padre/madre (opcional)
  - Indicar relación (MOTHER, FATHER, GUARDIAN)
  - Marcar cuál es contacto principal

### Página: Detalle del Bebé (`/clients/[id]`)
Tabs o secciones:
1. **Información General**
   - Datos básicos + foto
   - Edad actual (calculada)
   - Padres vinculados
   - Código de acceso portal
2. **Paquetes**
   - Paquete activo (si tiene)
   - Historial de paquetes
   - Botón "Vender Paquete"
3. **Citas**
   - Próximas citas
   - Historial de citas
   - Botón "Agendar Cita"
4. **Sesiones**
   - Historial de sesiones completadas
   - Evaluaciones
5. **Notas**
   - Notas internas (solo staff)
   - Agregar nueva nota

### API Routes

```typescript
// GET /api/babies
// Query params: search, page, limit, status, hasActivePackage
// Response: { babies: Baby[], total: number, page: number }

// POST /api/babies
// Body: { baby: BabyInput, parentId: string, relationship: string }
// Response: { baby: Baby }

// GET /api/babies/[id]
// Include: parents, packages, appointments, sessions
// Response: { baby: BabyWithRelations }

// PUT /api/babies/[id]
// Body: BabyUpdateInput
// Response: { baby: Baby }

// GET /api/parents/search?query=xxx
// Busca por CI, teléfono, o nombre
// Response: { parents: Parent[] }
```

## 1.3 Reglas de Negocio

```typescript
// Al crear bebé:
// 1. Generar código de acceso para el padre: BSB-XXXXX
// 2. Verificar que bebé tenga ≤36 meses
// 3. Vincular al menos un padre como contacto principal

// Código de acceso:
function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin confusiones I/1, O/0
  let code = 'BSB-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Calcular edad:
function calculateAge(birthDate: Date): { months: number; display: string } {
  const now = new Date();
  const months = differenceInMonths(now, birthDate);
  
  if (months < 12) {
    return { months, display: `${months} meses` };
  } else {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return { 
      months, 
      display: remainingMonths > 0 
        ? `${years} año${years > 1 ? 's' : ''} y ${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}`
        : `${years} año${years > 1 ? 's' : ''}`
    };
  }
}
```

## 1.4 Traducciones Requeridas

```json
// messages/es.json
{
  "clients": {
    "title": "Clientes",
    "subtitle": "Gestión de bebés y familias",
    "newBaby": "Nuevo Bebé",
    "search": "Buscar por nombre, CI o teléfono...",
    "filters": {
      "all": "Todos",
      "withPackage": "Con paquete activo",
      "withoutPackage": "Sin paquete"
    },
    "table": {
      "name": "Nombre",
      "age": "Edad",
      "parent": "Padre/Madre",
      "package": "Paquete",
      "lastVisit": "Última visita",
      "actions": "Acciones"
    },
    "empty": "No hay clientes registrados",
    "emptySearch": "No se encontraron resultados"
  },
  "baby": {
    "create": {
      "title": "Registrar Nuevo Bebé",
      "step1": "Datos del Padre/Madre",
      "step2": "Datos del Bebé",
      "step3": "Confirmar"
    },
    "form": {
      "name": "Nombre completo",
      "birthDate": "Fecha de nacimiento",
      "gender": "Género",
      "male": "Masculino",
      "female": "Femenino",
      "photo": "Foto",
      "uploadPhoto": "Subir foto",
      "birthType": "Tipo de parto",
      "natural": "Natural",
      "cesarean": "Cesárea",
      "gestationWeeks": "Semanas de gestación",
      "birthWeight": "Peso al nacer (kg)",
      "birthHeight": "Talla al nacer (cm)",
      "specialConditions": "Condiciones especiales",
      "specialConditionsPlaceholder": "Alergias, diagnósticos, observaciones..."
    },
    "profile": {
      "title": "Perfil del Bebé",
      "info": "Información",
      "packages": "Paquetes",
      "appointments": "Citas",
      "sessions": "Sesiones",
      "notes": "Notas"
    },
    "age": {
      "months": "{count} meses",
      "years": "{count} año | {count} años",
      "yearsAndMonths": "{years} año y {months} meses | {years} años y {months} meses"
    }
  },
  "parent": {
    "search": {
      "title": "Buscar Padre/Madre",
      "placeholder": "CI, teléfono o nombre...",
      "notFound": "No se encontró. ¿Desea crear uno nuevo?",
      "createNew": "Crear nuevo"
    },
    "form": {
      "name": "Nombre completo",
      "documentId": "Documento de identidad",
      "documentType": "Tipo de documento",
      "phone": "Teléfono",
      "email": "Email (opcional)",
      "birthDate": "Fecha de nacimiento (opcional)",
      "relationship": "Relación con el bebé",
      "mother": "Madre",
      "father": "Padre",
      "guardian": "Tutor/a",
      "isPrimaryContact": "Es contacto principal"
    },
    "accessCode": "Código de acceso al portal"
  }
}
```

---

# 📦 MÓDULO 2: LINK REGISTRO TEMPORAL

## 2.1 Concepto

Recepción genera un **link temporal** que envía por WhatsApp al padre.
El padre completa el formulario desde su celular (sin login).
Los datos se guardan y quedan listos para la primera cita.

## 2.2 Estructura

```
app/
├── registro/
│   └── [token]/
│       └── page.tsx            # Formulario público (sin auth)
├── api/
│   └── registration-links/
│       ├── route.ts            # POST: crear link
│       └── [token]/
│           └── route.ts        # GET: validar, POST: completar
```

## 2.3 Flujo

```
1. Recepción → Crea link con nombre del padre y teléfono
2. Sistema genera token único (válido 5 días)
3. Recepción envía link por WhatsApp: bo.babyspa.online/registro/ABC123
4. Padre abre link en su celular
5. Padre ve formulario con su nombre y telefono pre-llenado
6. padre puede llenar los datos del segundo padre si asi lo desea, tal cual hacemos en nuestro wizard del staff
7. Padre completa datos del bebé
8. Al guardar:
   - Se crea el Parent (si no existe) o padres
   - Se crea el Baby
   - Se vinculan
   - Se genera código de acceso (BSB-XXXXX)
   - Se marca el link como usado
   - Se puede iniciar sesion y ingresar al dashboard de padres de manera directa con ese codigo generado
9. Padre recibe confirmación con su código de acceso, al correo registrado
```

## 2.4 Formulario Público

- Diseño: Simple, móvil-first, colores Baby Spa, siguiendo los patrones de disenho!
- Sin header/sidebar (es público)
- Campos:
  - Nombre del padre (pre-llenado, editable)
  - CI/CPF
  - Teléfono (pre-llenado)
  - Email (opcional) para el padre que no es principal sigueindo la logica que seguimos en el wizard! este email se usara para contacto
  - --- Datos del Bebé ---
  - Nombre completo
  - Fecha de nacimiento
  - Género
  - Tipo de parto
  - Semanas de gestación (opcional)
  - Peso al nacer (opcional)
  y los demas datos que ya tenemos en el formulario que crea el staff informacion medica, observaciones, autorizaciones y demas...
- Botón: "Completar Registro"
- Al finalizar: mostrar código de acceso y mensaje de bienvenida, pedir que guarde el codigo de acceso para un proximo inicio de sesion, posterior a eso deberiamos tener un boton de comenzar el cual inciara sesion de manera directa y redirigira al portal de padres, obviamente creando la sesion que persistira en ese dispositivo hasta que el padre decida cerrar sesion
- Como dato extra debemos siempre tener el overlay que usamos de intro en todo el sistema con su logica ya definida! creo que es solo reutilizarlo

---

# 📦 MÓDULO 3: PAQUETES Y VENTAS

## 3.1 Estructura

```
app/
├── [locale]/
│   └── (admin)/
│       ├── packages/
│       │   ├── page.tsx              # Config de paquetes disponibles
│       │   └── [id]/page.tsx         # Editar paquete
│       └── clients/
│           └── [id]/
│               └── sell-package/page.tsx  # Vender paquete a bebé
├── api/
│   ├── package-types/                # Tipos de paquetes (config)
│   │   └── route.ts
│   └── package-purchases/            # Compras de paquetes
│       ├── route.ts                  # POST: vender
│       └── [id]/route.ts             # GET, PUT
```

## 3.2 Funcionalidades

### Configuración de Paquetes (`/packages`)
- Lista de tipos de paquetes disponibles
- Crear/editar paquete:
  - Nombre
  - Número de sesiones
  - Precio (Bs o R$)
  - Descripción
  - Activo/Inactivo

### Vender Paquete (modal o página)
- Seleccionar bebé (o ya estar en su perfil)
- Seleccionar tipo de paquete
- Registrar pago:
  - Método: Efectivo, Transferencia, Tarjeta
  - Monto (pre-llenado con precio del paquete)
  - Referencia (opcional)
- Al guardar:
  - Crear PackagePurchase
  - Registrar Payment
  - Actualizar sesiones disponibles

## 3.3 Reglas de Negocio

```typescript
// Paquetes NO vencen (válidos hasta que bebé cumpla 3 años)
// Sesiones NO son transferibles entre bebés

// Al vender paquete:
const purchase = await prisma.packagePurchase.create({
  data: {
    babyId,
    packageTypeId,
    totalSessions: packageType.sessions,
    usedSessions: 0,
    remainingSessions: packageType.sessions,
    purchaseDate: new Date(),
    isActive: true,
    payments: {
      create: {
        amount: packageType.price,
        method: paymentMethod,
        reference: paymentReference,
        date: new Date(),
      }
    }
  }
});
```

---

# 📦 MÓDULO 4: CALENDARIO Y AGENDAMIENTO

## 4.1 Estructura

```
app/
├── [locale]/
│   └── (admin)/
│       └── calendar/
│           └── page.tsx              # Vista de calendario
├── api/
│   └── appointments/
│       ├── route.ts                  # GET (by date range), POST
│       ├── [id]/route.ts             # GET, PUT, DELETE
│       └── availability/route.ts     # GET slots disponibles

components/
├── calendar/
│   ├── calendar-view.tsx             # Vista principal
│   ├── day-view.tsx                  # Vista de un día
│   ├── week-view.tsx                 # Vista semanal
│   ├── time-slot.tsx                 # Slot de hora
│   └── appointment-modal.tsx         # Modal crear/editar cita
```

## 4.2 Funcionalidades

### Vista de Calendario
- Navegación por semana/día
- Mostrar horarios de operación:
  - Lunes: 9:00 - 17:00 (continuo)
  - Mar-Sáb: 9:00-12:00 y 14:30-18:30
- Slots de 1 hora
- Máximo 2 citas por hora (2 terapeutas)
- Colores por estado:
  - 🟡 Agendada (amarillo)
  - 🔵 En progreso (azul)
  - 🟢 Completada (verde)
  - 🔴 Cancelada (rojo)
  - ⚫ No-show (gris)
- Click en slot vacío → Modal agendar
- Click en cita → Ver detalles / modificar

### Modal Agendar Cita
- Buscar bebé (autocomplete)
- Si bebé no tiene paquete activo → advertencia
- Mostrar sesiones disponibles del paquete
- Seleccionar terapeuta (opcional o automático)
- Notas para la cita
- Confirmar

## 4.3 Reglas de Negocio

```typescript
// Validar disponibilidad
async function checkAvailability(date: Date, time: string): Promise<boolean> {
  const count = await prisma.appointment.count({
    where: {
      date,
      startTime: time,
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
    }
  });
  return count < 2; // MAX_SLOTS_PER_HOUR
}

// Validar horario de operación
function isWithinBusinessHours(date: Date, time: string): boolean {
  const dayOfWeek = date.getDay(); // 0=Dom, 1=Lun, ...
  const hour = parseInt(time.split(':')[0]);
  const minute = parseInt(time.split(':')[1]);
  
  if (dayOfWeek === 0) return false; // Domingo cerrado
  
  if (dayOfWeek === 1) { // Lunes: 9-17 continuo
    return hour >= 9 && hour < 17;
  }
  
  // Mar-Sáb: 9-12 y 14:30-18:30
  const morningOk = hour >= 9 && hour < 12;
  const afternoonOk = (hour === 14 && minute >= 30) || (hour >= 15 && hour < 18) || (hour === 18 && minute <= 30);
  
  return morningOk || afternoonOk;
}

// Al agendar:
// 1. Verificar disponibilidad
// 2. Verificar horario válido
// 3. Verificar que bebé no tenga otra cita ese día
// 4. Descontar sesión del paquete
// 5. Crear appointment

// Al cancelar:
// 1. Devolver sesión al paquete
// 2. Cambiar status a CANCELLED
```

---

# 📦 MÓDULO 5: SESIONES Y EVALUACIONES

## 5.1 Estructura

```
app/
├── [locale]/
│   ├── (admin)/
│   │   └── sessions/
│   │       └── [id]/page.tsx         # Completar sesión (recepción)
│   └── (therapist)/
│       ├── today/page.tsx            # Sesiones del día
│       └── session/
│           └── [id]/
│               └── evaluate/page.tsx  # Formulario evaluación

components/
├── sessions/
│   ├── session-card.tsx              # Card de sesión
│   ├── evaluation-form.tsx           # Formulario evaluación
│   └── product-selector.tsx          # Seleccionar productos usados
```

## 5.2 Flujo

```
1. Bebé llega → Recepción marca "En progreso"
2. Terapeuta realiza sesión
3. Terapeuta completa evaluación:
   - Actividades realizadas (checkboxes)
   - Tono muscular (Bajo/Normal/Tenso)
   - Estado de ánimo (Tranquilo/Irritable)
   - Comentarios internos (solo staff)
   - Comentarios externos (visible para padres en portal)
   - Productos usados (de inventario)
4. Recepción completa sesión:
   - Verifica productos cobrables
   - Cobra extras si aplica
   - Marca como completada
5. Si no-show:
   - Marcar como NO_SHOW
   - Incrementar noShowCount del padre
   - Si noShowCount >= 3 → requiresPrepayment = true
```

## 5.3 Formulario de Evaluación

```typescript
interface EvaluationInput {
  // Actividades realizadas
  activities: {
    hydrotherapy: boolean;
    massage: boolean;
    motorStimulation: boolean;
    sensoryStimulation: boolean;
    relaxation: boolean;
    other?: string;
  };
  
  // Observaciones físicas
  muscleTone: 'LOW' | 'NORMAL' | 'TENSE';
  mood: 'CALM' | 'IRRITABLE';
  
  // Comentarios
  internalNotes?: string;  // Solo visible para staff
  externalNotes?: string;  // Visible en portal padres
  
  // Productos usados
  products: {
    productId: string;
    quantity: number;
  }[];
}
```

---

# 📦 MÓDULO 6: PORTAL PADRES (BÁSICO)

## 6.1 Estructura

```
app/
├── [locale]/
│   └── (portal)/
│       ├── login/page.tsx            # Login con código BSB-XXXXX
│       ├── dashboard/page.tsx        # Dashboard del padre
│       ├── baby/
│       │   └── [id]/page.tsx         # Perfil del bebé
│       └── appointments/
│           ├── page.tsx              # Lista de citas
│           └── new/page.tsx          # Agendar nueva cita
```

## 6.2 Funcionalidades

### Login Portal
- Campo único: Código de acceso (BSB-XXXXX)
- Sin contraseña (el código ES la autenticación)
- Mensaje de error si código inválido

### Dashboard
- Bienvenida con nombre del padre
- Cards de sus bebés:
  - Nombre, foto, edad
  - Paquete activo + sesiones restantes
  - Próxima cita
- Accesos rápidos:
  - Ver historial
  - Agendar cita

### Perfil del Bebé (portal)
- Información básica
- Paquete activo
- Historial de sesiones con:
  - Fecha
  - Actividades
  - Comentarios EXTERNOS (no internos)
- Próximas citas

### Agendar Cita (si tiene sesiones disponibles)
- Calendario para seleccionar fecha
- Mostrar horarios disponibles
- Si requiresPrepayment = true:
  - NO puede agendar desde portal
  - Mostrar mensaje: "Contacta a recepción para agendar"

## 6.3 Restricciones

```typescript
// En el portal, el padre:
// ✅ Puede ver solo sus propios bebés
// ✅ Puede ver historial de sesiones
// ✅ Puede ver evaluaciones EXTERNAS
// ❌ NO puede ver notas internas
// ❌ NO puede ver información de otros bebés
// ❌ NO puede agendar si requiresPrepayment = true
```

---

# 🎨 RECORDATORIO: DESIGN SYSTEM

**IMPORTANTE:** Todos los componentes deben seguir el Design System definido en `CLAUDE.md`:

```
✅ Glassmorphism: bg-white/70 backdrop-blur-md
✅ Bordes: rounded-2xl o rounded-3xl
✅ Sombras: shadow-lg shadow-teal-500/10
✅ Gradientes: from-teal-500 to-cyan-500
✅ Hover: hover:-translate-y-1 hover:shadow-xl
✅ Inputs: rounded-xl border-2 border-teal-100
✅ Botones: gradiente para primary, outline para secondary
✅ Badges: rounded-full con colores semánticos
✅ FloatingBubbles en backgrounds
```

---

# 📝 ORDEN DE IMPLEMENTACIÓN SUGERIDO

```
Semana 1:
├── Día 1-2: Módulo Bebés y Padres (CRUD completo)
├── Día 3: Link Registro Temporal
└── Día 4-5: Paquetes y Ventas

Semana 2:
├── Día 1-2: Calendario y Agendamiento
├── Día 3-4: Sesiones y Evaluaciones
└── Día 5: Portal Padres (básico)
```

---

# ✅ CHECKLIST POR MÓDULO

Antes de marcar un módulo como completado:

```
□ API routes implementadas y funcionando
□ Páginas creadas con el Design System
□ Formularios con validación Zod
□ Traducciones en es.json y pt-BR.json
□ Probado en /es/ y /pt-BR/
□ Mobile responsive
□ npx tsc --noEmit → 0 errores
□ npx eslint . --ext .ts,.tsx → 0 errores
□ npm run build → éxito
```

---

# 🚀 COMENZAR

Para iniciar la Fase 2, decirle a Claude Code:

> "Vamos a comenzar la Fase 2. Lee CLAUDE.md y BABY-SPA-SPEC.md. Empezamos con el Módulo 1: Bebés y Padres. Implementa el CRUD completo siguiendo el Design System y las convenciones del proyecto."

¡Buena suerte! 🎉
