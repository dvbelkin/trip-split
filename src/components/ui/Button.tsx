import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  startIcon?: ReactNode;
};

const variants = {
  primary: "bg-forest text-white hover:bg-brand-700",
  secondary:
    "border bg-white text-gray-700 hover:bg-gray-50 dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10",
  danger:
    "bg-error-50 text-error-700 hover:bg-red-100 dark:bg-error-500/15 dark:text-red-300",
};

export function Button({
  variant = "primary",
  size = "md",
  startIcon,
  className = "",
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        size === "sm" ? "min-h-9 px-3" : "min-h-11 px-4"
      } ${variants[variant]} ${className}`}
      {...props}
    >
      {startIcon}
      {children}
    </button>
  );
}
