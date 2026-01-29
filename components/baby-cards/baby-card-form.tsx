"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Trash2,
  Gift,
  Tag,
  Package,
  ShoppingBag,
  Sparkles,
  Star,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { translateError } from "@/lib/form-utils";
import { BabyCardVisual } from "@/components/baby-cards/baby-card-visual";
import { EmojiPicker } from "@/components/ui/emoji-picker";

// Form data type (simplified for react-hook-form)
interface FormData {
  name: string;
  description: string;
  price: number;
  totalSessions: number;
  firstSessionDiscount: number;
  isActive: boolean;
  sortOrder: number;
  specialPrices: Array<{
    id?: string;
    packageId: string;
    specialPrice: number;
  }>;
  rewards: Array<{
    id?: string;
    sessionNumber: number;
    rewardType: "SERVICE" | "PRODUCT" | "EVENT" | "CUSTOM";
    packageId: string | null;
    productId: string | null;
    customName: string | null;
    customDescription: string | null;
    displayName: string;
    displayIcon: string | null;
  }>;
}

interface PackageOption {
  id: string;
  name: string;
  basePrice: number;
  sessionCount: number;
}

interface ProductOption {
  id: string;
  name: string;
  salePrice: number;
}

interface BabyCardFormProps {
  readOnly?: boolean;
  babyCard?: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    totalSessions: number;
    firstSessionDiscount: number;
    isActive: boolean;
    sortOrder: number;
    specialPrices: Array<{
      id: string;
      packageId: string;
      specialPrice: number;
      package: { id: string; name: string; basePrice: number } | null;
    }>;
    rewards: Array<{
      id: string;
      sessionNumber: number;
      rewardType: string;
      packageId: string | null;
      productId: string | null;
      customName: string | null;
      customDescription: string | null;
      displayName: string;
      displayIcon: string | null;
    }>;
  };
}

const REWARD_TYPES = [
  { value: "SERVICE", icon: Package },
  { value: "PRODUCT", icon: ShoppingBag },
  { value: "EVENT", icon: Star },
  { value: "CUSTOM", icon: Sparkles },
] as const;

