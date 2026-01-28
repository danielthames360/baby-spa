"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserPlus } from "lucide-react";
import { UserDialog } from "./user-dialog";

interface CreateUserButtonProps {
  locale: string;
}

export function CreateUserButton({ locale }: CreateUserButtonProps) {
  const t = useTranslations("users");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:shadow-xl hover:shadow-teal-300/50"
      >
        <UserPlus className="h-5 w-5" />
        {t("newUser")}
      </button>

      <UserDialog
        open={open}
        onOpenChange={setOpen}
        locale={locale}
      />
    </>
  );
}
