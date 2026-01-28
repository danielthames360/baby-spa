"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BabyCardForm } from "@/components/baby-cards/baby-card-form";

export default function NewBabyCardPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

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
            {t("babyCard.newCard")}
          </h1>
          <p className="mt-1 text-gray-500">{t("babyCard.subtitle")}</p>
        </div>
      </div>

      {/* Form */}
      <BabyCardForm />
    </div>
  );
}
