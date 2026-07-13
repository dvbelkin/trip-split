import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export function PageHeader({ title, description, parent, actions }: { title: string; description?: React.ReactNode; parent?: { label: string; to: string }; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 md:mb-8">
      {parent && (
        <nav aria-label="Хлебные крошки" className="mb-3 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <Link className="hover:text-forest dark:hover:text-brand-300" to={parent.to}>{parent.label}</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span aria-current="page" className="truncate">{title}</span>
        </nav>
      )}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">{title}</h1>
          {description && <div className="muted mt-1.5 text-sm">{description}</div>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
