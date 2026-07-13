import type { LucideIcon } from "lucide-react";

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <span className="mb-4 grid size-12 place-items-center rounded-xl bg-brand-50 text-forest dark:bg-brand-500/10 dark:text-brand-300">
        <Icon size={22} />
      </span>
      <h3 className="font-semibold">{title}</h3>
      <p className="muted mt-1 max-w-sm text-sm">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
