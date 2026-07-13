import { useState } from "react";
import { Check } from "lucide-react";

export function Checkbox({
  name,
  value = "1",
  defaultChecked = false,
  checked,
  onChange,
  label,
  className = "",
}: {
  name?: string;
  value?: string | number;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label: React.ReactNode;
  className?: string;
}) {
  const controlled = checked !== undefined;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isChecked = controlled ? checked : internalChecked;

  const toggle = () => {
    const next = !isChecked;
    if (!controlled) setInternalChecked(next);
    onChange?.(next);
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {name && isChecked && <input type="hidden" name={name} value={String(value)} />}
      <button
        type="button"
        role="checkbox"
        aria-checked={isChecked}
        onClick={toggle}
        className={`grid size-5 shrink-0 place-items-center rounded-md border transition ${isChecked ? "border-forest bg-forest text-white" : "bg-white text-transparent hover:border-brand-400 dark:bg-white/5"}`}
      >
        <Check size={14} strokeWidth={3} />
      </button>
      <button type="button" onClick={toggle} className="min-w-0 text-left text-sm">{label}</button>
    </div>
  );
}
