"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Copy, Check, Link2, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const createLinkSchema = z.object({
  parentPhone: z
    .string()
    .min(1, "PHONE_REQUIRED")
    .regex(/^\+\d{1,4}\d{6,14}$/, "PHONE_INVALID"), // Must include country code
});

type CreateLinkFormData = z.infer<typeof createLinkSchema>;

interface CreateRegistrationLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRegistrationLinkDialog({
  open,
  onOpenChange,
}: CreateRegistrationLinkDialogProps) {
  const t = useTranslations();
  const locale = useLocale();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<CreateLinkFormData>({
    resolver: zodResolver(createLinkSchema),
    defaultValues: {
      parentPhone: "",
    },
  });

  const translateError = (error: string | undefined): string => {
    if (!error) return "";
    if (error.includes("_")) {
      return t(`registrationLink.errors.${error}`);
    }
    return error;
  };

  const handleSubmit = async (data: CreateLinkFormData) => {
    setIsSubmitting(true);
    setCreatedLink(null);

    try {
      const response = await fetch("/api/registration-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error creating link");
      }

      setCreatedLink(result.url);
    } catch (error) {
      console.error("Error creating registration link:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!createdLink) return;
    await navigator.clipboard.writeText(createdLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!createdLink) return;
    const phone = form.getValues("parentPhone").replace(/\D/g, "");
    const message = encodeURIComponent(
      t("registrationLink.whatsappMessage", { link: createdLink })
    );
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  const handleClose = () => {
    form.reset();
    setCreatedLink(null);
    setCopied(false);
    onOpenChange(false);
  };

  const handleCreateAnother = () => {
    form.reset();
    setCreatedLink(null);
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl border border-white/50 bg-white/90 shadow-xl shadow-teal-500/10 backdrop-blur-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-800">
            <Link2 className="h-5 w-5 text-teal-600" />
            {t("registrationLink.title")}
          </DialogTitle>
          <DialogDescription className="text-gray-500">
            {t("registrationLink.description")}
          </DialogDescription>
        </DialogHeader>

        {!createdLink ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="parentPhone"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      {t("registrationLink.parentPhone")}
                    </FormLabel>
                    <FormControl>
                      <PhoneInput
                        value={field.value}
                        onChange={field.onChange}
                        locale={locale}
                      />
                    </FormControl>
                    <FormMessage>{translateError(fieldState.error?.message)}</FormMessage>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="h-10 rounded-xl border-2 border-gray-200 px-4"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 font-medium text-white shadow-md shadow-teal-300/50 hover:from-teal-600 hover:to-cyan-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("common.loading")}
                    </>
                  ) : (
                    t("registrationLink.createButton")
                  )}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-medium text-emerald-700">
                {t("registrationLink.linkCreated")}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={createdLink}
                  readOnly
                  className="flex-1 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleCopy}
                  className="h-10 w-10 rounded-lg border-emerald-200 hover:bg-emerald-100"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-emerald-600" />
                  )}
                </Button>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              {t("registrationLink.expiresIn")}
            </p>

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleSendWhatsApp}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 font-medium text-white shadow-md shadow-green-300/50 hover:from-green-600 hover:to-emerald-600"
              >
                <Send className="mr-2 h-5 w-5" />
                {t("registrationLink.sendWhatsApp")}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCreateAnother}
                  className="flex-1 h-10 rounded-xl border-2 border-teal-200 font-medium text-teal-600 hover:bg-teal-50"
                >
                  {t("registrationLink.createAnother")}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 h-10 rounded-xl border-2 border-gray-200"
                >
                  {t("common.close")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
