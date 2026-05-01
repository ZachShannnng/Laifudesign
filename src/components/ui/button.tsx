import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const buttonVariants = cva(
  "inline-flex items-center justify-center transition-all focus-visible:outline-none active:opacity-80 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-charcoal text-off-white rounded-[6px] shadow-[rgba(255,255,255,0.2)_0_0.5px_0_0_inset,rgba(0,0,0,0.2)_0_0_0_0.5px_inset,rgba(0,0,0,0.05)_0_1px_2px_0] focus-visible:shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
        ghost:
          "bg-transparent text-charcoal rounded-[6px] border border-charcoal-40 focus-visible:shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
        cream:
          "bg-cream text-charcoal rounded-[6px] focus-visible:shadow-[0_4px_12px_rgba(0,0,0,0.1)]",
        pill:
          "bg-cream text-charcoal rounded-full opacity-50 hover:opacity-80 active:opacity-100 shadow-[rgba(255,255,255,0.2)_0_0.5px_0_0_inset,rgba(0,0,0,0.2)_0_0_0_0.5px_inset,rgba(0,0,0,0.05)_0_1px_2px_0]",
      },
      size: {
        sm: "px-3 py-1 text-sm",
        default: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

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
