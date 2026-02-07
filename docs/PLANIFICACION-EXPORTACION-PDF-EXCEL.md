# PLANIFICACIÓN: EXPORTACIÓN PDF/EXCEL

**Estado:** PENDIENTE
**Prioridad:** Baja (después de Arqueo de Caja)
**Fecha de análisis:** Febrero 2026
**Tiempo estimado:** 2-3 días

---

## RESUMEN

Sistema de exportación de reportes a PDF y Excel para facilitar contabilidad, auditorías y análisis de datos.

---

## DECISIONES TOMADAS

| Pregunta | Decisión |
|----------|----------|
| ¿Qué reportes exportar? | Todos los que apliquen (ver matriz abajo) |
| ¿PDF o Excel primero? | Ambos, se implementarán juntos |
| ¿Historial Bebé PDF? | **NO se implementará** |
| ¿Server-side o Client-side? | **Por definir** (ver análisis abajo) |

---

## MATRIZ DE REPORTES A EXPORTAR

| Reporte | PDF | Excel | Prioridad |
|---------|:---:|:-----:|-----------|
| Dashboard | ❌ | ❌ | - |
| **Ingresos** | ✅ | ✅ | Alta |
| **Cuentas por Cobrar** | ✅ | ✅ | Alta |
| Asistencia/No-Shows | ⚪ | ✅ | Media |
| **Inventario** | ✅ | ✅ | Alta |
| Evaluaciones Pendientes | ❌ | ⚪ | Baja |
| **P&L** | ✅ | ✅ | **Crítica** |
| Terapeutas | ⚪ | ✅ | Media |
| Cartera Clientes | ⚪ | ✅ | Media |
| Paquetes | ⚪ | ✅ | Media |
| Adquisición | ⚪ | ✅ | Baja |
| Ocupación | ❌ | ❌ | - |
| Baby Cards | ⚪ | ✅ | Media |
| Eventos | ✅ | ✅ | Media |
| **Nómina** | ✅ | ✅ | **Crítica** |
| **Flujo de Caja** | ✅ | ✅ | **Crítica** |
| Historial Bebé (Portal) | ❌ | ❌ | **Descartado** |

✅ = Implementar | ⚪ = Opcional | ❌ = No implementar

---

## FORMATO PDF

### Diseño propuesto

```
┌─────────────────────────────────────────────────────────┐
│  🏊 BABY SPA                          Fecha: DD/MM/YYYY │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  [TÍTULO DEL REPORTE]                                   │
│  Período: [Fecha inicio] - [Fecha fin]                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │                                                 │   │
│  │            [CONTENIDO DEL REPORTE]              │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  Generado por Baby Spa System | Página X de Y           │
└─────────────────────────────────────────────────────────┘
```

### Características
- Logo de Baby Spa en header
- Fecha de generación
- Período del reporte
- Colores del brand (teal/cyan)
- Pie de página con paginación
- Texto: "Generado por Baby Spa System"

---

## FORMATO EXCEL

### Características
- Datos tabulares crudos (fácil de filtrar/ordenar)
- Sin diseño excesivo
- Encabezados claros
- Totales al final de cada sección
- Una hoja por sección si aplica

### Ejemplo estructura Ingresos
```
| Fecha      | Concepto     | Descripción          | Cliente      | Método   | Monto    |
|------------|--------------|----------------------|--------------|----------|----------|
| 2026-01-15 | Sesión       | Hidroterapia Indiv.  | Ana López    | Efectivo | 350.00   |
| 2026-01-15 | Paquete      | Programa Inicial     | María García | Tarjeta  | 1,360.00 |
| 2026-01-16 | Baby Card    | Baby Spa Card        | Juan Pérez   | QR       | 600.00   |
|            |              |                      |              | TOTAL    | 2,310.00 |
```

---

## DATOS POR REPORTE

### Ingresos
```typescript
{
  fecha: Date,
  concepto: string,        // "Sesión", "Paquete", "Baby Card", "Evento", "Producto"
  descripcion: string,     // "Hidroterapia Individual"
  cliente: string,         // Nombre del padre/bebé
  metodoPago: string,      // "Efectivo", "Tarjeta", "QR", "Transferencia"
  monto: number,
  referencia?: string      // Número de transacción si aplica
}
```

