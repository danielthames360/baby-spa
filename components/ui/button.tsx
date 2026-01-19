import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-teal-500/20 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-200 hover:from-teal-600 hover:to-cyan-600 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0",
        destructive:
          "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-200 hover:from-red-600 hover:to-rose-600 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0",
        outline:
          "border-2 border-teal-500 bg-transparent text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950",
        secondary:
          "bg-teal-50 text-teal-700 border-2 border-teal-200 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800 dark:hover:bg-teal-900",
        ghost:
          "hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950 dark:hover:text-teal-300",
        link: "text-teal-600 underline-offset-4 hover:underline",
        accent:
          "bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg shadow-amber-200 hover:from-amber-500 hover:to-orange-500 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0",
      },
      size: {
        default: "h-10 px-6 py-2.5 has-[>svg]:px-4",
        sm: "h-8 rounded-xl gap-1.5 px-4 has-[>svg]:px-3 text-xs",
        lg: "h-12 rounded-2xl px-8 has-[>svg]:px-6 text-base",
        icon: "size-10 rounded-xl",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
