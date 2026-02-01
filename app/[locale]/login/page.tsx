"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, getSession, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { User, Lock, AlertCircle, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingBubbles } from "@/components/ui/floating-bubbles";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { staffLoginSchema, type StaffLoginInput } from "@/lib/validations";

export default function StaffLoginPage() {
  const t = useTranslations();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [serverError, setServerError] = useState("");

  // Redirect if already authenticated (any role)
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      const role = session.user.role;
      // Redirect staff to their dashboard
      if (role === "ADMIN" || role === "OWNER" || role === "RECEPTION") {
        router.replace("/admin/dashboard");
      } else if (role === "THERAPIST") {
        router.replace("/therapist/today");
      } else if (role === "PARENT") {
        // Parent trying to access staff login → redirect to parent portal
        router.replace("/portal/dashboard");
      }
    }
  }, [status, session, router]);

  const form = useForm<StaffLoginInput>({
    resolver: zodResolver(staffLoginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const getRedirectUrl = (role: string): string => {
    switch (role) {
      case "ADMIN":
        return "/admin/dashboard";
      case "RECEPTION":
        return "/admin/calendar";
      case "THERAPIST":
        return "/therapist/today";
      default:
        return "/admin/dashboard";
    }
  };

  const handleLogin = async (data: StaffLoginInput) => {
    setServerError("");

    const result = await signIn("staff-credentials", {
      username: data.username,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      const errorKey = result.error.includes("desactivado")
        ? "USER_INACTIVE"
        : "INVALID_CREDENTIALS";
      setServerError(t(`auth.errors.${errorKey}`));
      return;
    }

    const session = await getSession();
    if (session?.user?.role) {
      const redirectUrl = getRedirectUrl(session.user.role);
      router.push(redirectUrl);
      router.refresh();
    }
  };

  const translateZodError = (error: string | undefined): string => {
    if (!error) return "";
    if (error.includes("_")) {
      return t(`auth.errors.${error}`);
    }
    return error;
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-cyan-50 via-teal-50 to-white">
      {/* Decorative background blurs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-teal-200/40 blur-3xl" />
        <div className="absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-teal-100/50 blur-2xl" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-cyan-100/40 blur-3xl" />
      </div>

      {/* Floating animated bubbles */}
      <FloatingBubbles count={20} />

      <div className="relative z-10 flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Welcome */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="relative">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-2xl shadow-teal-500/30">
                <Image
                  src="/images/logoBabySpa.png"
                  alt="Baby Spa"
                  width={100}
                  height={100}
                  className="h-24 w-24 object-contain"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-300 to-secondary-400 text-white shadow-lg shadow-secondary-300/50">
                <Shield className="h-4 w-4" />
              </div>
            </div>

            <p className="mt-2 text-lg font-medium text-teal-600">
              {t("auth.systemTitle")}
            </p>
          </div>

          {/* Login Card */}
          <Card className="border border-white/50 bg-white/70 shadow-2xl shadow-teal-500/10 backdrop-blur-md">
            <CardHeader className="space-y-2 pb-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
                <Lock className="h-6 w-6 text-teal-600" />
              </div>
              <CardTitle className="text-xl text-gray-700">
                {t("auth.welcomeBack")}
              </CardTitle>
              <CardDescription className="text-balance text-gray-500">
                {t("auth.enterCredentials")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleLogin)}
                  className="space-y-5"
                >
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-base text-gray-700">
                          {t("auth.username")}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-500" />
                            <Input
                              type="text"
                              placeholder="admin"
                              className="h-12 border-2 border-teal-100 pl-12 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                              autoComplete="username"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage>
                          {translateZodError(fieldState.error?.message)}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field, fieldState }) => (
                      <FormItem>
                        <FormLabel className="text-base text-gray-700">
                          {t("auth.password")}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-500" />
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className="h-12 border-2 border-teal-100 pl-12 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                              autoComplete="current-password"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage>
                          {translateZodError(fieldState.error?.message)}
                        </FormMessage>
                      </FormItem>
                    )}
                  />

                  {serverError && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-600">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{serverError}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="h-12 w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-base font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600 hover:shadow-xl hover:shadow-teal-400/40"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t("auth.loggingIn")}
                      </>
                    ) : (
                      t("auth.login")
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()}{" "}
            <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text font-medium text-transparent">
              Baby Spa
            </span>
            . {t("common.tagline")}.
          </p>
        </div>
      </div>
    </div>
  );
}
