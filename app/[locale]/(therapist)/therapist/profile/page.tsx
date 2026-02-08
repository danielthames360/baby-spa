"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  Clock,
  Lock,
  Loader2,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getRoleLabel, getRoleBadgeColor } from "@/lib/permissions";
import { UserRole } from "@prisma/client";

interface ProfileData {
  id: string;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function TherapistProfilePage() {
  const t = useTranslations();
  const locale = useLocale();
  const dateLocale = locale === "pt-BR" ? "pt-BR" : "es-BO";
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentional mount-only fetch
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        profileForm.reset({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error(t("profile.errors.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
        }),
      });

      if (response.ok) {
        const updated = await response.json();
        setProfile(updated);
        if (session?.user?.name !== data.name) {
          await updateSession({ name: data.name });
        }
        toast.success(t("profile.profileUpdated"));
      } else {
        toast.error(t("profile.errors.updateFailed"));
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(t("profile.errors.updateFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      passwordForm.setError("confirmPassword", {
        message: t("profile.errors.passwordsDoNotMatch"),
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(t("profile.passwordChanged"));
        setShowPasswordDialog(false);
        passwordForm.reset();
        await updateSession();
        fetchProfile();
      } else {
        const errorKey = result.error || "updateFailed";
        toast.error(t(`profile.errors.${errorKey}`));
      }
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(t("profile.errors.updateFailed"));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString(dateLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">{t("profile.errors.loadFailed")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-3xl font-bold text-transparent">
          {t("profile.title")}
        </h1>
        <p className="mt-1 text-gray-500">{t("profile.subtitle")}</p>
      </div>

      {/* Forced password change alert */}
      {profile.mustChangePassword && (
        <Card className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
              <Lock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800">
                {t("profile.mustChangePassword")}
              </h3>
              <p className="text-sm text-amber-700">
                {t("profile.mustChangePasswordDesc")}
              </p>
            </div>
            <Button
              onClick={() => setShowPasswordDialog(true)}
              className="bg-amber-500 text-white hover:bg-amber-600"
            >
              {t("profile.changePassword")}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile info - Editable */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
                <User className="h-5 w-5 text-teal-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                {t("profile.personalInfo")}
              </h2>
            </div>

            <form
              onSubmit={profileForm.handleSubmit(handleProfileSubmit)}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700">
                    {t("profile.name")}
                  </Label>
                  <Input
                    id="name"
                    {...profileForm.register("name", { required: true })}
                    className="h-11 rounded-xl border-2 border-teal-100 focus:border-teal-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-700">
                    {t("profile.username")}
                  </Label>
                  <Input
                    id="username"
                    value={profile.username}
                    disabled
                    className="h-11 rounded-xl border-2 border-gray-100 bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">
                    {t("profile.usernameReadOnly")}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="flex items-center gap-2 text-gray-700"
                  >
                    <Mail className="h-4 w-4" />
                    {t("profile.email")}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    {...profileForm.register("email")}
                    placeholder="correo@ejemplo.com"
                    className="h-11 rounded-xl border-2 border-teal-100 focus:border-teal-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="flex items-center gap-2 text-gray-700"
                  >
                    <Phone className="h-4 w-4" />
                    {t("profile.phone")}
                  </Label>
                  <Input
                    id="phone"
                    {...profileForm.register("phone")}
                    placeholder="+591 12345678"
                    className="h-11 rounded-xl border-2 border-teal-100 focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-white shadow-lg shadow-teal-300/50 hover:from-teal-600 hover:to-cyan-600"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {t("common.save")}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Sidebar - Account info & security */}
        <div className="space-y-6">
          {/* Account info */}
          <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100">
                <Shield className="h-5 w-5 text-cyan-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                {t("profile.accountInfo")}
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">{t("profile.role")}</p>
                <span
                  className={`mt-1 inline-flex rounded-full border px-3 py-1 text-sm font-medium ${getRoleBadgeColor(
                    profile.role
                  )}`}
                >
                  {getRoleLabel(profile.role)}
                </span>
              </div>

              <div>
                <p className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />
                  {t("profile.memberSince")}
                </p>
                <p className="mt-1 font-medium text-gray-700">
                  {formatDate(profile.createdAt)}
                </p>
              </div>

              <div>
                <p className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="h-3.5 w-3.5" />
                  {t("profile.lastLogin")}
                </p>
                <p className="mt-1 font-medium text-gray-700">
                  {formatDateTime(profile.lastLoginAt)}
                </p>
              </div>
            </div>
          </Card>

          {/* Security */}
          <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-purple-100">
                <Lock className="h-5 w-5 text-violet-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">
                {t("profile.security")}
              </h2>
            </div>

            <p className="mb-4 text-sm text-gray-600">
              {t("profile.securityDesc")}
            </p>

            <Button
              variant="outline"
              onClick={() => setShowPasswordDialog(true)}
              className="w-full rounded-xl border-2 border-violet-200 text-violet-700 hover:bg-violet-50"
            >
              <Lock className="mr-2 h-4 w-4" />
              {t("profile.changePassword")}
            </Button>

            {!profile.mustChangePassword && (
              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
                <CheckCircle className="h-4 w-4" />
                {t("profile.passwordSecure")}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Password change dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-purple-100">
                <Lock className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-gray-800">
                  {t("profile.changePassword")}
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500">
                  {t("profile.changePasswordDesc")}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form
            onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}
            className="mt-4 space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-gray-700">
                {t("profile.currentPassword")}
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  {...passwordForm.register("currentPassword", {
                    required: true,
                  })}
                  className="h-11 rounded-xl border-2 border-violet-100 pr-10 focus:border-violet-400"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-gray-700">
                {t("profile.newPassword")}
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  {...passwordForm.register("newPassword", {
                    required: true,
                    minLength: 6,
                  })}
                  className="h-11 rounded-xl border-2 border-violet-100 pr-10 focus:border-violet-400"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                {t("profile.passwordMinLength")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-700">
                {t("profile.confirmPassword")}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                {...passwordForm.register("confirmPassword", {
                  required: true,
                })}
                className="h-11 rounded-xl border-2 border-violet-100 focus:border-violet-400"
              />
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {passwordForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPasswordDialog(false);
                  passwordForm.reset();
                }}
                className="h-11 flex-1 rounded-xl border-2 border-gray-200"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="h-11 flex-1 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 font-semibold text-white shadow-lg shadow-violet-300/50 hover:from-violet-600 hover:to-purple-600"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  t("profile.changePassword")
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
