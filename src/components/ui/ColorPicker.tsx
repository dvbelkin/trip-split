import { useEffect, useRef, useState } from "react";
import { Check, Palette } from "lucide-react";

const colors = ["#295943", "#3F7E5F", "#7189BF", "#7A5AF8", "#2E90FA", "#12B76A", "#F79009", "#E87B5F", "#F04438", "#667085", "#17211B", "#FFFFFF"];
const normalize = (value: string) => /^#[0-9a-f]{6}$/i.test(value) ? value.toUpperCase() : "#7189BF";

export function ColorPicker({ name, defaultValue = "#7189BF", value, onChange, ariaLabel = "Выберите цвет" }: { name?: string; defaultValue?: string; value?: string; onChange?: (value: string) => void; ariaLabel?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(normalize(defaultValue));
  const [open, setOpen] = useState(false);
  const currentValue = normalize(controlled ? value! : internalValue);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const choose = (nextValue: string) => {
    const next = normalize(nextValue);
    if (!controlled) setInternalValue(next);
    onChange?.(next);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      {name && <input type="hidden" name={name} value={currentValue} />}
      <button type="button" aria-label={ariaLabel} aria-expanded={open} onClick={() => setOpen((state) => !state)} className="grid size-11 place-items-center rounded-lg border bg-white dark:bg-white/5">
        <span className="size-6 rounded-md border shadow-sm" style={{ backgroundColor: currentValue }} />
      </button>
      {open && (
        <div role="dialog" aria-label={ariaLabel} className="absolute right-0 z-[80] mt-1.5 w-56 rounded-xl border bg-white p-3 shadow-overlay dark:bg-gray-900">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Palette size={16} />Цвет</div>
          <div className="grid grid-cols-6 gap-2">
            {colors.map((color) => <button key={color} type="button" aria-label={color} onClick={() => choose(color)} className="relative grid size-7 place-items-center rounded-md border shadow-sm" style={{ backgroundColor: color }}>{currentValue === color.toUpperCase() && <Check size={15} className={color === "#FFFFFF" ? "text-gray-900" : "text-white"} />}</button>)}
          </div>
          <label className="mt-3 block"><span className="label">HEX</span><input className="field uppercase" value={currentValue} maxLength={7} onChange={(event) => { const next = event.target.value; if (/^#[0-9a-f]{6}$/i.test(next)) choose(next); }} /></label>
        </div>
      )}
    </div>
  );
}
