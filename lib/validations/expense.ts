import { z } from "zod";

// Payment detail schema (for split payments)
const paymentDetailSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: z.enum(["CASH", "TRANSFER", "CARD", "OTHER"]),
  reference: z.string().optional().nullable(),
});

// Expense categories
export const expenseCategories = [
  "RENT",
  "UTILITIES",
  "SUPPLIES",
  "MAINTENANCE",
  "MARKETING",
  "TAXES",
  "INSURANCE",
  "EQUIPMENT",
  "OTHER",
] as const;

// Create expense schema
export const createExpenseSchema = z.object({
  category: z.enum(expenseCategories),
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  reference: z.string().optional(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  paymentDetails: z.array(paymentDetailSchema).optional(),
  paymentMethod: z.enum(["CASH", "TRANSFER", "CARD", "OTHER"]).optional(),
  paymentReference: z.string().optional(),
});

// Update expense schema
export const updateExpenseSchema = z.object({
  category: z.enum(expenseCategories).optional(),
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  reference: z.string().optional().nullable(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// Delete expense schema
export const deleteExpenseSchema = z.object({
  id: z.string().min(1, "Expense ID is required"),
});

// List expenses schema
export const listExpensesSchema = z.object({
  category: z.enum(expenseCategories).optional(),
  categories: z.array(z.enum(expenseCategories)).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  includeDeleted: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

// Summary schema
export const expenseSummarySchema = z.object({
  year: z.coerce.number().min(2020).max(2100),
  month: z.coerce.number().min(1).max(12),
});

// Export types
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesInput = z.infer<typeof listExpensesSchema>;
export type ExpenseSummaryInput = z.infer<typeof expenseSummarySchema>;
