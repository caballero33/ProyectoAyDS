import React from "react"
import { cn } from "../../lib/utils"
import "./input.css"

export function Input({ className = "", ...props }) {
  return <input className={cn("ms-input", className)} {...props} />
}