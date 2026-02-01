"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Image from "next/image";
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
  AlertCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { FloatingBubbles } from "@/components/ui/floating-bubbles";
import {
  publicPrimaryParentSchema,
  publicSecondaryParentSchema,
  publicBabySchema,
} from "@/lib/validations/registration";

// Import form field components
import { PublicParentFormFields } from "./parent-form-fields";
import { PublicBabyFormFields } from "./baby-form-fields";
import { RegistrationIntro, shouldShowRegistrationIntro } from "./registration-intro";

type Step = "parent1" | "parent2" | "baby" | "confirm";

interface LinkData {
  valid: boolean;
  parentName?: string;
  parentPhone: string;
  expiresAt: string;
}

interface RegistrationResult {
  success: boolean;
  accessCode: string;
  parentName?: string;
  baby: {
    id: string;
    name: string;
  };
}

// Translations for the public form (hardcoded since this is a public page without locale routing)
const translations = {
  es: {
    introTagline: "Hidroterapia infantil",
    title: "Registro de Bebé",
    subtitle: "Complete los datos para registrar a su bebé en Baby Spa",
    steps: {
      parent1: "Mamá o Papá",
      parent2: "Segundo Tutor",
      baby: "Datos del Bebé",
      confirm: "Confirmar",
    },
    parent1: {
      title: "Mamá o Papá",
      subtitle: "Por favor verifique y complete su información",
    },
    parent2: {
      title: "Segundo Padre/Madre/Tutor",
      subtitle: "Este paso es opcional",
      skipButton: "Omitir este paso",
      addAnother: "o agregar otro padre/tutor",
    },
    babyStep: {
      title: "Datos del Bebé",
      subtitle: "Información de su bebé",
    },
    confirmStep: {
      title: "Confirmar Registro",
      subtitle: "Verifique que los datos sean correctos",
      parentInfo: "Datos del Padre/Madre",
      parent2Info: "Segundo Padre/Tutor",
      babyInfo: "Datos del Bebé",
      primaryContact: "Contacto principal",
    },
    success: {
      title: "¡Registro Completado!",
      message: "Su bebé ha sido registrado exitosamente en Baby Spa",
      accessCode: "Su Código de Acceso",
      accessCodeNote: "Guarde este código para acceder al portal de padres",
      startButton: "Comenzar",
      copyCode: "Copiar código",
      copied: "¡Copiado!",
    },
    errors: {
      LINK_NOT_FOUND: "El enlace no es válido",
      LINK_EXPIRED: "El enlace ha expirado",
      LINK_ALREADY_USED: "Este enlace ya fue utilizado",
      GENERIC: "Ha ocurrido un error. Por favor intente nuevamente.",
    },
    loading: "Cargando...",
    validating: "Validando enlace...",
    submitting: "Registrando...",
    next: "Siguiente",
    back: "Atrás",
    confirmButton: "Confirmar Registro",
    name: "Nombre",
    phone: "Teléfono",
    birthDate: "Fecha de nacimiento",
    gender: "Género",
    male: "Masculino",
    female: "Femenino",
  },
  "pt-BR": {
    introTagline: "Hidroterapia infantil",
    title: "Cadastro de Bebê",
    subtitle: "Complete os dados para cadastrar seu bebê no Baby Spa",
    steps: {
      parent1: "Mamãe ou Papai",
      parent2: "Segundo Responsável",
      baby: "Dados do Bebê",
      confirm: "Confirmar",
    },
    parent1: {
      title: "Mamãe ou Papai",
      subtitle: "Por favor verifique e complete suas informações",
    },
    parent2: {
      title: "Segundo Pai/Mãe/Responsável",
      subtitle: "Esta etapa é opcional",
      skipButton: "Pular esta etapa",
      addAnother: "ou adicionar outro responsável",
    },
    babyStep: {
      title: "Dados do Bebê",
      subtitle: "Informações do seu bebê",
    },
    confirmStep: {
      title: "Confirmar Cadastro",
      subtitle: "Verifique se os dados estão corretos",
      parentInfo: "Dados do Responsável",
      parent2Info: "Segundo Responsável",
      babyInfo: "Dados do Bebê",
      primaryContact: "Contato principal",
    },
    success: {
      title: "Cadastro Concluído!",
      message: "Seu bebê foi cadastrado com sucesso no Baby Spa",
      accessCode: "Seu Código de Acesso",
      accessCodeNote: "Guarde este código para acessar o portal de pais",
      startButton: "Começar",
      copyCode: "Copiar código",
      copied: "Copiado!",
    },
    errors: {
      LINK_NOT_FOUND: "O link não é válido",
      LINK_EXPIRED: "O link expirou",
      LINK_ALREADY_USED: "Este link já foi utilizado",
      GENERIC: "Ocorreu um erro. Por favor tente novamente.",
    },
    loading: "Carregando...",
    validating: "Validando link...",
    submitting: "Cadastrando...",
    next: "Próximo",
    back: "Voltar",
    confirmButton: "Confirmar Cadastro",
    name: "Nome",
    phone: "Telefone",
    birthDate: "Data de nascimento",
    gender: "Gênero",
    male: "Masculino",
    female: "Feminino",
  },
};

