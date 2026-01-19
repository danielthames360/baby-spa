"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ParentSearch } from "@/components/parents/parent-search";
import { ParentFormFields } from "@/components/parents/parent-form";
import { parentSchema } from "@/lib/validations/baby";
import { z } from "zod";

interface SelectedParent {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  accessCode: string;
}

interface AddParentDialogProps {
  babyId: string;
  babyName: string;
  existingParentIds: string[];
  onSuccess: () => void;
  onClose: () => void;
}

type ParentFormValues = z.infer<typeof parentSchema>;

export function AddParentDialog({
  babyId,
  babyName,
  existingParentIds,
  onSuccess,
  onClose,
}: AddParentDialogProps) {
  const t = useTranslations();

  const [selectedParent, setSelectedParent] = useState<SelectedParent | null>(null);
  const [isCreatingParent, setIsCreatingParent] = useState(false);
  const [relationship, setRelationship] = useState("GUARDIAN");
  const [isPrimary, setIsPrimary] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parentForm = useForm({
    resolver: zodResolver(parentSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      relationship: "GUARDIAN",
      isPrimary: false,
    } as ParentFormValues,
  });

  const handleSelectParent = (parent: SelectedParent) => {
    // Don't select if already linked to baby
    if (existingParentIds.includes(parent.id)) {
      return;
    }
    setSelectedParent(parent);
    setIsCreatingParent(false);
    setError(null);
  };

  const handleCreateNewParent = () => {
    setSelectedParent(null);
    setIsCreatingParent(true);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedParent && !isCreatingParent) {
      setError(t("babyForm.errors.PARENT_REQUIRED"));
      return;
    }

    if (isCreatingParent) {
      const isValid = await parentForm.trigger();
      if (!isValid) return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        relationship,
        isPrimary,
      };

      if (selectedParent) {
        body.existingParentId = selectedParent.id;
      } else {
        body.parentData = parentForm.getValues();
      }

      const response = await fetch(`/api/babies/${babyId}/parents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "PHONE_EXISTS") {
          setError(t("babyForm.errors.PHONE_EXISTS"));
        } else {
          setError(t("addParentDialog.error"));
        }
        return;
      }

      onSuccess();
    } catch (err) {
      console.error("Error adding parent:", err);
      setError(t("addParentDialog.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/50 bg-white/95 p-6 shadow-xl backdrop-blur-md">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-800">
              <UserPlus className="h-5 w-5 text-teal-600" />
              {t("addParentDialog.title")}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t("addParentDialog.subtitle", { babyName })}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 rounded-xl hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Parent Selection/Creation */}
        <div className="space-y-4">
          {!isCreatingParent ? (
            <ParentSearch
              onSelect={handleSelectParent}
              onCreateNew={handleCreateNewParent}
              selectedParentId={selectedParent?.id}
              excludeIds={existingParentIds}
            />
          ) : (
            <Form {...parentForm}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-700">
                    {t("babyForm.parentForm.title")}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreatingParent(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
                <ParentFormFields form={parentForm} isPrimary hideRelationshipFields />
              </div>
            </Form>
          )}

          {/* Relationship selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t("addParentDialog.relationship")}
            </label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger className="h-12 rounded-xl border-2 border-teal-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MOTHER">
                  {t("babyForm.parentForm.mother")}
                </SelectItem>
                <SelectItem value="FATHER">
                  {t("babyForm.parentForm.father")}
                </SelectItem>
                <SelectItem value="GUARDIAN">
                  {t("babyForm.parentForm.guardian")}
                </SelectItem>
                <SelectItem value="OTHER">
                  {t("babyForm.parentForm.other")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Set as primary checkbox */}
          <div className="flex items-center gap-3 rounded-xl border-2 border-teal-100 bg-teal-50/50 p-4">
            <Checkbox
              id="isPrimary"
              checked={isPrimary}
              onCheckedChange={(checked) => setIsPrimary(checked === true)}
              className="h-5 w-5 rounded border-2 border-teal-300 data-[state=checked]:bg-teal-500 data-[state=checked]:text-white"
            />
            <div>
              <label
                htmlFor="isPrimary"
                className="cursor-pointer text-sm font-medium text-gray-700"
              >
                {t("addParentDialog.setPrimary")}
              </label>
              {isPrimary && (
                <p className="text-xs text-amber-600">
                  {t("addParentDialog.primaryWarning")}
                </p>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-12 rounded-xl border-2 border-teal-200 px-6 font-medium text-teal-600 transition-all hover:bg-teal-50"
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || (!selectedParent && !isCreatingParent)}
              className="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {t("addParentDialog.adding")}
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-5 w-5" />
                  {t("common.add")}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
