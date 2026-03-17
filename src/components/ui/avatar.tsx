"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const avatarSizes = {
  default: "h-10 w-10",
  sm: "h-8 w-8",
  lg: "h-12 w-12",
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> & {
    size?: keyof typeof avatarSizes
  }
>(({ className, size = "default", ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex shrink-0 overflow-hidden rounded-full",
      avatarSizes[size],
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

const AvatarBadge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "absolute bottom-0 end-0 block h-2.5 w-2.5 rounded-full border-2 border-background ring-0",
      className
    )}
    {...props}
  />
))
AvatarBadge.displayName = "AvatarBadge"

const AvatarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex -space-x-2 [&>*]:border-[1.5px] [&>*]:border-white dark:[&>*]:border-[#1a1917] [&>*:first-child]:z-[1] [&>*:nth-child(2)]:z-[2] [&>*:nth-child(3)]:z-[3] [&>*:nth-child(4)]:z-[4] [&>*:nth-child(5)]:z-[5]",
      className
    )}
    {...props}
  />
))
AvatarGroup.displayName = "AvatarGroup"

const AvatarGroupCount = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn(
      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-subtle-pressed text-xs font-medium text-fg-subtle",
      className
    )}
    {...props}
  />
))
AvatarGroupCount.displayName = "AvatarGroupCount"

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
}
