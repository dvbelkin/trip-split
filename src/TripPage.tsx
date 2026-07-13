import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Receipt,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  api,
  Category,
  Contribution,
  Dashboard,
  Expense,
  Member,
  Trip,
} from "./api";
import { PageHeader } from "./components/layout/PageHeader";
import { Alert } from "./components/ui/Alert";
import { Checkbox } from "./components/ui/Checkbox";
import { ColorPicker } from "./components/ui/ColorPicker";
import { DatePicker } from "./components/ui/DatePicker";
import { EmptyState } from "./components/ui/EmptyState";
import { Modal } from "./components/ui/Modal";
import { Select } from "./components/ui/Select";

const money = (n: number, c: string) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: c,
    maximumFractionDigits: 2,
  }).format(n / 100);
function ExpenseForm({
  expense,
  members,
  categories,
  onSave,
}: {
  expense?: Expense;
  members: Member[];
  categories: Category[];
  onSave: (body: any) => Promise<void>;
}) {
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget),
          participant_ids = fd.getAll("participants").map(Number);
        try {
          await onSave({ ...Object.fromEntries(fd), participant_ids });
        } catch (x: any) {
          setError(x.message);
        }
      }}
      className="space-y-4"
    >
      <label>
        <span className="label">Что покупали</span>
        <input
          className="field"
          name="title"
          defaultValue={expense?.title}
          required
          autoFocus
        />
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label>
          <span className="label">Сумма</span>
          <input
            className="field"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={expense ? expense.amount / 100 : ""}
            required
          />
        </label>
        <label>
          <span className="label">Дата</span>
          <DatePicker
            name="date"
            defaultValue={
              expense?.date || new Date().toISOString().slice(0, 10)
            }
            ariaLabel="Дата расхода"
            required
          />
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label>
          <span className="label">Кто заплатил</span>
          <Select
            name="paid_by"
            defaultValue={expense?.paid_by}
            ariaLabel="Кто заплатил"
            options={members.map((member) => ({ value: member.id, label: member.name }))}
          />
        </label>
        <label>
          <span className="label">Категория</span>
          <Select
            name="category_id"
            defaultValue={expense?.category_id}
            ariaLabel="Категория"
            options={categories.map((category) => ({ value: category.id, label: category.name }))}
          />
        </label>
      </div>
      <fieldset>
        <legend className="label">На кого делим поровну</legend>
        <div className="flex flex-wrap gap-2">
          {members.map((m) => (
            <Checkbox
              key={m.id}
              name="participants"
              value={m.id}
              defaultChecked={!expense || expense.participant_ids.includes(m.id)}
              label={m.name}
              className="rounded-xl border bg-white px-3 py-2 dark:bg-white/5"
            />
          ))}
        </div>
      </fieldset>
      <Checkbox name="paid_from_fund" value="1" defaultChecked={Boolean(expense?.paid_from_fund)} label="Оплачено из общей кассы" className="rounded-xl bg-sage/60 p-3 font-semibold dark:bg-brand-500/10" />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button className="btn-primary w-full">
        {expense ? "Сохранить изменения" : "Сохранить расход"}
      </button>
    </form>
  );
}
export default function TripPage() {
  const { id = "" } = useParams();
  const [data, setData] = useState<{
      trip: Trip;
      members: Member[];
      categories: Category[];
      expenses: Expense[];
      dashboard: Dashboard;
      contributions: Contribution[];
    } | null>(null),
    [modal, setModal] = useState(""),
    [editing, setEditing] = useState<Expense | null>(null),
    [error, setError] = useState(""),
    [loadError, setLoadError] = useState(""),
    [query, setQuery] = useState(""),
    [categoryFilter, setCategoryFilter] = useState("all"),
    [memberFilter, setMemberFilter] = useState("all"),
    [page, setPage] = useState(1);
  const load = async () => {
    setLoadError("");
    try {
      setData(await api.trip(id));
    } catch (loadFailure: any) {
      setLoadError(loadFailure.message);
    }
  };
  useEffect(() => {
    void load();
  }, [id]);
  const filteredExpenses = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");
    return (data?.expenses || []).filter((expense) => {
      const matchesQuery = !normalizedQuery || `${expense.title} ${expense.paid_by_name} ${expense.category_name}`.toLocaleLowerCase("ru-RU").includes(normalizedQuery);
      const matchesCategory = categoryFilter === "all" || String(expense.category_id) === categoryFilter;
      const matchesMember = memberFilter === "all" || String(expense.paid_by) === memberFilter;
      return matchesQuery && matchesCategory && matchesMember;
    });
  }, [data, query, categoryFilter, memberFilter]);
  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(filteredExpenses.length / pageSize));
  const visibleExpenses = filteredExpenses.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, categoryFilter, memberFilter]);

  if (!data && loadError) return <Alert variant="error">Не удалось загрузить поездку: {loadError}</Alert>;
  if (!data)
    return (
      <div aria-label="Загрузка поездки" className="animate-pulse space-y-5">
        <div className="h-8 w-64 rounded-lg bg-gray-200 dark:bg-white/10" />
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="h-40 rounded-2xl bg-gray-200 dark:bg-white/10 lg:col-span-2" />
          <div className="h-40 rounded-2xl bg-gray-200 dark:bg-white/10" />
        </div>
      </div>
    );
  const { trip, members, categories, expenses, dashboard, contributions } =
    data;
  const close = () => {
    setModal("");
    setEditing(null);
    setError("");
  };
  return (
    <>
      <main className="mx-auto max-w-7xl">
        <PageHeader
          title={trip.name}
          parent={{ label: "Все поездки", to: "/" }}
          description={<span className="flex items-center gap-2"><CalendarDays size={16} />{trip.start_date || "Даты не указаны"}{trip.end_date && ` — ${trip.end_date}`}</span>}
          actions={
            <div className="flex items-center gap-2">
              <button aria-label="Изменить название" title="Изменить название" className="grid size-11 place-items-center rounded-lg border bg-white text-gray-500 hover:bg-gray-50 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10" onClick={() => setModal("rename")}><Pencil size={18} /></button>
              <button className="btn-primary" onClick={() => setModal("expense")}><Plus size={17} />Расход</button>
            </div>
          }
        />
        <div className="mb-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button
              className="btn-secondary"
              onClick={() => setModal("categories")}
            >
              Статьи
            </button>
            <button className="btn-secondary" onClick={() => setModal("fund")}>
              Общая касса
            </button>
            <label
              className="btn-secondary cursor-pointer"
              title="JPG, PNG или WebP, не больше 8 МБ"
            >
              Обложка
              <input
                className="hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    try {
                      await api.uploadCover(id, f);
                      await load();
                    } catch (x: any) {
                      setError(x.message);
                    }
                  }
                }}
              />
            </label>
            <button
              className="btn-secondary"
              onClick={() => setModal("members")}
            >
              <Users size={17} />
              Участники
            </button>
          </div>
        <section className="grid lg:grid-cols-3 gap-5 mb-5">
          <div className="card lg:col-span-2 bg-forest text-white">
            <p className="text-white/60 text-sm">Всего потрачено</p>
            <p className="text-3xl sm:text-4xl font-extrabold mt-2 break-words">
              {money(dashboard.total, trip.currency)}
            </p>
            <div className="flex gap-6 mt-8 text-sm">
              <span>{dashboard.expense_count} расходов</span>
              <span>{members.length} участников</span>
            </div>
          </div>
          <div className="card">
            <h2 className="font-bold mb-4">По категориям</h2>
            {dashboard.byCategory.length ? (
              dashboard.byCategory.map((c) => (
                <div className="mb-3" key={c.name}>
                  <div className="flex justify-between text-sm">
                    <span>{c.name}</span>
                    <b>{money(c.amount, trip.currency)}</b>
                  </div>
                  <div className="mt-2 h-2 rounded bg-gray-100 dark:bg-white/10">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${(c.amount / dashboard.total) * 100}%`,
                        background: c.color,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="muted text-sm">Добавьте первый расход</p>
            )}
          </div>
        </section>
        <section className="card mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="muted text-sm">Общая касса</p>
            <p className="text-2xl font-extrabold text-forest">
              {money(dashboard.fundTotal - dashboard.fundSpent, trip.currency)}
            </p>
          </div>
          <div className="muted text-sm">
            Внесено: {money(dashboard.fundTotal, trip.currency)} · Потрачено:{" "}
            {money(dashboard.fundSpent, trip.currency)}
          </div>
        </section>
        <section className="grid lg:grid-cols-5 gap-5">
          <div className="card overflow-visible p-0 lg:col-span-5">
            <div className="border-b p-4 sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Расходы</h2>
                  <p className="muted mt-0.5 text-sm">{filteredExpenses.length} из {expenses.length}</p>
                </div>
                {(query || categoryFilter !== "all" || memberFilter !== "all") && (
                  <button type="button" className="text-sm font-semibold text-forest dark:text-brand-300" onClick={() => { setQuery(""); setCategoryFilter("all"); setMemberFilter("all"); }}>Сбросить</button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <label className="relative sm:col-span-3 xl:col-span-1">
                  <span className="sr-only">Поиск расходов</span>
                  <Search aria-hidden="true" className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <input className="field pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск расходов" />
                </label>
                <label>
                  <span className="sr-only">Фильтр по категории</span>
                  <Select ariaLabel="Фильтр по категории" value={categoryFilter} onChange={setCategoryFilter} options={[{ value: "all", label: "Все категории" }, ...categories.map((category) => ({ value: category.id, label: category.name }))]} />
                </label>
                <label>
                  <span className="sr-only">Фильтр по плательщику</span>
                  <Select ariaLabel="Фильтр по плательщику" value={memberFilter} onChange={setMemberFilter} options={[{ value: "all", label: "Все плательщики" }, ...members.map((member) => ({ value: member.id, label: member.name }))]} />
                </label>
              </div>
            </div>

            {visibleExpenses.length ? (
              <>
                <div className="hidden md:block">
                  <table className="w-full table-fixed text-left text-sm">
                    <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-white/5 dark:text-gray-400">
                      <tr><th className="w-[28%] px-5 py-3">Расход</th><th className="w-[18%] px-4 py-3">Плательщик</th><th className="w-[18%] px-4 py-3">Категория</th><th className="w-[14%] px-4 py-3">Дата</th><th className="w-[14%] px-4 py-3 text-right">Сумма</th><th className="w-[88px] px-3 py-3"><span className="sr-only">Действия</span></th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {visibleExpenses.map((expense) => (
                        <tr key={expense.id} className="hover:bg-gray-50/70 dark:hover:bg-white/[0.03]">
                          <td className="px-5 py-3.5"><div className="flex min-w-0 items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg" style={{ background: expense.category_color + "25" }}><Receipt size={16} /></span><span className="max-w-[220px] truncate font-semibold" title={expense.title}>{expense.title}</span></div></td>
                          <td className="muted truncate px-4 py-3.5" title={expense.paid_by_name}>{expense.paid_by_name}</td>
                          <td className="overflow-hidden px-4 py-3.5"><span className="inline-flex max-w-full truncate rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold dark:bg-white/10" title={expense.category_name}>{expense.category_name}</span></td>
                          <td className="muted whitespace-nowrap px-4 py-3.5">{expense.date}</td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold">{money(expense.amount, trip.currency)}</td>
                          <td className="px-2 py-3.5"><div className="flex justify-end"><button type="button" title="Изменить" aria-label={`Изменить ${expense.title}`} className="grid size-9 shrink-0 place-items-center rounded-lg text-gray-400 hover:bg-brand-50 hover:text-forest dark:hover:bg-brand-500/10" onClick={() => { setEditing(expense); setModal("expense"); }}><Pencil size={15} /></button><button type="button" title="Удалить" aria-label={`Удалить ${expense.title}`} className="grid size-9 shrink-0 place-items-center rounded-lg text-gray-400 hover:bg-error-50 hover:text-error-700 dark:hover:bg-error-500/10" onClick={async () => { try { await api.deleteExpense(expense.id); await load(); } catch (failure: any) { setError(failure.message); } }}><Trash2 size={15} /></button></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="divide-y md:hidden">
                  {visibleExpenses.map((expense) => (
                    <article key={expense.id} className="p-4">
                      <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg" style={{ background: expense.category_color + "25" }}><Receipt size={17} /></span><div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><h3 className="truncate text-sm font-semibold">{expense.title}</h3><b className="shrink-0 text-sm">{money(expense.amount, trip.currency)}</b></div><p className="muted mt-1 text-xs">{expense.paid_by_name} · {expense.category_name} · {expense.date}</p><div className="mt-3 flex gap-2"><button type="button" className="btn-secondary min-h-9 px-3" onClick={() => { setEditing(expense); setModal("expense"); }}><Pencil size={14} />Изменить</button><button type="button" aria-label={`Удалить ${expense.title}`} className="grid size-9 place-items-center rounded-lg bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-red-300" onClick={async () => { try { await api.deleteExpense(expense.id); await load(); } catch (failure: any) { setError(failure.message); } }}><Trash2 size={15} /></button></div></div></div>
                    </article>
                  ))}
                </div>
                {pageCount > 1 && (
                  <div className="flex items-center justify-between border-t px-4 py-3 sm:px-5">
                    <p className="muted text-sm">Страница {page} из {pageCount}</p>
                    <div className="flex gap-2"><button type="button" aria-label="Предыдущая страница" className="grid size-9 place-items-center rounded-lg border disabled:opacity-40" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={16} /></button><button type="button" aria-label="Следующая страница" className="grid size-9 place-items-center rounded-lg border disabled:opacity-40" disabled={page === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}><ChevronRight size={16} /></button></div>
                  </div>
                )}
              </>
            ) : (
              <EmptyState icon={Receipt} title={expenses.length ? "Ничего не найдено" : "Расходов пока нет"} description={expenses.length ? "Попробуйте изменить параметры поиска." : "Добавьте первый расход, чтобы начать расчёты."} />
            )}
          </div>
          <div className="card lg:col-span-2">
            <h2 className="mb-5 text-lg font-semibold">
              Кто кому должен
            </h2>
            {dashboard.settlements.length ? (
              dashboard.settlements.map((s, i) => (
                <div className="mb-3 rounded-xl bg-sage/60 p-4 dark:bg-brand-500/10" key={i}>
                  <div className="flex justify-between text-sm">
                    <b>{s.from}</b>
                    <span>→</span>
                    <b>{s.to}</b>
                  </div>
                  <p className="text-center text-xl font-extrabold text-forest mt-2">
                    {money(s.amount, trip.currency)}
                  </p>
                </div>
              ))
            ) : (
              <p className="muted text-sm">Все расчёты закрыты 🎉</p>
            )}
            <h3 className="font-bold text-sm mt-7 mb-3">Баланс участников</h3>
            {dashboard.byMember.map((m) => (
              <div key={m.name} className="flex justify-between py-2 text-sm">
                <span className="flex gap-2 items-center">
                  <i
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: m.color }}
                  />
                  {m.name}
                </span>
                <b className={m.balance >= 0 ? "text-forest" : "text-coral"}>
                  {m.balance > 0 ? "+" : ""}
                  {money(m.balance, trip.currency)}
                </b>
              </div>
            ))}
          </div>
        </section>
      </main>
      {modal === "expense" && (
        <Modal
          title={editing ? "Изменить расход" : "Новый расход"}
          onClose={close}
        >
          <ExpenseForm
            expense={editing || undefined}
            members={members}
            categories={categories}
            onSave={async (body) => {
              editing
                ? await api.updateExpense(editing.id, body)
                : await api.addExpense(id, body);
              close();
              await load();
            }}
          />
        </Modal>
      )}
      {modal === "rename" && (
        <Modal title="Название путешествия" onClose={close}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              try {
                await api.updateTrip(
                  id,
                  Object.fromEntries(new FormData(form)),
                );
                close();
                await load();
              } catch (x: any) {
                setError(x.message);
              }
            }}
          >
            <label>
              <span className="label">Название</span>
              <input
                className="field mb-4"
                name="name"
                defaultValue={trip.name}
                minLength={2}
                maxLength={80}
                required
                autoFocus
              />
            </label>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <button className="btn-primary w-full">Сохранить</button>
          </form>
        </Modal>
      )}
      {modal === "members" && (
        <Modal title="Участники поездки" onClose={close}>
          <div className="space-y-2 mb-7">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 rounded-xl border bg-white p-2 dark:bg-white/5"
              >
                <i
                  className="w-3 h-3 rounded-full ml-2"
                  style={{ background: m.color }}
                />
                <input
                  className="flex-1 bg-transparent px-2 py-1 outline-none"
                  defaultValue={m.name}
                  onBlur={async (e) => {
                    if (e.target.value !== m.name) {
                      try {
                        await api.updateMember(m.id, { name: e.target.value });
                        load();
                      } catch (x: any) {
                        setError(x.message);
                      }
                    }
                  }}
                />
                {m.user_id && (
                  <span
                    title="Пользователь приложения"
                    className="rounded-lg bg-sage px-2 py-1 text-xs text-forest dark:bg-brand-500/15 dark:text-brand-300"
                  >
                    аккаунт
                  </span>
                )}
                <button
                  className="p-2 text-gray-400 hover:text-red-500"
                  onClick={async () => {
                    try {
                      await api.deleteMember(m.id);
                      load();
                    } catch (x: any) {
                      setError(x.message);
                    }
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                try {
                  await api.addMember(
                    id,
                    Object.fromEntries(new FormData(form)),
                  );
                  form.reset();
                  load();
                } catch (x: any) {
                  setError(x.message);
                }
              }}
            >
              <span className="label">Участник без аккаунта</span>
              <div className="flex gap-2">
                <input
                  className="field"
                  name="name"
                  placeholder="Имя"
                  required
                />
                <button className="btn-secondary">
                  <Plus size={17} />
                </button>
              </div>
            </form>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                try {
                  await api.invite(id, Object.fromEntries(new FormData(form)));
                  form.reset();
                  load();
                } catch (x: any) {
                  setError(x.message);
                }
              }}
            >
              <span className="label">Пригласить по email</span>
              <div className="flex gap-2">
                <input
                  className="field"
                  name="email"
                  type="email"
                  placeholder="user@mail.ru"
                  required
                />
                <button className="btn-primary">
                  <UserPlus size={17} />
                </button>
              </div>
            </form>
          </div>
          {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
        </Modal>
      )}
      {modal === "categories" && (
        <Modal title="Статьи расходов" onClose={close}>
          <div className="space-y-2 mb-5">
            {categories.map((c) => (
              <div key={c.id} className="flex gap-2 rounded-xl border bg-white p-2 dark:bg-white/5">
                <ColorPicker
                  defaultValue={c.color}
                  ariaLabel={`Цвет категории ${c.name}`}
                  onChange={async (color) => {
                    await api.updateCategory(c.id, {
                      name: c.name,
                      color,
                    });
                    await load();
                  }}
                />
                <input
                  className="flex-1 bg-transparent outline-none"
                  defaultValue={c.name}
                  onBlur={async (e) => {
                    if (e.target.value !== c.name) {
                      try {
                        await api.updateCategory(c.id, {
                          name: e.target.value,
                          color: c.color,
                        });
                        load();
                      } catch (x: any) {
                        setError(x.message);
                      }
                    }
                  }}
                />
                <button
                  onClick={async () => {
                    try {
                      await api.deleteCategory(c.id);
                      load();
                    } catch (x: any) {
                      setError(x.message);
                    }
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              try {
                await api.addCategory(
                  id,
                  Object.fromEntries(new FormData(form)),
                );
                form.reset();
                load();
              } catch (x: any) {
                setError(x.message);
              }
            }}
          >
            <input
              className="field"
              name="name"
              placeholder="Новая статья"
              required
            />
            <ColorPicker name="color" defaultValue="#7189BF" ariaLabel="Цвет новой категории" />
            <button className="btn-primary">
              <Plus />
            </button>
          </form>
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        </Modal>
      )}
      {modal === "fund" && (
        <Modal title="Общая касса" onClose={close}>
          <form
            className="space-y-3 mb-6"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              try {
                await api.addContribution(
                  id,
                  Object.fromEntries(new FormData(form)),
                );
                form.reset();
                load();
              } catch (x: any) {
                setError(x.message);
              }
            }}
          >
            <Select name="member_id" ariaLabel="Участник" options={members.map((member) => ({ value: member.id, label: member.name }))} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                className="field"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Сумма"
                required
              />
              <DatePicker
                name="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                ariaLabel="Дата взноса"
                required
              />
            </div>
            <input className="field" name="note" placeholder="Комментарий" />
            <button className="btn-primary w-full">Внести в кассу</button>
          </form>
          {contributions.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between border-t py-2"
            >
              <div>
                <b className="text-sm">{c.member_name}</b>
                <p className="muted text-xs">
                  {c.date}
                  {c.note ? ` · ${c.note}` : ""}
                </p>
              </div>
              <b className="text-forest">+{money(c.amount, trip.currency)}</b>
              <button
                onClick={async () => {
                  try {
                    await api.deleteContribution(c.id);
                    load();
                  } catch (x: any) {
                    setError(x.message);
                  }
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        </Modal>
      )}
    </>
  );
}
