import React from "react"
import { cn } from "../../lib/utils"
import "./label.css"

export function Label({ children, className = "", ...props }) {
  return (
    <label className={cn("ms-label", className)} {...props}>
      {children}
    </label>
  )
}