# BABY SPA - GUÍA COMPLETA DE FUNCIONALIDADES

## Sistema de Gestión para Spa de Bebés

---

## CONTENIDO

1. [Introducción](#1-introducción)
2. [Acceso al Sistema](#2-acceso-al-sistema)
3. [Panel de Administración](#3-panel-de-administración)
4. [Portal de Padres](#4-portal-de-padres)
5. [Panel de Terapeutas](#5-panel-de-terapeutas)
6. [Flujos de Trabajo Principales](#6-flujos-de-trabajo-principales)

---

# 1. INTRODUCCIÓN

## ¿Qué es Baby Spa System?

Baby Spa System es una plataforma digital completa para gestionar todas las operaciones de un centro de hidroterapia y estimulación temprana para bebés. El sistema permite:

- **Gestionar clientes** (bebés y padres)
- **Agendar y controlar citas**
- **Vender paquetes de sesiones**
- **Registrar evaluaciones de desarrollo**
- **Controlar inventario de productos**
- **Administrar finanzas** (ingresos, gastos, pagos a personal)
- **Organizar eventos grupales**
- **Fidelizar clientes** con tarjetas de recompensas (Baby Cards)

## Idiomas Disponibles

El sistema está disponible en:
- **Español** (Bolivia)
- **Portugués** (Brasil)

## Dispositivos Compatibles

Funciona en:
- Computadoras de escritorio
- Tablets
- Celulares (diseño adaptable)

---

# 2. ACCESO AL SISTEMA

## Tipos de Usuarios

El sistema tiene **4 tipos de usuarios**, cada uno con acceso a diferentes funciones:

| Usuario | Descripción | Acceso |
|---------|-------------|--------|
| **Propietario (Owner)** | Dueño del negocio | Acceso total a todo |
| **Administrador (Admin)** | Gerente/Encargado | Casi todo, excepto configuración crítica |
| **Recepción (Reception)** | Personal de recepción | Clientes, citas, ventas, inventario |
| **Terapeuta (Therapist)** | Personal terapéutico | Solo sus citas y evaluaciones |

Adicionalmente:
| Usuario | Descripción | Acceso |
|---------|-------------|--------|
| **Padre/Madre (Parent)** | Clientes | Portal de padres (ver abajo) |

## Cómo Ingresar

### Personal del Spa
1. Ir a `bo.babyspa.online` (Bolivia) o `br.babyspa.online` (Brasil)
2. Ingresar usuario y contraseña
3. El sistema redirige automáticamente según el rol

### Padres/Madres
1. Ir a la misma dirección web
2. Seleccionar "Portal de Padres"
3. Ingresar código de acceso (formato: `BSB-XXXXX`)

---

# 3. PANEL DE ADMINISTRACIÓN

Esta es la interfaz principal donde el personal del spa gestiona todas las operaciones.

---

## 3.1 Dashboard (Pantalla Principal)

Al ingresar, se muestra un resumen con información clave del día:

### Estadísticas Visibles

| Indicador | Qué muestra |
|-----------|-------------|
| **Citas de Hoy** | Cantidad de citas programadas y en progreso |
| **Sesiones Pendientes** | Sesiones listas para cobrar |
| **Clientes Activos** | Número de padres registrados |
| **Bebés Registrados** | Número de bebés en el sistema |
| **Ingresos del Día** | Dinero recaudado hoy (solo con permiso) |
| **Ingresos del Mes** | Acumulado mensual |
| **Pagos Pendientes** | Deuda total de clientes |

---

## 3.2 Gestión de Clientes

### Listado de Bebés

En esta sección puede:
- **Buscar bebés** por nombre
- **Filtrar** por estado (con paquete, sin paquete)
- **Ver información rápida**: nombre, edad, padres, paquete activo, sesiones restantes
- **Crear nuevo bebé**
- **Generar link de registro** para que los padres se registren solos

### Ficha del Bebé (Perfil Detallado)

Cada bebé tiene un perfil completo con varias secciones:

#### Información Básica
- Nombre, fecha de nacimiento, género
- Datos de nacimiento (peso, semanas de gestación, tipo de parto)
- **Alertas médicas importantes**:
  - Alergias
  - Enfermedades diagnosticadas
  - Dificultades al nacer
  - Medicación actual
- Observaciones especiales
- Lista de padres/tutores asociados
- Código de acceso al portal

#### Paquetes
- Ver paquete activo y progreso
- Ver historial de paquetes comprados
- Agendar sesiones pendientes
- Vender nuevo paquete
- Registrar pagos de cuotas

#### Baby Cards (Tarjetas de Fidelización)
- Ver tarjeta activa
- Ver recompensas disponibles y usadas
- Comprar nueva tarjeta
- Usar recompensas

#### Citas
- Ver todas las citas programadas e historial
- Ver estado de cada cita
- Agendar nueva cita

#### Sesiones
- Historial completo de sesiones realizadas
- Ver evaluaciones de cada sesión
- Información del terapeuta que atendió

#### Notas
- Agregar notas internas sobre el cliente
- Ver historial de notas con autor y fecha

---

## 3.3 Gestión de Padres

Permite administrar contactos de padres/madres y leads (prospectos):

### Categorías
- **Con bebés registrados**: Clientes actuales
- **Leads**: Contactos interesados (ej: mamás embarazadas en talleres)

### Información Visible
- Nombre y datos de contacto
- Bebés asociados
- Estado del cliente
- Semanas de embarazo (para leads)

---

## 3.4 Calendario de Citas

### Vistas Disponibles
- **Vista semanal**: Ver lunes a viernes
- **Vista diaria**: Ver un solo día

### Funcionalidades
- Navegar entre fechas
- Ver citas por colores según estado:
  - Verde = Completada
  - Azul = Programada
  - Naranja = Pendiente de pago
  - Rojo = Cancelada
  - Gris = No asistió
- Hacer clic en cita para ver detalles
- Crear nueva cita
- Ver disponibilidad de terapeutas
- Ver eventos bloqueados

### Información por Cita
- Bebé o padre asociado
- Hora y terapeuta asignado
- Estado de pago
- Notas
- Acciones: completar, cambiar, cancelar

---

## 3.5 Eventos Grupales

Para organizar talleres, actividades grupales, ferias, etc.

### Tipos de Eventos
- **Para Bebés**: Hora de Juego, Babython, etc.
- **Para Padres**: Talleres prenatales, cursos de estimulación

### Estados de Eventos
1. **Borrador**: En preparación
2. **Publicado**: Listo para inscripciones
3. **En Progreso**: Ocurriendo ahora
4. **Completado**: Finalizado

### Funcionalidades
- Crear y editar eventos
- Definir fecha, hora, capacidad máxima
- Configurar cuántos terapeutas estarán ocupados
- Inscribir participantes
- Aplicar descuentos o cortesías
- Registrar pagos
- Marcar asistencia
- Registrar productos vendidos/usados

---

## 3.6 Paquetes de Servicios

Administrar el catálogo de paquetes disponibles para venta.

### Información por Paquete
- Nombre y descripción
- Número de sesiones incluidas
- Precio
- Duración de cada sesión
- Estado (activo/inactivo)
- Orden de visualización
- Configuración de cuotas (si permite financiamiento)

### Categorías
Los paquetes se organizan por categorías que usted puede crear y modificar.

### Tipos de Servicio
- **Para Bebés**: Hidroterapia, Cumple Mes, Vacunas, etc.
- **Para Padres**: Masaje Prenatal, Masaje Postparto

---

## 3.7 Inventario de Productos

Control de stock de productos usados en sesiones o para venta.

### Funcionalidades
- Crear y editar productos
- Registrar compras de stock
- Ajustar inventario manual
- Ver alertas de stock bajo

### Información por Producto
- Nombre y categoría
- Precio de costo y precio de venta
- Stock actual y stock mínimo
- Si se cobra automáticamente en sesiones

### Estados de Stock
- **En stock**: Cantidad suficiente (verde)
- **Stock bajo**: Cerca del mínimo (naranja)
- **Agotado**: Sin existencias (rojo)

---

## 3.8 Baby Cards (Sistema de Fidelización)

Tarjetas de recompensas para incentivar la fidelidad de los clientes.

### ¿Cómo Funcionan?
1. El cliente compra una Baby Card
2. Por cada sesión completada, avanza en la tarjeta
3. Al alcanzar ciertos números de sesiones, desbloquea premios
4. Los premios pueden ser: servicios gratis, productos gratis, descuentos

### Configuración de Tarjetas
- Nombre y descripción
- Precio de la tarjeta
- Total de sesiones para completar
- Descuento en primera sesión
- Recompensas por sesión alcanzada
- Precios especiales en ciertos paquetes

---

## 3.9 Gastos Administrativos

Registro y control de gastos operativos del negocio.

### Categorías de Gastos
- Alquiler
- Servicios (agua, luz, internet)
- Suministros
- Marketing
- Mantenimiento
- Impuestos
- Equipos
- Otros

### Funcionalidades
- Registrar nuevos gastos
- Filtrar por categoría y fechas
- Ver resumen por categoría
- Ver monto total del período

---

## 3.10 Pagos a Personal

Control de nómina y pagos a empleados (solo para Propietario).

### Tipos de Movimientos

**Ingresos para el empleado:**
- Salario base
- Bonificaciones
- Comisiones
- Beneficios (aguinaldo)

**Egresos/Descuentos:**
- Adelantos
- Deducciones

### Flujo de Nómina
1. Durante el período: Registrar bonos, comisiones, deducciones
2. Si necesita adelanto: Registrar adelanto (se descuenta después)
3. Fin del período: Pagar salario (consolida todos los movimientos)

### Control de Adelantos
- El sistema lleva control del saldo de adelantos por empleado
- Al pagar salario, se puede descontar parte del adelanto

---

## 3.11 Gestión de Usuarios

Administrar el personal del sistema (solo para Propietario).

### Información por Usuario
- Nombre de usuario
- Email y teléfono
- Rol asignado
- Salario base (si aplica)
- Frecuencia de pago
- Estado (activo/inactivo)

---

## 3.12 Actividad del Sistema (Auditoría)

Registro de todas las acciones realizadas en el sistema.

### Qué se Registra
- Creación, modificación y eliminación de registros
- Ventas realizadas
- Pagos registrados
- Cambios de estado
- Quién lo hizo y cuándo

### Utilidad
- Rastrear quién hizo qué
- Resolver discrepancias
- Auditoría de operaciones

---

## 3.13 Notificaciones

Alertas en tiempo real para el personal.

### Tipos de Notificaciones
- Nueva cita agendada desde el portal
- Cita cancelada o reagendada
- Citas próximas
- Pagos pendientes
- Stock bajo en inventario
- Cumpleaños de bebés

---

# 4. PORTAL DE PADRES

Esta es la interfaz que usan los clientes (padres/madres) para gestionar sus citas y ver información de sus bebés.

---

## 4.1 Acceso al Portal

### Cómo Ingresar
1. Los padres reciben un **código de acceso** al registrarse (formato: `BSB-XXXXX`)
2. Ingresan el código en la página de login del portal
3. Acceden a toda la información de sus bebés

---

## 4.2 Dashboard del Padre

La pantalla principal muestra:

### Bienvenida
- Saludo personalizado con el nombre del padre
- Guía de orientación (solo la primera vez)

### Alertas Importantes
- **Mesversario**: Si algún bebé cumple meses hoy, aparece celebración
- **Prepago Requerido**: Si tienen historial de no-shows, se les indica que deben prepagar

### Próxima Cita
- Nombre del bebé
- Fecha y hora
- Botones para reagendar o cancelar

### Mis Bebés
Para cada bebé se muestra:
- Nombre y edad
- Sesiones disponibles
- Paquetes activos con progreso
- Próxima cita
- Botón para agendar

### Baby Card
- Si tiene tarjeta activa: muestra progreso y recompensas
- Si no tiene: muestra promoción para adquirir una

### Resumen Rápido
- Número de bebés
- Paquetes activos
- Sesiones disponibles
- Estado de cuenta (si hay deuda)

### Accesos Rápidos
- Mis Citas
- Historial
- Mi Cuenta
- WhatsApp (contacto directo)

---

## 4.3 Agendar Citas

Los padres pueden agendar citas desde el portal.

### Pasos
1. Seleccionar bebé
2. Seleccionar paquete (de los que tienen sesiones disponibles)
3. Elegir fecha en el calendario
4. Elegir hora disponible
5. Confirmar

### Reglas
- Mínimo 24 horas de anticipación
- Máximo 2 citas por horario (para dejar espacio)
- Si requieren prepago, deben contactar al spa

---

## 4.4 Cancelar o Reagendar Citas

### Cancelar
1. Ver la cita en el dashboard o en "Mis Citas"
2. Hacer clic en "Cancelar"
3. Indicar motivo (opcional)
4. Confirmar

**Regla**: Solo se puede cancelar con al menos 24 horas de anticipación.

### Reagendar
1. Hacer clic en "Reagendar"
2. Seleccionar nueva fecha y hora
3. Confirmar

---

## 4.5 Historial de Sesiones

Los padres pueden ver todas las sesiones completadas de sus bebés.

### Información Disponible
- Fecha y hora de cada sesión
- Terapeuta que atendió
- Paquete utilizado
- **Evaluación del terapeuta**:
  - Actividades realizadas
  - Evaluación de desarrollo
  - Notas para los padres

### Exportar Reporte
Pueden descargar un PDF con todo el historial y evaluaciones.

---

## 4.6 Estado de Cuenta

Los padres pueden ver su situación financiera.

### Información Visible
- Monto total pendiente
- Detalle por paquete:
  - Precio total
  - Monto pagado
  - Monto pendiente
  - Progreso de pago
  - Historial de pagos realizados
- Paquetes completamente pagados

**Nota**: Los padres pueden ver la información pero NO pueden pagar online. Deben pagar presencialmente o contactar por WhatsApp.

---

## 4.7 Perfil Personal

Los padres pueden ver y editar su información.

### Datos Editables del Padre
- Nombre completo
- Teléfono
- Email

### Datos Editables de los Bebés
- Información de nacimiento (peso, semanas, tipo de parto)
- Información médica (alergias, enfermedades, dificultades)
- Autorización para redes sociales

### Información de Cuenta
- Código de acceso (para compartir o recordar)
- Fecha de registro

---

## 4.8 Baby Card en el Portal

Si el bebé tiene una Baby Card activa, el padre puede ver:

- Progreso de sesiones
- Recompensas desbloqueadas y disponibles
- Recompensas ya utilizadas
- Precios especiales disponibles

---

# 5. PANEL DE TERAPEUTAS

Interfaz simplificada para el personal terapéutico.

---

## 5.1 Sesiones del Día

Al ingresar, el terapeuta ve **únicamente sus citas asignadas** para el día actual.

### Navegación
- Puede ver días anteriores o siguientes
- Botón para volver a "Hoy"

### Estadísticas
- Total de sesiones del día
- Evaluaciones pendientes

---

## 5.2 Tarjetas de Cita

Cada cita muestra:

### Información
- Hora de inicio
- Nombre del bebé o padre
- Edad o semanas de embarazo
- Nombre del contacto principal
- Paquete asignado

### Estados
- **Amarillo/Naranja**: Esperando iniciar
- **Azul**: En progreso (puede evaluar)
- **Verde**: Completada

### Alertas Médicas
Si el bebé tiene alergias o condiciones especiales, aparece un indicador rojo.

---

## 5.3 Ver Información del Bebé

Antes de la sesión, el terapeuta puede revisar:

- Datos básicos del bebé
- Peso y semanas de nacimiento
- **Alertas médicas importantes**:
  - Alergias
  - Enfermedades diagnosticadas
  - Dificultades al nacer
- Observaciones especiales
- Contacto de los padres

---

## 5.4 Registrar Evaluación

Después de la sesión, el terapeuta registra la evaluación:

### Actividades Realizadas
- Hidroterapia
- Masaje
- Estimulación motora
- Estimulación sensorial
- Relajación
- Otras (texto libre)

### Evaluación Sensorial
- Seguimiento visual (sí/no)
- Contacto visual (sí/no)
- Respuesta auditiva (sí/no)

### Desarrollo Muscular
- Tono muscular (bajo/normal/tenso)
- Control cervical
- Levanta la cabeza

### Hitos del Desarrollo
- Se sienta solo
- Gatea
- Camina

### Estado del Bebé
- Humor (tranquilo/irritable)

### Notas
- **Notas internas**: Solo visibles para el personal
- **Notas para padres**: Visibles en el portal de padres

---

## 5.5 Ver Evaluaciones Anteriores

El terapeuta puede revisar evaluaciones de sesiones anteriores para dar seguimiento al progreso del bebé.

---

# 6. FLUJOS DE TRABAJO PRINCIPALES

---

## 6.1 Registrar un Nuevo Cliente

```
1. Ir a Clientes → Nuevo Bebé
2. Ingresar datos del bebé (nombre, fecha nacimiento, género)
3. Agregar información médica relevante
4. Agregar padre/madre principal
5. Guardar → Se genera código de acceso automáticamente
6. (Opcional) Vender paquete inicial
7. (Opcional) Agendar primera cita
```

---

## 6.2 Vender un Paquete

```
1. Ir al perfil del bebé (o padre para servicios de padres)
2. Clic en "Vender Paquete"
3. Seleccionar paquete del catálogo
4. Elegir forma de pago:
   - Pago único: Registrar pago completo
   - En cuotas: Registrar primera cuota
5. (Opcional) Establecer preferencias de horario
6. Guardar
```

---

## 6.3 Agendar una Cita

```
1. Ir a Calendario o perfil del cliente
2. Clic en "Nueva Cita"
3. Seleccionar bebé (o padre)
4. Elegir fecha y hora disponible
5. Seleccionar terapeuta (opcional)
6. Agregar notas si es necesario
7. Confirmar
```

---

## 6.4 Completar una Sesión

```
1. Cita cambia a "En Progreso" (automático o manual)
2. Terapeuta realiza la sesión
3. Terapeuta registra evaluación
4. Recepción abre "Completar Sesión"
5. Confirmar paquete usado
6. Agregar productos utilizados (si hay)
7. Registrar pago (si hay saldo pendiente)
8. Completar → Sesión cerrada
```

---

## 6.5 Vender una Baby Card

```
1. Ir al perfil del bebé → Baby Cards
2. Clic en "Comprar Baby Card"
3. Seleccionar tipo de tarjeta
4. Registrar pago
5. (Opcional) Agendar primera sesión gratis
6. Guardar
```

---

## 6.6 Organizar un Evento

```
1. Ir a Eventos → Nuevo Evento
2. Configurar:
   - Nombre y descripción
   - Fecha y hora
   - Tipo (bebés o padres)
   - Capacidad máxima
   - Precio
   - Terapeutas bloqueados
3. Guardar como borrador o publicar
4. Inscribir participantes
5. Día del evento:
   - Marcar asistencia
   - Registrar productos usados
   - Completar evento
```

---

## 6.7 Registrar un Gasto

```
1. Ir a Gastos → Nuevo Gasto
2. Seleccionar categoría
3. Ingresar descripción y monto
4. Seleccionar fecha
5. Agregar referencia (opcional)
6. Guardar
```

---

## 6.8 Pagar Nómina

```
1. Durante el mes: Registrar bonos, comisiones, adelantos según ocurran
2. Fin del período:
   - Ir a Pagos de Personal
   - Seleccionar empleado
   - Revisar movimientos pendientes
   - Crear pago de Salario
   - Confirmar monto (base + bonos - deducciones - adelantos)
   - Registrar pago
```

---

# RESUMEN DE PERMISOS POR ROL

| Función | Propietario | Admin | Recepción | Terapeuta | Padre |
|---------|:-----------:|:-----:|:---------:|:---------:|:-----:|
| Dashboard con finanzas | ✓ | ✓ | - | - | - |
| Gestión de clientes | ✓ | ✓ | ✓ | - | Solo propios |
| Calendario completo | ✓ | ✓ | ✓ | Solo propias | - |
| Vender paquetes | ✓ | ✓ | ✓ | - | - |
| Completar sesiones | ✓ | ✓ | ✓ | - | - |
| Registrar evaluaciones | ✓ | ✓ | ✓ | ✓ | - |
| Gestión de inventario | ✓ | ✓ | ✓ | - | - |
| Eventos | ✓ | ✓ | ✓ | - | - |
| Baby Cards | ✓ | ✓ | ✓ | - | Ver propia |
| Gastos | ✓ | ✓ | Solo propios | - | - |
| Pagos a personal | ✓ | - | - | - | - |
| Gestión de usuarios | ✓ | - | - | - | - |
| Auditoría/Actividad | ✓ | ✓ | - | - | - |
| Agendar desde portal | - | - | - | - | ✓ |
| Cancelar/Reagendar | - | - | - | - | ✓ |
| Ver historial bebé | - | - | - | - | ✓ |
| Ver estado de cuenta | - | - | - | - | ✓ |

---

# GLOSARIO

| Término | Significado |
|---------|-------------|
| **Baby Card** | Tarjeta de fidelización con recompensas por sesiones completadas |
| **Lead** | Contacto interesado que aún no es cliente (ej: mamá embarazada) |
| **No-show** | Cuando un cliente no asiste a su cita sin avisar |
| **Prepago** | Pago anticipado requerido para confirmar cita |
| **Paquete** | Conjunto de sesiones vendidas juntas |
| **Sesión** | Una visita individual al spa |
| **Slot** | Espacio de tiempo disponible para agendar |
| **Checkout** | Proceso de completar y cobrar una sesión |

---

**Última actualización:** Enero 2026
**Versión del Sistema:** 5.0

---

*Para soporte técnico o dudas sobre el sistema, contactar al equipo de desarrollo.*
