# 🧑‍🍼 MÓDULO 4.5: SERVICIOS PARA PADRES - BRIEFING

## 📋 Resumen Ejecutivo

Extender el sistema para permitir citas y paquetes para padres/madres, no solo bebés.
Ejemplos de servicios: Masaje Prenatal, Masaje Postparto.

**Cambio Principal:**
- Actualmente: Una cita SIEMPRE necesita un bebé (`babyId` obligatorio)
- Nuevo: Una cita puede ser para un bebé O para un padre (uno u otro, nunca ambos)

---

## 🎯 Reglas Críticas

```
1. Una cita es para UN bebé O para UN padre (nunca ambos, nunca ninguno)
2. Los paquetes definen si son para BABY o PARENT (campo serviceType)
3. El calendario muestra todo junto (citas de bebés y padres)
4. LEADS = padres sin bebés registrados (potenciales clientes)
5. Los LEADS NO tienen acceso al portal hasta que registren un bebé
6. Solo se guarda "semanas de embarazo", NO fecha estimada de parto
```

---

## 📊 Casos de Uso

| Escenario | Cliente | Bebé Requerido |
|-----------|---------|----------------|
| Hidroterapia | Bebé | ✅ Sí |
| Vacunas | Bebé | ✅ Sí |
| Fisioterapia | Bebé | ✅ Sí |
| **Masaje Prenatal** | Madre (puede ser LEAD) | ❌ No |
| **Masaje Postparto** | Madre | ❌ No |

---

## 🗄️ Modelo de Datos

### 1. Agregar enum ServiceType

```prisma
enum ServiceType {
  BABY      // Servicio para bebés (hidroterapia, vacunas, etc.)
  PARENT    // Servicio para padres (masaje prenatal, postparto, etc.)
}
```

### 2. Agregar campo serviceType a Package

```prisma
model Package {
  // ... campos existentes ...
  
  serviceType         ServiceType   @default(BABY)
}
```

### 3. Modificar Appointment

```prisma
model Appointment {
  // Cambiar babyId de obligatorio a opcional
  babyId              String?       // Para servicios de bebés
  parentId            String?       // Para servicios de padres (NUEVO)
  
  // ... resto de campos igual ...
  
  // Agregar relación
  parent              Parent?       @relation(fields: [parentId], references: [id])
}
```

### 4. Modificar PackagePurchase

```prisma
model PackagePurchase {
  // Cambiar babyId de obligatorio a opcional
  babyId              String?       // Para paquetes de bebés
  parentId            String?       // Para paquetes de padres (NUEVO)
  
  // ... resto de campos igual ...
  
  // Agregar relación
  parent              Parent?       @relation(fields: [parentId], references: [id])
}
```

### 5. Agregar relaciones en Parent

```prisma
model Parent {
  // ... campos existentes (incluyendo los de LEAD) ...
  
  // Agregar relaciones
  appointments        Appointment[]
  packagePurchases    PackagePurchase[]
}
```

### 6. Migración

```bash
npx prisma migrate dev --name add_parent_services
```

---

## 🖥️ Pantalla de Padres (NUEVA)

### Ruta: `/admin/parents`

### Lista de Padres

