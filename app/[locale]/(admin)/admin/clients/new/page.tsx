"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  User,
  UserPlus,
  Baby,
  ClipboardCheck,
  Loader2,
  Copy,
  CheckCircle,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { ParentSearch } from "@/components/parents/parent-search";
import { ParentFormFields } from "@/components/parents/parent-form";
import { BabyFormFields } from "@/components/babies/baby-form";
import {
  primaryParentSchema,
  secondaryParentSchema,
  babySchema,
} from "@/lib/validations/baby";
import { z } from "zod";

type Step = "parent1" | "parent2" | "baby" | "confirm";

interface SelectedParent {
  id: string;
  name: string;
  phone: string;
  documentId: string;
  documentType: string;
  email: string | null;
  accessCode: string;
}

interface CreatedBaby {
  id: string;
  name: string;
  parents: {
    parent: {
      accessCode: string;
      name: string;
    };
  }[];
}

type PrimaryParentFormValues = z.infer<typeof primaryParentSchema>;
type SecondaryParentFormValues = z.infer<typeof secondaryParentSchema>;

export default function NewBabyPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [step, setStep] = useState<Step>("parent1");

  // Parent 1 (Primary) state
  const [selectedParent1, setSelectedParent1] = useState<SelectedParent | null>(null);
  const [isCreatingParent1, setIsCreatingParent1] = useState(false);

  // Parent 2 (Secondary/Optional) state
  const [selectedParent2, setSelectedParent2] = useState<SelectedParent | null>(null);
  const [isCreatingParent2, setIsCreatingParent2] = useState(false);
  const [skipParent2, setSkipParent2] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBaby, setCreatedBaby] = useState<CreatedBaby | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const parent1Form = useForm({
    resolver: zodResolver(primaryParentSchema),
    defaultValues: {
      name: "",
      documentId: "",
      documentType: "CI",
      phone: "",
      email: "",
      relationship: "MOTHER",
      isPrimary: true,
    } as PrimaryParentFormValues,
  });

  const parent2Form = useForm({
    resolver: zodResolver(secondaryParentSchema),
    defaultValues: {
      name: "",
      documentId: "",
      documentType: "CI",
      phone: "",
      email: "",
      relationship: "FATHER",
      isPrimary: false,
    } as SecondaryParentFormValues,
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

  // Parent 1 handlers
  const handleSelectParent1 = (parent: SelectedParent) => {
    setSelectedParent1(parent);
    setIsCreatingParent1(false);
  };

  const handleCreateNewParent1 = () => {
    setSelectedParent1(null);
    setIsCreatingParent1(true);
  };

  // Parent 2 handlers
  const handleSelectParent2 = (parent: SelectedParent) => {
    setSelectedParent2(parent);
    setIsCreatingParent2(false);
    setSkipParent2(false);
  };

  const handleCreateNewParent2 = () => {
    setSelectedParent2(null);
    setIsCreatingParent2(true);
    setSkipParent2(false);
  };

  const handleSkipParent2 = () => {
    setSelectedParent2(null);
    setIsCreatingParent2(false);
    setSkipParent2(true);
    setStep("baby");
  };

  // Navigation handlers
  const handleNextFromParent1 = async () => {
    if (isCreatingParent1) {
      const isValid = await parent1Form.trigger();
      if (!isValid) return;
    }
    setStep("parent2");
  };

  const handleNextFromParent2 = async () => {
    if (isCreatingParent2) {
      const isValid = await parent2Form.trigger();
      if (!isValid) return;
    }
    setStep("baby");
  };

  const handleNextFromBaby = async () => {
    const isValid = await babyForm.trigger();
    if (!isValid) return;
    setStep("confirm");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const babyData = babyForm.getValues();
      const parent1Data = isCreatingParent1 ? parent1Form.getValues() : null;
      const parent2Data = isCreatingParent2 ? parent2Form.getValues() : null;

      const response = await fetch("/api/babies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baby: babyData,
          parent1: parent1Data,
          existingParent1Id: selectedParent1?.id || null,
          parent2: skipParent2 ? null : parent2Data,
          existingParent2Id: skipParent2 ? null : (selectedParent2?.id || null),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "DOCUMENT_EXISTS") {
          setSubmitError(t("babyForm.errors.DOCUMENT_EXISTS"));
        } else if (data.error === "PHONE_EXISTS") {
          setSubmitError(t("babyForm.errors.PHONE_EXISTS"));
        } else {
          setSubmitError(data.error || t("common.error"));
        }
        return;
      }

      setCreatedBaby(data.baby);
    } catch (error) {
      console.error("Error creating baby:", error);
      setSubmitError(t("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const steps = [
    { id: "parent1", label: t("babyForm.steps.parent1"), icon: User },
    { id: "parent2", label: t("babyForm.steps.parent2"), icon: UserPlus },
    { id: "baby", label: t("babyForm.steps.baby"), icon: Baby },
    { id: "confirm", label: t("babyForm.steps.confirm"), icon: ClipboardCheck },
  ];

  const getStepStatus = (stepId: string) => {
    const stepOrder = ["parent1", "parent2", "baby", "confirm"];
    const currentIndex = stepOrder.indexOf(step);
    const stepIndex = stepOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  // Success state
  if (createdBaby) {
    const accessCode = createdBaby.parents[0]?.parent.accessCode || "";

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="rounded-3xl border border-white/50 bg-white/70 p-8 shadow-lg shadow-teal-500/10 backdrop-blur-md">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-gray-800">
              {t("babyForm.success.title")}
            </h2>
            <p className="mt-2 text-gray-500">{t("babyForm.success.message")}</p>

            {/* Access Code */}
            <div className="mt-8 w-full rounded-2xl border-2 border-teal-200 bg-teal-50 p-6">
              <p className="text-sm text-teal-600">
                {t("babyForm.success.accessCode")}
              </p>
              <div className="mt-2 flex items-center justify-center gap-3">
                <span className="font-mono text-3xl font-bold text-teal-700">
                  {accessCode}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleCopyCode(accessCode)}
                  className="h-10 w-10 rounded-xl hover:bg-teal-100"
                >
                  {codeCopied ? (
                    <Check className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Copy className="h-5 w-5 text-teal-600" />
                  )}
                </Button>
              </div>
              <p className="mt-3 text-xs text-teal-500">
                {t("babyForm.success.accessCodeNote")}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => router.push(`/${locale}/admin/clients/${createdBaby.id}`)}
                className="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
              >
                {t("babyForm.success.goToProfile")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCreatedBaby(null);
                  setStep("parent1");
                  setSelectedParent1(null);
                  setIsCreatingParent1(false);
                  setSelectedParent2(null);
                  setIsCreatingParent2(false);
                  setSkipParent2(false);
                  parent1Form.reset();
                  parent2Form.reset();
                  babyForm.reset();
                }}
                className="h-12 rounded-xl border-2 border-teal-200 px-6 font-medium text-teal-600 transition-all hover:bg-teal-50"
              >
                {t("babyForm.success.registerAnother")}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-10 w-10 rounded-xl hover:bg-teal-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Button>
        <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-2xl font-bold text-transparent">
          {t("babyForm.createTitle")}
        </h1>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {steps.map((s, index) => {
          const Icon = s.icon;
          const status = getStepStatus(s.id);
          const isActive = status === "active";
          const isCompleted = status === "completed";
          const isSkipped = s.id === "parent2" && skipParent2 && step !== "parent2";

          return (
            <div key={s.id} className="flex items-center">
              {index > 0 && (
                <div
                  className={`mx-1 h-0.5 w-4 sm:mx-2 sm:w-8 ${
                    isCompleted || isSkipped ? "bg-teal-500" : "bg-gray-200"
                  }`}
                />
              )}
              <div
                className={`flex items-center gap-1 rounded-full px-2 py-1.5 transition-all sm:gap-2 sm:px-4 sm:py-2 ${
                  isActive
                    ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg"
                    : isCompleted || isSkipped
                      ? "bg-teal-100 text-teal-700"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : isSkipped ? (
                  <SkipForward className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="hidden text-sm font-medium md:inline">
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card className="rounded-3xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md sm:p-8">
        {/* Step 1: Primary Parent */}
        {step === "parent1" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {t("babyForm.steps.parent1")}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {t("babyForm.searchParent.selectExisting")}
              </p>
            </div>

            {!isCreatingParent1 ? (
              <ParentSearch
                onSelect={handleSelectParent1}
                onCreateNew={handleCreateNewParent1}
                selectedParentId={selectedParent1?.id}
              />
            ) : (
              <Form {...parent1Form}>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-700">
                      {t("babyForm.parentForm.title")}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCreatingParent1(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {t("common.cancel")}
                    </Button>
                  </div>
                  <ParentFormFields form={parent1Form} isPrimary />
                </div>
              </Form>
            )}

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleNextFromParent1}
                disabled={!selectedParent1 && !isCreatingParent1}
                className="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-8 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
              >
                {t("common.next")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Secondary Parent (Optional) */}
        {step === "parent2" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {t("babyForm.secondParent.title")}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {t("babyForm.secondParent.subtitle")}
              </p>
            </div>

            {/* Skip button - prominent at top */}
            <Button
              variant="outline"
              onClick={handleSkipParent2}
              className="h-12 w-full rounded-xl border-2 border-amber-200 bg-amber-50/50 font-medium text-amber-700 transition-all hover:bg-amber-100"
            >
              <SkipForward className="mr-2 h-5 w-5" />
              {t("babyForm.secondParent.skipButton")}
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-sm text-gray-400">
                {t("babyForm.secondParent.addAnother")}
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {!isCreatingParent2 ? (
              <ParentSearch
                onSelect={handleSelectParent2}
                onCreateNew={handleCreateNewParent2}
                selectedParentId={selectedParent2?.id}
                excludeIds={selectedParent1 ? [selectedParent1.id] : []}
              />
            ) : (
              <Form {...parent2Form}>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-700">
                      {t("babyForm.parentForm.title")}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsCreatingParent2(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {t("common.cancel")}
                    </Button>
                  </div>
                  <ParentFormFields form={parent2Form} />
                </div>
              </Form>
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setStep("parent1")}
                className="h-12 rounded-xl border-2 border-teal-200 px-6 font-medium text-teal-600 transition-all hover:bg-teal-50"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                {t("common.back")}
              </Button>
              <Button
                onClick={handleNextFromParent2}
                disabled={!selectedParent2 && !isCreatingParent2}
                className="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-8 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
              >
                {t("common.next")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Baby */}
        {step === "baby" && (
          <Form {...babyForm}>
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">
                {t("babyForm.babyData.title")}
              </h2>

              <BabyFormFields form={babyForm} />

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep(skipParent2 ? "parent2" : "parent2")}
                  className="h-12 rounded-xl border-2 border-teal-200 px-6 font-medium text-teal-600 transition-all hover:bg-teal-50"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  {t("common.back")}
                </Button>
                <Button
                  onClick={handleNextFromBaby}
                  className="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-8 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
                >
                  {t("common.next")}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </Form>
        )}

        {/* Step 4: Confirm */}
        {step === "confirm" && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {t("babyForm.confirm.title")}
            </h2>
            <p className="text-sm text-gray-500">
              {t("babyForm.confirm.reviewData")}
            </p>

            {/* Primary Parent Summary */}
            <div className="rounded-2xl border-2 border-teal-100 bg-teal-50/50 p-4">
              <h3 className="flex items-center gap-2 font-medium text-gray-700">
                <User className="h-5 w-5 text-teal-600" />
                {t("babyForm.confirm.parentInfo")}
                <span className="ml-2 text-xs text-teal-600">
                  ({t("babyProfile.info.primaryContact")})
                </span>
              </h3>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                {selectedParent1 ? (
                  <>
                    <p>
                      <span className="text-gray-500">{t("babyForm.parentForm.name")}:</span>{" "}
                      {selectedParent1.name}
                    </p>
                    <p>
                      <span className="text-gray-500">{t("babyForm.parentForm.phone")}:</span>{" "}
                      {selectedParent1.phone}
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <span className="text-gray-500">{t("babyForm.parentForm.name")}:</span>{" "}
                      {parent1Form.getValues("name")}
                    </p>
                    <p>
                      <span className="text-gray-500">{t("babyForm.parentForm.phone")}:</span>{" "}
                      {parent1Form.getValues("phone")}
                    </p>
                    <p>
                      <span className="text-gray-500">{t("babyForm.parentForm.documentId")}:</span>{" "}
                      {parent1Form.getValues("documentId")}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Secondary Parent Summary (if not skipped) */}
            {!skipParent2 && (selectedParent2 || isCreatingParent2) && (
              <div className="rounded-2xl border-2 border-violet-100 bg-violet-50/50 p-4">
                <h3 className="flex items-center gap-2 font-medium text-gray-700">
                  <UserPlus className="h-5 w-5 text-violet-600" />
                  {t("babyForm.confirm.parent2Info")}
                </h3>
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  {selectedParent2 ? (
                    <>
                      <p>
                        <span className="text-gray-500">{t("babyForm.parentForm.name")}:</span>{" "}
                        {selectedParent2.name}
                      </p>
                      <p>
                        <span className="text-gray-500">{t("babyForm.parentForm.phone")}:</span>{" "}
                        {selectedParent2.phone}
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        <span className="text-gray-500">{t("babyForm.parentForm.name")}:</span>{" "}
                        {parent2Form.getValues("name")}
                      </p>
                      <p>
                        <span className="text-gray-500">{t("babyForm.parentForm.phone")}:</span>{" "}
                        {parent2Form.getValues("phone")}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Baby Summary */}
            <div className="rounded-2xl border-2 border-cyan-100 bg-cyan-50/50 p-4">
              <h3 className="flex items-center gap-2 font-medium text-gray-700">
                <Baby className="h-5 w-5 text-cyan-600" />
                {t("babyForm.confirm.babyInfo")}
              </h3>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>
                  <span className="text-gray-500">{t("babyForm.babyData.name")}:</span>{" "}
                  {babyForm.getValues("name")}
                </p>
                <p>
                  <span className="text-gray-500">{t("babyForm.babyData.birthDate")}:</span>{" "}
                  {babyForm.getValues("birthDate")
                    ? new Date(babyForm.getValues("birthDate") as Date).toLocaleDateString()
                    : "-"}
                </p>
                <p>
                  <span className="text-gray-500">{t("babyForm.babyData.gender")}:</span>{" "}
                  {babyForm.getValues("gender") === "MALE"
                    ? t("babyForm.babyData.male")
                    : t("babyForm.babyData.female")}
                </p>
              </div>
            </div>

            {/* Access Code Note */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-sm text-amber-700">
                {t("babyForm.confirm.accessCodeNote")}
              </p>
            </div>

            {/* Error message */}
            {submitError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setStep("baby")}
                disabled={isSubmitting}
                className="h-12 rounded-xl border-2 border-teal-200 px-6 font-medium text-teal-600 transition-all hover:bg-teal-50"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                {t("common.back")}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-8 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    {t("common.confirm")}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