export function BabyCardForm({ babyCard, readOnly = false }: BabyCardFormProps) {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const isEditing = !!babyCard;

  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [expandedRewardIndex, setExpandedRewardIndex] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: babyCard?.name || "",
      description: babyCard?.description || "",
      price: babyCard?.price || 0,
      totalSessions: babyCard?.totalSessions || 24,
      firstSessionDiscount: babyCard?.firstSessionDiscount ?? 0,
      isActive: babyCard?.isActive ?? true,
      sortOrder: babyCard?.sortOrder || 0,
      specialPrices: babyCard?.specialPrices.map((sp) => ({
        id: sp.id,
        packageId: sp.packageId,
        specialPrice: sp.specialPrice,
      })) || [],
      rewards: babyCard?.rewards.map((r) => ({
        id: r.id,
        sessionNumber: r.sessionNumber,
        rewardType: r.rewardType as "SERVICE" | "PRODUCT" | "EVENT" | "CUSTOM",
        packageId: r.packageId,
        productId: r.productId,
        customName: r.customName,
        customDescription: r.customDescription,
        displayName: r.displayName,
        displayIcon: r.displayIcon,
      })) || [],
    },
  });

  const {
    fields: specialPriceFields,
    append: appendSpecialPrice,
    remove: removeSpecialPrice,
  } = useFieldArray({
    control,
    name: "specialPrices",
  });

  const {
    fields: rewardFields,
    append: appendReward,
    remove: removeReward,
  } = useFieldArray({
    control,
    name: "rewards",
  });

  const watchedName = watch("name");
  const watchedTotalSessions = watch("totalSessions");
  const watchedRewards = watch("rewards");
  const watchedFirstSessionDiscount = watch("firstSessionDiscount");

  // Note: Session 1 reward is now implicit (firstSessionDiscount)
  // Rewards are configured starting from session 2

  // Fetch packages and products
  useEffect(() => {
    async function fetchData() {
      setIsFetchingData(true);
      try {
        const [packagesRes, productsRes] = await Promise.all([
          fetch("/api/packages"),
          fetch("/api/products"),
        ]);

        if (packagesRes.ok) {
          const data = await packagesRes.json();
          setPackages(
            (data.packages || []).map((p: PackageOption) => ({
              id: p.id,
              name: p.name,
              basePrice: Number(p.basePrice),
              sessionCount: p.sessionCount,
            }))
          );
        }

        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(
            (data.products || []).map((p: ProductOption) => ({
              id: p.id,
              name: p.name,
              salePrice: Number(p.salePrice),
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsFetchingData(false);
      }
    }
    fetchData();
  }, []);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const url = isEditing
        ? `/api/baby-cards/${babyCard.id}`
        : "/api/baby-cards";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error saving baby card");
      }

      toast.success(
        isEditing
          ? t("babyCard.messages.updated")
          : t("babyCard.messages.created")
      );
      router.push(`/${locale}/admin/baby-cards`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Handle specific error codes with proper namespace
      if (errorMessage === "REWARD_HAS_USAGES_CANNOT_DELETE") {
        toast.error(t("babyCard.errors.REWARD_HAS_USAGES_CANNOT_DELETE"));
      } else {
        toast.error(translateError(errorMessage, t));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale === "pt-BR" ? "pt-BR" : "es-BO", {
      style: "currency",
      currency: locale === "pt-BR" ? "BRL" : "BOB",
    }).format(price);
  };

  // Filter packages for individual sessions (single session packages)
  const individualPackages = packages.filter((p) => p.sessionCount === 1);

  if (isFetchingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <fieldset disabled={readOnly} className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left column - Form fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Section */}
          <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
            <h3 className="mb-4 font-semibold text-gray-800 flex items-center gap-2">
              <Tag className="h-5 w-5 text-teal-600" />
              {t("babyCard.info.name")}
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">{t("babyCard.info.name")} *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder={t("babyCard.info.namePlaceholder")}
                  className="mt-1"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">
                    {translateError(errors.name.message || "", t)}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">{t("babyCard.info.description")}</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder={t("babyCard.info.descriptionPlaceholder")}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">{t("babyCard.info.price")} *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register("price", { valueAsNumber: true })}
                    className="mt-1"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-500">
                      {translateError(errors.price.message || "", t)}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="totalSessions">
                    {t("babyCard.info.totalSessions")} *
                  </Label>
                  <Input
                    id="totalSessions"
                    type="number"
                    {...register("totalSessions", { valueAsNumber: true })}
                    className="mt-1"
                  />
                  {errors.totalSessions && (
                    <p className="mt-1 text-sm text-red-500">
                      {translateError(errors.totalSessions.message || "", t)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="firstSessionDiscount">
                  {t("babyCard.info.firstSessionDiscountLabel")}
                </Label>
                <div className="mt-1 relative">
                  <Input
                    id="firstSessionDiscount"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("firstSessionDiscount", { valueAsNumber: true })}
                    className="pr-16"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                    {locale === "pt-BR" ? "BRL" : "BOB"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {t("babyCard.info.firstSessionDiscountHelp")}
                </p>
              </div>
            </div>
          </Card>

          {/* Special Prices Section */}
          <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Tag className="h-5 w-5 text-teal-600" />
                  {t("babyCard.specialPrices.title")}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {t("babyCard.specialPrices.subtitle")}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendSpecialPrice({ packageId: "", specialPrice: 0 })
                }
                className="rounded-xl border-2 border-teal-200 text-teal-600 hover:bg-teal-50"
              >
                <Plus className="mr-1 h-4 w-4" />
                {t("babyCard.specialPrices.add")}
              </Button>
            </div>

            {specialPriceFields.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                {t("babyCard.specialPrices.empty")}
              </p>
            ) : (
              <div className="space-y-3">
                {specialPriceFields.map((field, index) => {
                  const selectedPackage = packages.find(
                    (p) => p.id === watch(`specialPrices.${index}.packageId`)
                  );
                  return (
                    <div
                      key={field.id}
                      className="flex items-end gap-3 rounded-xl bg-gray-50 p-3"
                    >
                      <div className="flex-1">
                        <Label className="text-xs text-gray-500">
                          {t("babyCard.specialPrices.service")}
                        </Label>
                        <Select
                          value={watch(`specialPrices.${index}.packageId`)}
                          onValueChange={(value) =>
                            setValue(`specialPrices.${index}.packageId`, value)
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue
                              placeholder={t("babyCard.specialPrices.selectService")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {individualPackages.map((pkg) => (
                              <SelectItem key={pkg.id} value={pkg.id}>
                                {pkg.name} - {formatPrice(pkg.basePrice)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedPackage && (
                        <div className="text-xs text-gray-500">
                          <span className="block">
                            {t("babyCard.specialPrices.normalPrice")}
                          </span>
                          <span className="font-medium line-through">
                            {formatPrice(selectedPackage.basePrice)}
                          </span>
                        </div>
                      )}
                      <div className="w-32">
                        <Label className="text-xs text-gray-500">
                          {t("babyCard.specialPrices.specialPrice")}
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`specialPrices.${index}.specialPrice`, {
                            valueAsNumber: true,
                          })}
                          className="mt-1"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSpecialPrice(index)}
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Rewards Section */}
          <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Gift className="h-5 w-5 text-teal-600" />
                {t("babyCard.rewards.title")}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {t("babyCard.rewards.subtitle")}
              </p>
            </div>

            {rewardFields.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                {t("babyCard.rewards.empty")}
              </p>
            ) : (
              <div className="space-y-2">
                {rewardFields.map((field, index) => {
                  const rewardType = watch(`rewards.${index}.rewardType`);
                  const rewardData = watch(`rewards.${index}`);
                  const isExpanded = expandedRewardIndex === index;

                  // Summary for collapsed state
                  const summaryIcon = rewardData.displayIcon || "🎁";
                  const summarySession = `#${rewardData.sessionNumber || "?"}`;
                  const summaryName = rewardData.displayName || t("babyCard.rewards.unnamed");

                  return (
                    <div
                      key={field.id}
                      className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden"
                    >
                      {/* Collapsible Header */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setExpandedRewardIndex(isExpanded ? null : index)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setExpandedRewardIndex(isExpanded ? null : index);
                          }
                        }}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{summaryIcon}</span>
                          <span className="text-sm font-medium text-teal-600">
                            {summarySession}
                          </span>
                          <span className="text-sm text-gray-700 truncate max-w-[200px]">
                            {summaryName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeReward(index);
                              if (expandedRewardIndex === index) {
                                setExpandedRewardIndex(null);
                              } else if (expandedRewardIndex !== null && expandedRewardIndex > index) {
                                setExpandedRewardIndex(expandedRewardIndex - 1);
                              }
                            }}
                            className="text-red-500 hover:bg-red-50 hover:text-red-600 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <ChevronDown
                            className={`h-5 w-5 text-gray-400 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>

                      {/* Expandable Content */}
                      {isExpanded && (
                        <div className="p-4 pt-2 border-t border-gray-200 bg-white">
                          <div className="grid gap-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-gray-500">
                                  {t("babyCard.rewards.sessionNumber")}
                                </Label>
                                <Input
                                  type="number"
                                  min={2}
                                  max={watchedTotalSessions}
                                  {...register(`rewards.${index}.sessionNumber`, {
                                    valueAsNumber: true,
                                  })}
                                  className="mt-1"
                                  placeholder="2+"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">
                                  {t("babyCard.rewards.type")}
                                </Label>
                                <Select
                                  value={rewardType}
                                  onValueChange={(value) =>
                                    setValue(
                                      `rewards.${index}.rewardType`,
                                      value as "SERVICE" | "PRODUCT" | "EVENT" | "CUSTOM"
                                    )
                                  }
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {REWARD_TYPES.map(({ value, icon: Icon }) => (
                                      <SelectItem key={value} value={value}>
                                        <span className="flex items-center gap-2">
                                          <Icon className="h-4 w-4" />
                                          {t(`babyCard.rewards.type${value.charAt(0) + value.slice(1).toLowerCase()}`)}
                                        </span>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Conditional fields based on reward type */}
                            {rewardType === "SERVICE" && (
                              <div>
                                <Label className="text-xs text-gray-500">
                                  {t("babyCard.rewards.selectService")}
                                </Label>
                                <Select
                                  value={watch(`rewards.${index}.packageId`) || ""}
                                  onValueChange={(value) => {
                                    setValue(`rewards.${index}.packageId`, value);
                                    const selectedPkg = packages.find((p) => p.id === value);
                                    if (selectedPkg) {
                                      setValue(`rewards.${index}.displayName`, selectedPkg.name);
                                    }
                                  }}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue
                                      placeholder={t("babyCard.rewards.selectService")}
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {packages.map((pkg) => (
                                      <SelectItem key={pkg.id} value={pkg.id}>
                                        {pkg.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {rewardType === "PRODUCT" && (
                              <div>
                                <Label className="text-xs text-gray-500">
                                  {t("babyCard.rewards.selectProduct")}
                                </Label>
                                <Select
                                  value={watch(`rewards.${index}.productId`) || ""}
                                  onValueChange={(value) => {
                                    setValue(`rewards.${index}.productId`, value);
                                    const selectedProduct = products.find((p) => p.id === value);
                                    if (selectedProduct) {
                                      setValue(`rewards.${index}.displayName`, selectedProduct.name);
                                    }
                                  }}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue
                                      placeholder={t("babyCard.rewards.selectProduct")}
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {products.map((prod) => (
                                      <SelectItem key={prod.id} value={prod.id}>
                                        {prod.name} - {formatPrice(prod.salePrice)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            {rewardType === "CUSTOM" && (
                              <>
                                <div>
                                  <Label className="text-xs text-gray-500">
                                    {t("babyCard.rewards.customName")}
                                  </Label>
                                  <Input
                                    {...register(`rewards.${index}.customName`)}
                                    placeholder={t("babyCard.rewards.customNamePlaceholder")}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-500">
                                    {t("babyCard.rewards.customDescription")}
                                  </Label>
                                  <Textarea
                                    {...register(`rewards.${index}.customDescription`)}
                                    placeholder={t("babyCard.rewards.customDescriptionPlaceholder")}
                                    className="mt-1"
                                    rows={2}
                                  />
                                </div>
                              </>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs text-gray-500">
                                  {t("babyCard.rewards.displayName")} *
                                </Label>
                                <Input
                                  {...register(`rewards.${index}.displayName`)}
                                  placeholder={t("babyCard.rewards.displayNamePlaceholder")}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-500">
                                  {t("babyCard.rewards.displayIcon")}
                                </Label>
                                <div className="mt-1 flex gap-2">
                                  <Input
                                    {...register(`rewards.${index}.displayIcon`)}
                                    placeholder={t("babyCard.rewards.displayIconPlaceholder")}
                                    className="flex-1"
                                    maxLength={4}
                                  />
                                  <EmojiPicker
                                    onSelect={(emoji) =>
                                      setValue(`rewards.${index}.displayIcon`, emoji)
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add button at the bottom */}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                appendReward({
                  sessionNumber: 2, // Session #1 is reserved for first session discount
                  rewardType: "SERVICE",
                  packageId: null,
                  productId: null,
                  customName: null,
                  customDescription: null,
                  displayName: "",
                  displayIcon: null,
                });
                // Auto-expand the new reward
                setExpandedRewardIndex(rewardFields.length);
              }}
              className="w-full mt-4 rounded-xl border-2 border-dashed border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("babyCard.rewards.add")}
            </Button>

            {errors.rewards && typeof errors.rewards.message === "string" && (
              <p className="mt-2 text-sm text-red-500">
                {translateError(errors.rewards.message, t)}
              </p>
            )}
          </Card>
        </div>

        {/* Right column - Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">
            <Card className="rounded-2xl border border-white/50 bg-white/70 p-6 shadow-lg backdrop-blur-md">
              <h3 className="mb-4 font-semibold text-gray-800">
                {t("babyCard.preview.title")}
              </h3>
              <BabyCardVisual
                name={watchedName || "Baby Spa Card"}
                totalSessions={watchedTotalSessions || 24}
                completedSessions={0}
                firstSessionDiscount={watchedFirstSessionDiscount || 0}
                rewards={watchedRewards.map((r, i) => ({
                  id: `preview-${i}`,
                  sessionNumber: r.sessionNumber,
                  displayName: r.displayName,
                  displayIcon: r.displayIcon,
                  rewardType: r.rewardType,
                }))}
                variant="preview"
              />
            </Card>

            {/* Status toggle */}
            <Card className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive" className="cursor-pointer">
                  {t("babyCard.info.active")}
                </Label>
                <Switch
                  id="isActive"
                  checked={watch("isActive")}
                  onCheckedChange={(checked) => setValue("isActive", checked)}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
      </fieldset>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        {readOnly ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="rounded-xl border-2"
          >
            {t("common.close")}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="rounded-xl border-2"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-8 text-white shadow-lg shadow-teal-300/50 hover:from-teal-600 hover:to-cyan-600"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
