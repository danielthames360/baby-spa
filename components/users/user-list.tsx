"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatCurrency as formatCurrencyUtil } from "@/lib/utils/currency-utils";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es, ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Pencil,
  UserCheck,
  UserX,
  Shield,
  Headset,
  Heart,
  Loader2,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { UserDialog } from "./user-dialog";

type UserRole = "OWNER" | "ADMIN" | "RECEPTION" | "THERAPIST";
type PayFrequency = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";

interface User {
  id: string;
  username: string;
  email: string | null;
  name: string;
  role: UserRole;
  phone: string | null;
  isActive: boolean;
  baseSalary: number | null;
  payFrequency: PayFrequency;
  createdAt: string;
  lastLoginAt: string | null;
  _count: {
    sessionsAsTherapist: number;
    appointmentsAssigned: number;
  };
}

interface UserListProps {
  users: User[];
  locale: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const ROLE_CONFIG: Record<UserRole, { icon: typeof Shield; color: string; bgColor: string }> = {
  OWNER: { icon: Crown, color: "text-amber-700", bgColor: "bg-amber-100" },
  ADMIN: { icon: Shield, color: "text-purple-700", bgColor: "bg-purple-100" },
  RECEPTION: { icon: Headset, color: "text-blue-700", bgColor: "bg-blue-100" },
  THERAPIST: { icon: Heart, color: "text-pink-700", bgColor: "bg-pink-100" },
};

export function UserList({ users, locale, pagination }: UserListProps) {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const dateLocale = locale === "pt-BR" ? ptBR : es;

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [toggleUser, setToggleUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const handleToggleActive = async () => {
    if (!toggleUser) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${toggleUser.id}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle user status");
      }

      toast.success(
        toggleUser.isActive ? t("deactivateSuccess") : t("activateSuccess")
      );
      router.refresh();
    } catch (error) {
      console.error("Error toggling user:", error);
      toast.error(t("errors.toggleFailed"));
    } finally {
      setLoading(false);
      setToggleUser(null);
    }
  };

  const formatCurrency = (amount: number) => formatCurrencyUtil(amount, locale);

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-white/50 bg-white/70 p-12 text-center shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <p className="text-gray-500">{t("empty")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.name")}</TableHead>
              <TableHead>{t("table.username")}</TableHead>
              <TableHead>{t("table.role")}</TableHead>
              <TableHead>{t("table.salary")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead>{t("table.lastLogin")}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const roleConfig = ROLE_CONFIG[user.role];
              const RoleIcon = roleConfig.icon;

              return (
                <TableRow
                  key={user.id}
                  className={!user.isActive ? "opacity-50" : ""}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      {user.email && (
                        <p className="text-xs text-gray-500">{user.email}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                      {user.username}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${roleConfig.bgColor} ${roleConfig.color}`}
                    >
                      <RoleIcon className="mr-1 h-3 w-3" />
                      {t(`roles.${user.role}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.baseSalary ? (
                      <div>
                        <p className="font-medium">
                          {formatCurrency(user.baseSalary)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t(`payFrequency.${user.payFrequency}`)}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.isActive ? "default" : "secondary"}
                      className={
                        user.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }
                    >
                      {user.isActive ? t("status.active") : t("status.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt ? (
                      <span className="text-sm text-gray-500">
                        {format(new Date(user.lastLoginAt), "dd/MM/yyyy HH:mm", {
                          locale: dateLocale,
                        })}
                      </span>
                    ) : (
                      <span className="text-gray-400">{t("neverLoggedIn")}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingUser(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          {tCommon("edit")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setToggleUser(user)}
                          className={
                            user.isActive ? "text-red-600" : "text-green-600"
                          }
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" />
                              {t("actions.deactivate")}
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              {t("actions.activate")}
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-gray-500">
              {t("pagination.showing", {
                from: (pagination.page - 1) * pagination.limit + 1,
                to: Math.min(pagination.page * pagination.limit, pagination.total),
                total: pagination.total,
              })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => {
                  const params = new URLSearchParams(window.location.search);
                  params.set("page", String(pagination.page - 1));
                  router.push(`?${params.toString()}`);
                }}
              >
                {tCommon("previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => {
                  const params = new URLSearchParams(window.location.search);
                  params.set("page", String(pagination.page + 1));
                  router.push(`?${params.toString()}`);
                }}
              >
                {tCommon("next")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {editingUser && (
        <UserDialog
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          locale={locale}
          user={editingUser}
        />
      )}

      {/* Toggle Active Confirmation */}
      <AlertDialog open={!!toggleUser} onOpenChange={() => setToggleUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleUser?.isActive
                ? t("deactivateConfirm.title")
                : t("activateConfirm.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleUser?.isActive
                ? t("deactivateConfirm.description", { name: toggleUser.name })
                : t("activateConfirm.description", { name: toggleUser?.name || "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {tCommon("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleActive}
              disabled={loading}
              className={
                toggleUser?.isActive
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              }
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {toggleUser?.isActive
                ? t("actions.deactivate")
                : t("actions.activate")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
