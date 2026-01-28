"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Loader2,
  IdCard,
  Check,
  Gift,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BabyCardVisual } from "./baby-card-visual";
import {
  SplitPaymentForm,
  type PaymentDetailInput,
} from "@/components/payments/split-payment-form";

interface Reward {
  id: string;
  sessionNumber: number;
  displayName: string;
  displayIcon: string | null;
  rewardType: string;
}

interface BabyCardOption {
  id: string;
  name: string;
  description: string | null;
  price: number;
  totalSessions: number;
  firstSessionDiscount: number;
  rewards: Reward[];
  specialPrices: Array<{
    packageId: string;
    specialPrice: number;
  }>;
}

interface FormData {
  babyCardId: string;
  babyId: string;
  pricePaid: number;
}

interface SellBabyCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babyId: string;
  babyName: string;
  hasActiveBabyCard?: boolean;
  onSuccess: () => void;
}

export function SellBabyCardDialog({
  open,
  onOpenChange,
  babyId,
  babyName,
  hasActiveBabyCard = false,
  onSuccess,
}: SellBabyCardDialogProps) {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const [babyCards, setBabyCards] = useState<BabyCardOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetailInput[]>([]);

  const form = useForm<FormData>({
    defaultValues: {
      babyCardId: "",
      babyId: babyId,
      pricePaid: 0,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        babyCardId: "",
        babyId: babyId,
        pricePaid: 0,
      });
      setSelectedCardId(null);
      setPaymentDetails([]);
      fetchBabyCards();
    }
  }, [open, babyId, form]);

  const fetchBabyCards = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/baby-cards?isActive=true");
      if (response.ok) {
        const data = await response.json();
        setBabyCards(data);
      }
    } catch (error) {
      console.error("Error fetching baby cards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCard = babyCards.find((c) => c.id === selectedCardId);

  const handleCardSelect = (cardId: string) => {
    const card = babyCards.find((c) => c.id === cardId);
    setSelectedCardId(cardId);
    form.setValue("babyCardId", cardId);
    if (card) {
      form.setValue("pricePaid", card.price);
    }
    // Reset payment details when card changes
    setPaymentDetails([]);
  };

  const handlePaymentDetailsChange = useCallback(
    (details: PaymentDetailInput[]) => {
      setPaymentDetails(details);
    },
    []
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : "es-BO", {
      style: "currency",
      currency: locale === "pt-BR" ? "BRL" : "BOB",
    }).format(price);
  };

  const onSubmit = async (data: FormData) => {
    if (paymentDetails.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/baby-cards/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          babyCardId: data.babyCardId,
          babyId: data.babyId,
          pricePaid: data.pricePaid,
          paymentDetails,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to sell baby card");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error selling baby card:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pricePaid = form.watch("pricePaid");
  const isValid = paymentDetails.length > 0 && selectedCardId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
              <IdCard className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-800">
                {t("babyCard.sell.title")}
              </DialogTitle>
              <p className="text-sm text-gray-500">
                {t("babyCard.sell.subtitle", { name: babyName })}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Warning if already has active card */}
        {hasActiveBabyCard && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
            <div>
              <p className="font-medium text-amber-700">
                {t("babyCard.sell.hasActiveCard")}
              </p>
              <p className="mt-1 text-sm text-amber-600">
                {t("babyCard.sell.hasActiveCardDesc")}
              </p>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Baby Card Selection */}
            <div>
              <FormLabel className="text-gray-700 mb-3 block">
                {t("babyCard.sell.selectCard")}
              </FormLabel>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                </div>
              ) : babyCards.length > 0 ? (
                <div className="space-y-3">
                  {babyCards.map((card) => {
                    const isSelected = selectedCardId === card.id;

                    return (
                      <Card
                        key={card.id}
                        onClick={() => handleCardSelect(card.id)}
                        className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-md ${
                          isSelected
                            ? "border-teal-500 bg-teal-50 ring-2 ring-teal-500"
                            : "border-gray-200 bg-white hover:border-teal-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-800">
                                {card.name}
                              </h4>
                              {isSelected && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500">
                                  <Check className="h-3 w-3 text-white" />
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-teal-400 to-cyan-500 px-2 py-0.5 text-xs font-medium text-white">
                                {t("babyCard.list.sessionsCount", {
                                  count: card.totalSessions,
                                })}
                              </span>
                              {card.firstSessionDiscount > 0 && (
                                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                  <Gift className="mr-1 h-3 w-3" />
                                  {t("babyCard.info.firstSessionDiscount", {
                                    amount: card.firstSessionDiscount,
                                  })}
                                </span>
                              )}
                              {card.rewards.length > 0 && (
                                <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                                  <Gift className="mr-1 h-3 w-3" />
                                  {t("babyCard.rewards.count", {
                                    count: card.rewards.length,
                                  })}
                                </span>
                              )}
                            </div>
                            {card.description && (
                              <p className="mt-2 text-sm text-gray-500">
                                {card.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-gray-800">
                              {formatPrice(card.price)}
                            </span>
                          </div>
                        </div>

                        {/* Preview visual */}
                        {isSelected && (
                          <div className="mt-4">
                            <BabyCardVisual
                              name={card.name}
                              totalSessions={card.totalSessions}
                              completedSessions={0}
                              rewards={card.rewards}
                              variant="compact"
                            />
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-500">
                  {t("babyCard.list.empty")}
                </div>
              )}
              <FormField
                control={form.control}
                name="babyCardId"
                render={({ fieldState }) => (
                  <FormMessage className="mt-2">
                    {fieldState.error?.message &&
                      t(`babyCard.errors.${fieldState.error.message}`)}
                  </FormMessage>
                )}
              />
            </div>

            {/* Price Paid */}
            {selectedCard && (
              <FormField
                control={form.control}
                name="pricePaid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      {t("babyCard.sell.pricePaid")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="h-11 rounded-xl border-2 border-gray-200"
                      />
                    </FormControl>
                    {field.value !== selectedCard.price && (
                      <p className="text-xs text-amber-600">
                        {t("babyCard.sell.priceModified", {
                          original: formatPrice(selectedCard.price),
                        })}
                      </p>
                    )}
                  </FormItem>
                )}
              />
            )}

            {/* Split Payment Form */}
            {selectedCard && pricePaid > 0 && (
              <SplitPaymentForm
                totalAmount={pricePaid}
                onPaymentDetailsChange={handlePaymentDetailsChange}
                disabled={isSubmitting}
                showReference={true}
              />
            )}

            {/* Summary */}
            {selectedCard && (
              <div className="rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{selectedCard.name}</span>
                    <span className="text-gray-800">
                      {t("babyCard.list.sessionsCount", {
                        count: selectedCard.totalSessions,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-teal-200 pt-2">
                    <span className="font-medium text-gray-700">
                      {t("packages.total")}
                    </span>
                    <span className="text-xl font-bold text-teal-600">
                      {formatPrice(pricePaid)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-11 rounded-xl border-2 border-gray-200"
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isValid}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  <>
                    <IdCard className="mr-2 h-4 w-4" />
                    {t("babyCard.sell.confirm")}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
