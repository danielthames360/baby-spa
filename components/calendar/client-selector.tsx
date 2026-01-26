"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Baby,
  Search,
  Loader2,
  User,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types for baby search result
export interface BabySearchResult {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  parents: {
    isPrimary: boolean;
    parent: {
      id: string;
      name: string;
      phone: string;
    };
  }[];
  packagePurchases: {
    id: string;
    remainingSessions: number;
    totalSessions: number;
    usedSessions: number;
    isActive: boolean;
    package: {
      id: string;
      name: string;
      categoryId: string | null;
      duration: number;
    };
  }[];
}

// Types for parent search result
export interface ParentSearchResult {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  pregnancyWeeks: number | null;
  packagePurchases?: {
    id: string;
    remainingSessions: number;
    totalSessions: number;
    isActive: boolean;
    package: {
      id: string;
      name: string;
      categoryId: string | null;
      duration: number;
    };
  }[];
}

export type ClientType = "BABY" | "PARENT";

export interface SelectedClient {
  type: ClientType;
  baby?: BabySearchResult | null;
  parent?: ParentSearchResult | null;
}

interface ClientSelectorProps {
  onClientSelect: (client: SelectedClient | null) => void;
  selectedClient: SelectedClient | null;
  defaultType?: ClientType;
}

export function ClientSelector({
  onClientSelect,
  selectedClient,
  defaultType = "BABY",
}: ClientSelectorProps) {
  const t = useTranslations();

  const [clientType, setClientType] = useState<ClientType>(defaultType);
  const [searchQuery, setSearchQuery] = useState("");
  const [babyResults, setBabyResults] = useState<BabySearchResult[]>([]);
  const [parentResults, setParentResults] = useState<ParentSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Reset search when type changes
  useEffect(() => {
    setSearchQuery("");
    setBabyResults([]);
    setParentResults([]);
  }, [clientType]);

  // Search babies
  const searchBabies = useCallback(async (query: string) => {
    if (query.length < 2) {
      setBabyResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/babies?search=${encodeURIComponent(query)}&limit=5`,
      );
      const data = await response.json();
      setBabyResults(data.babies || []);
    } catch (err) {
      console.error("Error searching babies:", err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Search parents
  const searchParents = useCallback(async (query: string) => {
    if (query.length < 2) {
      setParentResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/parents?search=${encodeURIComponent(query)}&limit=5`,
      );
      const data = await response.json();
      setParentResults(data.parents || []);
    } catch (err) {
      console.error("Error searching parents:", err);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        if (clientType === "BABY") {
          searchBabies(searchQuery);
        } else {
          searchParents(searchQuery);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, clientType, searchBabies, searchParents]);

  // Handle baby selection
  const handleBabySelect = (baby: BabySearchResult) => {
    onClientSelect({
      type: "BABY",
      baby,
      parent: null,
    });
  };

  // Handle parent selection
  const handleParentSelect = (parent: ParentSearchResult) => {
    onClientSelect({
      type: "PARENT",
      baby: null,
      parent,
    });
  };

  // Clear selection
  const handleClearSelection = () => {
    onClientSelect(null);
    setSearchQuery("");
    setBabyResults([]);
    setParentResults([]);
  };

  // If a client is selected, show the selection card
  if (selectedClient) {
    const isBaby = selectedClient.type === "BABY" && selectedClient.baby;
    const isParent = selectedClient.type === "PARENT" && selectedClient.parent;

    return (
      <div className="flex items-center justify-between rounded-xl border-2 border-teal-200 bg-teal-50 p-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            isBaby
              ? "bg-gradient-to-br from-teal-500 to-cyan-500"
              : "bg-gradient-to-br from-rose-400 to-pink-500"
          )}>
            {isBaby ? (
              <Baby className="h-6 w-6 text-white" />
            ) : (
              <UserRound className="h-6 w-6 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-800">
                {isBaby ? selectedClient.baby?.name : selectedClient.parent?.name}
              </p>
              <span className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                isBaby
                  ? "bg-cyan-100 text-cyan-700"
                  : "bg-rose-100 text-rose-700"
              )}>
                {isBaby ? t("calendar.clientType.baby") : t("calendar.clientType.parent")}
              </span>
            </div>
            {isBaby && selectedClient.baby?.parents.find((p) => p.isPrimary) && (
              <p className="flex items-center gap-1 text-sm text-gray-500">
                <User className="h-3 w-3" />
                {selectedClient.baby.parents.find((p) => p.isPrimary)?.parent.name}
              </p>
            )}
            {isParent && selectedClient.parent?.phone && (
              <p className="text-sm text-gray-500">
                {selectedClient.parent.phone}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearSelection}
          className="text-gray-500 hover:text-gray-700"
        >
          {t("calendar.change")}
        </Button>
      </div>
    );
  }

  // Show search interface
  return (
    <div className="space-y-4">
      {/* Client type toggle */}
      <div className="space-y-2">
        <Label className="text-gray-700">
          {t("calendar.selectClientType")}
        </Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={clientType === "BABY" ? "default" : "outline"}
            onClick={() => setClientType("BABY")}
            className={cn(
              "flex-1 rounded-xl",
              clientType === "BABY"
                ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                : "border-2 border-teal-200"
            )}
          >
            <Baby className="mr-2 h-4 w-4" />
            {t("calendar.clientType.baby")}
          </Button>
          <Button
            type="button"
            variant={clientType === "PARENT" ? "default" : "outline"}
            onClick={() => setClientType("PARENT")}
            className={cn(
              "flex-1 rounded-xl",
              clientType === "PARENT"
                ? "bg-gradient-to-r from-rose-400 to-pink-500 text-white"
                : "border-2 border-rose-200"
            )}
          >
            <UserRound className="mr-2 h-4 w-4" />
            {t("calendar.clientType.parent")}
          </Button>
        </div>
      </div>

      {/* Search input */}
      <div className="space-y-3">
        <Label className="text-gray-700">
          {clientType === "BABY"
            ? t("calendar.searchBaby")
            : t("calendar.searchParent")}
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              clientType === "BABY"
                ? t("calendar.searchBabyPlaceholder")
                : t("calendar.searchParentPlaceholder")
            }
            className="h-12 rounded-xl border-2 border-teal-100 pl-10 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-teal-500" />
          )}
        </div>

        {/* Baby search results */}
        {clientType === "BABY" && babyResults.length > 0 && (
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-gray-100 p-2">
            {babyResults.map((baby) => {
              const totalRemainingSessions = baby.packagePurchases
                .filter((p) => p.isActive && p.remainingSessions > 0)
                .reduce((sum, p) => sum + p.remainingSessions, 0);
              const primaryParent = baby.parents.find((p) => p.isPrimary);

              return (
                <button
                  key={baby.id}
                  onClick={() => handleBabySelect(baby)}
                  className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-teal-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-cyan-100">
                      <Baby className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{baby.name}</p>
                      {primaryParent && (
                        <p className="text-sm text-gray-500">
                          {primaryParent.parent.name}
                        </p>
                      )}
                    </div>
                  </div>
                  {totalRemainingSessions > 0 ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                      {totalRemainingSessions} {t("common.sessionsUnit")}
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                      {t("calendar.noPackage")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Parent search results */}
        {clientType === "PARENT" && parentResults.length > 0 && (
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-gray-100 p-2">
            {parentResults.map((parent) => (
              <button
                key={parent.id}
                onClick={() => handleParentSelect(parent)}
                className="flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-rose-50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-pink-100">
                    <UserRound className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{parent.name}</p>
                    <p className="text-sm text-gray-500">{parent.phone}</p>
                  </div>
                </div>
                {parent.pregnancyWeeks && (
                  <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                    {parent.pregnancyWeeks} {t("parents.weeksShort")}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* No results message */}
        {searchQuery.length >= 2 &&
          ((clientType === "BABY" && babyResults.length === 0) ||
            (clientType === "PARENT" && parentResults.length === 0)) &&
          !isSearching && (
            <p className="text-center text-sm text-gray-500">
              {t("common.noResults")}
            </p>
          )}
      </div>
    </div>
  );
}
