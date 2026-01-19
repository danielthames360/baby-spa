"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Search, User, Phone, Loader2, Plus, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ParentResult {
  id: string;
  name: string;
  phone: string;
  documentId: string;
  documentType: string;
  email: string | null;
  accessCode: string;
  babies: {
    baby: {
      id: string;
      name: string;
    };
  }[];
}

interface ParentSearchProps {
  onSelect: (parent: ParentResult) => void;
  onCreateNew: () => void;
  selectedParentId?: string | null;
  excludeIds?: string[];
}

export function ParentSearch({
  onSelect,
  onCreateNew,
  selectedParentId,
  excludeIds = [],
}: ParentSearchProps) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ParentResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchParents = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/parents/search?query=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      // Filter out excluded parents
      const filteredParents = (data.parents || []).filter(
        (parent: ParentResult) => !excludeIds.includes(parent.id)
      );
      setResults(filteredParents);
    } catch (error) {
      console.error("Error searching parents:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [excludeIds]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchParents(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchParents]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-teal-500" />
        <Input
          type="text"
          placeholder={t("babyForm.searchParent.placeholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 rounded-xl border-2 border-teal-100 pl-12 transition-all focus:border-teal-400 focus:ring-4 focus:ring-teal-500/20"
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-teal-500" />
        )}
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="space-y-2">
          {results.length > 0 ? (
            <>
              <p className="text-sm text-gray-500">
                {t("babyForm.searchParent.selectExisting")}
              </p>
              <div className="space-y-2">
                {results.map((parent) => (
                  <Card
                    key={parent.id}
                    onClick={() => onSelect(parent)}
                    className={`cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-teal-400 hover:bg-teal-50/50 ${
                      selectedParentId === parent.id
                        ? "border-teal-500 bg-teal-50"
                        : "border-white/50 bg-white/70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-100 to-cyan-100">
                          <User className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {parent.name}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {parent.phone}
                            </span>
                            <span>•</span>
                            <span>
                              {parent.documentType}: {parent.documentId}
                            </span>
                          </div>
                          {parent.babies.length > 0 && (
                            <p className="mt-1 text-xs text-gray-400">
                              {parent.babies.map((b) => b.baby.name).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      {selectedParentId === parent.id && (
                        <Check className="h-5 w-5 text-teal-600" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-center text-sm text-amber-700">
                {t("babyForm.searchParent.notFound")}
              </p>
            </Card>
          )}

          {/* Create New Button */}
          <div className="flex items-center gap-2 pt-2">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">
              {t("babyForm.searchParent.orCreateNew")}
            </span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onCreateNew}
            className="h-12 w-full rounded-xl border-2 border-dashed border-teal-300 text-teal-600 transition-all hover:border-teal-400 hover:bg-teal-50"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("babyForm.searchParent.createNew")}
          </Button>
        </div>
      )}

      {/* Initial state - show create new button */}
      {!hasSearched && (
        <Button
          type="button"
          variant="outline"
          onClick={onCreateNew}
          className="h-12 w-full rounded-xl border-2 border-dashed border-teal-300 text-teal-600 transition-all hover:border-teal-400 hover:bg-teal-50"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("babyForm.searchParent.createNew")}
        </Button>
      )}
    </div>
  );
}
