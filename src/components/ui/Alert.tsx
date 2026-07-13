import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";

const styles = {
  success: ["bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-green-300", CheckCircle2],
  error: ["bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-red-300", AlertCircle],
  warning: ["bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-amber-300", TriangleAlert],
  info: ["bg-info-50 text-info-700 dark:bg-info-500/10 dark:text-blue-300", Info],
} as const;

export function Alert({ variant = "info", children }: { variant?: keyof typeof styles; children: React.ReactNode }) {
  const [className, Icon] = styles[variant];
  return (
    <div role={variant === "error" ? "alert" : "status"} className={`flex items-start gap-3 rounded-xl p-3.5 text-sm ${className}`}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
