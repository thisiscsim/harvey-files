import * as React from "react"
import { cn } from "@/lib/utils"

const buttonVariants = {
  variant: {
    default: "bg-button-inverted text-fg-on-color hover:bg-button-inverted-hover active:bg-button-inverted-pressed",
    secondary: "bg-button-neutral border border-border-base hover:bg-button-neutral-hover active:bg-button-neutral-pressed text-fg-base",
    ghost: "hover:bg-button-neutral-hover active:bg-button-neutral-pressed text-fg-subtle",
    outline: "bg-button-neutral border border-border-base hover:bg-button-neutral-hover active:bg-button-neutral-pressed text-fg-base",
    danger: "bg-button-danger text-white hover:bg-button-danger-hover active:bg-button-danger-pressed",
  },
  size: {
    default: "h-7 px-2 text-sm rounded-[7px]",
    medium: "h-7 px-2 text-sm rounded-[7px]",
    small: "h-6 px-2 text-xs rounded-[6px]",
    icon: "h-7 w-7 rounded-[7px]",
    iconSmall: "h-6 w-6 rounded-[6px]",
  },
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variant
  size?: keyof typeof buttonVariants.size
  children?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", children, ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-interactive disabled:pointer-events-none disabled:opacity-50",
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

// Small button with icon - specialized component for toolbar buttons
export interface SmallButtonProps extends Omit<ButtonProps, 'size'> {
  icon?: React.ReactNode
  children?: React.ReactNode
}

const SmallButton = React.forwardRef<HTMLButtonElement, SmallButtonProps>(
  ({ className, variant = "secondary", icon, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size="small"
        className={cn(
          "gap-1",
          className
        )}
        {...props}
      >
        {icon}
        {children}
      </Button>
    )
  }
)

SmallButton.displayName = "SmallButton"

export { Button, SmallButton, buttonVariants } 