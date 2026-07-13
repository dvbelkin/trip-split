import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
  Link,
} from "react-router-dom";
import { api, Trip, Member, Category, Expense, Dashboard } from "./api";
import SharedTripPage from "./TripPage";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  LogOut,
  Plus,
  Receipt,
  Trash2,
  Users,
  WalletCards,
} from "lucide-react";
import { AppLayout } from "./components/layout/AppLayout";
import { PageHeader } from "./components/layout/PageHeader";
import { Alert } from "./components/ui/Alert";
import { Checkbox } from "./components/ui/Checkbox";
import { DatePicker } from "./components/ui/DatePicker";
import { EmptyState } from "./components/ui/EmptyState";
import { Modal } from "./components/ui/Modal";
import { Select } from "./components/ui/Select";
const money = (n: number, c = "RUB") =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: c,
    maximumFractionDigits: 2,
  }).format(n / 100);
function Auth() {
  const [register, setRegister] = useState(false),
    [error, setError] = useState("");
  const nav = useNavigate();
  async function submit(e: any) {
    e.preventDefault();
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const r = await api.auth(register ? "register" : "login", body);
      localStorage.setItem("token", r.token);
      localStorage.setItem("user", JSON.stringify(r.user));
      nav("/");
    } catch (x: any) {
      setError(x.message);
    }
  }
  return (
    <main className="grid min-h-screen bg-cream text-ink lg:grid-cols-2">
      <section className="hidden lg:flex bg-forest text-white p-16 flex-col justify-between">
        <div className="text-xl font-extrabold">Вместе.</div>
        <div>
          <p className="text-coral text-sm font-bold tracking-[.25em] uppercase">
            Путешествуйте легко
          </p>
          <h1 className="font-[Playfair_Display] text-6xl leading-tight mt-4">
            Деньги не должны портить впечатления.
          </h1>
          <p className="mt-6 text-white/70 max-w-lg">
            Фиксируйте общие расходы, а мы честно посчитаем, кто кому должен.
          </p>
        </div>
        <p className="text-white/40 text-sm">
          Расходы компании — без таблиц и споров
        </p>
      </section>
      <section className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-md">
          <h2 className="font-[Playfair_Display] text-4xl">
            {register ? "Создать аккаунт" : "С возвращением"}
          </h2>
          <p className="text-black/50 mt-2 mb-8">
            {register
              ? "Начните планировать общие поездки"
              : "Войдите, чтобы продолжить"}
          </p>
          {register && (
            <label className="block mb-4">
              <span className="label">Имя</span>
              <input className="field" name="name" required />
            </label>
          )}
          <label className="block mb-4">
            <span className="label">Email</span>
            <input className="field" name="email" type="email" required />
          </label>
          <label className="block mb-5">
            <span className="label">Пароль</span>
            <input
              className="field"
              name="password"
              type="password"
              minLength={6}
              required
            />
          </label>
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <button className="btn-primary w-full">
            {register ? "Зарегистрироваться" : "Войти"}
          </button>
          <button
            type="button"
            onClick={() => {
              setRegister(!register);
              setError("");
            }}
            className="w-full text-sm mt-5 text-forest font-bold"
          >
            {register
              ? "Уже есть аккаунт? Войти"
              : "Нет аккаунта? Зарегистрироваться"}
          </button>
        </form>
      </section>
    </main>
  );
}
function Shell({ children }: { children: any }) {
  return <AppLayout>{children}</AppLayout>;
}
function Account() {
  const [user, setUser] = useState<{
    id: number;
    name: string;
    email: string;
    avatar: string | null;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const remember = (next: typeof user) => {
    if (!next) return;
    setUser(next);
    localStorage.setItem(
      "user",
      JSON.stringify({
        name: next.name,
        email: next.email,
        avatar: next.avatar,
      }),
    );
  };
  if (loading)
    return (
      <Shell>
        <main className="mx-auto max-w-3xl animate-pulse space-y-5"><div className="h-8 w-52 rounded-lg bg-gray-200 dark:bg-white/10" /><div className="h-40 rounded-2xl bg-gray-200 dark:bg-white/10" /></main>
      </Shell>
    );
  if (!user)
    return <Shell><main className="mx-auto max-w-3xl"><Alert variant="error">Не удалось загрузить аккаунт: {error}</Alert></main></Shell>;
  return (
    <Shell>
      <main className="mx-auto max-w-3xl">
        <PageHeader title="Мой аккаунт" parent={{ label: "Поездки", to: "/" }} description="Управляйте профилем и настройками безопасности." />
        {message && (
          <div className="mb-5"><Alert variant="success">{message}</Alert></div>
        )}
        {error && (
          <div className="mb-5"><Alert variant="error">{error}</Alert></div>
        )}
        <section className="card mb-5 flex flex-col sm:flex-row items-center gap-6">
          {user.avatar ? (
            <img
              src={user.avatar}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <span className="w-24 h-24 rounded-full bg-sage grid place-items-center text-3xl font-bold">
              {user.name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div>
            <h2 className="font-bold text-lg">Фотография</h2>
            <p className="text-sm text-black/45 mt-1 mb-4">
              JPG, PNG, WebP или GIF, не больше 8 МБ
            </p>
            <label className="btn-secondary cursor-pointer">
              Выбрать файл
              <input
                className="hidden"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setError("");
                  try {
                    remember(await api.uploadAvatar(file));
                    setMessage("Аватар обновлён");
                  } catch (x: any) {
                    setError(x.message);
                  }
                }}
              />
            </label>
          </div>
        </section>
        <section className="card mb-5">
          <h2 className="font-[Playfair_Display] text-2xl mb-5">
            Личные данные
          </h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              try {
                remember(
                  await api.updateMe(
                    Object.fromEntries(new FormData(e.currentTarget)),
                  ),
                );
                setMessage("Имя сохранено");
              } catch (x: any) {
                setError(x.message);
              }
            }}
            className="grid gap-5"
          >
            <label className="block">
              <span className="label">Email</span>
              <input className="field bg-black/5" value={user.email} disabled />
            </label>
            <label className="block">
              <span className="label">Имя</span>
              <input
                className="field"
                name="name"
                defaultValue={user.name}
                required
                minLength={2}
                maxLength={60}
              />
            </label>
            <button className="btn-primary mt-1 justify-self-start">Сохранить имя</button>
          </form>
        </section>
        <section className="card">
          <h2 className="font-[Playfair_Display] text-2xl mb-5">
            Смена пароля
          </h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              const form = e.currentTarget;
              try {
                await api.updatePassword(
                  Object.fromEntries(new FormData(form)),
                );
                form.reset();
                setMessage("Пароль изменён");
              } catch (x: any) {
                setError(x.message);
              }
            }}
            className="grid gap-5"
          >
            <label className="block">
              <span className="label">Текущий пароль</span>
              <input
                className="field"
                name="currentPassword"
                type="password"
                required
              />
            </label>
            <label className="block">
              <span className="label">Новый пароль</span>
              <input
                className="field"
                name="newPassword"
                type="password"
                minLength={6}
                required
              />
            </label>
            <button className="btn-primary mt-1 justify-self-start">Изменить пароль</button>
          </form>
        </section>
      </main>
    </Shell>
  );
}
function Trips() {
  const location = useLocation();
  const [trips, setTrips] = useState<Trip[] | null>(null),
    [open, setOpen] = useState(false),
    [error, setError] = useState(""),
    [createError, setCreateError] = useState(""),
    [notice] = useState(() => (location.state as { notice?: string } | null)?.notice || "");
  const nav = useNavigate();
  const load = () => api.trips().then(setTrips).catch((failure) => setError(failure.message));
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if ((location.state as { notice?: string } | null)?.notice)
      nav("/", { replace: true, state: null });
  }, [location.state, nav]);
  async function create(e: any) {
    e.preventDefault();
    setCreateError("");
    try {
      const b = Object.fromEntries(new FormData(e.currentTarget));
      const t = await api.createTrip(b);
      nav("/trips/" + t.id);
    } catch (failure: any) {
      setCreateError(failure.message);
    }
  }
  return (
    <Shell>
      <main className="mx-auto max-w-6xl">
        <PageHeader title="Мои поездки" description="Все путешествия, участники и общие расходы в одном месте." actions={<button className="btn-primary" onClick={() => { setCreateError(""); setOpen(true); }}><Plus size={18} /><span>Новая поездка</span></button>} />
        {notice && <div className="mb-5"><Alert variant="success">{notice}</Alert></div>}
        {error ? <Alert variant="error">Не удалось загрузить поездки: {error}</Alert> : trips === null ? (
          <div className="grid animate-pulse gap-5 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-64 rounded-2xl bg-gray-200 dark:bg-white/10" />)}</div>
        ) : trips.length ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {trips.map((t) => (
              <button
                key={t.id}
                onClick={() => nav("/trips/" + t.id)}
                className="card text-left hover:-translate-y-1 transition"
              >
                <div
                  className="h-36 sm:h-28 bg-gradient-to-br from-sage to-green-100 rounded-2xl p-4 flex justify-end bg-cover bg-center"
                  style={
                    t.cover ? { backgroundImage: `url(${t.cover})` } : undefined
                  }
                >
                  <ChevronRight className="text-forest" />
                </div>
                <h2 className="font-[Playfair_Display] text-2xl mt-5">
                  {t.name}
                </h2>
                <div className="flex gap-5 text-sm text-black/50 mt-4">
                  <span className="flex gap-1.5">
                    <Users size={17} />
                    {t.member_count}
                  </span>
                  <span className="font-bold text-forest">
                    {money(t.expense_total, t.currency)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="card"><EmptyState icon={WalletCards} title="Пока здесь тихо" description="Создайте первую поездку и пригласите компанию." action={<button className="btn-primary" onClick={() => { setCreateError(""); setOpen(true); }}><Plus size={17} />Новая поездка</button>} /></div>
        )}
        {open && (
          <Modal title="Новая поездка" onClose={() => setOpen(false)}>
            <form onSubmit={create} className="space-y-4">
              {createError && <Alert variant="error">Не удалось создать поездку: {createError}</Alert>}
              <label>
                <span className="label">Название</span>
                <input
                  className="field"
                  name="name"
                  placeholder="Например, Алтай 2026"
                  required
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label>
                  <span className="label">Начало</span>
                  <DatePicker name="start_date" ariaLabel="Дата начала" />
                </label>
                <label>
                  <span className="label">Окончание</span>
                  <DatePicker name="end_date" ariaLabel="Дата окончания" />
                </label>
              </div>
              <label>
                <span className="label">Валюта</span>
                <Select
                  name="currency"
                  ariaLabel="Валюта"
                  options={["RUB", "EUR", "USD"].map((currency) => ({ value: currency, label: currency }))}
                />
              </label>
              <button className="btn-primary w-full">Создать</button>
            </form>
          </Modal>
        )}
      </main>
    </Shell>
  );
}
function TripPage() {
  const { id = "" } = useParams();
  const [data, setData] = useState<{
      trip: Trip;
      members: Member[];
      categories: Category[];
      expenses: Expense[];
      dashboard: Dashboard;
    } | null>(null),
    [modal, setModal] = useState("");
  const load = () => api.trip(id).then(setData);
  useEffect(() => {
    void load();
  }, [id]);
  if (!data) return <div className="p-10">Загрузка…</div>;
  const { trip, members, categories, expenses, dashboard } = data;
  async function addExpense(e: any) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget),
      participant_ids = fd.getAll("participants").map(Number);
    await api.addExpense(id, { ...Object.fromEntries(fd), participant_ids });
    setModal("");
    load();
  }
  return (
    <Shell>
      <main className="max-w-7xl mx-auto p-5 md:p-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-black/50"
        >
          <ArrowLeft size={17} />
          Все поездки
        </Link>
        <div className="flex flex-wrap justify-between items-end gap-4 mt-6 mb-8">
          <div>
            <h1 className="font-[Playfair_Display] text-4xl md:text-5xl">
              {trip.name}
            </h1>
            <p className="text-black/45 mt-2 flex items-center gap-2">
              <CalendarDays size={16} />
              {trip.start_date || "Даты не указаны"}
              {trip.end_date && ` — ${trip.end_date}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="btn-secondary"
              onClick={() => setModal("member")}
            >
              <Users size={17} />
              Участник
            </button>
            <button className="btn-primary" onClick={() => setModal("expense")}>
              <Plus size={17} />
              Расход
            </button>
          </div>
        </div>
        <section className="grid lg:grid-cols-3 gap-5 mb-5">
          <div className="card lg:col-span-2 bg-forest text-white">
            <p className="text-white/60 text-sm">Всего потрачено</p>
            <p className="text-4xl font-extrabold mt-2">
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
                  <div className="h-2 bg-black/5 rounded mt-2">
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
              <p className="text-sm text-black/40">Добавьте первый расход</p>
            )}
          </div>
        </section>
        <section className="grid lg:grid-cols-5 gap-5">
          <div className="card lg:col-span-3">
            <h2 className="font-[Playfair_Display] text-2xl mb-5">
              Последние расходы
            </h2>
            {expenses.length ? (
              expenses.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 py-3 border-b last:border-0 border-black/5"
                >
                  <span
                    className="w-10 h-10 rounded-xl grid place-items-center"
                    style={{ background: e.category_color + "25" }}
                  >
                    <Receipt size={18} />
                  </span>
                  <div className="flex-1">
                    <b className="text-sm">{e.title}</b>
                    <p className="text-xs text-black/45">
                      {e.paid_by_name} · {e.category_name} · {e.date}
                    </p>
                  </div>
                  <b>{money(e.amount, trip.currency)}</b>
                  <button
                    className="text-black/25 hover:text-red-500"
                    onClick={async () => {
                      await api.deleteExpense(e.id);
                      load();
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-black/40 text-sm py-8 text-center">
                Расходов ещё нет
              </p>
            )}
          </div>
          <div className="card lg:col-span-2">
            <h2 className="font-[Playfair_Display] text-2xl mb-5">
              Кто кому должен
            </h2>
            {dashboard.settlements.length ? (
              dashboard.settlements.map((s, i) => (
                <div className="bg-sage/60 rounded-2xl p-4 mb-3" key={i}>
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
              <p className="text-black/45 text-sm">Все расчёты закрыты 🎉</p>
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
      {modal === "member" && (
        <Modal title="Добавить участника" onClose={() => setModal("")}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await api.addMember(
                id,
                Object.fromEntries(new FormData(e.currentTarget)),
              );
              setModal("");
              load();
            }}
          >
            <span className="label">Имя</span>
            <input className="field mb-4" name="name" required autoFocus />
            <button className="btn-primary w-full">Добавить</button>
          </form>
        </Modal>
      )}
      {modal === "expense" && (
        <Modal title="Новый расход" onClose={() => setModal("")}>
          <form onSubmit={addExpense} className="space-y-4">
            <label>
              <span className="label">Что покупали</span>
              <input className="field" name="title" required autoFocus />
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
                  required
                />
              </label>
              <label>
                <span className="label">Дата</span>
                <DatePicker
                  name="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  ariaLabel="Дата расхода"
                  required
                />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label>
                <span className="label">Кто заплатил</span>
                <Select name="paid_by" ariaLabel="Кто заплатил" options={members.map((member) => ({ value: member.id, label: member.name }))} />
              </label>
              <label>
                <span className="label">Категория</span>
                <Select name="category_id" ariaLabel="Категория" options={categories.map((category) => ({ value: category.id, label: category.name }))} />
              </label>
            </div>
            <fieldset>
              <legend className="label">На кого делим поровну</legend>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <Checkbox key={m.id} name="participants" value={m.id} defaultChecked label={m.name} className="rounded-xl border bg-white px-3 py-2" />
                ))}
              </div>
            </fieldset>
            <button className="btn-primary w-full">Сохранить расход</button>
          </form>
        </Modal>
      )}
    </Shell>
  );
}
export default function App() {
  const guarded = (el: any) =>
    localStorage.getItem("token") ? el : <Navigate to="/login" />;
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route path="/" element={guarded(<Trips />)} />
      <Route path="/account" element={guarded(<Account />)} />
      <Route path="/trips/:id" element={guarded(<Shell><SharedTripPage /></Shell>)} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
