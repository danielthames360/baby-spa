import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-gray-400 selection:bg-teal-200 selection:text-teal-900 h-11 w-full min-w-0 rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-base shadow-xs transition-all duration-300 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
        "focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20",
        "aria-invalid:ring-red-500/20 aria-invalid:border-red-300",
        "dark:bg-gray-900 dark:border-gray-700 dark:placeholder:text-gray-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
