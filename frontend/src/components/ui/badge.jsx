import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-indigo-600 text-white shadow-sm hover:bg-indigo-700",
        secondary:
          "border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
        destructive:
          "border-transparent bg-red-500 text-white shadow-sm hover:bg-red-600",
        success:
          "border-transparent bg-emerald-500 text-white shadow-sm",
        outline:
          "border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300",
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
  ...props
}) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
