"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:rounded-xl group-[.toaster]:border group-[.toaster]:shadow-lg group-[.toaster]:p-4 group-[.toaster]:flex group-[.toaster]:items-start group-[.toaster]:gap-3",
          title: "group-[.toast]:text-sm group-[.toast]:font-semibold",
          description: "group-[.toast]:text-sm group-[.toast]:text-gray-500",
          actionButton:
            "group-[.toast]:bg-teal-500 group-[.toast]:text-white group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-600 group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm",
          // Pastel colors for different states
          success:
            "group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-emerald-50 group-[.toaster]:to-teal-50 group-[.toaster]:border-emerald-200 group-[.toaster]:text-emerald-800 [&>svg]:text-emerald-500",
          error:
            "group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-rose-50 group-[.toaster]:to-pink-50 group-[.toaster]:border-rose-200 group-[.toaster]:text-rose-800 [&>svg]:text-rose-500",
          warning:
            "group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-amber-50 group-[.toaster]:to-orange-50 group-[.toaster]:border-amber-200 group-[.toaster]:text-amber-800 [&>svg]:text-amber-500",
          info:
            "group-[.toaster]:bg-gradient-to-r group-[.toaster]:from-cyan-50 group-[.toaster]:to-sky-50 group-[.toaster]:border-cyan-200 group-[.toaster]:text-cyan-800 [&>svg]:text-cyan-500",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
