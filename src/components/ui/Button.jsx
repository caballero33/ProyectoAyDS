import React from "react"
import { cn } from "../../lib/utils" 

export function Button({
  children,
  className = "",
  variant = "default",
  size = "default",
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"

  // 🎨 variantes de color
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-100",
    ghost: "bg-transparent hover:bg-gray-100",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  }

  // 📏 tamaños
  const sizes = {
    default: "px-4 py-2 text-sm",
    sm: "px-3 py-1 text-sm",
    lg: "px-6 py-3 text-base",
  }

  const classes = cn(baseStyles, variants[variant], sizes[size], className)

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}