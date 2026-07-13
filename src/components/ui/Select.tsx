import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = {
  value: string | number;
  label: string;
};

type SelectProps = {
  name?: string;
  options: SelectOption[];
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string) => void;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
};

export function Select({
  name,
  options,
  value,
  defaultValue,
  onChange,
  ariaLabel,
  className = "",
  disabled = false,
}: SelectProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const isControlled = value !== undefined;
  const initialValue = String(defaultValue ?? options[0]?.value ?? "");
  const [internalValue, setInternalValue] = useState(initialValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const currentValue = String(isControlled ? value : internalValue);
  const selectedIndex = Math.max(0, options.findIndex((option) => String(option.value) === currentValue));
  const selected = options[selectedIndex];

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const choose = (index: number) => {
    const next = options[index];
    if (!next) return;
    const nextValue = String(next.value);
    if (!isControlled) setInternalValue(nextValue);
    setOpen(false);
    onChange?.(nextValue);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) choose(activeIndex);
      else {
        setActiveIndex(selectedIndex);
        setOpen(true);
      }
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      if (!open) {
        setActiveIndex(selectedIndex);
        setOpen(true);
      } else {
        setActiveIndex((index) => (index + direction + options.length) % options.length);
      }
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {name && <input type="hidden" name={name} value={currentValue} />}
      <button
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        className="field flex items-center justify-between gap-3 text-left disabled:opacity-50"
        onClick={() => {
          setActiveIndex(selectedIndex);
          setOpen((state) => !state);
        }}
        onKeyDown={handleKeyDown}
      >
        <span className="min-w-0 truncate">{selected?.label || "Выберите значение"}</span>
        <ChevronDown className={`size-4 shrink-0 text-gray-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-[70] mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border bg-white p-1.5 shadow-overlay dark:bg-gray-900"
        >
          {options.map((option, index) => {
            const optionValue = String(option.value);
            const isSelected = optionValue === currentValue;
            return (
              <li
                key={optionValue}
                role="option"
                aria-selected={isSelected}
                className={`flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm ${index === activeIndex ? "bg-gray-100 dark:bg-white/10" : ""} ${isSelected ? "font-semibold text-forest dark:text-brand-300" : "text-gray-700 dark:text-gray-200"}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  choose(index);
                }}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check className="size-4 shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
