"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  Baby,
  Loader2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ParentFormFields } from "@/components/parents/parent-form";
import { BabyFormFields } from "@/components/babies/baby-form";
import {
  primaryParentSchema,
  babySchema,
} from "@/lib/validations/baby";

type Step = "parent" | "baby";

interface RegisteredBaby {
  id: string;
  name: string;
  birthDate: string;
  parents: {
    isPrimary: boolean;
    parent: {
      name: string;
      phone: string | null;
    };
  }[];
}

interface RegisterClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (baby: RegisteredBaby) => void;
}

type PrimaryParentFormValues = z.infer<typeof primaryParentSchema>;

export function RegisterClientDialog({
  open,
  onOpenChange,
  onSuccess,
}: RegisterClientDialogProps) {
  const t = useTranslations();
  const tEvents = useTranslations("events");

  const [step, setStep] = useState<Step>("parent");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const parentForm = useForm({
    resolver: zodResolver(primaryParentSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      relationship: "MOTHER",
      isPrimary: true,
    } as PrimaryParentFormValues,
  });

  const babyForm = useForm({
    resolver: zodResolver(babySchema),
    defaultValues: {
      name: "",
      birthDate: undefined,
      gender: undefined,
      birthType: undefined,
      birthWeeks: undefined,
      birthWeight: undefined,
      birthDifficulty: false,
      birthDifficultyDesc: undefined,
      pregnancyIssues: false,
      pregnancyIssuesDesc: undefined,
      priorStimulation: false,
      priorStimulationType: undefined,
      developmentDiagnosis: false,
      developmentDiagnosisDesc: undefined,
      diagnosedIllness: false,
      diagnosedIllnessDesc: undefined,
      recentMedication: false,
      recentMedicationDesc: undefined,
      allergies: undefined,
      specialObservations: undefined,
      socialMediaConsent: false,
      instagramHandle: undefined,
      referralSource: undefined,
    },
  });

  const handleNextFromParent = async () => {
    const isValid = await parentForm.trigger();
    if (!isValid) return;
    setStep("baby");
  };

  const handleSubmit = async () => {
    const isValid = await babyForm.trigger();
    if (!isValid) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const babyData = babyForm.getValues();
      const parentData = parentForm.getValues();

      const response = await fetch("/api/babies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baby: babyData,
          parent1: parentData,
          existingParent1Id: null,
          parent2: null,
          existingParent2Id: null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "PHONE_EXISTS") {
          setSubmitError(t("babyForm.errors.PHONE_EXISTS"));
        } else {
          setSubmitError(data.error || t("common.error"));
        }
        return;
      }

      // Convert baby data to the format expected by parent component
      const registeredBaby: RegisteredBaby = {
        id: data.baby.id,
        name: data.baby.name,
        birthDate: data.baby.birthDate,
        parents: data.baby.parents,
      };

      onSuccess(registeredBaby);
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating client:", error);
      setSubmitError(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep("parent");
    setSubmitError(null);
    parentForm.reset();
    babyForm.reset();
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); else onOpenChange(o); }}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-hidden rounded-2xl p-0">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              {step === "parent" ? (
                <>
                  <User className="h-5 w-5 text-teal-600" />
                  {tEvents("participants.registerNew")}
                </>
              ) : (
                <>
                  <Baby className="h-5 w-5 text-teal-600" />
                  {t("babyForm.babyData.title")}
                </>
              )}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 rounded-lg"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Step indicator */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
              step === "parent"
                ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                : "bg-teal-100 text-teal-700"
            }`}>
              {step !== "parent" ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <User className="h-3.5 w-3.5" />
              )}
              <span>1. {t("babyForm.steps.parent1")}</span>
            </div>
            <div className={`h-0.5 w-6 ${step === "baby" ? "bg-teal-500" : "bg-gray-200"}`} />
            <div className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
              step === "baby"
                ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white"
                : "bg-gray-100 text-gray-400"
            }`}>
              <Baby className="h-3.5 w-3.5" />
              <span>2. {t("babyForm.steps.baby")}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          {/* Step 1: Parent */}
          {step === "parent" && (
            <Form {...parentForm}>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  {t("babyForm.searchParent.newParentInfo")}
                </p>
                <ParentFormFields form={parentForm} isPrimary hideRelationshipFields />
              </div>
            </Form>
          )}

          {/* Step 2: Baby */}
          {step === "baby" && (
            <Form {...babyForm}>
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  {tEvents("participants.babyDataInfo")}
                </p>
                <BabyFormFields form={babyForm} />
              </div>
            </Form>
          )}

          {/* Error message */}
          {submitError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50/50 px-6 py-4">
          <div className="flex justify-between">
            {step === "parent" ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="h-10 rounded-xl border-2 border-gray-200 px-4"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleNextFromParent}
                  className="h-10 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 font-semibold text-white shadow-lg shadow-teal-300/50"
                >
                  {t("common.next")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setStep("parent")}
                  disabled={isSubmitting}
                  className="h-10 rounded-xl border-2 border-gray-200 px-4"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("common.back")}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="h-10 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 font-semibold text-white shadow-lg shadow-teal-300/50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("common.loading")}
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      {tEvents("participants.registerAndSelect")}
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
