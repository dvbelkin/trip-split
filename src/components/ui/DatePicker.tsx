import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const months = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const pad = (value: number) => String(value).padStart(2, "0");
const toValue = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseValue = (value?: string) => {
  const [year, month, day] = (value || "").split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
};

export function DatePicker({ name, defaultValue = "", value, onChange, ariaLabel = "Выберите дату", required = false }: { name?: string; defaultValue?: string; value?: string; onChange?: (value: string) => void; ariaLabel?: string; required?: boolean }) {
  const dialogId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const currentValue = controlled ? value : internalValue;
  const selectedDate = parseValue(currentValue);
  const [viewDate, setViewDate] = useState(() => selectedDate || new Date());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const days = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 42 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
  }, [viewDate]);

  const choose = (date: Date) => {
    const next = toValue(date);
    if (!controlled) setInternalValue(next);
    onChange?.(next);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      {name && <input type="hidden" name={name} value={currentValue} />}
      <button type="button" aria-label={ariaLabel} aria-expanded={open} aria-controls={dialogId} onClick={() => setOpen((state) => !state)} className="field flex items-center justify-between gap-3 text-left">
        <span className={currentValue ? "" : "text-gray-400"}>{currentValue || "Выберите дату"}{required && !currentValue ? " *" : ""}</span>
        <CalendarDays className="size-4 shrink-0 text-gray-400" />
      </button>
      {open && (
        <div id={dialogId} role="dialog" aria-label={ariaLabel} className="absolute left-0 z-[80] mt-1.5 w-[292px] rounded-xl border bg-white p-3 shadow-overlay dark:bg-gray-900">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" aria-label="Предыдущий месяц" className="grid size-9 place-items-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}><ChevronLeft size={17} /></button>
            <strong className="text-sm">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</strong>
            <button type="button" aria-label="Следующий месяц" className="grid size-9 place-items-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/10" onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}><ChevronRight size={17} /></button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400">{weekdays.map((day) => <span key={day} className="py-1.5">{day}</span>)}</div>
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((date) => {
              const dateValue = toValue(date);
              const selected = dateValue === currentValue;
              const outside = date.getMonth() !== viewDate.getMonth();
              const today = dateValue === toValue(new Date());
              return <button key={dateValue} type="button" aria-label={dateValue} aria-pressed={selected} onClick={() => choose(date)} className={`grid size-9 place-items-center rounded-lg text-sm transition ${selected ? "bg-forest font-semibold text-white" : today ? "bg-brand-50 font-semibold text-forest dark:bg-brand-500/15 dark:text-brand-300" : "hover:bg-gray-100 dark:hover:bg-white/10"} ${outside && !selected ? "text-gray-300 dark:text-gray-600" : ""}`}>{date.getDate()}</button>;
            })}
          </div>
          <div className="mt-2 flex justify-between border-t pt-2">
            <button type="button" className="px-2 py-1.5 text-sm font-semibold text-gray-500" onClick={() => { if (!controlled) setInternalValue(""); onChange?.(""); setOpen(false); }}>Очистить</button>
            <button type="button" className="px-2 py-1.5 text-sm font-semibold text-forest dark:text-brand-300" onClick={() => choose(new Date())}>Сегодня</button>
          </div>
        </div>
      )}
    </div>
  );
}
