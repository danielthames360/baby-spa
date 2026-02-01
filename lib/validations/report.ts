import { z } from "zod";

// Schema para filtro de rango de fechas
export const dateRangeSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

// Schema para el dashboard
export const dashboardFiltersSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

// Schema para reporte de ingresos
export const incomeReportSchema = dateRangeSchema.extend({
  groupBy: z.enum(["day", "week", "month"]).optional().default("day"),
});

// Schema para reporte de cuentas por cobrar
export const receivablesReportSchema = z.object({
  status: z.enum(["all", "overdue", "pending"]).optional().default("all"),
});

// Schema para reporte de asistencia
export const attendanceReportSchema = dateRangeSchema.extend({
  groupBy: z.enum(["day", "week", "month"]).optional().default("week"),
});

// Schema para reporte de inventario
export const inventoryReportSchema = z.object({
  filter: z.enum(["all", "low-stock", "out-of-stock"]).optional().default("all"),
});

// Schema para reporte de evaluaciones
export const evaluationsReportSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

// Tipos exportados
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export type DashboardFiltersInput = z.infer<typeof dashboardFiltersSchema>;
export type IncomeReportInput = z.infer<typeof incomeReportSchema>;
export type ReceivablesReportInput = z.infer<typeof receivablesReportSchema>;
export type AttendanceReportInput = z.infer<typeof attendanceReportSchema>;
export type InventoryReportInput = z.infer<typeof inventoryReportSchema>;
export type EvaluationsReportInput = z.infer<typeof evaluationsReportSchema>;
