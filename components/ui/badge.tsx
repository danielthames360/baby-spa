import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all duration-300 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-teal-100 text-teal-700 [a&]:hover:bg-teal-200",
        secondary:
          "bg-cyan-100 text-cyan-700 [a&]:hover:bg-cyan-200",
        destructive:
          "bg-red-100 text-red-700 [a&]:hover:bg-red-200",
        outline:
          "border border-gray-200 text-gray-700 [a&]:hover:bg-gray-50",
        success:
          "bg-green-100 text-green-700 [a&]:hover:bg-green-200",
        warning:
          "bg-amber-100 text-amber-700 [a&]:hover:bg-amber-200",
        info:
          "bg-blue-100 text-blue-700 [a&]:hover:bg-blue-200",
        purple:
          "bg-purple-100 text-purple-700 [a&]:hover:bg-purple-200",
        gradient:
          "bg-gradient-to-r from-teal-500 to-cyan-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
