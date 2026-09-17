import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function Card({ className, elevated = false, children, ...props }: CardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          "rounded-xl border transition-all duration-150",
          elevated
            ? "bg-[#141414] border-[#2A2A2A] shadow-sm"
            : "bg-[#111111] border-[#222222]",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge("px-5 py-4 border-b border-[#222222] flex items-center justify-between", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge("p-5", className)} {...props}>
      {children}
    </div>
  );
}