### P&L (Estado de Resultados)
```typescript
{
  periodo: { desde: Date, hasta: Date },
  ingresos: {
    servicios: number,
    paquetes: number,
    babyCards: number,
    productos: number,
    eventos: number,
    total: number
  },
  costos: {
    productosUsados: number,
    total: number
  },
  margenBruto: number,
  gastos: {
    nomina: number,
    alquiler: number,
    servicios: number,
    marketing: number,
    mantenimiento: number,
    otros: number,
    total: number
  },
  resultadoNeto: number,
  margenNeto: number  // porcentaje
}
```

### Nómina
```typescript
{
  periodo: { desde: Date, hasta: Date },
  empleados: Array<{
    nombre: string,
    cargo: string,
    salarioBase: number,
    comisiones: number,
    bonos: number,
    beneficios: number,
    deducciones: number,
    adelantoDescontado: number,
    netoAPagar: number,
    metodoPago: string,
    fechaPago: Date
  }>,
  totales: {
    salarioBase: number,
    comisiones: number,
    bonos: number,
    deducciones: number,
    adelantos: number,
    netoPagado: number
  }
}
```

### Cuentas por Cobrar
```typescript
{
  clientes: Array<{
    padre: string,
    bebe: string,
    telefono: string,
    paquete: string,
    totalPaquete: number,
    montoPagado: number,
    saldoPendiente: number,
    cuotaActual: string,     // "3 de 5"
    diasVencido: number,
    ultimoPago: Date | null,
    estado: "al_dia" | "vencido_30" | "vencido_60" | "vencido_60_mas"
  }>,
  resumen: {
    totalPendiente: number,
    clientesAlDia: number,
    clientesVencidos: number
  }
}
```

### Inventario
```typescript
{
  productos: Array<{
    codigo: string,
    nombre: string,
    categoria: string,
    stockActual: number,
    stockMinimo: number,
    estado: "ok" | "bajo" | "agotado",
    precioUnitario: number,
    valorTotal: number,
    ultimoMovimiento: Date
  }>,
  resumen: {
    totalProductos: number,
    valorInventario: number,
    productosStockBajo: number,
    productosAgotados: number
  }
}
```

### Flujo de Caja
```typescript
{
  periodo: { desde: Date, hasta: Date },
  saldoInicial: number,
  entradas: {
    pagosClientes: number,
    anticipos: number,
    cuotasCobradas: number,
    total: number
  },
  salidas: {
    proveedores: number,
    nomina: number,
    gastosOperativos: number,
    adelantosPersonal: number,
    total: number
  },
  saldoFinal: number,
  proyeccion?: {
    cuotasPorCobrar: number,
    citasProgramadas: number,
    gastosFijosEstimados: number,
    proyeccionNeta: number
  }
}
```

---

## LIBRERÍAS RECOMENDADAS

### Para Excel
| Librería | Pros | Contras |
|----------|------|---------|
| **xlsx (SheetJS)** | Muy popular, bien documentado, ligero | Estilos limitados en versión gratis |
| exceljs | Más features, estilos completos | Más pesado, más complejo |

**Recomendación:** `xlsx` - Simple y funciona bien para nuestro caso

### Para PDF
| Librería | Pros | Contras |
|----------|------|---------|
| **@react-pdf/renderer** | Sintaxis React, componentes, diseño fácil | Solo client-side |
| jsPDF + jspdf-autotable | Server-side, tablas fáciles | API más manual |
| pdfmake | Declarativo, server-side | Sintaxis propia |

**Recomendación:** `@react-pdf/renderer` para PDFs con diseño bonito

---

## SERVER-SIDE VS CLIENT-SIDE

### Client-side (Recomendado para empezar)
```
Pros:
✅ Más simple de implementar
✅ No consume recursos del servidor
✅ Funciona offline una vez cargados los datos
✅ Más rápido para reportes pequeños

Contras:
❌ Puede ser lento con muchos datos (10,000+ filas)
❌ Consume memoria del navegador
```

### Server-side
```
Pros:
✅ Mejor para reportes muy grandes
✅ No depende del navegador del usuario
✅ Puede generar reportes programados (cron)

Contras:
❌ Más complejo de implementar
❌ Consume recursos del servidor
❌ Necesita manejar archivos temporales
```

**Decisión:** Empezar con **client-side**. Si hay problemas de rendimiento con reportes grandes, migrar a server-side.

---

## ARQUITECTURA PROPUESTA

