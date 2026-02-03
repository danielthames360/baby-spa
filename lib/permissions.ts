/**
 * Sistema de Permisos Centralizado
 * Define qué puede hacer cada rol en el sistema
 */

import { UserRole } from "@prisma/client";

// Tipos de permisos
export type Permission =
  // Dashboard
  | "dashboard:view"
  | "dashboard:view-finance"
  | "dashboard:view-operations"
  // Calendario
  | "calendar:view"
  | "calendar:create"
  | "calendar:edit"
  | "calendar:delete"
  // Clientes (Bebés)
  | "babies:view"
  | "babies:create"
  | "babies:edit"
  | "babies:delete"
  // Padres
  | "parents:view"
  | "parents:create"
  | "parents:edit"
  | "parents:delete"
  // Paquetes
  | "packages:view"
  | "packages:create"
  | "packages:edit"
  | "packages:delete"
  // Eventos
  | "events:view"
  | "events:create"
  | "events:edit"
  | "events:delete"
  // Baby Cards
  | "baby-cards:view"
  | "baby-cards:create"
  | "baby-cards:sell"
  // Inventario
  | "inventory:view"
  | "inventory:create"
  | "inventory:edit"
  | "inventory:adjust"
  // Sesiones / Checkout
  | "sessions:view"
  | "sessions:start"
  | "sessions:complete"
  | "sessions:evaluate"
  // Usuarios
  | "users:view"
  | "users:create"
  | "users:edit"
  | "users:delete"
  // Staff Payments
  | "staff-payments:view"
  | "staff-payments:create"
  | "staff-payments:delete"
  // Gastos
  | "expenses:view"
  | "expenses:view-all"
  | "expenses:create"
  | "expenses:delete"
  // Actividad
  | "activity:view"
  // Settings
  | "settings:view"
  | "settings:edit"
  // Arqueo de Caja (futuro)
  | "cash-register:operate"
  | "cash-register:approve"
  // Reportes
  | "reports:view"
  | "reports:view-financial"
  | "reports:view-operational"
  | "reports:export";

// Permisos por rol
const ROLE_PERMISSIONS: Record<UserRole | "PARENT", Permission[]> = {
  OWNER: [
    // Todo el sistema
    "dashboard:view",
    "dashboard:view-finance",
    "dashboard:view-operations",
    "calendar:view",
    "calendar:create",
    "calendar:edit",
    "calendar:delete",
    "babies:view",
    "babies:create",
    "babies:edit",
    "babies:delete",
    "parents:view",
    "parents:create",
    "parents:edit",
    "parents:delete",
    "packages:view",
    "packages:create",
    "packages:edit",
    "packages:delete",
    "events:view",
    "events:create",
    "events:edit",
    "events:delete",
    "baby-cards:view",
    "baby-cards:create",
    "baby-cards:sell",
    "inventory:view",
    "inventory:create",
    "inventory:edit",
    "inventory:adjust",
    "sessions:view",
    "sessions:start",
    "sessions:complete",
    "sessions:evaluate",
    "users:view",
    "users:create",
    "users:edit",
    "users:delete",
    "staff-payments:view",
    "staff-payments:create",
    "staff-payments:delete",
    "expenses:view",
    "expenses:view-all",
    "expenses:create",
    "expenses:delete",
    "activity:view",
    "settings:view",
    "settings:edit",
    "cash-register:operate",
    "cash-register:approve",
    "reports:view",
    "reports:view-financial",
    "reports:view-operational",
    "reports:export",
  ],

  ADMIN: [
    // Operaciones + Finanzas limitadas
    "dashboard:view",
    "dashboard:view-finance",
    "dashboard:view-operations",
    "calendar:view",
    "calendar:create",
    "calendar:edit",
    "calendar:delete",
    "babies:view",
    "babies:create",
    "babies:edit",
    "babies:delete",
    "parents:view",
    "parents:create",
    "parents:edit",
    "parents:delete",
    "packages:view",
    "packages:create",
    "packages:edit",
    "packages:delete",
    "events:view",
    "events:create",
    "events:edit",
    "events:delete",
    "baby-cards:view",
    "baby-cards:create",
    "baby-cards:sell",
    "inventory:view",
    "inventory:create",
    "inventory:edit",
    "inventory:adjust",
    "sessions:view",
    "sessions:start",
    "sessions:complete",
    "sessions:evaluate",
    // NO: users (solo OWNER)
    // NO: staff-payments (solo OWNER)
    "expenses:view",
    "expenses:view-all",
    "expenses:create",
    "expenses:delete",
    "activity:view",
    // NO: settings (solo OWNER)
    "cash-register:operate",
    "cash-register:approve",
    "reports:view",
    "reports:view-financial",
    "reports:view-operational",
    "reports:export",
  ],

  RECEPTION: [
    // Operaciones diarias
    "dashboard:view",
    "dashboard:view-operations",
    "calendar:view",
    "calendar:create",
    "calendar:edit",
    "calendar:delete",
    "babies:view",
    "babies:create",
    "babies:edit",
    // NO: babies:delete
    "parents:view",
    "parents:create",
    "parents:edit",
    // NO: parents:delete
    "packages:view",
    // NO: packages:create/edit/delete
    "events:view",
    "events:create",
    "events:edit",
    // NO: events:delete
    "baby-cards:view",
    "baby-cards:sell",
    // NO: baby-cards:create (plantillas)
    "inventory:view",
    "inventory:adjust",
    // NO: inventory:create/edit
    "sessions:view",
    "sessions:start",
    "sessions:complete",
    // NO: sessions:evaluate (solo terapeutas)
    // NO: users
    // NO: staff-payments
    "expenses:create", // Solo crear, no ver todos
    // NO: expenses:view-all
    // NO: activity
    // NO: settings
    "cash-register:operate",
    // NO: cash-register:approve
    "reports:view",
    "reports:view-operational",
    // NO: reports:view-financial
    // NO: reports:export
  ],

  THERAPIST: [
    // Solo su agenda y evaluaciones
    "sessions:view",
    "sessions:evaluate",
    "babies:view", // Solo lectura para ver datos del bebé
  ],

  PARENT: [
    // Solo portal - no tiene acceso al admin
  ],
};

