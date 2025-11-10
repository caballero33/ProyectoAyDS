import React from "react"
import { cn } from "../../lib/utils"
import "./button.css"

const VARIANT_MAP = {
  default: "ms-btn--default",
  accent: "ms-btn--accent",
  outline: "ms-btn--outline",
  ghost: "ms-btn--ghost",
  secondary: "ms-btn--secondary",
  destructive: "ms-btn--destructive",
}

const SIZE_MAP = {
  sm: "ms-btn--sm",
  md: "ms-btn--md",
  lg: "ms-btn--lg",
}

export function Button({ children, className = "", variant = "default", size = "md", ...props }) {
  return (
    <button
      className={cn("ms-btn", VARIANT_MAP[variant] ?? VARIANT_MAP.default, SIZE_MAP[size] ?? SIZE_MAP.md, className)}
      {...props}
    >
      {children}
    </button>
  )
}