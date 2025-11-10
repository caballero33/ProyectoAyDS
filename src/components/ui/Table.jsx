import React from "react"
import { cn } from "../../lib/utils"
import "./table.css"

export function Table({ children, className = "", ...props }) {
  return (
    <div className="ms-table-wrapper">
      <table className={cn("ms-table", className)} {...props}>
        {children}
      </table>
    </div>
  )
}

export function TableHeader({ children, className = "", ...props }) {
  return (
    <thead className={cn(className)} {...props}>
      {children}
    </thead>
  )
}

export function TableBody({ children, className = "", ...props }) {
  return (
    <tbody className={cn(className)} {...props}>
      {children}
    </tbody>
  )
}

export function TableRow({ children, className = "", ...props }) {
  return (
    <tr className={cn(className)} {...props}>
      {children}
    </tr>
  )
}

export function TableHead({ children, className = "", ...props }) {
  return (
    <th className={cn(className)} {...props}>
      {children}
    </th>
  )
}

export function TableCell({ children, className = "", ...props }) {
  return (
    <td className={cn(className)} {...props}>
      {children}
    </td>
  )
}
