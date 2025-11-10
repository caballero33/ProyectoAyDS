import React from "react"
import { cn } from "../../lib/utils"
import "./card.css"

export function Card({ children, className = "", flat = false, ...props }) {
  return (
    <div className={cn("ms-card", flat && "ms-card--flat", className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = "", ...props }) {
  return (
    <div className={cn("ms-card__header", className)} {...props}>
      {children}
    </div>
  )
}

export function CardContent({ children, className = "", ...props }) {
  return (
    <div className={cn("ms-card__content", className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = "", ...props }) {
  return (
    <h3 className={cn("ms-card__title", className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ children, className = "", ...props }) {
  return (
    <p className={cn("ms-card__description", className)} {...props}>
      {children}
    </p>
  )
}
