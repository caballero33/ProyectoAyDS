import React from "react"
import { cn } from "../../lib/utils"

export function Input({ className = "", ...props }) {
  return (
    <input
      className={cn(
        "w-full rounded-md border px-3 py-2 bg-[var(--input)] text-[var(--foreground)] placeholder:opacity-70 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]",
        className
      )}
      {...props}
    />
  )
}