import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "success" | "warning" | "danger" | "mock" | "live";
  size?: "sm" | "md";
}

export function Badge({
  variant = "neutral",
  size = "sm",
  className,
  children,
  ...props
}: BadgeProps) {
  const base = "inline-flex items-center font-medium font-mono rounded-full border transition-colors";

  const variants = {
    neutral: "bg-[#171717] text-[#A3A3A3] border-[#2B2B2B]",
    success: "bg-[#064E3B]/40 text-[#34D399] border-[#065F46]",
    warning: "bg-[#78350F]/40 text-[#FBBF24] border-[#92400E]",
    danger: "bg-[#7F1D1D]/40 text-[#F87171] border-[#991B1B]",
    mock: "bg-[#1E1B4B]/50 text-[#A5B4FC] border-[#3730A3]",
    live: "bg-[#064E3B]/60 text-[#6EE7B7] border-[#10B981]",
  };

  const sizes = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  return (
    <span className={twMerge(clsx(base, variants[variant], sizes[size], className))} {...props}>
      {children}
    </span>
  );
}