// Detect locale from URL param, subdomain, or browser
function detectLocale(): "es" | "pt-BR" {
  if (typeof window === "undefined") return "es";

  // 1. Check URL parameter (highest priority)
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get("lang");
  if (langParam === "pt-BR" || langParam === "pt") return "pt-BR";
  if (langParam === "es") return "es";

  // 2. Check subdomain (br.babyspa.online = Portuguese)
  const hostname = window.location.hostname;
  if (hostname.startsWith("br.") || hostname.includes("brazil")) {
    return "pt-BR";
  }

  // 3. Check referrer URL for locale hint
  const referrer = document.referrer;
  if (referrer.includes("/pt-BR/") || referrer.includes("/pt/")) {
    return "pt-BR";
  }

  // 4. Fallback to browser language
  const lang = navigator.language || "es";
  return lang.startsWith("pt") ? "pt-BR" : "es";
}

export default function PublicRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [locale, setLocale] = useState<"es" | "pt-BR">("es");
  const [isLoading, setIsLoading] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_linkData, setLinkData] = useState<LinkData | null>(null);
  const [step, setStep] = useState<Step>("parent1");
  const [skipParent2, setSkipParent2] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showIntro, setShowIntro] = useState<boolean | null>(null);

  const t = translations[locale];

  // Detect locale on mount
  useEffect(() => {
    setLocale(detectLocale());
  }, []);

  // Check if should show intro on mount
  useEffect(() => {
    setShowIntro(shouldShowRegistrationIntro());
  }, []);

  // Parent 1 form (primary)
  const parent1Form = useForm({
    resolver: zodResolver(publicPrimaryParentSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      birthDate: undefined as Date | undefined,
      relationship: "MOTHER" as const,
    },
  });

  // Parent 2 form (optional)
  const parent2Form = useForm({
    resolver: zodResolver(publicSecondaryParentSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      birthDate: undefined as Date | undefined,
      relationship: "FATHER" as const,
    },
  });

  // Baby form
  const babyForm = useForm({
    resolver: zodResolver(publicBabySchema),
    defaultValues: {
      name: "",
      birthDate: undefined as Date | undefined,
      gender: undefined as "MALE" | "FEMALE" | "OTHER" | undefined,
      birthType: undefined as "NATURAL" | "CESAREAN" | undefined | null,
      birthWeeks: undefined as number | undefined | null,
      birthWeight: undefined as number | undefined | null,
      birthDifficulty: false,
      birthDifficultyDesc: undefined as string | undefined | null,
      pregnancyIssues: false,
      pregnancyIssuesDesc: undefined as string | undefined | null,
      priorStimulation: false,
      priorStimulationType: undefined as string | undefined | null,
      developmentDiagnosis: false,
      developmentDiagnosisDesc: undefined as string | undefined | null,
      diagnosedIllness: false,
      diagnosedIllnessDesc: undefined as string | undefined | null,
      recentMedication: false,
      recentMedicationDesc: undefined as string | undefined | null,
      allergies: undefined as string | undefined | null,
      specialObservations: undefined as string | undefined | null,
      socialMediaConsent: false,
      instagramHandle: undefined as string | undefined | null,
      referralSource: undefined as string | undefined | null,
    },
  });

  // Validate token on mount
  useEffect(() => {
    async function validateToken() {
      try {
        const response = await fetch(`/api/registration-links/${token}`);
        const data = await response.json();

        if (!response.ok) {
          setLinkError(data.error || "GENERIC");
          setIsLoading(false);
          return;
        }

        setLinkData(data);

        // Pre-fill parent 1 form with phone from link
        parent1Form.setValue("phone", data.parentPhone);

        setIsLoading(false);
      } catch {
        setLinkError("GENERIC");
        setIsLoading(false);
      }
    }

    if (token) {
      validateToken();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Navigation handlers
  const handleNextFromParent1 = async () => {
    const isValid = await parent1Form.trigger();
    if (!isValid) return;
    setStep("parent2");
  };

  const handleNextFromParent2 = async () => {
    if (!skipParent2) {
      const isValid = await parent2Form.trigger();
      if (!isValid) return;
    }
    setStep("baby");
  };

  const handleSkipParent2 = () => {
    setSkipParent2(true);
    setStep("baby");
  };

  const handleNextFromBaby = async () => {
    const isValid = await babyForm.trigger();
    if (!isValid) return;
    setStep("confirm");
  };

  // Submit registration
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`/api/registration-links/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent1: parent1Form.getValues(),
          parent2: skipParent2 ? null : parent2Form.getValues(),
          baby: babyForm.getValues(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSubmitError(data.error || "GENERIC");
        setIsSubmitting(false);
        return;
      }

      setRegistrationResult(data);
    } catch {
      setSubmitError("GENERIC");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy access code
  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // Auto-login and redirect to portal
  const handleStartPortal = async () => {
    if (!registrationResult) return;

    setIsLoggingIn(true);

    try {
      const result = await signIn("parent-credentials", {
        accessCode: registrationResult.accessCode,
        redirect: false,
      });

      if (result?.ok) {
        // Redirect to parent portal
        router.push(`/${locale}/portal/dashboard`);
      } else {
        // If auto-login fails, just redirect to portal login
        router.push(`/${locale}/portal/login`);
      }
    } catch {
      router.push(`/${locale}/portal/login`);
    }
  };

  // Step indicator
  const steps = [
    { id: "parent1", label: t.steps.parent1, icon: User },
    { id: "parent2", label: t.steps.parent2, icon: UserPlus },
    { id: "baby", label: t.steps.baby, icon: Baby },
    { id: "confirm", label: t.steps.confirm, icon: ClipboardCheck },
  ];

  const getStepStatus = (stepId: string) => {
    const stepOrder = ["parent1", "parent2", "baby", "confirm"];
    const currentIndex = stepOrder.indexOf(step);
    const stepIndex = stepOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "active";
    return "pending";
  };

  // Background decoration
  const BackgroundDecoration = () => (
    <>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-cyan-200/25 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-teal-100/40 blur-2xl" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-cyan-100/30 blur-3xl" />
      </div>
      <FloatingBubbles count={12} />
    </>
  );

  // Decorative side panel for desktop
  const DecorativeSidePanel = () => (
    <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center lg:p-12 xl:p-16">
      <div className="relative">
        {/* Main illustration container */}
        <div className="relative flex h-80 w-80 items-center justify-center xl:h-96 xl:w-96">
          {/* Animated rings */}
          <div className="absolute inset-0 animate-pulse rounded-full border-4 border-dashed border-teal-200/50" />
          <div className="absolute inset-4 animate-pulse rounded-full border-4 border-dashed border-cyan-200/40" style={{ animationDelay: "0.5s" }} />
          <div className="absolute inset-8 animate-pulse rounded-full border-4 border-dashed border-teal-200/30" style={{ animationDelay: "1s" }} />

          {/* Center logo */}
          <div className="relative z-10 flex h-40 w-40 items-center justify-center rounded-full bg-white/80 shadow-2xl shadow-teal-500/20 backdrop-blur-sm xl:h-48 xl:w-48">
            <Image
              src="/images/logoBabySpa.png"
              alt="Baby Spa"
              width={120}
              height={120}
              className="h-28 w-28 object-contain xl:h-32 xl:w-32"
            />
          </div>
        </div>

        {/* Feature highlights */}
        <div className="mt-12 space-y-4 text-center">
          <h2 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-3xl font-bold text-transparent xl:text-4xl">
            Baby Spa
          </h2>
          <p className="mx-auto max-w-sm text-gray-500">
            {locale === "pt-BR"
              ? "Hidroterapia e estimulação precoce para o desenvolvimento saudável do seu bebê"
              : "Hidroterapia y estimulación temprana para el desarrollo saludable de su bebé"}
          </p>

          {/* Benefits list */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              locale === "pt-BR" ? "Relaxamento" : "Relajación",
              locale === "pt-BR" ? "Desenvolvimento" : "Desarrollo",
              locale === "pt-BR" ? "Vínculo familiar" : "Vínculo familiar",
            ].map((benefit) => (
              <span
                key={benefit}
                className="rounded-full bg-gradient-to-r from-teal-100 to-cyan-100 px-4 py-2 text-sm font-medium text-teal-700"
              >
                {benefit}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Show intro animation on first visit
  if (showIntro) {
    return (
      <RegistrationIntro
        tagline={t.introTagline}
        onComplete={() => setShowIntro(false)}
      />
    );
  }

  // Loading state (show after intro completes, or if intro was already shown)
  if (isLoading || showIntro === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-white">
        <BackgroundDecoration />
        <div className="relative z-10 flex min-h-screen items-center justify-center p-4 lg:p-8">
          <div className="flex w-full max-w-6xl overflow-hidden rounded-3xl border border-white/50 bg-white/30 shadow-2xl shadow-teal-500/10 backdrop-blur-sm lg:min-h-[600px]">
            <DecorativeSidePanel />
            <div className="flex w-full items-center justify-center p-6 lg:w-1/2 lg:p-12">
              <Card className="w-full max-w-md rounded-3xl border border-white/50 bg-white/80 p-8 shadow-xl shadow-teal-500/10 backdrop-blur-md">
                <div className="flex flex-col items-center text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-teal-500" />
                  <p className="mt-4 text-gray-600">{t.validating}</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (linkError) {
    const errorMessages: Record<string, { icon: React.ReactNode; title: string; message: string }> = {
      LINK_NOT_FOUND: {
        icon: <XCircle className="h-12 w-12 text-rose-500" />,
        title: t.errors.LINK_NOT_FOUND,
        message: locale === "es"
          ? "El enlace que está intentando usar no existe. Por favor contacte a recepción."
          : "O link que você está tentando usar não existe. Por favor entre em contato com a recepção.",
      },
      LINK_EXPIRED: {
        icon: <Clock className="h-12 w-12 text-amber-500" />,
        title: t.errors.LINK_EXPIRED,
        message: locale === "es"
          ? "Este enlace ha expirado. Por favor solicite uno nuevo a recepción."
          : "Este link expirou. Por favor solicite um novo à recepção.",
      },
      LINK_ALREADY_USED: {
        icon: <AlertCircle className="h-12 w-12 text-blue-500" />,
        title: t.errors.LINK_ALREADY_USED,
        message: locale === "es"
          ? "Este enlace ya fue utilizado para registrar un bebé."
          : "Este link já foi utilizado para cadastrar um bebê.",
      },
      GENERIC: {
        icon: <AlertCircle className="h-12 w-12 text-rose-500" />,
        title: t.errors.GENERIC,
        message: "",
      },
    };

    const errorInfo = errorMessages[linkError] || errorMessages.GENERIC;

    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-white">
        <BackgroundDecoration />
        <div className="relative z-10 flex min-h-screen items-center justify-center p-4 lg:p-8">
          <div className="flex w-full max-w-6xl overflow-hidden rounded-3xl border border-white/50 bg-white/30 shadow-2xl shadow-teal-500/10 backdrop-blur-sm lg:min-h-[600px]">
            <DecorativeSidePanel />
            <div className="flex w-full items-center justify-center p-6 lg:w-1/2 lg:p-12">
              <Card className="w-full max-w-md rounded-3xl border border-white/50 bg-white/80 p-8 shadow-xl shadow-teal-500/10 backdrop-blur-md">
                <div className="flex flex-col items-center text-center">
                  {errorInfo.icon}
                  <h2 className="mt-4 text-xl font-bold text-gray-800 lg:text-2xl">{errorInfo.title}</h2>
                  {errorInfo.message && (
                    <p className="mt-2 text-gray-600">{errorInfo.message}</p>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (registrationResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-white">
        <BackgroundDecoration />
        <div className="relative z-10 flex min-h-screen items-center justify-center p-4 lg:p-8">
          <div className="flex w-full max-w-6xl overflow-hidden rounded-3xl border border-white/50 bg-white/30 shadow-2xl shadow-teal-500/10 backdrop-blur-sm lg:min-h-[600px]">
            <DecorativeSidePanel />
            <div className="flex w-full items-center justify-center p-6 lg:w-1/2 lg:p-12">
              <Card className="w-full max-w-md rounded-3xl border border-white/50 bg-white/80 p-8 shadow-xl shadow-teal-500/10 backdrop-blur-md lg:max-w-lg lg:p-10">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 lg:h-24 lg:w-24">
                    <CheckCircle className="h-10 w-10 text-emerald-500 lg:h-12 lg:w-12" />
                  </div>

                  <h2 className="mt-6 text-2xl font-bold text-gray-800 lg:text-3xl">
                    {t.success.title}
                  </h2>
                  <p className="mt-2 text-gray-500 lg:text-lg">{t.success.message}</p>

                  {/* Baby name */}
                  <p className="mt-4 text-lg font-medium text-teal-600 lg:text-xl">
                    {registrationResult.baby.name}
                  </p>

                  {/* Access Code */}
                  <div className="mt-6 w-full rounded-2xl border-2 border-teal-200 bg-teal-50 p-6 lg:p-8">
                    <p className="text-sm text-teal-600 lg:text-base">
                      {t.success.accessCode}
                    </p>
                    <div className="mt-2 flex items-center justify-center gap-3">
                      <span className="font-mono text-3xl font-bold text-teal-700 lg:text-4xl">
                        {registrationResult.accessCode}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopyCode(registrationResult.accessCode)}
                        className="h-10 w-10 rounded-xl hover:bg-teal-100 lg:h-12 lg:w-12"
                      >
                        {codeCopied ? (
                          <Check className="h-5 w-5 text-emerald-500 lg:h-6 lg:w-6" />
                        ) : (
                          <Copy className="h-5 w-5 text-teal-600 lg:h-6 lg:w-6" />
                        )}
                      </Button>
                    </div>
                    <p className="mt-3 text-xs text-teal-500 lg:text-sm">
                      {t.success.accessCodeNote}
                    </p>
                  </div>

                  {/* Start Button */}
                  <Button
                    onClick={handleStartPortal}
                    disabled={isLoggingIn}
                    className="mt-6 h-14 w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-8 text-lg font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600 lg:h-16 lg:text-xl"
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t.loading}
                      </>
                    ) : (
                      t.success.startButton
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-teal-50 to-white">
      <BackgroundDecoration />

      <div className="relative z-10 flex min-h-screen flex-col lg:flex-row lg:items-stretch">
        {/* Desktop: Side panel */}
        <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center lg:border-r lg:border-white/30 lg:bg-white/20 lg:p-12 xl:p-16">
          <div className="relative">
            {/* Main illustration container */}
            <div className="relative flex h-64 w-64 items-center justify-center xl:h-80 xl:w-80">
              {/* Animated rings */}
              <div className="absolute inset-0 animate-pulse rounded-full border-4 border-dashed border-teal-200/50" />
              <div className="absolute inset-4 animate-pulse rounded-full border-4 border-dashed border-cyan-200/40" style={{ animationDelay: "0.5s" }} />
              <div className="absolute inset-8 animate-pulse rounded-full border-4 border-dashed border-teal-200/30" style={{ animationDelay: "1s" }} />

              {/* Center logo */}
              <div className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full bg-white/80 shadow-2xl shadow-teal-500/20 backdrop-blur-sm xl:h-40 xl:w-40">
                <Image
                  src="/images/logoBabySpa.png"
                  alt="Baby Spa"
                  width={100}
                  height={100}
                  className="h-24 w-24 object-contain xl:h-28 xl:w-28"
                />
              </div>
            </div>

            {/* Feature highlights */}
            <div className="mt-10 space-y-4 text-center">
              <h2 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-2xl font-bold text-transparent xl:text-3xl">
                Baby Spa
              </h2>
              <p className="mx-auto max-w-xs text-sm text-gray-500 xl:max-w-sm xl:text-base">
                {locale === "pt-BR"
                  ? "Hidroterapia e estimulação precoce para o desenvolvimento saudável do seu bebê"
                  : "Hidroterapia y estimulación temprana para el desarrollo saludable de su bebé"}
              </p>

              {/* Benefits list */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  locale === "pt-BR" ? "Relaxamento" : "Relajación",
                  locale === "pt-BR" ? "Desenvolvimento" : "Desarrollo",
                  locale === "pt-BR" ? "Vínculo" : "Vínculo",
                ].map((benefit) => (
                  <span
                    key={benefit}
                    className="rounded-full bg-gradient-to-r from-teal-100 to-cyan-100 px-3 py-1.5 text-xs font-medium text-teal-700 xl:px-4 xl:py-2 xl:text-sm"
                  >
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile/Tablet: Header | Desktop: Form section */}
        <div className="flex flex-1 flex-col lg:w-1/2">
          {/* Header - Mobile/Tablet only */}
          <header className="sticky top-0 z-20 border-b border-white/50 bg-white/70 px-4 py-4 backdrop-blur-md lg:hidden">
            <div className="mx-auto flex max-w-lg items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md shadow-teal-200">
                <Image
                  src="/images/logoBabySpa.png"
                  alt="Baby Spa"
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                />
              </div>
              <div>
                <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-lg font-bold text-transparent">
                  {t.title}
                </h1>
                <p className="text-xs text-gray-500">{t.subtitle}</p>
              </div>
            </div>
          </header>

          {/* Desktop Header */}
          <header className="hidden border-b border-white/30 bg-white/50 px-8 py-6 lg:block">
            <h1 className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-nunito text-2xl font-bold text-transparent">
              {t.title}
            </h1>
            <p className="mt-1 text-gray-500">{t.subtitle}</p>
          </header>

          {/* Steps indicator */}
          <div className="sticky top-[73px] z-10 bg-white/50 px-4 py-3 backdrop-blur-sm lg:static lg:border-b lg:border-white/30 lg:px-8 lg:py-4">
            <div className="mx-auto flex max-w-lg items-center justify-center gap-1 lg:max-w-none lg:justify-start lg:gap-2">
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
                        className={`mx-0.5 h-0.5 w-4 sm:mx-1 sm:w-6 lg:mx-2 lg:w-8 ${
                          isCompleted || isSkipped ? "bg-teal-500" : "bg-gray-200"
                        }`}
                      />
                    )}
                    <div
                      className={`flex items-center gap-1 rounded-full px-2 py-1.5 transition-all sm:px-3 lg:gap-2 lg:px-4 lg:py-2 ${
                        isActive
                          ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md"
                          : isCompleted || isSkipped
                            ? "bg-teal-100 text-teal-700"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4 lg:h-5 lg:w-5" />
                      ) : isSkipped ? (
                        <SkipForward className="h-4 w-4 lg:h-5 lg:w-5" />
                      ) : (
                        <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
                      )}
                      <span className="hidden text-xs font-medium sm:inline lg:text-sm">
                        {s.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form content */}
          <main className="flex-1 px-4 py-6 lg:overflow-y-auto lg:px-8 lg:py-8">
            <Card className="mx-auto max-w-lg rounded-3xl border border-white/50 bg-white/80 p-6 shadow-lg shadow-teal-500/10 backdrop-blur-md lg:max-w-xl lg:p-8">
            {/* Step 1: Parent 1 */}
            {step === "parent1" && (
              <Form {...parent1Form}>
                <div className="space-y-6 lg:space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 lg:text-2xl">
                      {t.parent1.title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 lg:text-base">
                      {t.parent1.subtitle}
                    </p>
                  </div>

                  <PublicParentFormFields
                    form={parent1Form}
                    locale={locale}
                    isPrimary
                  />

                  <div className="flex justify-end pt-4 lg:pt-6">
                    <Button
                      onClick={handleNextFromParent1}
                      className="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-8 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600 lg:h-14 lg:px-10 lg:text-lg"
                    >
                      {t.next}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </Form>
            )}

            {/* Step 2: Parent 2 (Optional) */}
            {step === "parent2" && (
              <div className="space-y-6 lg:space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 lg:text-2xl">
                    {t.parent2.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 lg:text-base">
                    {t.parent2.subtitle}
                  </p>
                </div>

                {/* Skip button */}
                <Button
                  variant="outline"
                  onClick={handleSkipParent2}
                  className="h-12 w-full rounded-xl border-2 border-amber-200 bg-amber-50/50 font-medium text-amber-700 transition-all hover:bg-amber-100 lg:h-14 lg:text-lg"
                >
                  <SkipForward className="mr-2 h-5 w-5" />
                  {t.parent2.skipButton}
                </Button>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-sm text-gray-400 lg:text-base">{t.parent2.addAnother}</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <Form {...parent2Form}>
                  <PublicParentFormFields
                    form={parent2Form}
                    locale={locale}
                  />
                </Form>

                <div className="flex justify-between pt-4 lg:pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setStep("parent1")}
                    className="h-12 rounded-xl border-2 border-teal-200 px-6 font-medium text-teal-600 transition-all hover:bg-teal-50 lg:h-14 lg:px-8 lg:text-lg"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    {t.back}
                  </Button>
                  <Button
                    onClick={handleNextFromParent2}
                    className="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-8 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600 lg:h-14 lg:px-10 lg:text-lg"
                  >
                    {t.next}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Baby */}
            {step === "baby" && (
              <Form {...babyForm}>
                <div className="space-y-6 lg:space-y-8">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 lg:text-2xl">
                      {t.babyStep.title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 lg:text-base">
                      {t.babyStep.subtitle}
                    </p>
                  </div>

                  <PublicBabyFormFields form={babyForm} locale={locale} />

                  <div className="flex justify-between pt-4 lg:pt-6">
                    <Button
                      variant="outline"
                      onClick={() => setStep("parent2")}
                      className="h-12 rounded-xl border-2 border-teal-200 px-6 font-medium text-teal-600 transition-all hover:bg-teal-50 lg:h-14 lg:px-8 lg:text-lg"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      {t.back}
                    </Button>
                    <Button
                      onClick={handleNextFromBaby}
                      className="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-8 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600 lg:h-14 lg:px-10 lg:text-lg"
                    >
                      {t.next}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </Form>
            )}

            {/* Step 4: Confirm */}
            {step === "confirm" && (
              <div className="space-y-6 lg:space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 lg:text-2xl">
                    {t.confirmStep.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 lg:text-base">
                    {t.confirmStep.subtitle}
                  </p>
                </div>

                {/* Parent 1 Summary */}
                <div className="rounded-2xl border-2 border-teal-100 bg-teal-50/50 p-4 lg:p-6">
                  <h3 className="flex items-center gap-2 font-medium text-gray-700 lg:text-lg">
                    <User className="h-5 w-5 text-teal-600 lg:h-6 lg:w-6" />
                    {t.confirmStep.parentInfo}
                    <span className="ml-2 text-xs text-teal-600 lg:text-sm">
                      ({t.confirmStep.primaryContact})
                    </span>
                  </h3>
                  <div className="mt-3 space-y-1 text-sm text-gray-600 lg:mt-4 lg:space-y-2 lg:text-base">
                    <p>
                      <span className="text-gray-500">{t.name}:</span>{" "}
                      {parent1Form.getValues("name")}
                    </p>
                    <p>
                      <span className="text-gray-500">{t.phone}:</span>{" "}
                      {parent1Form.getValues("phone")}
                    </p>
                  </div>
                </div>

                {/* Parent 2 Summary (if not skipped) */}
                {!skipParent2 && parent2Form.getValues("name") && (
                  <div className="rounded-2xl border-2 border-violet-100 bg-violet-50/50 p-4 lg:p-6">
                    <h3 className="flex items-center gap-2 font-medium text-gray-700 lg:text-lg">
                      <UserPlus className="h-5 w-5 text-violet-600 lg:h-6 lg:w-6" />
                      {t.confirmStep.parent2Info}
                    </h3>
                    <div className="mt-3 space-y-1 text-sm text-gray-600 lg:mt-4 lg:space-y-2 lg:text-base">
                      <p>
                        <span className="text-gray-500">{t.name}:</span>{" "}
                        {parent2Form.getValues("name")}
                      </p>
                      <p>
                        <span className="text-gray-500">{t.phone}:</span>{" "}
                        {parent2Form.getValues("phone")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Baby Summary */}
                <div className="rounded-2xl border-2 border-cyan-100 bg-cyan-50/50 p-4 lg:p-6">
                  <h3 className="flex items-center gap-2 font-medium text-gray-700 lg:text-lg">
                    <Baby className="h-5 w-5 text-cyan-600 lg:h-6 lg:w-6" />
                    {t.confirmStep.babyInfo}
                  </h3>
                  <div className="mt-3 space-y-1 text-sm text-gray-600 lg:mt-4 lg:space-y-2 lg:text-base">
                    <p>
                      <span className="text-gray-500">{t.name}:</span>{" "}
                      {babyForm.getValues("name")}
                    </p>
                    <p>
                      <span className="text-gray-500">{t.birthDate}:</span>{" "}
                      {babyForm.getValues("birthDate")
                        ? new Date(babyForm.getValues("birthDate") as Date).toLocaleDateString(
                            locale === "pt-BR" ? "pt-BR" : "es-ES"
                          )
                        : "-"}
                    </p>
                    <p>
                      <span className="text-gray-500">{t.gender}:</span>{" "}
                      {babyForm.getValues("gender") === "MALE" ? t.male : t.female}
                    </p>
                  </div>
                </div>

                {/* Error message */}
                {submitError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-700 lg:text-base">
                      {t.errors[submitError as keyof typeof t.errors] || t.errors.GENERIC}
                    </p>
                  </div>
                )}

                <div className="flex justify-between pt-4 lg:pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setStep("baby")}
                    disabled={isSubmitting}
                    className="h-12 rounded-xl border-2 border-teal-200 px-6 font-medium text-teal-600 transition-all hover:bg-teal-50 lg:h-14 lg:px-8 lg:text-lg"
                  >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    {t.back}
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="h-12 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-8 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600 lg:h-14 lg:px-10 lg:text-lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t.submitting}
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        {t.confirmButton}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </main>
      </div>
      </div>
    </div>
  );
}