```
┌─────────────────────────────────────────────────────────────┐
│ 👥 Padres                                    [+ Nuevo Padre]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [🔍 Buscar por nombre o teléfono...]                       │
│                                                             │
│ [Todos (45)] [Con bebés (38)] [LEADS (7)]                  │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 👩 María García              │ 70012345 │ 2 bebés │ ✅  ││
│ │ 👩 Patricia López            │ 70098765 │ 1 bebé  │ ✅  ││
│ │ 🤰 Carmen Ruiz (LEAD)        │ 70054321 │ 0 bebés │ 🟡  ││
│ │ 👩 Sandra Martínez           │ 70011111 │ 1 bebé  │ ✅  ││
│ │ 🤰 Laura Fernández (LEAD)    │ 70022222 │ 0 bebés │ 🟡  ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Funcionalidades:**
- Lista de todos los padres con búsqueda
- Filtros: "Todos" | "Con bebés" | "LEADS (sin bebés)"
- Cada fila muestra: nombre, teléfono, cantidad de bebés, estado
- Botón "Nuevo Padre"
- Click en fila → ir a detalle

### Detalle de Padre (Cliente Activo)

```
┌─────────────────────────────────────────────────────────────┐
│ 👩 María García                              [Editar]       │
│ 🟢 Cliente Activo                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📱 70012345  |  📧 maria@email.com                         │
│                                                             │
│ ── SUS BEBÉS ───────────────────────────────────────────── │
│ • Lucas García (8 meses) - Ver perfil →                    │
│ • Sofía García (2 años) - Ver perfil →                     │
│                                                             │
│ ── SUS SERVICIOS ───────────────────────────── [+ Vender] ─│
│ • Paquete Masaje Postparto (2/4 sesiones) - Activo         │
│                                                             │
│ ── HISTORIAL DE CITAS ──────────────────────────────────── │
│ • 15/02/2026 - Masaje Postparto - Completada               │
│ • 08/02/2026 - Masaje Postparto - Completada               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Detalle de Padre LEAD

