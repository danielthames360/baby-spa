"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useCallback } from "react";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActivityType } from "@prisma/client";

interface User {
  id: string;
  name: string;
  role: string;
}

interface ActivityFiltersProps {
  locale: string;
  users: User[];
  initialFilters: {
    types?: string;
    performedById?: string;
    from?: string;
    to?: string;
  };
}

// Activity type groups for easier filtering
const ACTIVITY_TYPE_GROUPS = {
  appointments: [
    "APPOINTMENT_CREATED",
    "APPOINTMENT_CREATED_PORTAL",
    "APPOINTMENT_CANCELLED",
    "APPOINTMENT_CANCELLED_PORTAL",
    "APPOINTMENT_RESCHEDULED",
    "APPOINTMENT_RESCHEDULED_PORTAL",
  ],
  sessions: ["SESSION_COMPLETED", "DISCOUNT_APPLIED"],
  babyCards: ["BABY_CARD_SOLD", "BABY_CARD_REWARD_DELIVERED"],
  clients: ["BABY_CREATED", "CLIENT_UPDATED"],
  packages: ["PACKAGE_ASSIGNED", "INSTALLMENT_PAID"],
  events: ["EVENT_REGISTRATION"],
  evaluations: ["EVALUATION_SAVED"],
} as const;

export function ActivityFilters({
  locale,
  users,
  initialFilters,
}: ActivityFiltersProps) {
  const router = useRouter();
  const t = useTranslations("activity");
  const tRoles = useTranslations("roles");

  const [filters, setFilters] = useState({
    typeGroup: initialFilters.types ? "custom" : "all",
    performedById: initialFilters.performedById || "all",
    from: initialFilters.from || "",
    to: initialFilters.to || "",
  });

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();

    // Handle type group
    if (filters.typeGroup !== "all" && filters.typeGroup !== "custom") {
      const types =
        ACTIVITY_TYPE_GROUPS[
          filters.typeGroup as keyof typeof ACTIVITY_TYPE_GROUPS
        ];
      if (types) {
        params.set("types", types.join(","));
      }
    }

    if (filters.performedById !== "all") {
      params.set("performedById", filters.performedById);
    }

    if (filters.from) {
      params.set("from", filters.from);
    }

    if (filters.to) {
      params.set("to", filters.to);
    }

    const query = params.toString();
    router.push(`/${locale}/admin/activity${query ? `?${query}` : ""}`);
  }, [filters, locale, router]);

  const clearFilters = useCallback(() => {
    setFilters({
      typeGroup: "all",
      performedById: "all",
      from: "",
      to: "",
    });
    router.push(`/${locale}/admin/activity`);
  }, [locale, router]);

  const hasActiveFilters =
    filters.typeGroup !== "all" ||
    filters.performedById !== "all" ||
    filters.from ||
    filters.to;

  return (
    <div className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg shadow-teal-500/10 backdrop-blur-md">
      <div className="flex flex-wrap items-end gap-4">
        {/* Activity Type Group */}
        <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500">
            {t("filters.type")}
          </label>
          <Select
            value={filters.typeGroup}
            onValueChange={(value) =>
              setFilters((f) => ({ ...f, typeGroup: value }))
            }
          >
            <SelectTrigger className="h-10 rounded-xl border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
              <SelectItem value="appointments">
                {t("filters.typeGroups.appointments")}
              </SelectItem>
              <SelectItem value="sessions">
                {t("filters.typeGroups.sessions")}
              </SelectItem>
              <SelectItem value="babyCards">
                {t("filters.typeGroups.babyCards")}
              </SelectItem>
              <SelectItem value="clients">
                {t("filters.typeGroups.clients")}
              </SelectItem>
              <SelectItem value="packages">
                {t("filters.typeGroups.packages")}
              </SelectItem>
              <SelectItem value="events">
                {t("filters.typeGroups.events")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Performed By */}
        <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500">
            {t("filters.performedBy")}
          </label>
          <Select
            value={filters.performedById}
            onValueChange={(value) =>
              setFilters((f) => ({ ...f, performedById: value }))
            }
          >
            <SelectTrigger className="h-10 rounded-xl border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allUsers")}</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} ({tRoles(user.role.toLowerCase())})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div className="flex min-w-[150px] flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500">
            {t("filters.from")}
          </label>
          <Input
            type="date"
            value={filters.from}
            onChange={(e) =>
              setFilters((f) => ({ ...f, from: e.target.value }))
            }
            className="h-10 rounded-xl border-gray-200"
          />
        </div>

        {/* Date To */}
        <div className="flex min-w-[150px] flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-500">
            {t("filters.to")}
          </label>
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            className="h-10 rounded-xl border-gray-200"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={applyFilters}
            className="h-10 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 font-medium text-white shadow-md shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
          >
            <Filter className="mr-2 h-4 w-4" />
            {t("filters.apply")}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={clearFilters}
              className="h-10 rounded-xl border-gray-200 px-4 font-medium"
            >
              <X className="mr-2 h-4 w-4" />
              {t("filters.clear")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
