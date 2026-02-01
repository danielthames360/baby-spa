"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, Phone, Calendar } from "lucide-react";

interface NoShowItem {
  id: string;
  date: string;
  startTime: string;
  babyName: string;
  parentName: string;
  parentPhone: string | null;
}

interface NoShowListProps {
  items: NoShowItem[];
  locale: string;
}

export function NoShowList({ items, locale }: NoShowListProps) {
  const t = useTranslations("reports.attendance");

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/50 bg-white/70 p-8 text-center shadow-lg backdrop-blur-md">
        <div className="flex flex-col items-center gap-2">
          <Calendar className="h-12 w-12 text-emerald-500" />
          <p className="font-medium text-gray-900">{t("noNoShows")}</p>
          <p className="text-sm text-gray-500">{t("allAttended")}</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(
      locale === "pt-BR" ? "pt-BR" : "es-BO",
      { weekday: "short", day: "2-digit", month: "short" }
    );
  };

  return (
    <div className="rounded-2xl border border-white/50 bg-white/70 shadow-lg backdrop-blur-md">
      <div className="border-b border-gray-100 p-4">
        <h3 className="font-semibold text-gray-900">{t("noShowList")}</h3>
        <p className="text-sm text-gray-500">{t("noShowListDescription")}</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-100">
            <TableHead className="text-gray-500">{t("date")}</TableHead>
            <TableHead className="text-gray-500">{t("time")}</TableHead>
            <TableHead className="text-gray-500">{t("baby")}</TableHead>
            <TableHead className="text-gray-500">{t("parent")}</TableHead>
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="border-b border-gray-50">
              <TableCell className="text-gray-600">
                {formatDate(item.date)}
              </TableCell>
              <TableCell className="font-medium text-gray-900">
                {item.startTime}
              </TableCell>
              <TableCell className="font-medium text-gray-900">
                {item.babyName}
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-gray-600">{item.parentName}</p>
                  {item.parentPhone && (
                    <p className="text-xs text-gray-400">{item.parentPhone}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {item.parentPhone && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <a href={`tel:${item.parentPhone}`}>
                        <Phone className="h-4 w-4 text-gray-400" />
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    asChild
                  >
                    <Link href={`/${locale}/admin/calendar?date=${item.date.split("T")[0]}`}>
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                    </Link>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
