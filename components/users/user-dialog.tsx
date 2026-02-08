"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, User, Eye, EyeOff, KeyRound } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type UserRole = "OWNER" | "ADMIN" | "RECEPTION" | "THERAPIST";
type PayFrequency = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";

interface UserData {
  id: string;
  username: string;
  email: string | null;
  name: string;
  role: UserRole;
  phone: string | null;
  isActive: boolean;
  baseSalary: number | null;
  payFrequency: PayFrequency;
  mustChangePassword?: boolean;
}

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  user?: UserData | null;
  trigger?: React.ReactNode;
  currentUserRole?: UserRole;
}

// Solo OWNER puede ver/crear OWNER. Los demás solo ven roles menores
const ROLES: UserRole[] = ["OWNER", "ADMIN", "RECEPTION", "THERAPIST"];
const PAY_FREQUENCIES: PayFrequency[] = ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY"];

// Contraseña temporal predefinida para nuevos usuarios
const DEFAULT_PASSWORD = "cambiar123";

export function UserDialog({
  open,
  onOpenChange,
  user,
  trigger,
  currentUserRole,
}: UserDialogProps) {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const isEditing = !!user;

  // Solo OWNER puede ver/crear usuarios OWNER
  const availableRoles = currentUserRole === "OWNER"
    ? ROLES
    : ROLES.filter(r => r !== "OWNER");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("THERAPIST");
  const [phone, setPhone] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [payFrequency, setPayFrequency] = useState<PayFrequency>("MONTHLY");
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (open && user) {
      // Editando usuario existente
      setUsername(user.username);
      setEmail(user.email || "");
      setPassword("");
      setName(user.name);
      setRole(user.role);
      setPhone(user.phone || "");
      setBaseSalary(user.baseSalary?.toString() || "");
      setPayFrequency(user.payFrequency);
      setMustChangePassword(user.mustChangePassword || false);
      setShowPassword(false);
    } else if (open && !user) {
      // Creando nuevo usuario - mostrar contraseña por defecto
      setUsername("");
      setEmail("");
      setPassword(DEFAULT_PASSWORD);
      setName("");
      setRole("THERAPIST");
      setPhone("");
      setBaseSalary("");
      setPayFrequency("MONTHLY");
      setMustChangePassword(true); // Nuevos usuarios deben cambiar contraseña
      setShowPassword(true); // Mostrar contraseña visible al crear
    } else if (!open) {
      // Dialog cerrado - limpiar todo
      setUsername("");
      setEmail("");
      setPassword("");
      setName("");
      setRole("THERAPIST");
      setPhone("");
      setBaseSalary("");
      setPayFrequency("MONTHLY");
      setMustChangePassword(false);
      setShowPassword(false);
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !name || !role) {
      toast.error(t("errors.missingFields"));
      return;
    }

    if (!isEditing && !password) {
      toast.error(t("errors.passwordRequired"));
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        username,
        email: email || undefined,
        name,
        role,
        phone: phone || undefined,
        baseSalary: baseSalary ? parseFloat(baseSalary) : undefined,
        payFrequency,
        mustChangePassword,
      };

      if (password) {
        payload.password = password;
      }

      const url = isEditing ? `/api/users/${user.id}` : "/api/users";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.error === "USERNAME_ALREADY_EXISTS") {
          toast.error(t("errors.usernameExists"));
        } else if (error.error === "EMAIL_ALREADY_EXISTS") {
          toast.error(t("errors.emailExists"));
        } else {
          toast.error(isEditing ? t("errors.updateFailed") : t("errors.createFailed"));
        }
        return;
      }

      toast.success(isEditing ? t("updateSuccess") : t("createSuccess"));
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error(isEditing ? t("errors.updateFailed") : t("errors.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  const dialogContent = (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-teal-500" />
          {isEditing ? t("dialog.editTitle") : t("dialog.createTitle")}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name">{t("dialog.name")} *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("dialog.namePlaceholder")}
            required
          />
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username">{t("dialog.username")} *</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, "_"))}
            placeholder={t("dialog.usernamePlaceholder")}
            required
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">{t("dialog.email")}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("dialog.emailPlaceholder")}
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">
            {t("dialog.password")} {!isEditing && "*"}
            {isEditing && (
              <span className="ml-1 text-xs text-gray-500">
                ({t("dialog.leaveBlankToKeep")})
              </span>
            )}
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required={!isEditing}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          {!isEditing && (
            <p className="text-xs text-amber-600">
              💡 {t("dialog.passwordChangeRequired")}
            </p>
          )}
        </div>

        {/* Must Change Password - Only show when editing */}
        {isEditing && (
          <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-amber-600" />
              <div>
                <Label htmlFor="mustChangePassword" className="text-sm font-medium text-amber-800">
                  {t("dialog.forcePasswordChange")}
                </Label>
                <p className="text-xs text-amber-600">
                  {t("dialog.forcePasswordChangeDesc")}
                </p>
              </div>
            </div>
            <Switch
              id="mustChangePassword"
              checked={mustChangePassword}
              onCheckedChange={setMustChangePassword}
            />
          </div>
        )}

        {/* Role */}
        <div className="space-y-2">
          <Label>{t("dialog.role")} *</Label>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map((r) => (
                <SelectItem key={r} value={r}>
                  {t(`roles.${r}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">{t("dialog.phone")}</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+591 77777777"
          />
        </div>

        {/* Salary Section */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <h4 className="mb-3 text-sm font-medium text-gray-700">
            {t("dialog.salarySection")}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="baseSalary">{t("dialog.baseSalary")}</Label>
              <Input
                id="baseSalary"
                type="number"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("dialog.payFrequency")}</Label>
              <Select
                value={payFrequency}
                onValueChange={(v) => setPayFrequency(v as PayFrequency)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAY_FREQUENCIES.map((pf) => (
                    <SelectItem key={pf} value={pf}>
                      {t(`payFrequency.${pf}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-teal-500 to-cyan-500"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? tCommon("save") : t("dialog.create")}
          </Button>
        </div>
      </form>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {dialogContent}
    </Dialog>
  );
}
