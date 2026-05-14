import React from "react";
import { cn } from "@/lib/utils";

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-sm text-left", className)}>{children}</table>
    </div>
  );
}

export function TableHead({ children, className }: TableProps) {
  return (
    <thead className={cn("bg-gray-50 border-b border-gray-200", className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: TableProps) {
  return <tbody className={cn("divide-y divide-gray-100", className)}>{children}</tbody>;
}

export function TableRow({ children, className, onClick }: TableProps & { onClick?: () => void }) {
  return (
    <tr
      className={cn(
        "hover:bg-gray-50 transition-colors",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableHeader({ children, className }: TableProps) {
  return (
    <th className={cn("px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider", className)}>
      {children}
    </th>
  );
}

export function TableCell({ children, className }: TableProps) {
  return (
    <td className={cn("px-4 py-3 text-gray-700", className)}>{children}</td>
  );
}
