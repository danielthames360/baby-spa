"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  ArrowLeft,
  Tag,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";

const categoryFormSchema = z.object({
  name: z.string().min(1, "NAME_REQUIRED").max(50, "NAME_TOO_LONG"),
  description: z.string().max(200, "DESCRIPTION_TOO_LONG").optional(),
  color: z.string().max(20, "COLOR_TOO_LONG").optional(),
  sortOrder: z.number().int().min(0).optional(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface Category {
  id: string;
  name: string;
  description: string | null;
  type: "PACKAGE" | "PRODUCT";
  color: string | null;
  sortOrder: number;
  isActive: boolean;
  _count: {
    packages: number;
    products: number;
  };
}

interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "PACKAGE" | "PRODUCT";
  onCategoriesChange?: () => void;
}

const COLOR_OPTIONS = [
  { value: "teal", label: "Teal", class: "bg-teal-500" },
  { value: "cyan", label: "Cyan", class: "bg-cyan-500" },
  { value: "blue", label: "Azul", class: "bg-blue-500" },
  { value: "purple", label: "Morado", class: "bg-purple-500" },
  { value: "pink", label: "Rosa", class: "bg-pink-500" },
  { value: "rose", label: "Rose", class: "bg-rose-500" },
  { value: "amber", label: "Amber", class: "bg-amber-500" },
  { value: "orange", label: "Naranja", class: "bg-orange-500" },
  { value: "emerald", label: "Esmeralda", class: "bg-emerald-500" },
  { value: "gray", label: "Gris", class: "bg-gray-500" },
];

export function CategoryManagerDialog({
  open,
  onOpenChange,
  type,
  onCategoriesChange,
}: CategoryManagerDialogProps) {
  const t = useTranslations();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "teal",
      sortOrder: 0,
    },
  });

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/categories?type=${type}&includeInactive=true`
      );
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  useEffect(() => {
    if (open) {
      fetchCategories();
      setShowForm(false);
      setEditingCategory(null);
      form.reset({
        name: "",
        description: "",
        color: "teal",
        sortOrder: 0,
      });
    }
  }, [open, fetchCategories, form]);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      description: category.description || "",
      color: category.color || "teal",
      sortOrder: category.sortOrder,
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    form.reset({
      name: "",
      description: "",
      color: "teal",
      sortOrder: categories.length,
    });
    setShowForm(true);
  };

  const handleBack = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  const handleToggleActive = async (category: Category) => {
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "PATCH",
      });

      if (response.ok) {
        await fetchCategories();
        onCategoriesChange?.();
      }
    } catch (error) {
      console.error("Error toggling category:", error);
    }
  };

  const handleDelete = async (category: Category) => {
    if (
      category._count.packages > 0 ||
      category._count.products > 0
    ) {
      return;
    }

    setDeletingId(category.id);
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchCategories();
        onCategoriesChange?.();
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const translateZodError = (error: string | undefined): string => {
    if (!error) return "";
    if (error.includes("_")) {
      return t(`categoryManager.errors.${error}`);
    }
    return error;
  };

  const onSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);
    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : "/api/categories";
      const method = editingCategory ? "PUT" : "POST";

      const body = editingCategory
        ? data
        : { ...data, type };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchCategories();
        onCategoriesChange?.();
        setShowForm(false);
        setEditingCategory(null);
      } else {
        const errorData = await response.json();
        if (errorData.error === "CATEGORY_NAME_EXISTS") {
          form.setError("name", {
            message: t("categoryManager.errors.CATEGORY_NAME_EXISTS"),
          });
        }
      }
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getItemCount = (category: Category) => {
    return type === "PACKAGE" ? category._count.packages : category._count.products;
  };

  const getColorClass = (color: string | null) => {
    const option = COLOR_OPTIONS.find((c) => c.value === color);
    return option ? option.class : "bg-gray-400";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl border border-white/50 bg-white/95 backdrop-blur-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {showForm && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="h-10 w-10 rounded-xl"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100">
              <FolderOpen className="h-5 w-5 text-teal-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-800">
              {showForm
                ? editingCategory
                  ? t("categoryManager.editCategory")
                  : t("categoryManager.newCategory")
                : type === "PACKAGE"
                ? t("categoryManager.packageCategories")
                : t("categoryManager.productCategories")}
            </DialogTitle>
          </div>
        </DialogHeader>

        {showForm ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 overflow-y-auto flex-1 pr-1"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      {t("categoryManager.form.name")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("categoryManager.form.namePlaceholder")}
                        className="h-11 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                      />
                    </FormControl>
                    <FormMessage>
                      {translateZodError(fieldState.error?.message)}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      {t("categoryManager.form.description")}
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t(
                          "categoryManager.form.descriptionPlaceholder"
                        )}
                        className="min-h-[80px] rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                      />
                    </FormControl>
                    <FormMessage>
                      {translateZodError(fieldState.error?.message)}
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      {t("categoryManager.form.color")}
                    </FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_OPTIONS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => field.onChange(color.value)}
                          className={`h-8 w-8 rounded-full transition-all ${color.class} ${
                            field.value === color.value
                              ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                              : "hover:scale-105"
                          }`}
                          title={color.label}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">
                      {t("categoryManager.form.sortOrder")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        className="h-11 rounded-xl border-2 border-teal-100 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-11 rounded-xl border-2 border-gray-200"
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t("common.saving")}
                    </>
                  ) : (
                    t("common.save")
                  )}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            <Button
              onClick={handleAdd}
              className="mb-4 h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 font-semibold text-white shadow-lg shadow-teal-300/50 transition-all hover:from-teal-600 hover:to-cyan-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              {t("categoryManager.addCategory")}
            </Button>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                </div>
              ) : categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <Tag className="h-12 w-12 mb-2 text-gray-300" />
                  <p>{t("categoryManager.noCategories")}</p>
                </div>
              ) : (
                categories.map((category) => {
                  const itemCount = getItemCount(category);
                  const canDelete = itemCount === 0;

                  return (
                    <div
                      key={category.id}
                      className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                        category.isActive
                          ? "border-white/50 bg-white/70"
                          : "border-gray-200 bg-gray-100/70 opacity-60"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full ${getColorClass(
                          category.color
                        )}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 truncate">
                            {category.name}
                          </span>
                          {!category.isActive && (
                            <span className="text-xs text-gray-500">
                              ({t("categoryManager.inactive")})
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {itemCount}{" "}
                          {type === "PACKAGE"
                            ? t("categoryManager.packagesCount")
                            : t("categoryManager.productsCount")}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Switch
                          checked={category.isActive}
                          onCheckedChange={() => handleToggleActive(category)}
                          className="scale-90"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(category)}
                          className="h-8 w-8 rounded-lg text-gray-500 hover:text-teal-600 hover:bg-teal-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(category)}
                          disabled={!canDelete || deletingId === category.id}
                          className="h-8 w-8 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                          title={
                            !canDelete
                              ? t("categoryManager.cannotDeleteInUse")
                              : ""
                          }
                        >
                          {deletingId === category.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
