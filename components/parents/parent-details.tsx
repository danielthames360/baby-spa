"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  User,
  Phone,
  Mail,
  Baby,
  Heart,
  Calendar,
  Package,
  Edit,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { formatDateForDisplay } from "@/lib/utils/date-utils";

// bundle-dynamic-imports: Lazy load dialog
const ParentDialog = dynamic(
  () => import("@/components/parents/parent-dialog").then((m) => m.ParentDialog),
  { ssr: false }
);

interface SerializedParent {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
  accessCode: string;
  noShowCount: number;
  status: string;
  pregnancyWeeks: number | null;
  leadSource: string | null;
  leadNotes: string | null;
  convertedAt: string | null;
  createdAt: string;
  babies: {
    id: string;
    relationship: string;
    isPrimary: boolean;
    baby: {
      id: string;
      name: string;
      birthDate: string;
      gender: string;
      isActive: boolean;
    };
  }[];
  appointments: {
    id: string;
    date: string;
    startTime: string;
    status: string;
  }[];
  packagePurchases: {
    id: string;
    remainingSessions: number;
    totalSessions: number;
    isActive: boolean;
    package: {
      id: string;
      name: string;
      sessionCount: number;
    };
  }[];
}

interface ParentDetailsProps {
  parent: SerializedParent;
  locale: string;
}

export function ParentDetails({ parent, locale }: ParentDetailsProps) {
  const t = useTranslations();
  const router = useRouter();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isLead = parent.status === "LEAD";
  const hasBabies = parent.babies.length > 0;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/parents/${parent.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error deleting parent");
      }

      router.push(`/${locale}/admin/parents`);
      router.refresh();
    } catch (error) {
      console.error("Error deleting parent:", error);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Info */}
          <div className="flex items-start gap-4">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                isLead
                  ? "bg-gradient-to-br from-pink-100 to-rose-100"
                  : "bg-gradient-to-br from-teal-100 to-cyan-100"
              }`}
            >
              {isLead ? (
                <Heart className="h-8 w-8 text-pink-500" />
              ) : (
                <User className="h-8 w-8 text-teal-600" />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent">
                  {parent.name}
                </h1>
                <Badge
                  className={
                    isLead
                      ? "bg-pink-100 text-pink-700"
                      : "bg-teal-100 text-teal-700"
                  }
                >
                  {isLead ? t("parents.status.lead") : t("parents.status.active")}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                {parent.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-teal-500" />
                    {parent.phone}
                  </span>
                )}
                {parent.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-teal-500" />
                    {parent.email}
                  </span>
                )}
              </div>

              {isLead && parent.pregnancyWeeks && (
                <p className="flex items-center gap-1 text-sm text-pink-600">
                  <Heart className="h-4 w-4" />
                  {parent.pregnancyWeeks} {t("parents.fields.pregnancyWeeks").toLowerCase()}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(true)}
              className="rounded-xl border-2 border-teal-200"
            >
              <Edit className="mr-2 h-4 w-4" />
              {t("common.edit")}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(true)}
              className="rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* LEAD Info */}
      {isLead && (parent.leadSource || parent.leadNotes) && (
        <Card className="rounded-2xl border border-pink-100 bg-pink-50/50 p-6 shadow-lg">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-pink-700">
            <Heart className="h-5 w-5" />
            {t("parents.sections.leadInfo")}
          </h2>
          <div className="space-y-3">
            {parent.leadSource && (
              <div>
                <span className="text-sm text-gray-500">{t("parents.fields.leadSource")}:</span>
                <p className="font-medium">
                  {t(`parents.leadSources.${parent.leadSource}`) || parent.leadSource}
                </p>
              </div>
            )}
            {parent.leadNotes && (
              <div>
                <span className="text-sm text-gray-500">{t("parents.fields.leadNotes")}:</span>
                <p className="whitespace-pre-wrap">{parent.leadNotes}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Babies Section */}
      <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-gray-800">
            <Baby className="h-5 w-5 text-teal-500" />
            {t("parents.sections.babies")}
          </h2>
          {isLead && (
            <Link href={`/${locale}/admin/clients/new?parentId=${parent.id}`}>
              <Button className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-300/50">
                <Plus className="mr-2 h-4 w-4" />
                {t("parents.actions.registerBaby")}
              </Button>
            </Link>
          )}
        </div>

        {hasBabies ? (
          <div className="space-y-3">
            {parent.babies.map((rel) => (
              <Link
                key={rel.baby.id}
                href={`/${locale}/admin/clients/${rel.baby.id}`}
                className="block"
              >
                <Card className="cursor-pointer rounded-xl border border-teal-100 p-4 transition-all hover:border-teal-300 hover:bg-teal-50/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 to-teal-100">
                      <Baby className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{rel.baby.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatDateForDisplay(new Date(rel.baby.birthDate), locale)}
                      </p>
                    </div>
                    {rel.isPrimary && (
                      <Badge className="ml-auto bg-teal-100 text-teal-700">
                        Principal
                      </Badge>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-6">{t("parents.babies.none")}</p>
        )}
      </Card>

      {/* Appointments Section */}
      {parent.appointments.length > 0 && (
        <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-800">
            <Calendar className="h-5 w-5 text-teal-500" />
            {t("parents.sections.history")}
          </h2>
          <div className="space-y-2">
            {parent.appointments.slice(0, 5).map((apt) => (
              <div
                key={apt.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 p-3"
              >
                <div>
                  <p className="font-medium">
                    {formatDateForDisplay(new Date(apt.date), locale)}
                  </p>
                  <p className="text-sm text-gray-500">{apt.startTime}</p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    apt.status === "COMPLETED"
                      ? "border-green-200 text-green-700"
                      : apt.status === "CANCELLED"
                        ? "border-red-200 text-red-700"
                        : "border-teal-200 text-teal-700"
                  }
                >
                  {t(`appointment.${apt.status.toLowerCase()}`) || apt.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Package Purchases Section */}
      {parent.packagePurchases.length > 0 && (
        <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-800">
            <Package className="h-5 w-5 text-teal-500" />
            {t("parents.sections.services")}
          </h2>
          <div className="space-y-2">
            {parent.packagePurchases.map((pp) => (
              <div
                key={pp.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 p-3"
              >
                <div>
                  <p className="font-medium">{pp.package.name}</p>
                  <p className="text-sm text-gray-500">
                    {pp.remainingSessions}/{pp.totalSessions} {t("common.sessionsUnit")}
                  </p>
                </div>
                <Badge
                  className={
                    pp.isActive
                      ? "bg-teal-100 text-teal-700"
                      : "bg-gray-100 text-gray-600"
                  }
                >
                  {pp.isActive ? t("packages.active") : t("packages.completed")}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Edit Dialog */}
      <ParentDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        parent={parent}
        onSuccess={() => {
          setShowEditDialog(false);
          router.refresh();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("parents.messages.cannotDelete")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">
              {t("common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl bg-red-500 text-white hover:bg-red-600"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