/**
 * Verifica si un rol tiene un permiso específico
 */
export function hasPermission(
  role: UserRole | "PARENT",
  permission: Permission
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Verifica si un rol tiene CUALQUIERA de los permisos dados
 */
export function hasAnyPermission(
  role: UserRole | "PARENT",
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Verifica si un rol tiene TODOS los permisos dados
 */
export function hasAllPermissions(
  role: UserRole | "PARENT",
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Obtiene todos los permisos de un rol
 */
export function getPermissions(role: UserRole | "PARENT"): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

// ============================================================
// NAVEGACIÓN DEL SIDEBAR
// ============================================================

export type NavItem = {
  key: string;
  href: string;
  icon: string;
  requiredPermissions: Permission[];
};

// Items de navegación principal
export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    href: "/admin/dashboard",
    icon: "LayoutDashboard",
    requiredPermissions: ["dashboard:view"],
  },
  {
    key: "calendar",
    href: "/admin/calendar",
    icon: "Calendar",
    requiredPermissions: ["calendar:view"],
  },
  {
    key: "babies",
    href: "/admin/clients",
    icon: "Baby",
    requiredPermissions: ["babies:view"],
  },
  {
    key: "parents",
    href: "/admin/parents",
    icon: "UserRound",
    requiredPermissions: ["parents:view"],
  },
  {
    key: "packages",
    href: "/admin/packages",
    icon: "Package",
    requiredPermissions: ["packages:view"],
  },
  {
    key: "events",
    href: "/admin/events",
    icon: "PartyPopper",
    requiredPermissions: ["events:view"],
  },
  {
    key: "babyCards",
    href: "/admin/baby-cards",
    icon: "IdCard",
    requiredPermissions: ["baby-cards:view"],
  },
  {
    key: "inventory",
    href: "/admin/inventory",
    icon: "Warehouse",
    requiredPermissions: ["inventory:view"],
  },
];

// Items de navegación secundaria (administración)
export const SECONDARY_NAV_ITEMS: NavItem[] = [
  {
    key: "users",
    href: "/admin/users",
    icon: "Users",
    requiredPermissions: ["users:view"],
  },
  {
    key: "staffPayments",
    href: "/admin/staff-payments",
    icon: "CreditCard",
    requiredPermissions: ["staff-payments:view"],
  },
  {
    key: "expenses",
    href: "/admin/expenses",
    icon: "Receipt",
    requiredPermissions: ["expenses:create"], // Todos los que pueden crear pueden ver la página
  },
  {
    key: "activity",
    href: "/admin/activity",
    icon: "History",
    requiredPermissions: ["activity:view"],
  },
  {
    key: "cashRegister",
    href: "/admin/cash-register",
    icon: "CircleDollarSign",
    requiredPermissions: ["cash-register:approve"],
  },
  {
    key: "reports",
    href: "/admin/reports",
    icon: "BarChart3",
    requiredPermissions: ["reports:view"],
  },
  {
    key: "settings",
    href: "/admin/settings",
    icon: "Settings",
    requiredPermissions: ["settings:view"],
  },
];

/**
 * Filtra los items de navegación según los permisos del rol
 */
export function getNavItemsForRole(role: UserRole | "PARENT"): {
  main: NavItem[];
  secondary: NavItem[];
} {
  const filterItems = (items: NavItem[]) =>
    items.filter((item) =>
      item.requiredPermissions.some((p) => hasPermission(role, p))
    );

  return {
    main: filterItems(MAIN_NAV_ITEMS),
    secondary: filterItems(SECONDARY_NAV_ITEMS),
  };
}

// ============================================================
// HELPERS PARA ROLES
// ============================================================

/**
 * Verifica si el rol es staff (puede acceder al área admin)
 */
export function isStaffRole(role: string): boolean {
  return ["OWNER", "ADMIN", "RECEPTION", "THERAPIST"].includes(role);
}

/**
 * Verifica si el rol puede administrar (OWNER o ADMIN)
 */
export function isAdminRole(role: string): boolean {
  return ["OWNER", "ADMIN"].includes(role);
}

/**
 * Verifica si el rol es OWNER
 */
export function isOwnerRole(role: string): boolean {
  return role === "OWNER";
}

/**
 * Obtiene el label del rol para mostrar en UI
 */
export function getRoleLabel(role: UserRole | "PARENT"): string {
  const labels: Record<UserRole | "PARENT", string> = {
    OWNER: "Socio",
    ADMIN: "Administrador",
    RECEPTION: "Recepcionista",
    THERAPIST: "Terapeuta",
    PARENT: "Padre/Madre",
  };
  return labels[role] ?? role;
}

/**
 * Obtiene el color del badge del rol
 */
export function getRoleBadgeColor(role: UserRole | "PARENT"): string {
  const colors: Record<UserRole | "PARENT", string> = {
    OWNER: "bg-purple-100 text-purple-700 border-purple-200",
    ADMIN: "bg-blue-100 text-blue-700 border-blue-200",
    RECEPTION: "bg-teal-100 text-teal-700 border-teal-200",
    THERAPIST: "bg-amber-100 text-amber-700 border-amber-200",
    PARENT: "bg-pink-100 text-pink-700 border-pink-200",
  };
  return colors[role] ?? "bg-gray-100 text-gray-700 border-gray-200";
}
