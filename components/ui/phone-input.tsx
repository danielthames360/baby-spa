"use client";

import { forwardRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CountryConfig {
  code: string;
  flag: string;
  name: string;
  placeholder: string;
}

const COUNTRY_CONFIG: Record<string, CountryConfig> = {
  es: {
    code: "+591",
    flag: "🇧🇴",
    name: "Bolivia",
    placeholder: "7XXXXXXX",
  },
  "pt-BR": {
    code: "+55",
    flag: "🇧🇷",
    name: "Brasil",
    placeholder: "11 9XXXX-XXXX",
  },
};

export interface PhoneInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value"
  > {
  value?: string;
  onChange?: (value: string) => void;
  locale?: string;
}

/**
 * Phone input with country flag and code
 * Stores full phone number with country code
 */
const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value = "", onChange, locale = "es", disabled, ...props }, ref) => {
    const config = COUNTRY_CONFIG[locale] || COUNTRY_CONFIG["es"];

    // Extract local number from full value (remove country code if present)
    const getLocalNumber = useCallback((fullValue: string): string => {
      if (!fullValue) return "";
      // Check for country codes
      for (const loc of Object.keys(COUNTRY_CONFIG)) {
        const code = COUNTRY_CONFIG[loc].code;
        if (fullValue.startsWith(code)) {
          return fullValue.slice(code.length).trim();
        }
      }
      // Also handle without + prefix
      const codeWithoutPlus = config.code.replace("+", "");
      if (fullValue.startsWith(codeWithoutPlus)) {
        return fullValue.slice(codeWithoutPlus.length).trim();
      }
      return fullValue;
    }, [config.code]);

    const [localNumber, setLocalNumber] = useState(() => getLocalNumber(value));

    // Update local number when value changes externally
    useEffect(() => {
      setLocalNumber(getLocalNumber(value));
    }, [value, getLocalNumber]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newLocalNumber = e.target.value;
      setLocalNumber(newLocalNumber);

      // Build full number with country code
      const cleanedNumber = newLocalNumber.replace(/\s+/g, "").trim();
      const fullNumber = cleanedNumber ? `${config.code}${cleanedNumber}` : "";

      onChange?.(fullNumber);
    };

    return (
      <div className="relative flex">
        {/* Country code prefix */}
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-l-xl border-2 border-r-0 border-teal-100 bg-teal-50/50 px-3",
            disabled && "opacity-50",
            "select-none"
          )}
        >
          <span className="text-lg">{config.flag}</span>
          <span className="font-medium text-teal-700">{config.code}</span>
        </div>

        {/* Input */}
        <input
          type="tel"
          className={cn(
            "flex h-12 w-full rounded-r-xl border-2 border-teal-100 bg-white px-4 py-2 text-sm ring-offset-white transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus:border-teal-400 focus:outline-none focus:ring-4 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          value={localNumber}
          onChange={handleChange}
          placeholder={config.placeholder}
          disabled={disabled}
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
