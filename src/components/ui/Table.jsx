import React from "react"
import { cn } from "../../lib/utils" 

export function Table({ children, className = "", ...props }) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        className={cn(
          "w-full caption-bottom text-sm border-collapse border border-[var(--border)] rounded-md",
          className
        )}
        {...props}
      >
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ children, className = "", ...props }) {
  return (
    <thead
      className={cn("bg-[var(--muted)] text-[var(--muted-foreground)]", className)}
      {...props}
    >
      {children}
    </thead>
  )
}

export function TableBody({ children, className = "", ...props }) {
  return (
    <tbody
      className={cn("divide-y divide-[var(--border)] text-[var(--foreground)]", className)}
      {...props}
    >
      {children}
    </tbody>
  )
}

export function TableRow({ children, className = "", ...props }) {
  return (
    <tr
      className={cn(
        "hover:bg-[var(--muted)] transition-colors duration-200",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
}

export function TableHead({ children, className = "", ...props }) {
  return (
    <th
      className={cn(
        "px-4 py-2 text-left font-semibold border border-[var(--border)] bg-[var(--muted)] text-[var(--muted-foreground)]",
        className
      )}
      {...props}
    >
      {children}
    </th>
  )
}

export function TableCell({ children, className = "", ...props }) {
  return (
    <td
      className={cn(
        "px-4 py-2 border border-[var(--border)] text-[var(--foreground)]",
        className
      )}
      {...props}
    >
      {children}
    </td>
  )
}