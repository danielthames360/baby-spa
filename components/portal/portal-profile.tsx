"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { formatDateForDisplay } from "@/lib/utils/date-utils";
import { getGenderGradient } from "@/lib/utils/gender-utils";
import {
  User,
  Phone,
  Mail,
  Calendar,
  Baby,
  Key,
  Shield,
  AlertTriangle,
  Loader2,
  Save,
  Edit2,
  X,
  Check,
  Weight,
  Clock,
  FileText,
  Heart,
  Stethoscope,
  Instagram,
  Camera,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ============================================================
// TYPES
// ============================================================

interface Profile {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  accessCode: string;
  createdAt: string;
  noShowCount: number;
  requiresPrepayment: boolean;
}

interface BabyData {
  id: string;
  name: string;
  birthDate: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  birthWeeks: number | null;
  birthWeight: number | null;
  birthType: "NATURAL" | "CESAREAN" | null;
  birthDifficulty: boolean;
  birthDifficultyDesc: string | null;
  diagnosedIllness: boolean;
  diagnosedIllnessDesc: string | null;
  allergies: string | null;
  specialObservations: string | null;
  socialMediaConsent: boolean;
  instagramHandle: string | null;
  hasAppointments: boolean;
}

// ============================================================
// COMPONENT
// ============================================================

export function PortalProfile() {
  const t = useTranslations();
  const locale = useLocale();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [babies, setBabies] = useState<BabyData[]>([]);

  // Edit states
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingBabyId, setEditingBabyId] = useState<string | null>(null);

  // Form states
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", email: "" });
  const [babyForm, setBabyForm] = useState({
    name: "",
    birthWeeks: "",
    birthWeight: "",
    birthType: "" as "NATURAL" | "CESAREAN" | "",
    birthDifficulty: false,
    birthDifficultyDesc: "",
    diagnosedIllness: false,
    diagnosedIllnessDesc: "",
    allergies: "",
    specialObservations: "",
    socialMediaConsent: false,
    instagramHandle: "",
  });

  // Fetch profile data
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/portal/profile");
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      setProfile(data.profile);
      setBabies(data.babies);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  // Start editing profile
  const startEditProfile = () => {
    if (profile) {
      setProfileForm({
        name: profile.name,
        phone: profile.phone || "",
        email: profile.email || "",
      });
      setEditingProfile(true);
    }
  };

  // Cancel editing profile
  const cancelEditProfile = () => {
    setEditingProfile(false);
    setProfileForm({ name: "", phone: "", email: "" });
  };

  // Save profile
  const saveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/portal/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "profile",
          data: profileForm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "PHONE_EXISTS") {
          toast.error(t("portal.profile.phoneExists"));
        } else {
          toast.error(data.error || t("common.error"));
        }
        return;
      }

      setProfile((prev) => (prev ? { ...prev, ...data.profile } : null));
      setEditingProfile(false);
      toast.success(t("portal.profile.saveSuccess"));
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  // Start editing baby
  const startEditBaby = (baby: BabyData) => {
    setBabyForm({
      name: baby.name,
      birthWeeks: baby.birthWeeks?.toString() || "",
      birthWeight: baby.birthWeight?.toString() || "",
      birthType: baby.birthType || "",
      birthDifficulty: baby.birthDifficulty || false,
      birthDifficultyDesc: baby.birthDifficultyDesc || "",
      diagnosedIllness: baby.diagnosedIllness || false,
      diagnosedIllnessDesc: baby.diagnosedIllnessDesc || "",
      allergies: baby.allergies || "",
      specialObservations: baby.specialObservations || "",
      socialMediaConsent: baby.socialMediaConsent || false,
      instagramHandle: baby.instagramHandle || "",
    });
    setEditingBabyId(baby.id);
  };

  // Cancel editing baby
  const cancelEditBaby = () => {
    setEditingBabyId(null);
    setBabyForm({
      name: "",
      birthWeeks: "",
      birthWeight: "",
      birthType: "",
      birthDifficulty: false,
      birthDifficultyDesc: "",
      diagnosedIllness: false,
      diagnosedIllnessDesc: "",
      allergies: "",
      specialObservations: "",
      socialMediaConsent: false,
      instagramHandle: "",
    });
  };

  // Save baby
  const saveBaby = async (babyId: string) => {
    // Parse numeric values - only send if valid and within range
    const birthWeeksNum = babyForm.birthWeeks ? parseInt(babyForm.birthWeeks) : null;
    const birthWeightNum = babyForm.birthWeight ? parseFloat(babyForm.birthWeight) : null;

    // Client-side validation
    if (birthWeeksNum !== null && (birthWeeksNum < 20 || birthWeeksNum > 45)) {
      toast.error(t("babyForm.validation.birthWeeksRange"));
      return;
    }
    if (birthWeightNum !== null && (birthWeightNum < 0.5 || birthWeightNum > 10)) {
      toast.error(t("babyForm.validation.birthWeightRange"));
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/portal/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "baby",
          data: {
            babyId,
            name: babyForm.name,
            birthWeeks: birthWeeksNum,
            birthWeight: birthWeightNum,
            birthType: babyForm.birthType || null,
            birthDifficulty: babyForm.birthDifficulty,
            birthDifficultyDesc: babyForm.birthDifficultyDesc || null,
            diagnosedIllness: babyForm.diagnosedIllness,
            diagnosedIllnessDesc: babyForm.diagnosedIllnessDesc || null,
            allergies: babyForm.allergies || null,
            specialObservations: babyForm.specialObservations || null,
            socialMediaConsent: babyForm.socialMediaConsent,
            instagramHandle: babyForm.instagramHandle || null,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show field-specific validation errors if available
        if (data.details?.fieldErrors) {
          const errors = data.details.fieldErrors;
          const firstField = Object.keys(errors)[0];
          if (firstField && errors[firstField]?.[0]) {
            toast.error(`${firstField}: ${errors[firstField][0]}`);
            return;
          }
        }
        toast.error(data.error || t("common.error"));
        return;
      }

      setBabies((prev) =>
        prev.map((b) =>
          b.id === babyId
            ? { ...b, ...data.baby }
            : b
        )
      );
      setEditingBabyId(null);
      toast.success(t("portal.profile.babySaveSuccess"));
    } catch (error) {
      console.error("Error saving baby:", error);
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return formatDateForDisplay(dateString, locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Get gender label
  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case "MALE":
        return t("baby.male");
      case "FEMALE":
        return t("baby.female");
      default:
        return t("baby.other");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t("common.error")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent">
          {t("portal.profile.title")}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("portal.profile.subtitle")}
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <User className="h-5 w-5 text-teal-500" />
            {t("portal.profile.personalData")}
          </h2>
          {!editingProfile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={startEditProfile}
              className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              {t("common.edit")}
            </Button>
          )}
        </div>

        {editingProfile ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t("portal.profile.name")}</Label>
              <Input
                id="name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone">{t("portal.profile.phone")}</Label>
              <Input
                id="phone"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="mt-1"
                placeholder="+591 70000000"
              />
            </div>
            <div>
              <Label htmlFor="email">{t("portal.profile.email")}</Label>
              <Input
                id="email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="mt-1"
                placeholder="correo@ejemplo.com"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={cancelEditProfile}
                disabled={saving}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                {t("common.cancel")}
              </Button>
              <Button
                onClick={saveProfile}
                disabled={saving || !profileForm.name.trim()}
                className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" />
                    {t("common.save")}
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-700">
              <User className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{profile.name}</span>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-3 text-gray-700">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{profile.phone}</span>
              </div>
            )}
            {profile.email && (
              <div className="flex items-center gap-3 text-gray-700">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{profile.email}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Account Info (Read Only) */}
      <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
        <h2 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
          <Shield className="h-5 w-5 text-teal-500" />
          {t("portal.profile.accountInfo")}
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-3 text-gray-600">
              <Key className="h-4 w-4" />
              <span>{t("portal.profile.accessCode")}</span>
            </div>
            <span className="font-mono font-bold text-teal-600">{profile.accessCode}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>{t("portal.profile.memberSince")}</span>
            </div>
            <span className="text-gray-700">{formatDate(profile.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3 text-gray-600">
              <Baby className="h-4 w-4" />
              <span>{t("portal.profile.registeredBabies")}</span>
            </div>
            <span className="text-gray-700">{babies.length}</span>
          </div>
        </div>

        {/* Prepayment Warning */}
        {profile.requiresPrepayment && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 border border-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                {t("portal.profile.prepaymentRequired")}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                {t("portal.profile.prepaymentDescription")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Babies Section */}
      <div className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-sm">
        <h2 className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-800">
          <Baby className="h-5 w-5 text-teal-500" />
          {t("portal.profile.myBabies")}
        </h2>

        <div className="space-y-4">
          {babies.map((baby) => (
            <div
              key={baby.id}
              className="rounded-xl border border-gray-100 bg-white p-4"
            >
              {editingBabyId === baby.id ? (
                // Edit mode
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full text-white font-bold",
                        `bg-gradient-to-br ${getGenderGradient(baby.gender)}`
                      )}
                    >
                      {baby.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t("portal.profile.editingBaby")}</p>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div>
                    <Label htmlFor={`baby-name-${baby.id}`}>{t("baby.name")}</Label>
                    <Input
                      id={`baby-name-${baby.id}`}
                      value={babyForm.name}
                      onChange={(e) => setBabyForm({ ...babyForm, name: e.target.value })}
                      className="mt-1"
                    />
                  </div>

                  {/* Birth Info Section */}
                  <div className="space-y-3 rounded-xl bg-teal-50/50 p-3">
                    <h4 className="text-sm font-medium text-teal-700 flex items-center gap-2">
                      <Baby className="h-4 w-4" />
                      {t("babyForm.babyData.birthInfo")}
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label htmlFor={`baby-type-${baby.id}`} className="text-xs">{t("babyForm.babyData.birthType")}</Label>
                        <Select
                          value={babyForm.birthType}
                          onValueChange={(value) => setBabyForm({ ...babyForm, birthType: value as "NATURAL" | "CESAREAN" })}
                        >
                          <SelectTrigger className="mt-1 h-9">
                            <SelectValue placeholder={t("common.select")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NATURAL">{t("babyForm.babyData.natural")}</SelectItem>
                            <SelectItem value="CESAREAN">{t("babyForm.babyData.cesarean")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`baby-weeks-${baby.id}`} className="text-xs">{t("baby.birthWeeks")}</Label>
                        <Input
                          id={`baby-weeks-${baby.id}`}
                          type="number"
                          min="20"
                          max="45"
                          value={babyForm.birthWeeks}
                          onChange={(e) => setBabyForm({ ...babyForm, birthWeeks: e.target.value })}
                          className="mt-1 h-9"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`baby-weight-${baby.id}`} className="text-xs">{t("baby.birthWeight")}</Label>
                        <Input
                          id={`baby-weight-${baby.id}`}
                          type="number"
                          step="0.1"
                          min="0.5"
                          max="10"
                          value={babyForm.birthWeight}
                          onChange={(e) => setBabyForm({ ...babyForm, birthWeight: e.target.value })}
                          className="mt-1 h-9"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Medical Info Section */}
                  <div className="space-y-3 rounded-xl bg-rose-50/50 p-3">
                    <h4 className="text-sm font-medium text-rose-700 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      {t("babyForm.babyData.medicalInfo")}
                    </h4>

                    {/* Birth Difficulty */}
                    <div className="rounded-lg bg-white p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`baby-difficulty-${baby.id}`}
                          checked={babyForm.birthDifficulty}
                          onCheckedChange={(checked) => setBabyForm({ ...babyForm, birthDifficulty: !!checked })}
                        />
                        <Label htmlFor={`baby-difficulty-${baby.id}`} className="text-sm cursor-pointer">
                          {t("babyForm.babyData.birthDifficulty")}
                        </Label>
                      </div>
                      {babyForm.birthDifficulty && (
                        <Textarea
                          value={babyForm.birthDifficultyDesc}
                          onChange={(e) => setBabyForm({ ...babyForm, birthDifficultyDesc: e.target.value })}
                          placeholder={t("babyForm.babyData.birthDifficultyDesc")}
                          className="mt-2"
                          rows={2}
                        />
                      )}
                    </div>

                    {/* Diagnosed Illness */}
                    <div className="rounded-lg bg-white p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`baby-illness-${baby.id}`}
                          checked={babyForm.diagnosedIllness}
                          onCheckedChange={(checked) => setBabyForm({ ...babyForm, diagnosedIllness: !!checked })}
                        />
                        <Label htmlFor={`baby-illness-${baby.id}`} className="text-sm cursor-pointer">
                          {t("babyForm.babyData.diagnosedIllness")}
                        </Label>
                      </div>
                      {babyForm.diagnosedIllness && (
                        <Textarea
                          value={babyForm.diagnosedIllnessDesc}
                          onChange={(e) => setBabyForm({ ...babyForm, diagnosedIllnessDesc: e.target.value })}
                          placeholder={t("babyForm.babyData.diagnosedIllnessDesc")}
                          className="mt-2"
                          rows={2}
                        />
                      )}
                    </div>

                    {/* Allergies */}
                    <div>
                      <Label htmlFor={`baby-allergies-${baby.id}`} className="text-xs">{t("babyForm.babyData.allergies")}</Label>
                      <Textarea
                        id={`baby-allergies-${baby.id}`}
                        value={babyForm.allergies}
                        onChange={(e) => setBabyForm({ ...babyForm, allergies: e.target.value })}
                        placeholder={t("babyForm.babyData.allergiesPlaceholder")}
                        className="mt-1"
                        rows={2}
                      />
                    </div>

                    {/* Special Observations */}
                    <div>
                      <Label htmlFor={`baby-notes-${baby.id}`} className="text-xs">{t("portal.profile.specialObservations")}</Label>
                      <Textarea
                        id={`baby-notes-${baby.id}`}
                        value={babyForm.specialObservations}
                        onChange={(e) => setBabyForm({ ...babyForm, specialObservations: e.target.value })}
                        placeholder={t("portal.profile.specialObservationsPlaceholder")}
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Consents Section */}
                  <div className="space-y-3 rounded-xl bg-purple-50/50 p-3">
                    <h4 className="text-sm font-medium text-purple-700 flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      {t("babyForm.babyData.consents")}
                    </h4>
                    <div className="rounded-lg bg-white p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`baby-social-${baby.id}`}
                          checked={babyForm.socialMediaConsent}
                          onCheckedChange={(checked) => setBabyForm({ ...babyForm, socialMediaConsent: !!checked })}
                        />
                        <Label htmlFor={`baby-social-${baby.id}`} className="text-sm cursor-pointer">
                          {t("babyForm.babyData.socialMediaConsent")}
                        </Label>
                      </div>
                      {babyForm.socialMediaConsent && (
                        <div className="mt-2">
                          <Label htmlFor={`baby-ig-${baby.id}`} className="text-xs flex items-center gap-1">
                            <Instagram className="h-3 w-3" />
                            {t("babyForm.babyData.instagramHandle")}
                          </Label>
                          <Input
                            id={`baby-ig-${baby.id}`}
                            value={babyForm.instagramHandle}
                            onChange={(e) => setBabyForm({ ...babyForm, instagramHandle: e.target.value })}
                            placeholder={t("babyForm.babyData.instagramPlaceholder")}
                            className="mt-1"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {baby.hasAppointments && (
                    <div className="flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
                      <AlertTriangle className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span>{t("portal.profile.birthDateLocked")}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={cancelEditBaby}
                      disabled={saving}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-1" />
                      {t("common.cancel")}
                    </Button>
                    <Button
                      onClick={() => saveBaby(baby.id)}
                      disabled={saving || !babyForm.name.trim()}
                      className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          {t("common.save")}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                // View mode
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full text-white font-bold",
                          `bg-gradient-to-br ${getGenderGradient(baby.gender)}`
                        )}
                      >
                        {baby.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{baby.name}</h3>
                        <p className="text-xs text-gray-500">
                          {getGenderLabel(baby.gender)} • {formatDate(baby.birthDate)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditBaby(baby)}
                      className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Baby details */}
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    {baby.birthType && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-1 text-xs text-teal-700">
                        <Baby className="h-3 w-3" />
                        {baby.birthType === "NATURAL" ? t("babyForm.babyData.natural") : t("babyForm.babyData.cesarean")}
                      </span>
                    )}
                    {baby.birthWeeks && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        {baby.birthWeeks} {t("portal.profile.weeks")}
                      </span>
                    )}
                    {baby.birthWeight && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                        <Weight className="h-3 w-3" />
                        {baby.birthWeight} kg
                      </span>
                    )}
                    {baby.socialMediaConsent && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-xs text-purple-600">
                        <Camera className="h-3 w-3" />
                        {t("portal.profile.socialMediaAuthorized")}
                      </span>
                    )}
                  </div>

                  {/* Medical alerts */}
                  {(baby.birthDifficulty || baby.diagnosedIllness || baby.allergies) && (
                    <div className="mt-3 space-y-2">
                      {baby.birthDifficulty && (
                        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-xs">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5" />
                          <div>
                            <span className="font-medium text-amber-700">{t("babyForm.babyData.birthDifficulty")}</span>
                            {baby.birthDifficultyDesc && (
                              <p className="text-amber-600 mt-0.5">{baby.birthDifficultyDesc}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {baby.diagnosedIllness && (
                        <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-2 text-xs">
                          <Stethoscope className="h-3.5 w-3.5 text-rose-500 mt-0.5" />
                          <div>
                            <span className="font-medium text-rose-700">{t("babyForm.babyData.diagnosedIllness")}</span>
                            {baby.diagnosedIllnessDesc && (
                              <p className="text-rose-600 mt-0.5">{baby.diagnosedIllnessDesc}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {baby.allergies && (
                        <div className="flex items-start gap-2 rounded-lg bg-orange-50 p-2 text-xs">
                          <Heart className="h-3.5 w-3.5 text-orange-500 mt-0.5" />
                          <div>
                            <span className="font-medium text-orange-700">{t("babyForm.babyData.allergies")}</span>
                            <p className="text-orange-600 mt-0.5">{baby.allergies}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {baby.specialObservations && (
                    <div className="mt-3 rounded-lg bg-gray-50 p-3">
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4 mt-0.5" />
                        <span>{baby.specialObservations}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Logout Section - visible on all devices, useful for mobile */}
      <div className="mt-6 rounded-2xl border border-rose-100 bg-rose-50/50 p-4 backdrop-blur-sm">
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: `${window.location.origin}/portal/login` })}
          className="w-full justify-center gap-2 text-rose-600 hover:bg-rose-100 hover:text-rose-700"
        >
          <LogOut className="h-4 w-4" />
          {t("auth.logout")}
        </Button>
      </div>
    </div>
  );
}