```
┌─────────────────────────────────────────────────────────────┐
│ 🤰 Carmen Ruiz                               [Editar]       │
│ 🟡 LEAD - Potencial Cliente                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📱 70054321  |  📧 carmen@email.com                        │
│                                                             │
│ ── INFORMACIÓN DE LEAD ─────────────────────────────────── │
│ Semanas de embarazo: 32 (al momento de registro)           │
│ Fuente: Taller Prenatal                                     │
│ Notas: Interesada en paquete de hidroterapia               │
│                                                             │
│ [🎉 ¡Ya nació! Registrar Bebé →]                           │
│                                                             │
│ ── SUS SERVICIOS ───────────────────────────── [+ Vender] ─│
│ • Masaje Prenatal (1/1 sesiones) - Completado              │
│                                                             │
│ ── HISTORIAL DE CITAS ──────────────────────────────────── │
│ • 20/01/2026 - Masaje Prenatal - Completada                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Modal Crear/Editar Padre

```
┌─────────────────────────────────────────────────────────────┐
│ 👤 Agregar Padre/Lead                                [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [  Buscar padre...  ] [  Registrar Nuevo Lead  ]           │
│                                                             │
│ Nombre completo *                                           │
│ [_________________________________________________]        │
│                                                             │
│ Teléfono *                    Correo electrónico            │
│ [📱___________________]      [📧___________________]        │
│                                                             │
│ Semanas de embarazo          ¿Cómo nos conoció?             │
│ [_____________________]      [Ej: Instagram, Referido...]   │
│                                                             │
│ Notas                                                       │
│ [Información adicional sobre el lead________________]       │
│ [___________________________________________________]       │
│                                                             │
│                              [Cancelar] [Guardar]           │
└─────────────────────────────────────────────────────────────┘
```

**Nota:** Los campos "Semanas de embarazo" y "¿Cómo nos conoció?" solo aparecen cuando se está creando un LEAD (padre sin bebé).

---

## 📦 Actualizar Package Form

Agregar campo selector de tipo de servicio:

```
┌─────────────────────────────────────────────────────────────┐
│ Tipo de servicio                                            │
│                                                             │
│ ○ 👶 Para bebés                                             │
│   Hidroterapia, vacunas, fisioterapia, etc.                │
│                                                             │
│ ○ 👩 Para padres/madres                                     │
│   Masaje prenatal, postparto, etc.                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📅 Flujo de Agendamiento

### Lógica del Formulario de Cita

```
1. Staff selecciona paquete/servicio
2. Sistema verifica serviceType del paquete
3. Si serviceType = BABY:
   → Mostrar selector de bebé (flujo actual)
   → Ocultar selector de padre
4. Si serviceType = PARENT:
   → Ocultar selector de bebé
   → Mostrar selector de padre
   → Permitir crear padre nuevo si no existe
```

### Componente ParentSelector

Crear componente similar a BabySelector:
- Búsqueda por nombre o teléfono
- Muestra: nombre, teléfono, badge si es LEAD
- Botón "Crear nuevo padre" que abre modal

### Validación al Guardar Cita

```typescript
if (package.serviceType === 'BABY') {
  if (!babyId) throw Error("Se requiere seleccionar un bebé");
  parentId = null;
} else if (package.serviceType === 'PARENT') {
  if (!parentId) throw Error("Se requiere seleccionar un padre/madre");
  babyId = null;
}
```

---

## 📅 Calendario y Vistas

### Day View - Mostrar Citas de Padres

El calendario muestra todas las citas juntas:

```
┌─────────────────────────────────────────────────────────────┐
│ 📅 Lunes 10 de Febrero                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 09:00  👶 Lucas García - Hidroterapia (60 min)             │
│        Terapeuta: Ana                                       │
│                                                             │
│ 09:30  👶 Mía Rodríguez - Hidroterapia (60 min)            │
│        Terapeuta: María                                     │
│                                                             │
│ 10:00  🤰 Carmen López - Masaje Prenatal (60 min)          │
│        Terapeuta: Ana                                       │
│                                                             │
│ 11:00  👩 Patricia Ruiz - Masaje Postparto (60 min)        │
│        Terapeuta: María                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Iconos:**
- 👶 = Cita de bebé
- 🤰 = Cita de padre LEAD (sin bebés)
- 👩 = Cita de padre con bebés

### Lógica de Iconos

```typescript
const getClientIcon = (appointment) => {
  if (appointment.baby) return '👶';
  if (appointment.parent?.status === 'LEAD') return '🤰';
  return '👩';
};

const getClientName = (appointment) => {
  return appointment.baby?.name || appointment.parent?.name;
};
```

---

## 🔌 APIs

### CRUD de Padres

**GET /api/parents**
- Query params: `status` (ACTIVE, LEAD, all), `search`
- Retorna lista de padres

**POST /api/parents**
- Crear nuevo padre
- Body: `{ name, phone, email?, status?, pregnancyWeeks?, leadSource?, leadNotes? }`

**GET /api/parents/[id]**
- Detalle del padre con bebés, paquetes y citas

**PUT /api/parents/[id]**
- Actualizar padre

**DELETE /api/parents/[id]**
- Solo si no tiene bebés ni citas

### Actualizar APIs Existentes

**POST /api/appointments**
- Agregar campo opcional `parentId`
- Validar que tenga `babyId` XOR `parentId` según `serviceType`

**POST /api/package-purchases**
- Agregar campo opcional `parentId`

---

## 🧩 Servicios

### parent-service.ts

```typescript
// Funciones requeridas:
- getAll(filters: { status?, search? })
- getById(id)
- create(data)
- update(id, data)
- delete(id)
- getWithBabies(id)
- getAppointments(parentId)
- getPackagePurchases(parentId)
- convertLeadToActive(id, babyData) // Cuando registra bebé
```

### Actualizar appointment-service.ts

- Actualizar `create()` para aceptar `parentId`
- Actualizar validaciones
- Actualizar queries para incluir `parent` en los includes

### Actualizar package-purchase-service.ts

- Actualizar para soportar `parentId`

---

## 🧭 Navegación

Agregar en sidebar del admin:
- **Icono:** `Users` de lucide-react
- **Texto:** "Padres"
- **Ruta:** `/admin/parents`
- **Posición:** después de "Clientes"

---

## 🌐 Traducciones

### messages/es.json

```json
{
  "parents": {
    "title": "Padres",
    "newParent": "Nuevo Padre/Madre",
    "editParent": "Editar",
    "search": "Buscar por nombre o teléfono...",
    "filters": {
      "all": "Todos",
      "withBabies": "Con bebés",
      "leads": "LEADS (sin bebés)"
    },
    "status": {
      "active": "Cliente Activo",
      "lead": "LEAD - Potencial Cliente",
      "inactive": "Inactivo"
    },
    "fields": {
      "name": "Nombre completo",
      "phone": "Teléfono",
      "email": "Correo electrónico",
      "isLead": "Es potencial cliente (LEAD)",
      "pregnancyWeeks": "Semanas de embarazo",
      "leadSource": "¿Cómo nos conoció?",
      "leadNotes": "Notas"
    },
    "leadSources": {
      "event": "Evento/Taller",
      "instagram": "Instagram",
      "facebook": "Facebook",
      "referral": "Referido",
      "walkin": "Visita directa",
      "other": "Otro"
    },
    "sections": {
      "info": "Información",
      "leadInfo": "Información de LEAD",
      "babies": "Sus Bebés",
      "services": "Sus Servicios",
      "history": "Historial de Citas"
    },
    "actions": {
      "registerBaby": "¡Ya nació! Registrar Bebé",
      "sellService": "Vender Servicio",
      "viewProfile": "Ver perfil"
    },
    "babies": {
      "count": "{count} bebé(s)",
      "none": "Sin bebés registrados"
    },
    "messages": {
      "created": "Padre/Madre registrado exitosamente",
      "updated": "Información actualizada",
      "deleted": "Registro eliminado"
    },
    "tabs": {
      "searchParent": "Buscar padre...",
      "registerNew": "Registrar Nuevo Lead"
    }
  },
  "packages": {
    "serviceType": "Tipo de servicio",
    "serviceTypeBaby": "Para bebés",
    "serviceTypeParent": "Para padres/madres",
    "serviceTypeBabyDesc": "Hidroterapia, vacunas, fisioterapia, etc.",
    "serviceTypeParentDesc": "Masaje prenatal, postparto, etc."
  },
  "appointments": {
    "selectParent": "Seleccionar padre/madre",
    "forBaby": "Para bebé",
    "forParent": "Para padre/madre"
  }
}
```

### messages/pt-BR.json

```json
{
  "parents": {
    "title": "Pais",
    "newParent": "Novo Pai/Mãe",
    "editParent": "Editar",
    "search": "Buscar por nome ou telefone...",
    "filters": {
      "all": "Todos",
      "withBabies": "Com bebês",
      "leads": "LEADS (sem bebês)"
    },
    "status": {
      "active": "Cliente Ativo",
      "lead": "LEAD - Cliente Potencial",
      "inactive": "Inativo"
    },
    "fields": {
      "name": "Nome completo",
      "phone": "Telefone",
      "email": "Email",
      "isLead": "É cliente potencial (LEAD)",
      "pregnancyWeeks": "Semanas de gravidez",
      "leadSource": "Como nos conheceu?",
      "leadNotes": "Notas"
    },
    "leadSources": {
      "event": "Evento/Oficina",
      "instagram": "Instagram",
      "facebook": "Facebook",
      "referral": "Indicação",
      "walkin": "Visita direta",
      "other": "Outro"
    },
    "sections": {
      "info": "Informação",
      "leadInfo": "Informação de LEAD",
      "babies": "Seus Bebês",
      "services": "Seus Serviços",
      "history": "Histórico de Consultas"
    },
    "actions": {
      "registerBaby": "Nasceu! Registrar Bebê",
      "sellService": "Vender Serviço",
      "viewProfile": "Ver perfil"
    },
    "babies": {
      "count": "{count} bebê(s)",
      "none": "Sem bebês registrados"
    },
    "messages": {
      "created": "Pai/Mãe registrado com sucesso",
      "updated": "Informação atualizada",
      "deleted": "Registro excluído"
    },
    "tabs": {
      "searchParent": "Buscar pai...",
      "registerNew": "Registrar Novo Lead"
    }
  },
  "packages": {
    "serviceType": "Tipo de serviço",
    "serviceTypeBaby": "Para bebês",
    "serviceTypeParent": "Para pais/mães",
    "serviceTypeBabyDesc": "Hidroterapia, vacinas, fisioterapia, etc.",
    "serviceTypeParentDesc": "Massagem pré-natal, pós-parto, etc."
  },
  "appointments": {
    "selectParent": "Selecionar pai/mãe",
    "forBaby": "Para bebê",
    "forParent": "Para pai/mãe"
  }
}
```

---

## ✅ Checklist de Implementación

### Base de Datos
```
□ Agregar enum ServiceType
□ Agregar serviceType a Package
□ Hacer babyId opcional en Appointment
□ Agregar parentId a Appointment
□ Hacer babyId opcional en PackagePurchase
□ Agregar parentId a PackagePurchase
□ Agregar relaciones en Parent
□ Ejecutar migración
```

### Pantalla de Padres
```
□ Página lista /admin/parents
□ Búsqueda por nombre y teléfono
□ Filtros: Todos | Con bebés | LEADS
□ Página detalle /admin/parents/[id]
□ Vista diferenciada para LEAD vs Activo
□ Modal/página crear padre
□ Modal/página editar padre
□ Botón "Registrar Bebé" para LEADS
```

### Package Form
```
□ Agregar campo serviceType
□ Radio: Para bebés / Para padres
□ Descripciones de cada tipo
```

### Flujo de Agendamiento
```
□ Detectar serviceType del paquete seleccionado
□ Mostrar selector de bebé si BABY
□ Mostrar selector de padre si PARENT
□ Crear componente ParentSelector
□ Validación: babyId XOR parentId
```

### Calendario
```
□ Mostrar icono correcto (👶, 🤰, 👩)
□ Mostrar nombre del cliente correcto
□ Click abre detalle correcto
```

### APIs
```
□ GET /api/parents
□ POST /api/parents
□ GET /api/parents/[id]
□ PUT /api/parents/[id]
□ DELETE /api/parents/[id]
□ Actualizar POST /api/appointments
□ Actualizar POST /api/package-purchases
```

### Servicios
```
□ parent-service.ts completo
□ Actualizar appointment-service.ts
□ Actualizar package-purchase-service.ts
```

### Navegación
```
□ Link "Padres" en sidebar
□ Icono Users
```

### Traducciones
```
□ es.json completo
□ pt-BR.json completo
```

---

## 🧪 Pruebas a Realizar

```
PAQUETES:
□ Crear paquete tipo BABY (ej: Hidroterapia)
□ Crear paquete tipo PARENT (ej: Masaje Prenatal)
□ Editar paquete y cambiar tipo

PANTALLA DE PADRES:
□ Lista muestra todos los padres
□ Filtro "Con bebés" funciona
□ Filtro "LEADS" funciona
□ Búsqueda por nombre funciona
□ Búsqueda por teléfono funciona
□ Crear padre con bebés (status ACTIVE)
□ Crear padre LEAD (sin bebés)
□ Ver detalle padre activo
□ Ver detalle padre LEAD
□ Editar padre
□ "Registrar Bebé" convierte LEAD a activo

AGENDAMIENTO:
□ Seleccionar paquete BABY → muestra selector de bebé
□ Seleccionar paquete PARENT → muestra selector de padre
□ Crear cita para bebé funciona
□ Crear cita para padre funciona
□ Error si paquete BABY sin bebé
□ Error si paquete PARENT sin padre
□ Crear padre desde selector si no existe

CALENDARIO:
□ Citas de bebés muestran 👶
□ Citas de padres activos muestran 👩
□ Citas de LEADS muestran 🤰
□ Nombre correcto en cada cita
□ Click abre detalle correcto

TRADUCCIONES:
□ ES completo
□ PT-BR completo

BUILD:
□ npx tsc --noEmit sin errores
□ npm run build exitoso
```

---

## 📝 Notas Importantes

1. **Los LEADS no tienen acceso al portal** - Solo cuando registren un bebé se convierten en clientes con acceso.

2. **Solo semanas de embarazo** - No calculamos ni mostramos fecha estimada de parto.

3. **Un padre puede tener ambos** - Servicios para sí mismo (masajes) Y para sus bebés (hidroterapia).

4. **Paquetes múltiples funcionan** - Si en el futuro crean "Paquete 4 Masajes", la estructura actual lo soporta sin cambios.

5. **Calendario unificado** - Todas las citas se muestran juntas, diferenciadas por icono.
