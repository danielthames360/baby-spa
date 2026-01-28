"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  IdCard,
  Plus,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Edit,
  Gift,
  Tag,
  ShoppingBag,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BabyCardVisual } from "@/components/baby-cards/baby-card-visual";

interface SpecialPrice {
  id: string;
  packageId: string;
  specialPrice: number;
  package: {
    id: string;
    name: string;
    basePrice: number;
  } | null;
}

interface Reward {
  id: string;
  sessionNumber: number;
  rewardType: string;
  displayName: string;
  displayIcon: string | null;
}

interface BabyCardItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  totalSessions: number;
  firstSessionDiscount: number;
  isActive: boolean;
  sortOrder: number;
  specialPrices: SpecialPrice[];
  rewards: Reward[];
  _count: {
    purchases: number;
  };
}

export default function BabyCardsPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [babyCards, setBabyCards] = useState<BabyCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  const filteredCards = babyCards.filter((card) => {
    if (filter === "active") return card.isActive;
    if (filter === "inactive") return !card.isActive;
    return true;
  });

  const fetchBabyCards = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/baby-cards");
      if (response.ok) {
        const data = await response.json();
        setBabyCards(data);
      }
    } catch (error) {
      console.error("Error fetching baby cards:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBabyCards();
  }, [fetchBabyCards]);

  const handleToggleActive = async (card: BabyCardItem) => {
    setTogglingId(card.id);
    try {
      const response = await fetch(`/api/baby-cards/${card.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !card.isActive }),
      });
      if (response.ok) {
        fetchBabyCards();
      }
    } catch (error) {
      console.error("Error toggling baby card status:", error);
    } finally {
      setTogglingId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : "es-BO", {
      style: "currency",
      currency: locale === "pt-BR" ? "BRL" : "BOB",
    }).format(price);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-3xl font-bold text-transparent">
            {t("babyCard.title")}
          </h1>
          <p className="mt-1 text-gray-500">{t("babyCard.subtitle")}</p>
        </div>
        <Link href={`/${locale}/admin/baby-cards/new`}>
          <Button className="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600 hover:shadow-xl hover:shadow-teal-400/40">
            <Plus className="mr-2 h-5 w-5" />
            {t("babyCard.newCard")}
          </Button>
        </Link>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
            filter === "all"
              ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md"
              : "bg-white/70 text-gray-600 hover:bg-teal-50 hover:text-teal-700"
          }`}
        >
          {t("common.all")}
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
            filter === "active"
              ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md"
              : "bg-white/70 text-gray-600 hover:bg-teal-50 hover:text-teal-700"
          }`}
        >
          {t("babyCard.info.active")}
        </button>
        <button
          onClick={() => setFilter("inactive")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
            filter === "inactive"
              ? "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md"
              : "bg-white/70 text-gray-600 hover:bg-gray-50 hover:text-gray-700"
          }`}
        >
          {t("babyCard.info.inactive")}
        </button>
      </div>

      {/* Cards List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : filteredCards.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredCards.map((card) => {
            const isToggling = togglingId === card.id;

            return (
              <Card
                key={card.id}
                className={`group relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                  !card.isActive ? "opacity-60" : ""
                }`}
              >
                {/* Decorative top bar */}
                <div className="h-2 w-full bg-gradient-to-r from-teal-400 to-cyan-500" />

                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50">
                        <IdCard className="h-6 w-6 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {card.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 px-2.5 py-0.5 text-xs font-medium text-white">
                            {t("babyCard.list.sessionsCount", {
                              count: card.totalSessions,
                            })}
                          </span>
                          {card.firstSessionDiscount > 0 && (
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                              <Gift className="mr-1 h-3 w-3" />
                              -{formatPrice(card.firstSessionDiscount)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                        card.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {card.isActive
                        ? t("babyCard.info.active")
                        : t("babyCard.info.inactive")}
                    </span>
                  </div>

                  {/* Visual Preview */}
                  <div className="mt-4 flex justify-center">
                    <BabyCardVisual
                      name={card.name}
                      totalSessions={card.totalSessions}
                      completedSessions={0}
                      rewards={card.rewards}
                      variant="preview"
                    />
                  </div>

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-gray-50 px-2 py-2">
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                        <Gift className="h-3 w-3" />
                        {t("babyCard.rewards.title")}
                      </div>
                      <div className="font-semibold text-gray-800">
                        {card.rewards.length}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-2 py-2">
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                        <Tag className="h-3 w-3" />
                        {t("babyCard.specialPrices.title")}
                      </div>
                      <div className="font-semibold text-gray-800">
                        {card.specialPrices.length}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 px-2 py-2">
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                        <ShoppingBag className="h-3 w-3" />
                        {t("babyCard.list.purchasesCount", { count: "" })}
                      </div>
                      <div className="font-semibold text-gray-800">
                        {card._count.purchases}
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-800">
                      {formatPrice(card.price)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2 pt-4 border-t border-gray-100">
                    <Link
                      href={`/${locale}/admin/baby-cards/${card.id}/edit`}
                      className="flex-1"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-9 rounded-xl border-2 border-teal-200 text-teal-600 hover:bg-teal-50"
                      >
                        <Edit className="mr-1.5 h-4 w-4" />
                        {t("common.edit")}
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(card)}
                      disabled={isToggling}
                      className={`flex-1 h-9 rounded-xl border-2 ${
                        card.isActive
                          ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                          : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : card.isActive ? (
                        <ToggleRight className="mr-1.5 h-4 w-4" />
                      ) : (
                        <ToggleLeft className="mr-1.5 h-4 w-4" />
                      )}
                      {card.isActive
                        ? t("babyCard.list.deactivate")
                        : t("babyCard.list.activate")}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="rounded-2xl border border-white/50 bg-white/70 p-12 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100">
              <IdCard className="h-8 w-8 text-teal-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-600">
              {t("babyCard.list.empty")}
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              {t("babyCard.list.emptyDesc")}
            </p>
            <Link href={`/${locale}/admin/baby-cards/new`}>
              <Button className="mt-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600">
                <Plus className="mr-2 h-4 w-4" />
                {t("babyCard.newCard")}
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
