"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Waves, User, Lock, AlertCircle, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [serverError, setServerError] = useState("");

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
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-primary-100 via-primary-50 to-background">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary-200/30 blur-3xl" />
      </div>

      <div className="relative flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Welcome */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-2xl shadow-primary-500/40">
                <Waves className="h-12 w-12" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-accent-400 text-white shadow-lg">
                <Shield className="h-4 w-4" />
              </div>
            </div>
            <h1 className="mt-6 font-nunito text-4xl font-bold tracking-tight text-primary-700">
              Baby Spa
            </h1>
            <p className="mt-2 text-lg font-medium text-primary-600">
              Sistema de Gestión
            </p>
          </div>

          {/* Login Card */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-2xl shadow-primary-500/10">
            <CardHeader className="space-y-2 text-center pb-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                <Lock className="h-6 w-6 text-primary-600" />
              </div>
              <CardTitle className="text-xl">{t("auth.welcomeBack")}</CardTitle>
              <CardDescription className="text-balance">
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
                        <FormLabel className="text-base">
                          {t("auth.username")}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-400" />
                            <Input
                              type="text"
                              placeholder="admin"
                              className="h-12 pl-12 border-2 border-primary-100 focus:border-primary-400"
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
                        <FormLabel className="text-base">
                          {t("auth.password")}
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-400" />
                            <Input
                              type="password"
                              placeholder="••••••••"
                              className="h-12 pl-12 border-2 border-primary-100 focus:border-primary-400"
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
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{serverError}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/30"
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
          <p className="mt-8 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Baby Spa. Hidroterapia y
            estimulación temprana.
          </p>
        </div>
      </div>
    </div>
  );
}