```
lib/
└── exports/
    ├── excel-utils.ts          # Funciones genéricas para Excel
    ├── pdf-utils.ts            # Funciones genéricas para PDF
    ├── types.ts                # Tipos de datos para exportación
    └── templates/
        ├── income-pdf.tsx      # Template PDF de ingresos
        ├── pnl-pdf.tsx         # Template PDF de P&L
        ├── payroll-pdf.tsx     # Template PDF de nómina
        ├── cashflow-pdf.tsx    # Template PDF de flujo de caja
        ├── inventory-pdf.tsx   # Template PDF de inventario
        └── receivables-pdf.tsx # Template PDF de cuentas por cobrar

components/reports/shared/
├── export-button.tsx           # Botón con dropdown PDF/Excel
└── export-dialog.tsx           # Dialog para opciones de exportación (si aplica)
```

---

## FLUJO DE USUARIO

```
1. Usuario está en un reporte (ej: /admin/reports/income)
2. Click en botón "Exportar" (arriba a la derecha)
3. Dropdown muestra opciones:
   ┌─────────────────┐
   │ 📄 Exportar PDF │
   │ 📊 Exportar Excel│
   └─────────────────┘
4. Al seleccionar:
   - Muestra loading/spinner
   - Genera archivo con los datos actuales (respetando filtros)
   - Descarga automática del archivo
5. Nombre del archivo: `baby-spa-[reporte]-[fecha].pdf` o `.xlsx`
   Ejemplo: `baby-spa-ingresos-2026-02-02.pdf`
```

---

## COMPLEJIDAD Y TIEMPO ESTIMADO

| Componente | Complejidad | Tiempo |
|------------|-------------|--------|
| Setup librerías (xlsx, react-pdf) | Baja | 1-2h |
| ExportButton componente | Baja | 1-2h |
| Excel genérico (util) | Baja | 2-3h |
| PDF genérico (util + base template) | Media | 3-4h |
| Template PDF P&L | Media | 2-3h |
| Template PDF Nómina | Media | 2-3h |
| Template PDF Ingresos | Baja | 1-2h |
| Template PDF Flujo de Caja | Media | 2-3h |
| Template PDF Inventario | Baja | 1-2h |
| Template PDF Cuentas por Cobrar | Baja | 1-2h |
| Integración en cada reporte | Baja | 3-4h |
| Testing y ajustes | Media | 3-4h |
| **TOTAL** | | **~24-32h (3-4 días)** |

---

## ORDEN DE IMPLEMENTACIÓN SUGERIDO

### Fase 1: Setup y Excel (Día 1)
1. Instalar dependencias (`xlsx`)
2. Crear `excel-utils.ts` con función genérica
3. Crear `ExportButton` componente
4. Agregar exportación Excel a Ingresos (prueba piloto)

### Fase 2: PDF Base (Día 2)
1. Instalar `@react-pdf/renderer`
2. Crear template base con header/footer
3. Crear `pdf-utils.ts`
4. Template PDF para Ingresos

### Fase 3: PDFs Críticos (Día 3)
1. Template PDF P&L
2. Template PDF Nómina
3. Template PDF Flujo de Caja

### Fase 4: Resto y Testing (Día 4)
1. Templates restantes (Inventario, Cuentas por Cobrar)
2. Excel para todos los reportes
3. Testing completo
4. Ajustes de diseño

---

## TRADUCCIONES NECESARIAS

```json
// es.json
{
  "reports": {
    "export": {
      "button": "Exportar",
      "pdf": "Exportar PDF",
      "excel": "Exportar Excel",
      "generating": "Generando...",
      "success": "Archivo descargado",
      "error": "Error al generar archivo"
    }
  }
}

// pt-BR.json
{
  "reports": {
    "export": {
      "button": "Exportar",
      "pdf": "Exportar PDF",
      "excel": "Exportar Excel",
      "generating": "Gerando...",
      "success": "Arquivo baixado",
      "error": "Erro ao gerar arquivo"
    }
  }
}
```

---

## NOTAS ADICIONALES

1. **Filtros:** Los exports deben respetar los filtros actuales del reporte (fechas, etc.)

2. **Idioma:** Los PDFs deben generarse en el idioma actual del usuario

3. **Moneda:** Usar el símbolo correcto según el país (Bs para Bolivia, R$ para Brasil)

4. **Logo:** Necesitaremos el logo de Baby Spa en formato adecuado para PDF

5. **Límites:** Considerar límite de filas para Excel (evitar archivos enormes)

---

## DEPENDENCIAS A INSTALAR

```bash
npm install xlsx @react-pdf/renderer
```

---

**Última actualización:** Febrero 2026
**Próximo paso:** Implementar después de Fase 10 (Arqueo de Caja)
