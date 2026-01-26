"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { BabyFormFields } from "@/components/babies/baby-form";
import { babySchema } from "@/lib/validations/baby";

// Use explicit type to avoid zod coerce.date() type inference issues
interface BabyFormValues {
  name: string;
  birthDate: Date;
  gender: "MALE" | "FEMALE" | "OTHER";
  birthType?: "NATURAL" | "CESAREAN" | null;
  birthWeeks?: number | null;
  birthWeight?: number | null;
  birthDifficulty: boolean;
  birthDifficultyDesc?: string | null;
  pregnancyIssues: boolean;
  pregnancyIssuesDesc?: string | null;
  priorStimulation: boolean;
  priorStimulationType?: string | null;
  developmentDiagnosis: boolean;
  developmentDiagnosisDesc?: string | null;
  diagnosedIllness: boolean;
  diagnosedIllnessDesc?: string | null;
  recentMedication: boolean;
  recentMedicationDesc?: string | null;
  allergies?: string | null;
  specialObservations?: string | null;
  socialMediaConsent: boolean;
  instagramHandle?: string | null;
  referralSource?: string | null;
}

interface BabyData {
  id: string;
  name: string;
  birthDate: string;
  gender: string;
  birthWeeks: number | null;
  birthWeight: string | null;
  birthType: string | null;
  birthDifficulty: boolean;
  birthDifficultyDesc: string | null;
  pregnancyIssues: boolean;
  pregnancyIssuesDesc: string | null;
  priorStimulation: boolean;
  priorStimulationType: string | null;
  developmentDiagnosis: boolean;
  developmentDiagnosisDesc: string | null;
  diagnosedIllness: boolean;
  diagnosedIllnessDesc: string | null;
  recentMedication: boolean;
  recentMedicationDesc: string | null;
  allergies: string | null;
  specialObservations: string | null;
  socialMediaConsent: boolean;
  instagramHandle: string | null;
  referralSource: string | null;
}

export default function EditBabyPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const babyId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<BabyFormValues>({
    resolver: zodResolver(babySchema) as Resolver<BabyFormValues>,
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

  useEffect(() => {
    const fetchBaby = async () => {
      try {
        const response = await fetch(`/api/babies/${babyId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch baby");
        }
        const result = await response.json();
        const data: BabyData = result.baby;

        form.reset({
          name: data.name,
          birthDate: new Date(data.birthDate),
          gender: data.gender as "MALE" | "FEMALE" | "OTHER",
          birthType: data.birthType as "NATURAL" | "CESAREAN" | undefined,
          birthWeeks: data.birthWeeks,
          birthWeight: data.birthWeight ? parseFloat(data.birthWeight) : undefined,
          birthDifficulty: data.birthDifficulty || false,
          birthDifficultyDesc: data.birthDifficultyDesc,
          pregnancyIssues: data.pregnancyIssues || false,
          pregnancyIssuesDesc: data.pregnancyIssuesDesc,
          priorStimulation: data.priorStimulation || false,
          priorStimulationType: data.priorStimulationType,
          developmentDiagnosis: data.developmentDiagnosis || false,
          developmentDiagnosisDesc: data.developmentDiagnosisDesc,
          diagnosedIllness: data.diagnosedIllness || false,
          diagnosedIllnessDesc: data.diagnosedIllnessDesc,
          recentMedication: data.recentMedication || false,
          recentMedicationDesc: data.recentMedicationDesc,
          allergies: data.allergies,
          specialObservations: data.specialObservations,
          socialMediaConsent: data.socialMediaConsent || false,
          instagramHandle: data.instagramHandle,
          referralSource: data.referralSource,
        });
      } catch {
        setError("Error loading baby data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBaby();
  }, [babyId, form]);

  const onSubmit = async (data: BabyFormValues) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/babies/${babyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update baby");
      }

      router.push(`/${locale}/admin/clients/${babyId}`);
    } catch {
      setError("Error saving changes");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-xl hover:bg-teal-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Button>
        <div>
          <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-2xl font-bold text-transparent">
            {t("babyForm.editTitle")}
          </h1>
          <p className="text-sm text-gray-500">{form.getValues("name")}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
          {error}
        </div>
      )}

      <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <BabyFormFields form={form} />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="rounded-xl border-2 border-gray-200 px-6"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-6 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t("common.save")}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
