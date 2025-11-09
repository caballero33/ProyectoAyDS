import React from "react"
import { cn } from "../../lib/utils"

/* Exports with same names your code imports: Card, CardHeader, CardContent, CardTitle, CardDescription */

export function Card({ children, className = "", ...props }) {
  return (
    <div className={cn("bg-[var(--card)] text-[var(--card-foreground)] rounded-md shadow-sm border border-[var(--border)]", className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = "", ...props }) {
  return <div className={cn("px-4 py-3 border-b border-[var(--border)]", className)} {...props}>{children}</div>
}

export function CardContent({ children, className = "", ...props }) {
  return <div className={cn("p-4", className)} {...props}>{children}</div>
}

export function CardTitle({ children, className = "", ...props }) {
  return <h3 className={cn("text-lg font-bold", className)} {...props}>{children}</h3>
}

export function CardDescription({ children, className = "", ...props }) {
  return <p className={cn("text-sm opacity-80 mt-1", className)} {...props}>{children}</p>
}