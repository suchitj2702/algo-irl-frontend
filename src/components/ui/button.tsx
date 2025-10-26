import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
 "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
 {
  variants: {
   variant: {
    default: "bg-white/90 dark:bg-accent/10 hover:bg-mint-light /15 border border-slate/30 dark:border-accent/20 text-content shadow-[0_1px_2px_rgba(153,166,178,0.1),0_1px_20px_rgba(248,250,252,0.6)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(200,216,255,0.1)_inset] hover:shadow-[0_1px_3px_rgba(188,204,220,0.3),0_2px_30px_rgba(248,250,252,0.8)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_2px_30px_rgba(200,216,255,0.15)_inset] active:scale-[0.98] rounded-[14px] backdrop-blur-xl",
    primary: "bg-navy hover:bg-navy-dark text-button-foreground border border-navy-dark/30 shadow-[0_1px_2px_rgba(63,74,88,0.2),0_1px_20px_rgba(248,250,252,0.4)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.1),0_1px_20px_rgba(0,0,0,0.3)_inset] hover:shadow-[0_1px_3px_rgba(15,14,37,0.3),0_2px_30px_rgba(248,250,252,0.5)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.15),0_2px_30px_rgba(0,0,0,0.4)_inset] active:scale-[0.98] rounded-[14px] backdrop-blur-xl",
    destructive: "bg-white/90 dark:bg-accent/10 hover:bg-red-50 /15 border border-red-500/30 dark:border-red-400/20 text-red-600 dark:text-red-400 shadow-[0_1px_2px_rgba(239,68,68,0.1),0_1px_20px_rgba(248,250,252,0.6)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_20px_rgba(200,216,255,0.1)_inset] hover:shadow-[0_1px_3px_rgba(239,68,68,0.2),0_2px_30px_rgba(248,250,252,0.8)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_2px_30px_rgba(200,216,255,0.15)_inset] active:scale-[0.98] rounded-[14px] backdrop-blur-xl",
    outline: "bg-transparent hover:bg-cream/80 /5 border border-outline-subtle hover:border-mint/60 text-content shadow-[0_1px_20px_rgba(248,250,252,0.3)_inset] dark:shadow-[0_1px_20px_rgba(159,191,235,0.05)_inset] hover:shadow-[0_1px_2px_rgba(188,204,220,0.1),0_1px_30px_rgba(248,250,252,0.4)_inset] dark:hover:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_1px_30px_rgba(159,191,235,0.08)_inset] active:scale-[0.98] rounded-[14px] backdrop-blur-xl",
    secondary: "bg-mint/20 dark:bg-mint/8 hover:bg-mint/30 /12 border border-mint/40 dark:border-mint/20 text-content shadow-[0_1px_2px_rgba(188,204,220,0.1),0_1px_18px_rgba(248,250,252,0.5)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.25),0_1px_18px_rgba(147,183,255,0.08)_inset] hover:shadow-[0_1px_3px_rgba(188,204,220,0.2),0_2px_25px_rgba(248,250,252,0.6)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.35),0_2px_25px_rgba(147,183,255,0.12)_inset] active:scale-[0.98] rounded-[14px] backdrop-blur-xl",
    ghost: "bg-transparent hover:bg-mint-light/60 /5 text-content-muted dark:text-content-subtle hover:text-content dark:hover:text-button-foreground hover:shadow-[0_1px_20px_rgba(188,204,220,0.3)_inset] dark:hover:shadow-[0_1px_20px_rgba(255,255,255,0.05)_inset] active:scale-[0.98] rounded-[14px]",
    glass: "bg-cream/70 dark:bg-accent/12 hover:bg-cream/90 /16 backdrop-blur-2xl border border-slate/30 dark:border-accent/20 text-content shadow-[0_1px_2px_rgba(153,166,178,0.1),0_1px_25px_rgba(248,250,252,0.7)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_1px_25px_rgba(200,216,255,0.12)_inset] hover:shadow-[0_1px_3px_rgba(153,166,178,0.15),0_2px_35px_rgba(248,250,252,0.9)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_2px_35px_rgba(200,216,255,0.18)_inset] active:scale-[0.98] rounded-[16px]",
    run: "bg-button-100/85 dark:bg-button-800/35 hover:bg-button-200/90 dark:hover:bg-button-700/55 text-button-foreground/90 dark:text-button-foreground border border-button-300/70 dark:border-button-600/60 shadow-[0_1px_2px_rgba(88,108,140,0.18),0_1px_18px_rgba(255,255,255,0.4)_inset] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_1px_18px_rgba(184,204,255,0.12)_inset] hover:shadow-[0_1px_3px_rgba(88,108,140,0.25),0_2px_26px_rgba(255,255,255,0.5)_inset] dark:hover:shadow-[0_1px_3px_rgba(0,0,0,0.4),0_2px_26px_rgba(184,204,255,0.16)_inset] active:scale-[0.98] rounded-[14px] backdrop-blur-xl",
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
