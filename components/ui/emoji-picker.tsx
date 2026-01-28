"use client";

import { useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Curated emoji categories for Baby Spa
const EMOJI_CATEGORIES = [
  {
    name: "Servicios",
    emojis: ["🛁", "🏊", "📸", "💆", "🤱", "👶", "🩺", "👩‍⚕️", "💉"],
  },
  {
    name: "Juegos",
    emojis: ["🧱", "🎲", "🎮", "🧸", "🎨", "🎵"],
  },
  {
    name: "Celebración",
    emojis: ["🎈", "🎉", "🎂", "🎊", "🥳", "🎀"],
  },
  {
    name: "Premios",
    emojis: ["🎓", "👑", "⭐", "🏆", "🎁", "💎", "🥇", "🎖️", "💫", "🌟"],
  },
  {
    name: "Familia",
    emojis: ["🤰", "👨‍👩‍👧", "🍼", "❤️", "💕", "🏠"],
  },
  {
    name: "Productos",
    emojis: ["🧴", "✨", "🧼", "🛍️", "📦", "🎒"],
  },
] as const;

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

export function EmojiPicker({ onSelect, className }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "h-9 w-9 shrink-0 border-2 border-gray-200 hover:border-teal-300 hover:bg-teal-50",
            className
          )}
        >
          <Smile className="h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-72 p-2"
        align="start"
        side="bottom"
      >
        {/* Category tabs */}
        <div className="flex flex-wrap gap-1 border-b border-gray-100 pb-2 mb-2">
          {EMOJI_CATEGORIES.map((category, idx) => (
            <button
              key={category.name}
              type="button"
              onClick={() => setActiveCategory(idx)}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                activeCategory === idx
                  ? "bg-teal-100 text-teal-700"
                  : "text-gray-500 hover:bg-gray-100"
              )}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Emoji grid */}
        <div className="grid grid-cols-6 gap-1">
          {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xl transition-colors hover:bg-teal-50"
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Hint */}
        <p className="mt-2 border-t border-gray-100 pt-2 text-[10px] text-gray-400 text-center">
          Tip: Win + . para más emojis
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
