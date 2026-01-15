import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
 "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
 {
  variants: {
   variant: {
    default:
     "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary:
     "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive:
     "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground",
    success:
     "border-transparent bg-mint-100 dark:bg-mint-900/30 text-mint-700 dark:text-mint-300",
    warning:
     "border-transparent bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
    error:
     "border-transparent bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    info:
     "border-transparent bg-slate-100 dark:bg-panel-100/30 text-content-subtle",
   },
  },
  defaultVariants: {
   variant: "default",
  },
 }
)

export interface BadgeProps
 extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
 return (
  <div className={cn(badgeVariants({ variant }), className)} {...props} />
 )
}

export { Badge, badgeVariants }
