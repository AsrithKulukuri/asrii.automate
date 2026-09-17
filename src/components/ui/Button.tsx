import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0A] disabled:opacity-50 disabled:cursor-not-allowed select-none";

    const variants = {
      primary:
        "bg-[#F5F5F5] text-[#0A0A0A] hover:bg-white active:bg-[#E5E5E5] focus:ring-white",
      secondary:
        "bg-[#1A1A1A] text-[#F5F5F5] hover:bg-[#262626] border border-[#2B2B2B] active:bg-[#202020] focus:ring-[#404040]",
      outline:
        "bg-transparent text-[#F5F5F5] hover:bg-[#1A1A1A] border border-[#2B2B2B] active:bg-[#202020] focus:ring-[#404040]",
      ghost:
        "bg-transparent text-[#A3A3A3] hover:text-[#F5F5F5] hover:bg-[#171717] active:bg-[#202020] focus:ring-[#404040]",
      danger:
        "bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] focus:ring-[#DC2626]",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 h-8 gap-1.5",
      md: "text-sm px-4 py-2 h-9 gap-2",
      lg: "text-base px-5 py-2.5 h-11 gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
