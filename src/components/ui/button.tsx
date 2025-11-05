import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
 "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
 {
  variants: {
   variant: {
    default: "bg-white/95 dark:bg-accent/10 hover:bg-white border border-slate/30 dark:border-accent/20 text-content shadow-[0_1px_2px_rgba(153,166,178,0.1),0_1px_20px_rgba(248,250,252,0.6)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(200,216,255,0.1)_inset] hover:shadow-[0_1px_3px_rgba(188,204,220,0.3),0_2px_30px_rgba(248,250,252,0.8)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_2px_30px_rgba(200,216,255,0.15)_inset] hover:-translate-y-0.5 active:scale-[0.98] rounded-[14px] backdrop-blur-xl transition-all duration-200",
    primary: "bg-gradient-to-r from-[#5B8FDF] to-[#4A7FD4] hover:from-[#4A7FD4] hover:to-[#3968C4] text-white border border-[#4A7FD4]/30 shadow-[0_2px_8px_rgba(91,143,223,0.25),0_1px_20px_rgba(248,250,252,0.4)_inset] dark:shadow-[0_2px_8px_rgba(74,127,212,0.3),0_1px_20px_rgba(255,255,255,0.1)_inset] hover:shadow-[0_4px_16px_rgba(91,143,223,0.35),0_2px_30px_rgba(248,250,252,0.5)_inset] dark:hover:shadow-[0_4px_16px_rgba(74,127,212,0.4),0_2px_30px_rgba(255,255,255,0.15)_inset] hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] rounded-[14px] backdrop-blur-xl transition-all duration-200",
    destructive: "bg-white/95 dark:bg-accent/10 hover:bg-red-50 border border-red-500/30 dark:border-red-400/20 text-red-600 dark:text-red-400 shadow-[0_1px_2px_rgba(239,68,68,0.1),0_1px_20px_rgba(248,250,252,0.6)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(200,216,255,0.1)_inset] hover:shadow-[0_1px_3px_rgba(239,68,68,0.2),0_2px_30px_rgba(248,250,252,0.8)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_2px_30px_rgba(200,216,255,0.15)_inset] hover:-translate-y-0.5 active:scale-[0.98] rounded-[14px] backdrop-blur-xl transition-all duration-200",
    outline: "bg-transparent hover:bg-cream/80 border border-outline-subtle hover:border-[#7DD3FC]/40 text-content shadow-[0_1px_20px_rgba(248,250,252,0.3)_inset] dark:shadow-[0_1px_20px_rgba(159,191,235,0.05)_inset] hover:shadow-[0_1px_2px_rgba(125,211,252,0.1),0_1px_30px_rgba(248,250,252,0.4)_inset] dark:hover:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_1px_30px_rgba(125,211,252,0.08)_inset] hover:-translate-y-0.5 active:scale-[0.98] rounded-[14px] backdrop-blur-xl transition-all duration-200",
    secondary: "bg-[#7DD3FC]/12 dark:bg-[#7DD3FC]/8 hover:bg-[#7DD3FC]/20 dark:hover:bg-[#7DD3FC]/12 border border-[#7DD3FC]/30 dark:border-[#7DD3FC]/20 text-content shadow-[0_1px_2px_rgba(125,211,252,0.1),0_1px_18px_rgba(248,250,252,0.5)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.25),0_1px_18px_rgba(125,211,252,0.08)_inset] hover:shadow-[0_1px_3px_rgba(125,211,252,0.2),0_2px_25px_rgba(248,250,252,0.6)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.35),0_2px_25px_rgba(125,211,252,0.12)_inset] hover:-translate-y-0.5 active:scale-[0.98] rounded-[14px] backdrop-blur-xl transition-all duration-200",
    ghost: "bg-transparent hover:bg-[#7DD3FC]/8 text-content-muted dark:text-content-subtle hover:text-content dark:hover:text-button-foreground hover:shadow-[0_1px_20px_rgba(125,211,252,0.15)_inset] dark:hover:shadow-[0_1px_20px_rgba(125,211,252,0.1)_inset] active:scale-[0.98] rounded-[14px] transition-all duration-200",
    glass: "bg-cream/70 dark:bg-accent/12 hover:bg-cream/90 backdrop-blur-2xl border border-slate/30 dark:border-accent/20 text-content shadow-[0_1px_2px_rgba(153,166,178,0.1),0_1px_25px_rgba(248,250,252,0.7)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_25px_rgba(200,216,255,0.12)_inset] hover:shadow-[0_1px_3px_rgba(153,166,178,0.15),0_2px_35px_rgba(248,250,252,0.9)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_2px_35px_rgba(200,216,255,0.18)_inset] hover:-translate-y-0.5 active:scale-[0.98] rounded-[16px] transition-all duration-200",
    run: "bg-gradient-to-r from-[#3B82F6] to-[#6366F1] hover:from-[#2563EB] hover:to-[#4F46E5] text-white border border-[#6366F1]/30 shadow-[0_2px_8px_rgba(99,102,241,0.25),0_1px_18px_rgba(255,255,255,0.4)_inset] dark:shadow-[0_2px_8px_rgba(99,102,241,0.3),0_1px_18px_rgba(255,255,255,0.12)_inset] hover:shadow-[0_4px_16px_rgba(99,102,241,0.35),0_2px_26px_rgba(255,255,255,0.5)_inset] dark:hover:shadow-[0_4px_16px_rgba(99,102,241,0.4),0_2px_26px_rgba(255,255,255,0.16)_inset] hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] rounded-[14px] backdrop-blur-xl transition-all duration-200",
    premium: "bg-gradient-to-r from-[#7DD3FC] to-[#60A5FA] hover:from-[#60A5FA] hover:to-[#3B82F6] text-white border border-[#60A5FA]/30 shadow-[0_2px_8px_rgba(125,211,252,0.25),0_1px_20px_rgba(248,250,252,0.4)_inset] dark:shadow-[0_2px_8px_rgba(96,165,250,0.3),0_1px_20px_rgba(255,255,255,0.1)_inset] hover:shadow-[0_4px_16px_rgba(125,211,252,0.35),0_2px_30px_rgba(248,250,252,0.5)_inset] dark:hover:shadow-[0_4px_16px_rgba(96,165,250,0.4),0_2px_30px_rgba(255,255,255,0.15)_inset] hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] rounded-[14px] backdrop-blur-xl transition-all duration-200",
    action: "bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white border border-[#D97706]/30 shadow-[0_2px_8px_rgba(245,158,11,0.25),0_1px_20px_rgba(248,250,252,0.4)_inset] dark:shadow-[0_2px_8px_rgba(217,119,6,0.3),0_1px_20px_rgba(255,255,255,0.1)_inset] hover:shadow-[0_4px_16px_rgba(245,158,11,0.35),0_2px_30px_rgba(248,250,252,0.5)_inset] dark:hover:shadow-[0_4px_16px_rgba(217,119,6,0.4),0_2px_30px_rgba(255,255,255,0.15)_inset] hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] rounded-[14px] backdrop-blur-xl transition-all duration-200",
    teal: "bg-gradient-to-r from-[#14B8A6] to-[#0D9488] hover:from-[#0D9488] hover:to-[#0F766E] text-white border border-[#0D9488]/30 shadow-[0_2px_8px_rgba(20,184,166,0.25),0_1px_20px_rgba(248,250,252,0.4)_inset] dark:shadow-[0_2px_8px_rgba(13,148,136,0.3),0_1px_20px_rgba(255,255,255,0.1)_inset] hover:shadow-[0_4px_16px_rgba(20,184,166,0.35),0_2px_30px_rgba(248,250,252,0.5)_inset] dark:hover:shadow-[0_4px_16px_rgba(13,148,136,0.4),0_2px_30px_rgba(255,255,255,0.15)_inset] hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] rounded-[14px] backdrop-blur-xl transition-all duration-200",
   },
   size: {
    default: "h-11 px-6 py-2.5 text-[15px]",
    sm: "h-9 px-4 py-2 text-[13px] rounded-[12px]",
    lg: "h-[52px] px-8 py-3 text-[17px] rounded-[16px]",
    xl: "h-14 px-10 py-4 text-[19px] rounded-[18px]",
    icon: "h-11 w-11 rounded-[14px]",
   },
  },
  defaultVariants: {
   variant: "default",
   size: "default",
  },
 }
)

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
 VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
 ({ className, variant, size, ...props }, ref) => {
  return (
   <button
    className={cn(buttonVariants({ variant, size, className }))}
    ref={ref}
    {...props}
   />
  )
 }
)
Button.displayName = "Button"

export { Button, buttonVariants }
