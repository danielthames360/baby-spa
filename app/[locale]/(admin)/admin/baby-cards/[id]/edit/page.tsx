"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BabyCardForm } from "@/components/baby-cards/baby-card-form";
import { hasPermission } from "@/lib/permissions";
import { UserRole } from "@prisma/client";

interface BabyCardData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  totalSessions: number;
  firstSessionDiscount: number;
  isActive: boolean;
  sortOrder: number;
  specialPrices: Array<{
    id: string;
    packageId: string;
    specialPrice: number;
    package: { id: string; name: string; basePrice: number } | null;
  }>;
  rewards: Array<{
    id: string;
    sessionNumber: number;
    rewardType: string;
    packageId: string | null;
    productId: string | null;
    customName: string | null;
    customDescription: string | null;
    displayName: string;
    displayIcon: string | null;
  }>;
}

export default function EditBabyCardPage() {
  const t = useTranslations();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const id = params.id as string;
  const { data: session } = useSession();
  const userRole = (session?.user?.role as UserRole) || "RECEPTION";

  // Determinar si es modo solo lectura
  const isViewMode = searchParams.get("view") === "true";
  const canEdit = hasPermission(userRole, "baby-cards:create");
  const readOnly = isViewMode || !canEdit;

  const [babyCard, setBabyCard] = useState<BabyCardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBabyCard() {
      try {
        const response = await fetch(`/api/baby-cards/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch baby card");
        }
        const data = await response.json();
        setBabyCard(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }
    fetchBabyCard();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (error || !babyCard) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-500">{error || "Baby Card not found"}</p>
        <Link href={`/${locale}/admin/baby-cards`}>
          <Button variant="outline" className="mt-4">
            {t("common.back")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/admin/baby-cards`}>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl hover:bg-teal-50"
          >
            <ChevronLeft className="h-5 w-5 text-teal-600" />
          </Button>
        </Link>
        <div>
          <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-3xl font-bold text-transparent">
            {readOnly ? t("babyCard.viewCard") : t("babyCard.editCard")}
          </h1>
          <p className="mt-1 text-gray-500">{babyCard.name}</p>
        </div>
      </div>

      {/* Form */}
      <BabyCardForm babyCard={babyCard} readOnly={readOnly} />
    </div>
  );
}
