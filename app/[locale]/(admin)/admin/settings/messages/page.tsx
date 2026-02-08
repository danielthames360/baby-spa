"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  FileText,
  Mail,
  MessageSquare,
  Edit2,
  Save,
  Loader2,
  Calendar,
  Heart,
  Users,
  UserPlus,
  BarChart3,
  Eye,
  RefreshCw,
  Sparkles,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmojiPicker, EMAIL_TEMPLATE_CATEGORIES } from "@/components/ui/emoji-picker";

interface MessageTemplate {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  subject: string | null;
  body: string;
  bodyVersion2: string | null;
  bodyVersion3: string | null;
  variables: string[];
  config: Record<string, unknown> | null;
  isActive: boolean;
}

// Preview Content Component
function PreviewContent({ template }: { template: MessageTemplate }) {
  const t = useTranslations("settings.messages");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"email" | "text">("email");

  useEffect(() => {
    const fetchPreview = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/templates/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateBody: template.body,
            subject: template.subject,
            title: `¡Hola {parentName}!`,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setPreviewHtml(data.html);
        }
      } catch (error) {
        console.error("Error fetching preview:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [template.body, template.subject]);

  return (
    <div className="space-y-4">
      {template.subject && (
        <div>
          <Label className="text-xs text-gray-500">Asunto</Label>
          <p className="font-medium">{template.subject}</p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "email" | "text")}>
        <TabsList className="grid w-full grid-cols-2 rounded-xl">
          <TabsTrigger value="email" className="gap-2 rounded-lg">
            <Mail className="h-4 w-4" />
            {t("preview.emailView")}
          </TabsTrigger>
          <TabsTrigger value="text" className="gap-2 rounded-lg">
            <FileText className="h-4 w-4" />
            {t("preview.textView")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-4">
          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
            </div>
          ) : (
            <div
              className="overflow-hidden rounded-xl border border-gray-200 bg-white"
              style={{ height: "60vh" }}
            >
              <iframe
                srcDoc={previewHtml}
                className="h-full w-full"
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="text" className="mt-4">
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500">Mensaje principal</Label>
              <div className="mt-1 max-h-[40vh] overflow-y-auto whitespace-pre-wrap rounded-xl bg-gray-50 p-4 font-mono text-sm">
                {template.body}
              </div>
            </div>

            {template.bodyVersion2 && (
              <div>
                <Label className="text-xs text-gray-500">Versión 2</Label>
                <div className="mt-1 whitespace-pre-wrap rounded-xl bg-gray-50 p-4 font-mono text-sm">
                  {template.bodyVersion2}
                </div>
              </div>
            )}

            {template.bodyVersion3 && (
              <div>
                <Label className="text-xs text-gray-500">Versión 3</Label>
                <div className="mt-1 whitespace-pre-wrap rounded-xl bg-gray-50 p-4 font-mono text-sm">
                  {template.bodyVersion3}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

const CATEGORY_CONFIG: Record<string, { icon: typeof Calendar; color: string; key: string }> = {
  APPOINTMENT: {
    icon: Calendar,
    color: "bg-blue-100 text-blue-700",
    key: "APPOINTMENT",
  },
  MESVERSARY: {
    icon: Heart,
    color: "bg-pink-100 text-pink-700",
    key: "MESVERSARY",
  },
  REENGAGEMENT: {
    icon: Users,
    color: "bg-purple-100 text-purple-700",
    key: "REENGAGEMENT",
  },
  LEAD: {
    icon: UserPlus,
    color: "bg-amber-100 text-amber-700",
    key: "LEAD",
  },
  ADMIN: {
    icon: BarChart3,
    color: "bg-gray-100 text-gray-700",
    key: "ADMIN",
  },
};

export default function MessageTemplatesPage() {
  const t = useTranslations("settings.messages");
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [reseeding, setReseeding] = useState(false);
  const [activeCategory, setActiveCategory] = useState("APPOINTMENT");

  // Edit dialog state
  const [editTemplate, setEditTemplate] = useState<MessageTemplate | null>(null);
  const [editForm, setEditForm] = useState({
    subject: "",
    body: "",
    bodyVersion2: "",
    bodyVersion3: "",
    emailEnabled: true,
    whatsappEnabled: true,
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  // Preview dialog state
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);

  // Confirmation dialog state
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  // Live preview state for edit dialog
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentional mount-only fetch
  }, []);

  // Debounced preview fetch
  const fetchPreview = useCallback(async (body: string, subject: string) => {
    if (!body.trim()) {
      setPreviewHtml("");
      return;
    }

    setLoadingPreview(true);
    try {
      const response = await fetch("/api/templates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateBody: body,
          subject: subject,
          title: `¡Hola {parentName}!`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewHtml(data.html);
      }
    } catch (error) {
      console.error("Error fetching preview:", error);
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  // Debounce effect for preview
  useEffect(() => {
    if (!editTemplate) return;

    const timer = setTimeout(() => {
      fetchPreview(editForm.body, editForm.subject);
    }, 500);

    return () => clearTimeout(timer);
  }, [editForm.body, editForm.subject, editTemplate, fetchPreview]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error(t("loadError"));
    } finally {
      setLoading(false);
    }
  };

  const seedTemplates = async () => {
    try {
      setSeeding(true);
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed" }),
      });

      if (response.ok) {
        const data = await response.json();
        const langLabel = data.locale === "pt-BR" ? "PT-BR" : "ES";
        toast.success(`${data.created} templates ${t("created")} (${langLabel})`);
        fetchTemplates();
      } else {
        toast.error(t("createError"));
      }
    } catch {
      toast.error(t("createError"));
    } finally {
      setSeeding(false);
    }
  };

  const reseedTemplates = async () => {
    try {
      setReseeding(true);
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reseed" }),
      });

      if (response.ok) {
        const data = await response.json();
        const langLabel = data.locale === "pt-BR" ? "PT-BR" : "ES";
        toast.success(`${data.created} ${t("created")}, ${data.updated} ${t("updated")} (${langLabel})`);
        fetchTemplates();
      } else {
        toast.error(t("regenerateError"));
      }
    } catch {
      toast.error(t("regenerateError"));
    } finally {
      setReseeding(false);
    }
  };

  const openEditDialog = (template: MessageTemplate) => {
    setEditTemplate(template);
    setEditForm({
      subject: template.subject || "",
      body: template.body,
      bodyVersion2: template.bodyVersion2 || "",
      bodyVersion3: template.bodyVersion3 || "",
      emailEnabled: template.emailEnabled,
      whatsappEnabled: template.whatsappEnabled,
      isActive: template.isActive,
    });
  };

  const saveTemplate = async () => {
    if (!editTemplate) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/templates/${editTemplate.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: editForm.subject || null,
          body: editForm.body,
          bodyVersion2: editForm.bodyVersion2 || null,
          bodyVersion3: editForm.bodyVersion3 || null,
          emailEnabled: editForm.emailEnabled,
          whatsappEnabled: editForm.whatsappEnabled,
          isActive: editForm.isActive,
        }),
      });

      if (response.ok) {
        toast.success(t("templateUpdated"));
        setEditTemplate(null);
        fetchTemplates();
      } else {
        toast.error(t("saveError"));
      }
    } catch {
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const filteredTemplates = templates.filter((t) => t.category === activeCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Actions Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">
            {t("title")}
          </h2>
          <p className="text-sm text-gray-500">
            {templates.length} {t("configured")}
          </p>
        </div>

        <div className="flex gap-2">
          {templates.length === 0 && (
            <Button
              onClick={seedTemplates}
              disabled={seeding}
              className="gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500"
            >
              {seeding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {t("createTemplates")}
            </Button>
          )}
          {templates.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowRegenerateConfirm(true)}
              disabled={reseeding}
              className="gap-2 rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50"
            >
              {reseeding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {t("regenerateTemplates")}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTemplates}
            className="gap-2 rounded-xl"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-800">
            {t("noTemplates")}
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            {t("noTemplatesDescription")}
          </p>
          <Button
            onClick={seedTemplates}
            disabled={seeding}
            className="mt-4 gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500"
          >
            {seeding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {t("createDefault")}
          </Button>
        </div>
      ) : (
        <>
          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid w-full grid-cols-5 rounded-xl bg-gray-100 p-1">
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                const count = templates.filter((tmpl) => tmpl.category === key).length;
                return (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{t(`categories.${config.key}`)}</span>
                    <span className="text-xs text-gray-400">({count})</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.keys(CATEGORY_CONFIG).map((category) => (
              <TabsContent key={category} value={category} className="mt-6">
                <div className="space-y-3">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={cn(
                        "rounded-2xl border bg-white p-4 transition-all",
                        template.isActive
                          ? "border-gray-100 shadow-sm"
                          : "border-gray-200 bg-gray-50 opacity-60"
                      )}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-gray-800">
                              {template.name}
                            </h3>
                            {template.emailEnabled && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                <Mail className="h-3 w-3" />
                                {t("channels.email")}
                              </span>
                            )}
                            {template.whatsappEnabled && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                <MessageSquare className="h-3 w-3" />
                                {t("channels.whatsapp")}
                              </span>
                            )}
                            {!template.isActive && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                                {t("status.inactive")}
                              </span>
                            )}
                          </div>

                          {template.description && (
                            <p className="text-sm text-gray-500">
                              {template.description}
                            </p>
                          )}

                          {template.variables.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {template.variables.map((v) => (
                                <span
                                  key={v}
                                  className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-600"
                                >
                                  {`{${v}}`}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewTemplate(template)}
                            className="gap-1 rounded-xl"
                          >
                            <Eye className="h-4 w-4" />
                            {t("actions.view")}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openEditDialog(template)}
                            className="gap-1 rounded-xl bg-violet-500 text-white hover:bg-violet-600"
                          >
                            <Edit2 className="h-4 w-4" />
                            {t("actions.edit")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}

      {/* Edit Dialog with Live Preview */}
      <Dialog open={!!editTemplate} onOpenChange={() => setEditTemplate(null)}>
        <DialogContent className="max-h-[95vh] overflow-hidden sm:max-w-[95vw] lg:max-w-[1400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-violet-500" />
              {t("editor.editTitle")}: {editTemplate?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left side - Editor */}
            <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: "calc(95vh - 180px)" }}>
              {/* Channels */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editForm.emailEnabled}
                    onCheckedChange={(v) => setEditForm({ ...editForm, emailEnabled: v })}
                  />
                  <Label className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-blue-500" />
                    {t("channels.email")}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editForm.whatsappEnabled}
                    onCheckedChange={(v) => setEditForm({ ...editForm, whatsappEnabled: v })}
                  />
                  <Label className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4 text-green-500" />
                    {t("channels.whatsapp")}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editForm.isActive}
                    onCheckedChange={(v) => setEditForm({ ...editForm, isActive: v })}
                  />
                  <Label>{t("status.active")}</Label>
                </div>
              </div>

              {/* Subject (for email) */}
              {editForm.emailEnabled && (
                <div className="space-y-2">
                  <Label>{t("editor.subject")}</Label>
                  <Input
                    value={editForm.subject}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    placeholder={t("editor.subjectPlaceholder")}
                    className="rounded-xl"
                  />
                </div>
              )}

              {/* Variables & Emoji Quick Insert */}
              <div className="space-y-3 rounded-xl bg-gray-50 p-3">
                {/* Variables */}
                {editTemplate?.variables && editTemplate.variables.length > 0 && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1 text-xs text-gray-500">
                      <Plus className="h-3 w-3" />
                      {t("editor.insertVariable")}
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {editTemplate.variables.map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => {
                            const textarea = document.getElementById("template-body") as HTMLTextAreaElement;
                            if (textarea) {
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              const text = editForm.body;
                              const newText = text.substring(0, start) + `{${v}}` + text.substring(end);
                              setEditForm({ ...editForm, body: newText });
                              setTimeout(() => {
                                textarea.focus();
                                textarea.setSelectionRange(start + v.length + 2, start + v.length + 2);
                              }, 0);
                            }
                          }}
                          className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200"
                        >
                          {`{${v}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emoji picker */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500">{t("editor.insertEmoji")}</Label>
                  <EmojiPicker
                    categories={EMAIL_TEMPLATE_CATEGORIES}
                    onSelect={(emoji) => {
                      const textarea = document.getElementById("template-body") as HTMLTextAreaElement;
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const text = editForm.body;
                        const newText = text.substring(0, start) + emoji + text.substring(end);
                        setEditForm({ ...editForm, body: newText });
                        setTimeout(() => {
                          textarea.focus();
                          textarea.setSelectionRange(start + emoji.length, start + emoji.length);
                        }, 0);
                      }
                    }}
                  />
                  <span className="text-xs text-gray-400">o Win + .</span>
                </div>
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label>{t("editor.mainMessage")}</Label>
                <Textarea
                  id="template-body"
                  value={editForm.body}
                  onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                  placeholder={t("editor.messagePlaceholder")}
                  className="min-h-[250px] rounded-xl font-mono text-sm"
                />
              </div>

              {/* Formatting tips with color guide */}
              <div className="rounded-xl border border-gray-200 bg-white p-3 text-xs">
                <p className="mb-3 font-medium text-gray-700">💡 {t("formatting.title")}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-teal-500"></span>
                    <code className="rounded bg-teal-50 px-1 text-teal-700">👶 📅 🕐 💆 📍</code>
                    <span className="text-gray-500">→ {t("formatting.infoCard")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-green-500"></span>
                    <code className="rounded bg-green-50 px-1 text-green-700">✅</code>
                    <span className="text-gray-500">→ {t("formatting.confirmed")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-red-500"></span>
                    <code className="rounded bg-red-50 px-1 text-red-700">❌</code>
                    <span className="text-gray-500">→ {t("formatting.cancelled")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-amber-500"></span>
                    <code className="rounded bg-amber-50 px-1 text-amber-700">📋 ⚠️</code>
                    <span className="text-gray-500">→ {t("formatting.recommendations")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded bg-gray-400"></span>
                    <code className="rounded bg-gray-100 px-1 text-gray-600">• item</code>
                    <span className="text-gray-500">→ {t("formatting.bulletList")}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded bg-blue-400"></span>
                      <code className="rounded bg-blue-50 px-1 text-blue-600">https://...</code>
                      <span className="text-gray-500">→ {t("formatting.autoLink")}</span>
                    </div>
                    <div className="flex items-center gap-2 pl-5">
                      <code className="rounded bg-blue-50 px-1 text-blue-600">[Texto](url)</code>
                      <span className="text-gray-500">→ {t("formatting.linkWithTitle")}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-gray-400">{t("formatting.newParagraph")}</p>
              </div>

              {/* Version 2 & 3 (for mesversarios) */}
              {editTemplate?.category === "MESVERSARY" && (
                <>
                  <div className="space-y-2">
                    <Label>{t("editor.version2")}</Label>
                    <Textarea
                      value={editForm.bodyVersion2}
                      onChange={(e) => setEditForm({ ...editForm, bodyVersion2: e.target.value })}
                      placeholder={t("editor.version2Placeholder")}
                      className="min-h-[100px] rounded-xl font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("editor.version3")}</Label>
                    <Textarea
                      value={editForm.bodyVersion3}
                      onChange={(e) => setEditForm({ ...editForm, bodyVersion3: e.target.value })}
                      placeholder={t("editor.version3Placeholder")}
                      className="min-h-[100px] rounded-xl font-mono text-sm"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Right side - Live Preview */}
            <div className="hidden lg:block">
              <div className="sticky top-0 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-gray-500">
                    <Eye className="h-4 w-4" />
                    {t("preview.livePreview")}
                    {loadingPreview && (
                      <Loader2 className="h-3 w-3 animate-spin text-teal-500" />
                    )}
                  </Label>
                </div>
                <div
                  className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
                  style={{ height: "calc(95vh - 220px)" }}
                >
                  {previewHtml ? (
                    <iframe
                      srcDoc={previewHtml}
                      className="h-full w-full bg-white"
                      title="Email Preview"
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Mail className="mx-auto h-12 w-12 opacity-50" />
                        <p className="mt-2 text-sm">
                          {t("preview.typeToPreview")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setEditTemplate(null)}
              className="rounded-xl"
            >
              {t("actions.cancel")}
            </Button>
            <Button
              onClick={saveTemplate}
              disabled={saving}
              className="gap-2 rounded-xl bg-violet-500 text-white hover:bg-violet-600"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              <Save className="h-4 w-4" />
              {t("actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog - Shows rendered HTML */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-h-[95vh] overflow-hidden sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-teal-500" />
              {previewTemplate?.name}
            </DialogTitle>
          </DialogHeader>

          {previewTemplate && (
            <PreviewContent template={previewTemplate} />
          )}
        </DialogContent>
      </Dialog>

      {/* Regenerate Confirmation Dialog */}
      <AlertDialog open={showRegenerateConfirm} onOpenChange={setShowRegenerateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              {t("confirmRegenerate.title")}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <span className="block">{t("confirmRegenerate.description")}</span>
                <span className="block text-teal-600 font-medium">
                  {t("confirmRegenerate.note")}
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">
              {t("confirmRegenerate.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowRegenerateConfirm(false);
                reseedTemplates();
              }}
              className="rounded-xl bg-amber-500 text-white hover:bg-amber-600"
            >
              {t("confirmRegenerate.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
